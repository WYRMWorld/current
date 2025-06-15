// public/js/admin.js
// ————————————————————————————————————————————————————————————
// Uses the compat global `db` (firebase.firestore())
// and Firebase Auth if you need it (auth)

// DOM refs
const fbList      = document.getElementById("feedback-list");
const battleList  = document.getElementById("battle-list");
const archiveList = document.getElementById("archive-list");

const nextFbBtn    = document.getElementById("next-feedback");
const nextBattleBtn= document.getElementById("next-battle");

// Firestore collections
const fbCol       = db.collection("queues").doc("feedback").collection("items");
const battleCol   = db.collection("queues").doc("beatBattle").collection("items");
const archiveCol  = db.collection("queues").doc("archive").collection("items");

// ————————————————————————————————————————————————————————————
// Renders the three lists from Firestore
async function renderAll() {
  await Promise.all([ renderFeedback(), renderBattle(), renderArchive() ]);
}

async function renderFeedback() {
  const snap = await fbCol.orderBy("enqueuedAt").get();
  fbList.innerHTML = snap.docs.map((d,i) => {
    const x = d.data();
    return `<tr>
      <td>${i+1}</td>
      <td>${x.name}</td>
      <td>${x.originalName}</td>
      <td><audio controls src="${x.trackUrl}"></audio></td>
    </tr>`;
  }).join("");
}

async function renderBattle() {
  const snap = await battleCol.orderBy("enqueuedAt").get();
  battleList.innerHTML = snap.docs.map((d,i) => {
    const x = d.data();
    return `<tr>
      <td>${i+1}</td>
      <td>${x.name}</td>
      <td>${x.originalName}</td>
      <td><audio controls src="${x.trackUrl}"></audio></td>
    </tr>`;
  }).join("");
}

async function renderArchive() {
  const snap = await archiveCol.orderBy("archivedAt", "desc").get();
  archiveList.innerHTML = snap.docs.map(d => {
    const x = d.data();
    const t = x.archivedAt.toDate().toLocaleString();
    return `<li>${t}: ${x.name} (${x.originalName})</li>`;
  }).join("");
}

// ————————————————————————————————————————————————————————————
// Move one item from a queue into the archive, then re-render.
async function dequeueAndArchive(queueCol) {
  const snap = await queueCol.orderBy("enqueuedAt").limit(1).get();
  if (snap.empty) return;
  const doc = snap.docs[0];
  const data = doc.data();

  // write into archive
  await archiveCol.add({
    ...data,
    archivedAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  // delete from original queue
  await doc.ref.delete();

  // refresh
  renderAll();
}

// wire up buttons
nextFbBtn.addEventListener("click", () => dequeueAndArchive(fbCol));
nextBattleBtn.addEventListener("click", () => dequeueAndArchive(battleCol));

// initial render
document.addEventListener("DOMContentLoaded", renderAll);
