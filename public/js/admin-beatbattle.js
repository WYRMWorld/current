// public/js/admin-beatbattle.js
// Uses global db

document.getElementById('reset-votes').addEventListener('click', async () => {
  const btn = document.getElementById('reset-votes');
  const err = document.getElementById('battle-error');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Resetting...';
  err.textContent = '';
  try {
    const snap = await db.collection('beatBattles/current/tracks').get();
    const batch = db.batch();
    snap.forEach(d => batch.update(db.doc(`beatBattles/current/tracks/${d.id}`), { votes: 0 }));
    await batch.commit();
  } catch (e) {
    err.textContent = e.message;
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
});
// public/js/admin-beatbattle.js

// DOM refs
const nextBtn      = document.getElementById("next-battle");
const battleList   = document.getElementById("battle-list");
const archiveList  = document.getElementById("archive-list");

// Firestore refs
const queueCol   = db.collection("queues").doc("beatBattle");
const archiveCol = db.collection("queues").doc("beatBattleArchive");

// On “Next Battle” click:
nextBtn.addEventListener("click", async () => {
  // 1) Pull the next queued track (simplified)
  const snapshot = await queueCol.collection("items")
                                   .orderBy("enqueuedAt")
                                   .limit(1)
                                   .get();

  if (snapshot.empty) return;

  const doc = snapshot.docs[0];
  const data = doc.data();

  // 2) Move it into your archive
  await archiveCol.collection("items").add({
    ...data,
    archivedAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  // 3) Remove it from the live queue
  await doc.ref.delete();

  // 4) Re-render both lists
  renderBattleQueue();
  renderArchiveList();
});

// Renders the current battle queue
async function renderBattleQueue() {
  const snap = await queueCol.collection("items")
                             .orderBy("enqueuedAt")
                             .get();
  battleList.innerHTML = "";
  snap.forEach(doc => {
    const d = doc.data();
    battleList.innerHTML += `<tr>
      <td>${d.trackName}</td><td><a href="${d.url}" target="_blank">▶️</a></td>
    </tr>`;
  });
}

// Renders the archived tracks
async function renderArchiveList() {
  const snap = await archiveCol.collection("items")
                                .orderBy("archivedAt", "desc")
                                .get();
  archiveList.innerHTML = "";
  snap.forEach(doc => {
    const d = doc.data();
    const li = document.createElement("li");
    li.innerHTML = `${new Date(d.archivedAt.toDate()).toLocaleString()}: 
      <a href="${d.url}" target="_blank">${d.trackName}</a>`;
    archiveList.appendChild(li);
  });
}

// Initial load
renderBattleQueue();
renderArchiveList();
