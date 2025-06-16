// public/js/beatbattle.js
import { db } from './firebase-config.js';
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  runTransaction,
  limit
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

const battleContainer     = document.getElementById('battle-container');
const loader              = document.getElementById('initial-loader');
const prevWinnersList     = document.getElementById('previous-winners-list');
const allTimeWinnersList  = document.getElementById('all-time-winners-list');
const mostWinsLeaderP     = document.getElementById('most-wins-leader');

async function loadCurrentBattle() {
  try {
    const q    = query(collection(db, 'queues', 'beatBattle', 'items'), orderBy('enqueuedAt'));
    const snap = await getDocs(q);
    battleContainer.innerHTML = '';
    if (snap.empty) {
      battleContainer.innerHTML = '<p>No tracks in this battle yet.</p>';
    } else {
      snap.docs.forEach(docSnap => {
        const { name, votes = 0 } = docSnap.data();
        const id = docSnap.id;
        const trackEl = document.createElement('div');
        trackEl.className = 'track';
        trackEl.innerHTML = `
          <div class="track-header">
            <h3>${name}</h3>
            <div class="vote-section">
              <button class="vote-button btn" data-id="${id}">Vote</button>
              <span id="votes-${id}">Votes: ${votes}</span>
            </div>
          </div>
          <div class="vote-bar">
            <div id="fill-${id}" class="vote-fill" style="width:0;"></div>
          </div>
        `;
        battleContainer.appendChild(trackEl);
      });
      // attach vote handlers
      battleContainer.querySelectorAll('.vote-button').forEach(btn => btn.addEventListener('click', handleVote));
      // update bars
      updateVoteBars(snap.docs);
    }
  } catch (e) {
    console.error(e);
    battleContainer.innerHTML = `<p class="error-message">${e.message}</p>`;
  }
}

function updateVoteBars(docs) {
  const total = docs.reduce((sum, ds) => sum + (ds.data().votes||0), 0);
  docs.forEach(ds => {
    const { votes = 0 } = ds.data();
    const pct = total ? (votes/total)*100 : 0;
    document.getElementById(`fill-${ds.id}`).style.width = `${pct}%`;
  });
}

async function handleVote(e) {
  const id = e.currentTarget.dataset.id;
  e.currentTarget.disabled = true;
  try {
    const ref = doc(db,'queues','beatBattle','items',id);
    await runTransaction(db, async tx => {
      const snap = await tx.get(ref);
      const newVotes = (snap.data().votes||0) + 1;
      tx.update(ref, { votes: newVotes });
      return newVotes;
    }).then(newVotes => {
      document.getElementById(`votes-${id}`).textContent = `Votes: ${newVotes}`;
      // refresh bars
      getDocs(query(collection(db,'queues','beatBattle','items'),orderBy('enqueuedAt')))
        .then(snap => updateVoteBars(snap.docs));
      e.currentTarget.textContent = 'Voted!';
    });
  } catch (err) {
    console.error(err);
    e.currentTarget.textContent = 'Error';
    setTimeout(() => { e.currentTarget.disabled = false; e.currentTarget.textContent = 'Vote'; }, 2000);
  }
}

async function loadLeaderboards() {
  // last battle
  try {
    const histQ = query(collection(db,'battleHistory'), orderBy('endedAt','desc'), limit(1));
    const histSnap = await getDocs(histQ);
    if (histSnap.empty) {
      prevWinnersList.innerHTML = '<li>No past battle data.</li>';
    } else {
      const top = histSnap.docs[0].data().topTracks;
      prevWinnersList.innerHTML = top.map((t,i)=>`<li>#${i+1}: ${t.name} (${t.votes} votes)</li>`).join('');
    }
  } catch(e) {
    console.error(e);
    prevWinnersList.innerHTML = `<li>${e.message}</li>`;
  }
  // all-time
  try {
    const winQ  = query(collection(db,'winners'), orderBy('battleDate','desc'));
    const winSnap = await getDocs(winQ);
    if (winSnap.empty) {
      allTimeWinnersList.innerHTML = '<li>No winners yet.</li>';
      mostWinsLeaderP.textContent = 'N/A';
    } else {
      const counts = {};
      allTimeWinnersList.innerHTML = winSnap.docs.map(d => {
        const w = d.data();
        counts[w.name] = (counts[w.name]||0) + 1;
        return `<li>${w.name} — ${w.battleDate.toDate().toLocaleDateString()}</li>`;
      }).join('');
      const [leader, wins] = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0] || ['N/A',0];
      mostWinsLeaderP.textContent = `${leader} with ${wins} wins`;
    }
  } catch(e) {
    console.error(e);
    allTimeWinnersList.innerHTML = `<li>${e.message}</li>`;
    mostWinsLeaderP.textContent = 'Error';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([ loadCurrentBattle(), loadLeaderboards() ]);
  loader.style.display = 'none';
});
