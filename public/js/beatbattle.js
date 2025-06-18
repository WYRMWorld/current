import { db } from './firebase-config.js';
import {
  collection, getDocs, query, orderBy, doc, setDoc, limit, onSnapshot, where, serverTimestamp, getCountFromServer
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';

const auth = getAuth();

// --- DOM Elements ---
const battleContainer = document.getElementById('battle-container');
const loader = document.getElementById('initial-loader');
const battleTitleEl = document.getElementById('battle-title');
const votingStatusMessage = document.getElementById('voting-status-message');
const battleMainContent = document.getElementById('battle-main-content'); 
const bottomVisualizer = document.getElementById('bottom-vote-visualizer');
const prevWinnersList = document.getElementById('previous-winners-list');
const allTimeWinnersList = document.getElementById('all-time-winners-list');
const mostWinsLeaderP = document.getElementById('most-wins-leader');

let activeBattleId = null;
let currentIsVotingOpen = false;

// --- Main Initialization ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        initializePage();
    } else {
        signInAnonymously(auth).catch(error => console.error("Anonymous sign-in failed:", error));
    }
});

function initializePage() {
    listenForBattleUpdates();
    loadLeaderboards();
}

// --- NEW: Function to refresh all track data and vote counts ---
async function refreshTrackData() {
    if (!activeBattleId) return;
    const tracksQuery = query(collection(db, 'queues', 'beatBattle', 'items'), orderBy('enqueuedAt'));
    const tracksSnap = await getDocs(tracksQuery);

    if (tracksSnap.empty) {
        battleContainer.innerHTML = '<p>No tracks have been submitted to this battle yet.</p>';
        bottomVisualizer.style.display = 'none';
        return;
    }

    const tracksDataPromises = tracksSnap.docs.map(async (trackDoc) => {
        const votersCol = collection(db, 'queues', 'beatBattle', 'items', trackDoc.id, 'voters');
        const countSnap = await getCountFromServer(votersCol);
        return {
            id: trackDoc.id,
            ...trackDoc.data(),
            votes: countSnap.data().count
        };
    });
    
    const tracksData = await Promise.all(tracksDataPromises);
    renderTrackCards(tracksData, currentIsVotingOpen);
    renderBottomVisualizer(tracksData);
}

// --- Data Loading and UI Rendering ---
function listenForBattleUpdates() {
    const battleQuery = query(collection(db, 'battles'), where('endedAt', '==', null), orderBy('createdAt', 'desc'), limit(1));
    
    onSnapshot(battleQuery, (battleSnap) => {
        if (loader) loader.style.display = 'none';
        if (battleSnap.empty) {
            activeBattleId = null;
            battleTitleEl.textContent = 'No Active Battle';
            battleContainer.innerHTML = '<p>A new battle will begin soon!</p>';
            votingStatusMessage.innerHTML = '';
            battleMainContent.classList.remove('voting-is-active');
            bottomVisualizer.style.display = 'none';
            return;
        }

        const battleDoc = battleSnap.docs[0];
        activeBattleId = battleDoc.id;
        const battleData = battleDoc.data();
        currentIsVotingOpen = battleData.isVotingOpen || false;

        battleTitleEl.textContent = battleData.name;
        battleMainContent.classList.toggle('voting-is-active', currentIsVotingOpen);
        votingStatusMessage.innerHTML = currentIsVotingOpen
            ? `<p class="voting-active-banner">Voting is currently active!</p>`
            : `<p class="voting-closed-banner">Voting is currently closed</p>`;
        
        // Initial load of tracks and setting up the listener
        const tracksQuery = query(collection(db, 'queues', 'beatBattle', 'items'));
        onSnapshot(tracksQuery, () => {
             // We don't need to process the snapshot here anymore, just use it as a trigger
             // to refresh all data, which is more reliable for subcollection counts.
            refreshTrackData();
        });
    }, (error) => {
        console.error("Error fetching active battle:", error);
    });
}

function renderTrackCards(tracks, isVotingOpen) {
    battleContainer.innerHTML = '';
    const hasVoted = localStorage.getItem(`voted_in_battle_${activeBattleId}`);
    tracks.forEach(track => {
        const trackElement = createTrackElement(track, isVotingOpen, hasVoted);
        battleContainer.appendChild(trackElement);
    });
}

function createTrackElement(track, isVotingOpen, hasVoted) {
    const trackElement = document.createElement('div');
    trackElement.className = 'track';
    trackElement.id = `track-${track.id}`;
    const playerHtml = isVotingOpen ? `<audio controls src="${track.trackUrl}"></audio>` : `<div class="player-hidden-message">Player available when voting opens</div>`;
    const voteButtonDisabled = !isVotingOpen || hasVoted;
    const voteButtonText = hasVoted ? 'Voted' : 'Vote';
    trackElement.innerHTML = `
        <div class="track-info">
            <h3>${track.name}</h3>
            ${playerHtml}
        </div>
        <div class="vote-section">
            <button class="vote-button" data-id="${track.id}" ${voteButtonDisabled ? 'disabled' : ''}>${voteButtonText}</button>
        </div>
    `;
    if (!voteButtonDisabled) {
        trackElement.querySelector('.vote-button').addEventListener('click', handleVote);
    }
    return trackElement;
}

