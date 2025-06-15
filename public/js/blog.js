// public/blog.js
import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

const container = document.getElementById('posts-container');

async function loadPosts() {
  try {
    const q    = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    container.innerHTML = '';
    snap.forEach(doc => {
      const { title, content, createdAt } = doc.data();
      const date = createdAt ? new Date(createdAt.seconds * 1000).toLocaleDateString() : '';
      const article = document.createElement('article');
      article.className = 'post';
      article.innerHTML = `
        <h2>${title}</h2>
        <time>${date}</time>
        <div class="post-content">${content}</div>
      `;
      container.append(article);
    });
  } catch (e) {
    console.error(e);
    container.textContent = 'Unable to load blog posts.';
  }
}

loadPosts();
