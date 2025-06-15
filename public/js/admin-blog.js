// public/js/admin-blog.js

// Grab DOM refs
const titleInput   = document.getElementById("new-post-title");
const contentInput = document.getElementById("new-post-content");
const submitBtn    = document.getElementById("submit-post");
const statusMsg    = document.getElementById("post-status");

// On-click handler
submitBtn.addEventListener("click", async () => {
  const title   = titleInput.value.trim();
  const content = contentInput.value.trim();

  if (!title || !content) {
    statusMsg.textContent = "Both title and content are required.";
    return;
  }

  submitBtn.disabled = true;
  statusMsg.textContent = "";

  try {
    // Use the compat global `db`:
    await db.collection("posts").add({
      title,
      content,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    statusMsg.textContent = "Post published!";
    // Clear form:
    titleInput.value = "";
    contentInput.value = "";
  } catch (err) {
    console.error("Error publishing post:", err);
    statusMsg.textContent = "Failed to publish: " + err.message;
  } finally {
    submitBtn.disabled = false;
  }
});