function renderBottomVisualizer(tracks) {
    if (!bottomVisualizer) return;
    const totalVotes = tracks.reduce((sum, track) => sum + (track.votes || 0), 0);
    bottomVisualizer.innerHTML = ''; 
    if (tracks.length === 0) {
        bottomVisualizer.style.display = 'none';
        return;
    }
    bottomVisualizer.style.display = 'flex';
    const sortedTracks = [...tracks].sort((a, b) => (b.votes || 0) - (a.votes || 0));
    sortedTracks.forEach(track => {
        const percentage = totalVotes > 0 ? ((track.votes || 0) / totalVotes) * 100 : 0;
        const item = document.createElement('div');
        item.className = 'visualizer-item';
        const displayName = track.name && track.name.trim() ? track.name : 'Unnamed';
        item.innerHTML = `
            <div class="visualizer-bar-wrapper">
              <div class="visualizer-bar" style="height: ${percentage}%;"></div>
            </div>
            <div class="visualizer-label">${displayName} (${track.votes || 0})</div>
        `;
        bottomVisualizer.appendChild(item);
    });
}

async function loadLeaderboards() {
    try {
        const historyQuery = query(collection(db, 'battleHistory'), orderBy('endedAt', 'desc'), limit(1));
        const historySnap = await getDocs(historyQuery);
        if (!historySnap.empty) {
            const lastBattle = historySnap.docs[0].data();
            prevWinnersList.innerHTML = lastBattle.topTracks.map((track, index) =>
                `<li><strong>#${index + 1}:</strong> ${track.name} (${track.votes || 0} votes)</li>`
            ).join('');
        } else {
            prevWinnersList.innerHTML = '<li>No past battle data found.</li>';
        }
    } catch (e) {
        console.error("Previous Winners Error:", e.message);
        prevWinnersList.innerHTML = `<li class="error-message">Could not load. A database index is required.</li>`;
    }

    try {
        const winnersQuery = query(collection(db, 'winners'), orderBy('battleDate', 'desc'));
        onSnapshot(winnersQuery, (winnersSnap) => {
            if (winnersSnap.empty) {
                allTimeWinnersList.innerHTML = '<li>No winners yet.</li>';
                mostWinsLeaderP.textContent = 'No winners have been crowned.';
            } else {
                const winCounts = {};
                allTimeWinnersList.innerHTML = winnersSnap.docs.map(doc => {
                    const winner = doc.data();
                    winCounts[winner.name] = (winCounts[winner.name] || 0) + 1;
                    const date = winner.battleDate.toDate().toLocaleDateString();
                    return `<li><strong>${winner.name}</strong> - Winner on ${date}</li>`;
                }).join('');
                const mostWins = Object.entries(winCounts).sort((a, b) => b[1] - a[1]);
                if (mostWins.length > 0) {
                    mostWinsLeaderP.textContent = `${mostWins[0][0]} with ${mostWins[0][1]} wins`;
                }
            }
        });
    } catch (e) {
         console.error("All-Time Winners Error:", e.message);
         allTimeWinnersList.innerHTML = `<li class="error-message">Could not load. A database index is required.</li>`;
    }
}

async function handleVote(event) {
    const trackId = event.target.dataset.id;
    const voteButton = event.target;
    if (voteButton.disabled || !activeBattleId) return;
    const user = auth.currentUser;
    if (!user) return;

    voteButton.disabled = true;
    voteButton.textContent = 'Voting...';
    
    const voteRef = doc(db, 'queues', 'beatBattle', 'items', trackId, 'voters', user.uid);

    try {
        await setDoc(voteRef, { votedAt: serverTimestamp() });
        localStorage.setItem(`voted_in_battle_${activeBattleId}`, 'true');
        
        // UPDATED: Manually trigger the UI refresh after a successful vote
        await refreshTrackData();
        
        // Find the specific button again in the newly rendered UI to animate it
        const newVoteButton = document.querySelector(`.track#track-${trackId} .vote-button`);
        if (newVoteButton) {
            const trackElement = newVoteButton.closest('.track');
            trackElement.classList.add('voted-success-anim');
            setTimeout(() => trackElement.classList.remove('voted-success-anim'), 1200);
        }

    } catch (e) {
        console.error("Error submitting vote:", e);
        if (e.code === 'permission-denied') {
             voteButton.textContent = 'Already Voted';
             localStorage.setItem(`voted_in_battle_${activeBattleId}`, 'true');
        } else {
             voteButton.textContent = 'Error!';
             setTimeout(() => {
                voteButton.disabled = false;
                voteButton.textContent = 'Vote';
             }, 2000);
        }
    }
}