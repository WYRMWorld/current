// public/js/admin.js
import { auth, db } from "./firebase-config.js";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ——————————————————————————————————————————————————————————————————————————————
// Sign-out handler
document.getElementById("sign-out").addEventListener("click", async () => {
  await auth.signOut();
  window.location = "login.html";
});

// ——————————————————————————————————————————————————————————————————————————————
// Queues & render helpers (pseudo-code placeholders)

// Feedback:
async function renderFeedback() {
  const q = query(
    collection(db, "submissions"),
    orderBy("timestamp"),
    limit(1)
  );
  const snap = await getDocs(q);
  // iterate and populate #feedback-list tbody…
}

// Battle:
async function renderBattle() {
  const q = query(
    collection(db, "submissions"),
    orderBy("timestamp")
  );
  // fetch & populate #battle-list…
}

// Archive:
async function renderArchive() {
  const q = query(
    collection(db, "posts"),
    orderBy("publishedAt", "desc")
  );
  // fetch & populate #archive-list…
}

// call all renders:
async function renderAll() {
  await Promise.all([
    renderFeedback(),
    renderBattle(),
    renderArchive()
  ]);
}
renderAll();

// ——————————————————————————————————————————————————————————————————————————————
// Publish new blog post

const titleInput   = document.getElementById("title-input");
const contentInput = document.getElementById("content-input");
const mediaInput   = document.getElementById("media-input");
const msgEl        = document.getElementById("blog-msg");

document.getElementById("publish-btn").addEventListener("click", async () => {
  msgEl.textContent = "";
  try {
    // Build new post object:
    const newPost = {
      title:       titleInput.value.trim(),
      content:     contentInput.value.trim(),
      publishedAt: Date.now()
    };
    // (Optional) if a file is selected, upload to Storage and add URL…
    if (mediaInput.files.length) {
      // your storage upload logic here, then set newPost.mediaUrl = ...
    }
    await addDoc(collection(db, "posts"), newPost);
    titleInput.value   = "";
    contentInput.value = "";
    mediaInput.value   = "";
    renderArchive();
  } catch (e) {
    console.error(e);
    msgEl.textContent = "Failed to publish: " + e.message;
  }
});

document.getElementById("cancel-btn").addEventListener("click", () => {
  titleInput.value   = "";
  contentInput.value = "";
  mediaInput.value   = "";
  msgEl.textContent  = "";
});
