// public/js/login.js
// Uses global `auth` from firebase-config.js

document.getElementById('sign-in').addEventListener('click', async () => {
  const btn = document.getElementById('sign-in');
  const err = document.getElementById('login-error');
  btn.disabled = true;
  err.textContent = '';
  try {
    const email = document.getElementById('email').value;
    const pw    = document.getElementById('password').value;
    await auth.signInWithEmailAndPassword(email, pw);
    window.location = 'admin.html';
  } catch (e) {
    err.textContent = e.message;
  } finally {
    btn.disabled = false;
  }
});
