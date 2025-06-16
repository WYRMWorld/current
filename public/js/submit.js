// public/js/submit.js
import { db, storage } from './firebase-config.js';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js';

const form                = document.getElementById('submit-form');
const statusDiv           = document.getElementById('submit-status');
const loader              = document.getElementById('initial-loader');
const feedbackBody        = document.getElementById('feedback-queue-body');
const beatBattleBody      = document.getElementById('beatbattle-queue-body');

// Handle form submit
form && form.addEventListener('submit', async e => {
  e.preventDefault();
  const nameInput  = document.getElementById('submit-name');
  const trackInput = document.getElementById('submit-track');
  const queueType  = form.querySelector('input[name="type"]:checked').value;
  const file       = trackInput.files[0];
  if (!file) {
    statusDiv.textContent = 'Please select a track.';
    return;
  }
  loader.style.display = 'flex';
  statusDiv.textContent  = 'Uploading…';
  form.querySelector('button').disabled = true;

  try {
    // Upload to Storage
    const storageRef = ref(storage, `submissions/${queueType}/${Date.now()}_${file.name}`);
    const uploadRes  = await uploadBytes(storageRef, file);
    const trackUrl   = await getDownloadURL(uploadRes.ref);

    // Add to Firestore
    await addDoc(collection(db, 'queues', queueType, 'items'), {
      name:          nameInput.value.trim(),
      originalName:  file.name,
      trackUrl,
      enqueuedAt:    serverTimestamp()
    });

    statusDiv.textContent = '✅ Submission successful!';
    form.reset();
  } catch (err) {
    console.error(err);
    statusDiv.textContent = `❌ ${err.message}`;
  } finally {
    loader.style.display = 'none';
    form.querySelector('button').disabled = false;
  }
});

// Listen in real-time
function createQueueListener(name, tbodyEl) {
  if (!tbodyEl) return;
  const q = query(collection(db, 'queues', name, 'items'), orderBy('enqueuedAt'));
  onSnapshot(q, snapshot => {
    tbodyEl.innerHTML = '';
    if (snapshot.empty) {
      tbodyEl.innerHTML = `<tr><td colspan="3">This queue is currently empty.</td></tr>`;
    } else {
      snapshot.docs.forEach((docSnap, idx) => {
        const { name = 'Unnamed Track', originalName = '' } = docSnap.data();
        const fileName = originalName.replace(/\.[^/.]+$/, '');
        const row = document.createElement('tr');
        row.innerHTML = `<td>${idx + 1}</td><td>${name}</td><td>${fileName}</td>`;
        tbodyEl.appendChild(row);
      });
    }
  }, err => {
    console.error(err);
    tbodyEl.innerHTML = `<tr><td colspan="3" class="error-message">${err.message}</td></tr>`;
  });
}

createQueueListener('feedback',   feedbackBody);
createQueueListener('beatBattle', beatBattleBody);
