// public/login.js
import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';

const btn = document.getElementById('sign-in');
const err = document.getElementById('login-error');

btn.addEventListener('click', async () => {
  btn.disabled = true;
  err.textContent = '';
  const email = document.getElementById('email').value;
  const pw    = document.getElementById('password').value;
  try {
    await signInWithEmailAndPassword(auth, email, pw);
    window.location = 'admin.html';
  } catch (e) {
    err.textContent = e.message;
  } finally {
    btn.disabled = false;
  }
});
