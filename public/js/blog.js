// public/js/blog.js
import { db } from './firebase-config.js';
import { 
    collection, 
    getDocs, 
    query, 
    orderBy, 
    limit, 
    startAfter 
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

const postsContainer = document.getElementById('posts-container');
const loadMoreContainer = document.getElementById('load-more-container');
const initialLoader = document.getElementById('initial-loader');

let lastVisible = null; // Tracks the last document for pagination
const POSTS_PER_PAGE = 5; // Number of posts to load each time

// --- Renders a set of posts to the page ---
function renderPosts(docs) {
    docs.forEach(doc => {
        const post = doc.data();
        const title = post.title || 'Untitled Post';
        const content = post.content || '';
        const mediaUrl = post.mediaUrl || '';
        const date = post.createdAt?.seconds ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : 'No date';

        const article = document.createElement('article');
        article.className = 'post';
        
        let mediaElement = '';
        if (mediaUrl) {
            if (/\.(jpg|jpeg|png|gif)$/i.test(mediaUrl)) {
                mediaElement = `<img src="${mediaUrl}" alt="${title}" class="post-media" loading="lazy">`;
            } else if (/\.(mp4|webm|ogg)$/i.test(mediaUrl)) {
                mediaElement = `<video controls src="${mediaUrl}" class="post-media"></video>`;
            }
        }

        article.innerHTML = `
            <h2>${title}</h2>
            <time>${date}</time>
            ${mediaElement}
            <div class="post-content">${content}</div>
        `;
        postsContainer.append(article);
    });
}

// --- Fetches posts from Firestore ---
async function fetchPosts() {
    try {
        // Create the base query
        let postsQuery = query(
            collection(db, 'posts'), 
            orderBy('createdAt', 'desc'), 
            limit(POSTS_PER_PAGE)
        );

        // If this isn't the first page, start after the last document we saw
        if (lastVisible) {
            postsQuery = query(postsQuery, startAfter(lastVisible));
        }

        const snapshot = await getDocs(postsQuery);

        // Hide the initial loader if it's visible
        if (initialLoader) {
            initialLoader.style.display = 'none';
        }

        if (snapshot.empty && !lastVisible) {
            // This means it was the first load and no posts were found
            postsContainer.innerHTML = '<p>No blog posts have been published yet.</p>';
            return;
        }

        // Render the posts that were fetched
        renderPosts(snapshot.docs);
        
        // Update the last visible document
        lastVisible = snapshot.docs[snapshot.docs.length - 1];

        // Manage the 'Load More' button
        loadMoreContainer.innerHTML = ''; // Clear previous button
        if (snapshot.docs.length === POSTS_PER_PAGE) {
            // If we received a full page of results, there might be more
            const loadMoreBtn = document.createElement('button');
            loadMoreBtn.textContent = 'Load More';
            loadMoreBtn.className = 'btn'; // Use your existing button style
            loadMoreBtn.onclick = () => {
                loadMoreBtn.textContent = 'Loading...';
                loadMoreBtn.disabled = true;
                fetchPosts();
            };
            loadMoreContainer.appendChild(loadMoreBtn);
        }

    } catch (e) {
        console.error("Error loading posts:", e);
        if (initialLoader) initialLoader.style.display = 'none';
        postsContainer.innerHTML = `<div class="error-message"><p><strong>Unable to load blog posts.</strong></p></div>`;
    }
}

// --- Initial Load ---
// Start the process when the script runs
fetchPosts();

