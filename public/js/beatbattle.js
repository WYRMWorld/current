// public/beatbattle.js
import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

async function loadBattle() {
  const container = document.getElementById('battle-container');
  try {
    const q    = query(collection(db, 'beatBattle'), orderBy('enqueuedAt'));
    const snap = await getDocs(q);
    container.innerHTML = '';
    snap.forEach((doc, idx) => {
      const { name, trackUrl } = doc.data();
      const div = document.createElement('div');
      div.innerHTML = `
        <strong>${idx+1}. ${name}</strong>
        <audio controls src="${trackUrl}"></audio>
      `;
      container.append(div);
    });
  } catch (e) {
    console.error(e);
    container.textContent = 'Unable to load battles.';
  }
}

loadBattle();
