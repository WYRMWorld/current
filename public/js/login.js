// public/js/login.js
import { auth } from './firebase-config.js';
import { 
  signInWithEmailAndPassword, 
  setPersistence, 
  browserLocalPersistence 
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';

const btn = document.getElementById('sign-in');
const err = document.getElementById('login-error');

// Redirect if user is already logged in
auth.onAuthStateChanged(user => {
  if (user) {
    window.location.href = 'admin.html';
  }
});

btn.addEventListener('click', async () => {
  btn.disabled = true;
  err.textContent = '';
  const email = document.getElementById('email').value;
  const pw    = document.getElementById('password').value;

  if (!email || !pw) {
    err.textContent = 'Email and password cannot be empty.';
    btn.disabled = false;
    return;
  }

  try {
    // Set persistence to keep the user logged in
    await setPersistence(auth, browserLocalPersistence);
    await signInWithEmailAndPassword(auth, email, pw);
    // On success, the onAuthStateChanged listener above will redirect to admin.html
  } catch (e) {
    err.textContent = e.message;
  } finally {
    btn.disabled = false;
  }
});
