// public/js/admin.js
import { auth } from './firebase-config.js';
// CORRECTED: signOut is now imported from the auth library directly.
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { initializeAdminView } from './admin-beatbattle.js';
import { initializeBlogView } from './admin-blog.js'; // Import the new blog initialization function

// --- DOM ELEMENTS ---
const adminUI = document.getElementById('admin-ui');
const signOutBtn = document.getElementById('sign-out');
const loader = document.getElementById('loader');

// --- AUTHENTICATION ---
// This script now controls the entire page setup sequence.
onAuthStateChanged(auth, user => {
  if (user) {
    // 1. User is authenticated, so hide the loader and show the admin UI.
    if(loader) loader.style.display = 'none';
    if(adminUI) adminUI.style.display = 'block';
    if(signOutBtn) signOutBtn.style.display = 'inline-block';

    // 2. NOW that the UI is visible, load all the data and set up event listeners.
    initializeAdminView();
    initializeBlogView(); // Call the blog setup function.

  } else {
    // User is not authenticated, redirect to the login page.
    window.location.href = 'login.html';
  }
});

// Add the sign-out functionality.
if(signOutBtn) {
    signOutBtn.addEventListener('click', () => {
        signOut(auth).catch(error => console.error('Sign out error:', error));
    });
}
