// public/js/admin-blog.js
import { db, storage } from './firebase-config.js';
import { addDoc, collection, serverTimestamp, getDocs, query, orderBy, deleteDoc, doc } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js';

// All code is now wrapped in an exported function to prevent it from running too early.
export function initializeBlogView() {
    const titleInput = document.getElementById("new-post-title");
    const contentInput = document.getElementById("new-post-content");
    const mediaInput = document.getElementById("new-post-media");
    const publishBtn = document.getElementById("submit-post");
    const cancelBtn = document.getElementById("cancel-post");
    const statusDiv = document.getElementById("post-status");
    const blogPostsList = document.getElementById("blog-posts-list");
    const newPostForm = document.getElementById("new-post-form");

    const postsCol = collection(db, "posts");

    async function renderBlogPosts() {
        if (!blogPostsList) return;
        try {
            const snap = await getDocs(query(postsCol, orderBy("createdAt", "desc")));
            blogPostsList.innerHTML = "";
            if (snap.empty) {
                blogPostsList.innerHTML = `<p>No blog posts found.</p>`;
            } else {
                snap.forEach(doc => {
                    const post = doc.data();
                    const postEl = document.createElement('div');
                    postEl.className = 'post';
                    postEl.innerHTML = `
                        <h3>${post.title}</h3>
                        <p>${post.content}</p>
                        ${post.mediaUrl ? `<div class="post-media"><a href="${post.mediaUrl}" target="_blank">View Media</a></div>` : ''}
                        <button class="btn btn-delete-post" data-id="${doc.id}" data-media-url="${post.mediaUrl || ''}">Delete</button>
                    `;
                    blogPostsList.appendChild(postEl);
                });
            }
        } catch (error) {
            console.error("Failed to render blog posts:", error);
            blogPostsList.innerHTML = `<p class="error-message">Error loading posts: ${error.message}</p>`;
        }
    }

    async function deleteBlogPost(postId, mediaUrl) {
        if (!confirm("Are you sure you want to delete this post? This cannot be undone.")) {
            return;
        }

        try {
            if (mediaUrl) {
                const mediaRef = ref(storage, mediaUrl);
                await deleteObject(mediaRef);
            }
            await deleteDoc(doc(db, "posts", postId));
            renderBlogPosts();
        } catch (error) {
            console.error("Error deleting post:", error);
            statusDiv.textContent = `❌ Error deleting post: ${error.message}`;
        }
    }

    if (newPostForm) {
        newPostForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!titleInput.value.trim() || !contentInput.value.trim()) {
                statusDiv.textContent = "❌ Title and content cannot be empty.";
                return;
            }

            publishBtn.disabled = true;
            statusDiv.textContent = "Publishing...";

            try {
                let mediaUrl = "";
                if (mediaInput.files.length > 0) {
                    const file = mediaInput.files[0];
                    const storageRef = ref(storage, `blogMedia/${Date.now()}_${file.name}`);
                    await uploadBytes(storageRef, file);
                    mediaUrl = await getDownloadURL(storageRef);
                }

                await addDoc(postsCol, {
                    title: titleInput.value.trim(),
                    content: contentInput.value.trim(),
                    mediaUrl: mediaUrl,
                    createdAt: serverTimestamp(),
                });

                statusDiv.textContent = "✅ Published!";
                newPostForm.reset();
                renderBlogPosts();

            } catch (err) {
                console.error(err);
                statusDiv.textContent = "❌ Failed to publish: " + (err.message || err);
            } finally {
                publishBtn.disabled = false;
            }
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            newPostForm.reset();
            statusDiv.textContent = "";
        });
    }

    if (blogPostsList) {
        blogPostsList.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-delete-post')) {
                const postId = e.target.dataset.id;
                const mediaUrl = e.target.dataset.mediaUrl;
                deleteBlogPost(postId, mediaUrl);
            }
        });
    }

    // Initial render of blog posts when the view is initialized
    renderBlogPosts();
}
