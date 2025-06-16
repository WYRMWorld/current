// public/js/admin-beatbattle.js
import { db } from './firebase-config.js';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  doc,
  writeBatch
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// EXPORT the initializer that admin.js will call
export function initializeAdminView() {
  // --- DOM References ---
  const createBtn = document.getElementById('create-battle');
  const endBtn    = document.getElementById('end-battle');
  const titleEl   = document.getElementById('current-battle-title');
  const errDiv    = document.getElementById('battle-creation-error');
  const resetBtn  = document.getElementById('reset-battle-queue');

  let activeBattleId = null;

  // 1) Fetch any in-progress battle
  async function fetchActiveBattle() {
    const snap = await getDocs(query(
      collection(db, 'battles'),
      where('endedAt', '==', null),
      orderBy('createdAt', 'desc'),
      limit(1)
    ));
    if (snap.empty) {
      titleEl.textContent = 'No Active Battle';
      activeBattleId = null;
    } else {
      const d = snap.docs[0];
      titleEl.textContent = d.data().name;
      activeBattleId = d.id;
    }
  }

  // 2) Create a new battle
  createBtn.addEventListener('click', async () => {
    errDiv.textContent = '';
    try {
      const name = `Battle – ${new Date().toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric'
      })}`;
      const newDoc = await addDoc(collection(db, 'battles'), {
        name,
        createdAt: serverTimestamp(),
        endedAt: null
      });
      activeBattleId = newDoc.id;
      titleEl.textContent = name;
    } catch (e) {
      console.error(e);
      errDiv.textContent = e.message;
    }
  });

  // 3) End & crown the current battle
  endBtn.addEventListener('click', async () => {
    if (!activeBattleId) return;
    errDiv.textContent = '';
    try {
      await updateDoc(doc(db, 'battles', activeBattleId), {
        endedAt: serverTimestamp()
      });
      await fetchActiveBattle();
    } catch (e) {
      console.error(e);
      errDiv.textContent = e.message;
    }
  });

  // 4) Clear all submissions for the active battle
  resetBtn.addEventListener('click', async () => {
    if (!activeBattleId) return;
    if (!confirm(`Clear all submissions from "${titleEl.textContent}"?`)) return;
    errDiv.textContent = '';
    try {
      const itemsSnap = await getDocs(collection(db, 'battles', activeBattleId, 'items'));
      if (itemsSnap.empty) {
        errDiv.textContent = 'Queue is already empty.';
        return;
      }
      const batch = writeBatch(db);
      itemsSnap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    } catch (e) {
      console.error(e);
      errDiv.textContent = e.message;
    }
  });

  // 5) Kick it all off
  fetchActiveBattle();
}
