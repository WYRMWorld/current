// public/js/admin.js
// Uses Firebase compat globals: firebase, auth, db, storage

// --- Auth and UI State ---
const loginSection = document.getElementById("login-section");
const adminUI = document.getElementById("admin-ui");
const signInBtn = document.getElementById("sign-in");
const signOutBtn = document.getElementById("sign-out");
const loginError = document.getElementById("login-error");

// Sign in
signInBtn.addEventListener("click", async () => {
  loginError.textContent = "";
  signInBtn.disabled = true;
  try {
    const email = document.getElementById("email").value;
    const pw = document.getElementById("password").value;
    await auth.signInWithEmailAndPassword(email, pw);
  } catch (e) {
    loginError.textContent = e.message;
  } finally {
    signInBtn.disabled = false;
  }
});

// Sign out
signOutBtn.addEventListener("click", async () => {
  await auth.signOut();
});

// Monitor auth state
auth.onAuthStateChanged(user => {
  if (user) {
    loginSection.hidden = true;
    adminUI.hidden = false;
    renderAll();
  } else {
    loginSection.hidden = false;
    adminUI.hidden = true;
  }
});

// --- Firestore Queues & Archive ---
const fbList = document.getElementById("feedback-list");
const battleList = document.getElementById("battle-list");
const archiveList = document.getElementById("archive-list");

const nextFbBtn = document.getElementById("next-feedback");
const nextBattleBtn = document.getElementById("next-battle");
const resetBattleBtn = document.getElementById("reset-battle");

const fbCol = db.collection("queues").doc("feedback").collection("items");
const battleCol = db.collection("queues").doc("beatBattle").collection("items");
const archiveCol = db.collection("queues").doc("beatBattleArchive").collection("items");

async function renderFeedback() {
  const snap = await fbCol.orderBy("enqueuedAt").get();
  fbList.innerHTML = snap.docs.map((d, i) => {
    const x = d.data();
    return `<tr><td>${i+1}</td><td>${x.name}</td><td><a href='${x.trackUrl}' target='_blank'>▶️</a></td></tr>`;
  }).join("");
}

async function renderBattle() {
  const snap = await battleCol.orderBy("enqueuedAt").get();
  battleList.innerHTML = snap.docs.map((d, i) => {
    const x = d.data();
    return `<tr><td>${i+1}</td><td>${x.name}</td><td><a href='${x.trackUrl}' target='_blank'>▶️</a></td></tr>`;
  }).join("");
}

async function renderArchiveList() {
  const snap = await archiveCol.orderBy("archivedAt", "desc").get();
  archiveList.innerHTML = snap.docs.map(d => {
    const x = d.data();
    const t = x.archivedAt.toDate().toLocaleString();
    return `<li>${t}: <a href='${x.trackUrl}' target='_blank'>${x.name}</a></li>`;
  }).join("");
}

async function renderAll() {
  await Promise.all([renderFeedback(), renderBattle(), renderArchiveList()]);
}

// --- Queue actions ---
async function dequeueAndArchive(col) {
  const snap = await col.orderBy("enqueuedAt").limit(1).get();
  if (snap.empty) return;
  const doc = snap.docs[0];
  const data = doc.data();

  await archiveCol.add({ ...data, archivedAt: firebase.firestore.FieldValue.serverTimestamp() });
  await doc.ref.delete();
  renderAll();
}

nextFbBtn.addEventListener("click", () => dequeueAndArchive(fbCol));
nextBattleBtn.addEventListener("click", () => dequeueAndArchive(battleCol));

resetBattleBtn.addEventListener("click", async () => {
  let snap;
  do {
    snap = await battleCol.orderBy("enqueuedAt").limit(10).get();
    for (const d of snap.docs) {
      const x = d.data();
      await archiveCol.add({ ...x, archivedAt: firebase.firestore.FieldValue.serverTimestamp() });
      await d.ref.delete();
    }
  } while (!snap.empty);
  renderAll();
});

// --- Blog Posting ---
const titleInput = document.getElementById("new-post-title");
const contentInput = document.getElementById("new-post-content");
const mediaInput = document.getElementById("new-post-media");
const publishBtn = document.getElementById("publish-post");
const cancelBtn = document.getElementById("cancel-post");
const postStatus = document.getElementById("post-status");

publishBtn.addEventListener("click", async () => {
  postStatus.textContent = "";
  publishBtn.disabled = true;
  try {
    let mediaUrl = "";
    if (mediaInput.files.length) {
      const file = mediaInput.files[0];
      const ref = storage.ref(`postsMedia/${file.name}`);
      await ref.put(file);
      mediaUrl = await ref.getDownloadURL();
    }
    await db.collection("posts").add({
      title: titleInput.value.trim(),
      content: contentInput.value.trim(),
      mediaUrl,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    postStatus.textContent = "Post published!";
    titleInput.value = "";
    contentInput.value = "";
    mediaInput.value = "";
  } catch (e) {
    postStatus.textContent = "Failed to publish: " + e.message;
  } finally {
    publishBtn.disabled = false;
  }
});

cancelBtn.addEventListener("click", () => {
  titleInput.value = "";
  contentInput.value = "";
  mediaInput.value = "";
  postStatus.textContent = "";
});
