// public/js/blog.js
// (No imports — this uses the global `db` from firebase-config.js)

async function loadPosts() {
  try {
    const snapshot = await db
      .collection("posts")
      .orderBy("createdAt", "desc")
      .get();

    const container = document.getElementById("posts-container");
    container.innerHTML = ""; // clear any placeholder

    snapshot.forEach(doc => {
      const { title, content, mediaUrls = [], createdAt } = doc.data();

      const article = document.createElement("article");
      article.classList.add("blog-post");

      // Format date (if createdAt is a Firestore Timestamp)
      let dateString = "";
      if (createdAt && typeof createdAt.toDate === "function") {
        dateString = new Date(createdAt.toDate()).toLocaleDateString();
      }

      // Build media links, if any
      const mediaHtml = mediaUrls
        .map(u => `<a href="${u}" target="_blank" class="media-link">Media</a>`)
        .join(" ");

      article.innerHTML = `
        <h2>${title}</h2>
        <time>${dateString}</time>
        <div class="post-content">${content}</div>
        <div class="post-media">${mediaHtml}</div>
      `;

      container.appendChild(article);
    });
  } catch (err) {
    console.error("Error loading posts:", err);
    document
      .getElementById("posts-container")
      .textContent = "Unable to load blog posts.";
  }
}

document.addEventListener("DOMContentLoaded", loadPosts);
