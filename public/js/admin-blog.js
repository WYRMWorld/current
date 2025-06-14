// public/js/admin-blog.js
// Uses global db, storage, auth (no imports)

auth.onAuthStateChanged(user => {
  if (!user) window.location = 'login.html';
});

document.getElementById('publish-post').addEventListener('click', async () => {
  const btn = document.getElementById('publish-post');
  const err = document.getElementById('blog-error');
  btn.disabled = true;
  err.textContent = '';
  try {
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;
    const files = document.getElementById('post-media').files;

    // 1) Create Firestore document
    const postRef = await db.collection('posts').add({
      title,
      content,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // 2) Upload media files
    const mediaUrls = [];
    for (const f of files) {
      const storageRef = storage.ref(`posts/${postRef.id}/${f.name}`);
      await storageRef.put(f);
      mediaUrls.push(await storageRef.getDownloadURL());
    }

    // 3) Update post with media URLs
    await postRef.update({ mediaUrls });
    err.textContent = 'Post published successfully!';
  } catch (e) {
    err.textContent = e.message;
  } finally {
    btn.disabled = false;
  }
});
