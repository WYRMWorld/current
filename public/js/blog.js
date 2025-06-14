// Uses global `db`
async function loadPosts() {
  const snapshot = await db
    .collection("posts")
    .orderBy("createdAt", "desc")
    .get();
  const container = document.getElementById("posts-container");
  snapshot.forEach(doc => {
    const { title, content, mediaUrls, createdAt } = doc.data();
    const article = document.createElement("article");
    article.innerHTML = `
      <h2>${title}</h2>
      <time>${new Date(createdAt.toMillis()).toLocaleDateString()}</time>
      <div>${content}</div>
      ${mediaUrls?.map(u=>`<a href="${u}" target="_blank">Media</a>`).join(" ")}
    `;
    container.appendChild(article);
  });
}
loadPosts();
