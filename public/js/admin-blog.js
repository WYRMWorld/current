// public/js/admin-blog.js
// Uses global db, storage, auth

auth.onAuthStateChanged(user => {
  if (!user) window.location = 'login.html';
});

document.getElementById('publish-post')
  .addEventListener('click', async () => {
    const btn = document.getElementById('publish-post');
    const err = document.getElementById('blog-error');
    btn.disabled = true;
    err.textContent = '';
    try {
      const title   = document.getElementById('post-title').value.trim();
      const content = document.getElementById('post-content').value.trim();
      const files   = document.getElementById('post-media').files;

      if (!title || !content) {
        throw new Error("Title and content are required.");
      }

      // 1) Create Firestore doc with a 'type' field if you ever want to filter
      const postRef = await db.collection('posts').add({
        title,
        content,
        type: 'blog',                                // ← optional tag
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        mediaUrls: []                                // pre-seed the array
      });
      console.log("Created post:", postRef.id);

      // 2) Upload media and collect URLs
      const mediaUrls = [];
      for (const f of files) {
        const storageRef = storage.ref(`posts/${postRef.id}/${f.name}`);
        await storageRef.put(f);
        mediaUrls.push(await storageRef.getDownloadURL());
      }

      // 3) Merge in URLs (use merge: true so you preserve other fields)
      await postRef.set({ mediaUrls }, { merge: true });
      console.log("Uploaded media:", mediaUrls);

      err.textContent = 'Post published successfully!';
    } catch (e) {
      console.error("Blog publish error:", e);
      err.textContent = e.message;
    } finally {
      btn.disabled = false;
    }
  });
