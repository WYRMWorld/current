import { db } from './firebase-config.js';
import {
  collection, addDoc, getDocs, query, where, orderBy, limit,
  updateDoc, deleteDoc, serverTimestamp, doc, writeBatch, onSnapshot, getCountFromServer
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

export function initializeAdminView() {
  
  // --- DOM Element References ---
  const createBtn = document.getElementById('create-battle');
  const endBtn = document.getElementById('end-battle');
  const cancelBtn = document.getElementById('cancel-battle');
  const toggleVotingBtn = document.getElementById('toggle-voting-btn');
  const titleEl = document.getElementById('current-battle-title');
  const battleCreationErrorDiv = document.getElementById('battle-creation-error');
  
  const feedbackBody = document.getElementById('feedback-list-body');
  const battleBody = document.getElementById('battle-list-body');
  const nextFeedbackBtn = document.getElementById('next-feedback');
  const feedbackErrorDiv = document.getElementById('feedback-error');
  
  const battleArchiveList = document.getElementById('battle-archive-list');
  const feedbackArchiveList = document.getElementById('feedback-archive-list');
  
  const dangerZoneErrorDiv = document.getElementById('danger-zone-error');
  const resetFeedbackQueueBtn = document.getElementById('reset-feedback-queue');
  const resetBattleQueueBtn = document.getElementById('reset-battle-queue');
  const clearFeedbackArchiveBtn = document.getElementById('clear-feedback-archive');
  const clearBattleArchiveBtn = document.getElementById('clear-battle-archive');
  const resetWinnersBtn = document.getElementById('reset-winners');

  let activeBattleId = null;
  let isVotingOpen = false;

  // --- Data References ---
  const battlesCol = collection(db, 'battles');
  const feedbackQueueCol = collection(db, 'queues', 'feedback', 'items');
  const beatBattleQueueCol = collection(db, 'queues', 'beatBattle', 'items');
  const feedbackArchiveCol = collection(db, 'queues', 'feedbackArchive', 'items');
  const battleArchiveCol = collection(db, 'queues', 'battleArchive', 'items');
  const winnersCol = collection(db, 'winners');
  const historyCol = collection(db, 'battleHistory');

  // --- Core Functions ---

  async function fetchActiveBattle() {
    const q = query(battlesCol, where('endedAt', '==', null), orderBy('createdAt', 'desc'), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) {
        titleEl.textContent = 'No Active Battle';
        activeBattleId = null;
        isVotingOpen = false;
        toggleVotingBtn.disabled = true;
        toggleVotingBtn.textContent = 'Open Voting';
    } else {
        const battleDoc = snap.docs[0];
        const battleData = battleDoc.data();
        activeBattleId = battleDoc.id;
        isVotingOpen = battleData.isVotingOpen || false;
        titleEl.textContent = `Active: ${battleData.name}`;
        
        toggleVotingBtn.disabled = false;
        toggleVotingBtn.textContent = isVotingOpen ? 'Close Voting' : 'Open Voting';
    }
  }

  function renderQueue(tbody, querySnapshot, isPlayable = false) {
      tbody.innerHTML = '';
      if (querySnapshot.empty) {
          tbody.innerHTML = `<tr><td colspan="3">Queue is empty.</td></tr>`;
      } else {
          querySnapshot.docs.forEach((doc, index) => {
              const data = doc.data();
              const file = data.originalName ? data.originalName.replace(/\.[^/.]+$/, '') : 'N/A';
              const playerHtml = isPlayable && data.trackUrl ? `<audio controls style="width: 100%; height: 50px;" src="${data.trackUrl}"></audio>` : file;
              const row = document.createElement('tr');
              row.innerHTML = `<td>${index + 1}</td><td>${data.name || 'N/A'}</td><td>${playerHtml}</td>`;
              tbody.appendChild(row);
          });
      }
  }
  
  async function renderBattleArchive() {
      if (!battleArchiveList) return;
      battleArchiveList.innerHTML = '<li>Loading…</li>';
      try {
          const battleQ = query(battlesCol, where('endedAt', '!=', null), orderBy('endedAt', 'desc'));
          const battleSnap = await getDocs(battleQ);

          if (battleSnap.empty) {
              battleArchiveList.innerHTML = '<li>No finished battles yet.</li>';
              return;
          }

          let html = '';
          for (const battleDoc of battleSnap.docs) {
              const battle = battleDoc.data();
              const dateStr = battle.endedAt?.seconds ? new Date(battle.endedAt.seconds * 1000).toLocaleDateString() : 'N/A';
              html += `<details><summary>${battle.name} (${dateStr})</summary><ul>`;
              
              const itemsSnap = await getDocs(query(collection(db, 'battles', battleDoc.id, 'items'), orderBy('votes', 'desc')));
              if (itemsSnap.empty) {
                  html += '<li>No submissions for this battle.</li>';
              } else {
                  itemsSnap.forEach(itemDoc => {
                      const item = itemDoc.data();
                      const artistName = item.name || 'Unnamed Artist';
                      const trackName = item.originalName ? item.originalName.replace(/\.[^/.]+$/, '') : 'Unnamed Track';
                      const previewUrl = item.trackUrl;
                      const label = `${artistName} - ${trackName} (${item.votes || 0} votes)`;
                      const playerHtml = previewUrl ? `<audio controls style="vertical-align: middle; height: 30px; margin-left: 1rem;" src="${previewUrl}"></audio>` : `<span style="color:#f66; margin-left: 1rem;">(No Preview)</span>`;
                      html += `<li>${label} ${playerHtml}</li>`;
                  });
              }
              html += '</ul></details>';
          }
          battleArchiveList.innerHTML = html;
      } catch (e) {
          console.error("Error rendering battle archive:", e);
          battleArchiveList.innerHTML = `<li>Error loading archive: ${e.message}</li>`;
      }
  }

  async function renderFeedbackArchive() {
    if (!feedbackArchiveList) return;
    feedbackArchiveList.innerHTML = '<li>Loading…</li>';
    try {
        const q = query(feedbackArchiveCol, orderBy('archivedAt', 'desc'));
        const snap = await getDocs(q);
        if(snap.empty) {
            feedbackArchiveList.innerHTML = '<li>Feedback archive is empty.</li>';
            return;
        }
        feedbackArchiveList.innerHTML = snap.docs.map(doc => {
            const data = doc.data();
            const date = data.archivedAt?.toDate ? data.archivedAt.toDate().toLocaleString() : 'Invalid Date';
            return `<li>${date}: <a href="${data.trackUrl}" target="_blank">${data.name}</a></li>`;
        }).join('');
    } catch(e) {
        console.error("Error rendering feedback archive:", e);
        feedbackArchiveList.innerHTML = `<li>Error loading archive: ${e.message}</li>`;
    }
  }
    
  async function clearCollection(collectionRef, collectionName) {
      dangerZoneErrorDiv.textContent = `Clearing ${collectionName}...`;
      if (!confirm(`Are you sure you want to permanently delete all items from "${collectionName}"? This cannot be undone.`)) {
          dangerZoneErrorDiv.textContent = '';
          return;
      }
      try {
          const snapshot = await getDocs(collectionRef);
          if(snapshot.empty) {
              dangerZoneErrorDiv.textContent = `"${collectionName}" is already empty.`;
              return;
          }
          const batch = writeBatch(db);
          snapshot.docs.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
          dangerZoneErrorDiv.textContent = `✅ Successfully cleared "${collectionName}".`;
      } catch(e) {
          console.error(`Clearing ${collectionName} failed:`, e);
          dangerZoneErrorDiv.textContent = `❌ Error clearing ${collectionName}: ${e.message}`;
      }
  }
    
  async function resetAllWinners() {
      dangerZoneErrorDiv.textContent = 'Resetting winners...';
       if (!confirm('Are you sure you want to delete ALL winner and battle history records? This is permanent.')) {
          dangerZoneErrorDiv.textContent = '';
          return;
      }
      try {
          const batch = writeBatch(db);
          const [winnersSnap, historySnap] = await Promise.all([
              getDocs(winnersCol),
              getDocs(historyCol)
          ]);
          winnersSnap.forEach(doc => batch.delete(doc.ref));
          historySnap.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
          dangerZoneErrorDiv.textContent = '✅ All winner and battle history has been reset.';
      } catch (e) {
          console.error('Error resetting winners:', e);
          dangerZoneErrorDiv.textContent = `❌ Error resetting winners: ${e.message}`;
      }
  }

  // --- Event Listeners ---
  if(createBtn) createBtn.addEventListener('click', async () => {
    battleCreationErrorDiv.textContent = '';
    try {
      const name = `Battle – ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
      await addDoc(battlesCol, { name, createdAt: serverTimestamp(), endedAt: null, isVotingOpen: false });
      fetchActiveBattle();
    } catch (e) { battleCreationErrorDiv.textContent = e.message; }
  });

  if(toggleVotingBtn) toggleVotingBtn.addEventListener('click', async () => {
    if (!activeBattleId) {
      battleCreationErrorDiv.textContent = 'No active battle.';
      return;
    }
    toggleVotingBtn.disabled = true;
    try {
      const battleRef = doc(db, 'battles', activeBattleId);
      await updateDoc(battleRef, { isVotingOpen: !isVotingOpen });
      await fetchActiveBattle();
    } catch (e) {
      battleCreationErrorDiv.textContent = e.message;
      toggleVotingBtn.disabled = false;
    }
  });

  // UPDATED LISTENER with extensive logging for debugging
  if(endBtn) endBtn.addEventListener('click', async () => {
    if (!activeBattleId) { 
        battleCreationErrorDiv.textContent = 'No active battle to end.'; 
        return; 
    }
    battleCreationErrorDiv.textContent = 'Ending battle, calculating votes...';
    console.log("--- Starting End Battle Process ---");
    try {
      const queueSnap = await getDocs(query(beatBattleQueueCol));
      console.log(`Found ${queueSnap.size} tracks in the live queue.`);

      if (!queueSnap.empty) {
        const batch = writeBatch(db);
        const tracksWithVotes = [];
        console.log("Step 1: Calculating votes for each track...");

        for (const trackDoc of queueSnap.docs) {
            const votersCol = collection(db, 'queues', 'beatBattle', 'items', trackDoc.id, 'voters');
            const countSnap = await getCountFromServer(votersCol);
            const voteCount = countSnap.data().count;
            console.log(`  - Track "${trackDoc.data().name}" has ${voteCount} votes.`);
            tracksWithVotes.push({
                id: trackDoc.id,
                ...trackDoc.data(),
                votes: voteCount
            });
        }
        
        console.log("Step 2: Sorting tracks and determining winner...");
        tracksWithVotes.sort((a,b) => b.votes - a.votes);
        const topTracks = tracksWithVotes.slice(0, 3);
        const winner = topTracks.length > 0 ? topTracks[0] : null;
        if(winner) {
            console.log(`Winner is "${winner.name}" with ${winner.votes} votes.`);
        } else {
            console.log("No winner determined.");
        }

        console.log("Step 3: Preparing batch write to archive tracks and clear queue...");
        tracksWithVotes.forEach(trackData => {
            // Create a clean object for archiving, removing the redundant 'id' field
            const { id, ...archiveData } = trackData;
            batch.set(doc(db, 'battles', activeBattleId, 'items', id), archiveData);
            batch.delete(doc(db, 'queues', 'beatBattle', 'items', id));
        });
        console.log(`  - Batch now contains ${tracksWithVotes.length * 2} operations (set/delete).`);

        if (winner) {
            console.log("Step 4: Adding winner and history to batch...");
            batch.set(doc(collection(winnersCol)), {
                name: winner.name,
                trackName: winner.originalName,
                votes: winner.votes,
                battleDate: serverTimestamp()
            });
            batch.set(doc(collection(historyCol)), {
                endedAt: serverTimestamp(),
                topTracks: topTracks
            });
        }

        console.log("Step 5: Committing batch of all writes and deletes...");
        await batch.commit();
        console.log("  - Batch commit successful!");
      }

      console.log("Step 6: Updating battle document to set endedAt timestamp...");
      await updateDoc(doc(battlesCol, activeBattleId), { endedAt: serverTimestamp(), isVotingOpen: false });
      console.log("  - Battle officially ended.");
      
      battleCreationErrorDiv.textContent = '✅ Battle ended successfully!';
      fetchActiveBattle();
      renderBattleArchive();

    } catch (e) {
        console.error("--- ERROR DURING END BATTLE PROCESS ---");
        console.error(e);
        battleCreationErrorDiv.textContent = `❌ An error occurred: ${e.message}`;
    }
  });

  if(cancelBtn) cancelBtn.addEventListener('click', async () => {
    if (!activeBattleId || !confirm('Are you sure? This will delete the active battle record and all queued tracks permanently.')) return;
    battleCreationErrorDiv.textContent = '';
    try {
        const batch = writeBatch(db);
        const queueSnap = await getDocs(beatBattleQueueCol);
        queueSnap.docs.forEach(d => batch.delete(d.ref));
        batch.delete(doc(battlesCol, activeBattleId));
        await batch.commit();
        fetchActiveBattle();
    } catch (e) {
        battleCreationErrorDiv.textContent = e.message;
    }
  });
  
  if(nextFeedbackBtn) nextFeedbackBtn.addEventListener('click', async () => {
      feedbackErrorDiv.textContent = '';
      try {
          const q = query(feedbackQueueCol, orderBy('enqueuedAt'), limit(1));
          const snap = await getDocs(q);
          if(snap.empty) {
              feedbackErrorDiv.textContent = "Feedback queue is empty.";
              return;
          }
          const docToMove = snap.docs[0];
          await addDoc(feedbackArchiveCol, {...docToMove.data(), archivedAt: serverTimestamp()});
          await deleteDoc(docToMove.ref);
      } catch (e) {
          feedbackErrorDiv.textContent = e.message;
      }
  });

  if(resetFeedbackQueueBtn) resetFeedbackQueueBtn.addEventListener('click', () => clearCollection(feedbackQueueCol, 'Feedback Queue'));
  if(resetBattleQueueBtn) resetBattleQueueBtn.addEventListener('click', () => clearCollection(beatBattleQueueCol, 'Beat Battle Queue'));
  if(clearFeedbackArchiveBtn) clearFeedbackArchiveBtn.addEventListener('click', () => clearCollection(feedbackArchiveCol, 'Feedback Archive'));
  if(clearBattleArchiveBtn) clearBattleArchiveBtn.addEventListener('click', () => clearCollection(battleArchiveCol, 'Battle Archive'));
  if(resetWinnersBtn) resetWinnersBtn.addEventListener('click', resetAllWinners);


  // --- Initial Data Load & Real-time Listeners ---
  fetchActiveBattle();
  renderBattleArchive();
  renderFeedbackArchive();
  onSnapshot(query(feedbackQueueCol, orderBy('enqueuedAt')), (snap) => renderQueue(feedbackBody, snap, false));
  onSnapshot(query(beatBattleQueueCol, orderBy('enqueuedAt')), (snap) => renderQueue(battleBody, snap, true));
}