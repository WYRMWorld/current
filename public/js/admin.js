import { auth } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { initializeAdminView as initializeBeatBattleView } from './admin-beatbattle.js';
import { initializeBlogView } from './admin-blog.js';

// This is the single entry point for the entire admin page.
// It waits for Firebase to report the user's authentication status.
onAuthStateChanged(auth, (user) => {
  const loader = document.getElementById('loader');
  const adminUI = document.getElementById('admin-ui');
  const signOutBtn = document.getElementById('sign-out');

  if (user) {
    // 1. User is authenticated. First, hide the loader and show the admin panel.
    if (loader) loader.style.display = 'none';
    if (adminUI) adminUI.style.display = 'block';
    
    // 2. Set up the sign-out button.
    if (signOutBtn) {
      signOutBtn.style.display = 'inline-block';
      signOutBtn.addEventListener('click', () => {
        signOut(auth).catch(error => console.error('Sign out error:', error));
      });
    }

    // 3. NOW that the page is visible, initialize all the admin functionality.
    // This prevents the "cannot read properties of null" error because we know
    // all the buttons and sections exist at this point.
    initializeBeatBattleView();
    initializeBlogView();

  } else {
    // User is not authenticated, redirect them to the login page.
    window.location.href = 'login.html';
  }
});
