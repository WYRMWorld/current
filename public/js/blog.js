// public/js/blog.js

async function loadPosts() {
  try {
    const snapshot = await db.collection("posts")
                             .orderBy("timestamp", "desc")
                             .get();
    const container = document.getElementById("posts-container");
    container.innerHTML = "";    
    snapshot.forEach(doc => {
      const data = doc.data();
      const div  = document.createElement("div");
      div.className = "post";
      div.innerHTML = `
        <h2>${data.title}</h2>
        <p>${data.content}</p>
        <small>${new Date(data.timestamp).toLocaleString()}</small>
      `;
      container.append(div);
    });
  } catch (e) {
    document.getElementById("posts-container").textContent =
      "Unable to load blog posts.";
    console.error("Error loading posts:", e);
  }
}

// Run on page load
window.addEventListener("DOMContentLoaded", loadPosts);
