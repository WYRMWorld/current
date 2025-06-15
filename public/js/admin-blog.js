// public/js/admin-blog.js

const titleInput   = document.getElementById("new-post-title");
const contentInput = document.getElementById("new-post-content");
const mediaInput   = document.getElementById("new-post-media");
const publishBtn   = document.getElementById("submit-post");
const cancelBtn    = document.getElementById("cancel-post");
const statusDiv    = document.getElementById("post-status");

publishBtn.addEventListener("click", async () => {
  publishBtn.disabled = true;
  statusDiv.textContent = "";

  try {
    // 1) If a file is selected, upload it to Storage
    let mediaUrl = "";
    if (mediaInput.files.length) {
      const file     = mediaInput.files[0];
      const storageRef = firebase.storage().ref();
      const fileRef    = storageRef.child(`blogMedia/${file.name}`);
      await fileRef.put(file);
      mediaUrl = await fileRef.getDownloadURL();
    }

    // 2) Write the new post into Firestore
    await db.collection("posts").add({
      title:   titleInput.value.trim(),
      body:    contentInput.value.trim(),
      media:   mediaUrl,                // blank string if none
      created: firebase.firestore.FieldValue.serverTimestamp(),
    });

    statusDiv.textContent = "✅ Published!";
    // clear form
    titleInput.value = "";
    contentInput.value = "";
    mediaInput.value = "";
  } catch (err) {
    console.error(err);
    statusDiv.textContent = "❌ Failed to publish: " + (err.message||err);
  } finally {
    publishBtn.disabled = false;
  }
});

cancelBtn.addEventListener("click", () => {
  titleInput.value   = "";
  contentInput.value = "";
  mediaInput.value   = "";
  statusDiv.textContent = "";
});
