import { db, storage } from './firebase-config.js';
import {
  collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, getDocs, where, limit
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { ref, uploadBytesResumable, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js';

const form = document.getElementById('submit-form');
const statusDiv = document.getElementById('submit-status');
const feedbackBody = document.getElementById('feedback-queue-body');
const beatBattleBody = document.getElementById('beatbattle-queue-body');
const submitBtn = document.getElementById('submit-btn');
const radioFeedback = form.querySelector('input[value="feedback"]');
const radioBeatBattle = form.querySelector('input[value="beatBattle"]');
const battleStatusMessage = document.getElementById('battle-status-message');

let beatBattleLocked = false;

async function checkBeatBattleActive() {
  const q = query(collection(db, 'battles'), where('endedAt', '==', null), limit(1));
  const snap = await getDocs(q);
  return !snap.empty;
}

function setBeatBattleLockState(locked) {
  beatBattleLocked = locked;
  radioBeatBattle.disabled = locked;

  if (locked) {
    if (radioBeatBattle.checked) {
        radioFeedback.checked = true;
    }
    radioBeatBattle.parentElement.style.color = '#777';
    battleStatusMessage.textContent = "Beat Battle Submissions Can Not Be Accepted Until There Is An Active Battle...";
    battleStatusMessage.style.color = "var(--accent-pink)";
  } else {
    radioBeatBattle.parentElement.style.color = 'inherit';
    battleStatusMessage.textContent = "Battle Is Active! Submit Your Track!";
    battleStatusMessage.style.color = "var(--accent-green)";
  }
}

// Listeners for battle state and queues
checkBeatBattleActive().then(active => setBeatBattleLockState(!active));
onSnapshot(query(collection(db, 'battles'), where('endedAt', '==', null)), () => checkBeatBattleActive().then(active => setBeatBattleLockState(!active)));

// --- COMPLETE FORM SUBMISSION LOGIC ---
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
  if (beatBattleLocked && queueType === 'beatBattle') {
    statusDiv.textContent = 'Beat Battle submissions are currently closed.';
    return;
  }

  submitBtn.disabled = true;
  window.showLightspeedLoader && window.showLightspeedLoader();
  statusDiv.textContent = 'Uploading...';

  try {
    const storageRef = ref(storage, `submissions/${queueType}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    await new Promise((resolve, reject) => {
      uploadTask.on('state_changed', 
        snapshot => window.updateLightspeedLoaderProgress && window.updateLightspeedLoaderProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 0.95),
        error => reject(error),
        () => resolve()
      );
    });

    const trackUrl = await getDownloadURL(uploadTask.snapshot.ref);

    await addDoc(collection(db, 'queues', queueType, 'items'), {
      name: nameInput.value.trim(),
      originalName: file.name,
      trackUrl,
      enqueuedAt: serverTimestamp()
    });
    
    window.updateLightspeedLoaderProgress && window.updateLightspeedLoaderProgress(1);
    statusDiv.textContent = '✅ Submission successful!';
    form.reset();

  } catch (err) {
    console.error(err);
    statusDiv.textContent = `❌ ${err.message}`;
  } finally {
    setTimeout(() => {
      window.hideLightspeedLoader && window.hideLightspeedLoader();
      submitBtn.disabled = false;
    }, 600);
  }
});


// --- COMPLETE QUEUE RENDERING LOGIC ---
function createQueueListener(name, tbodyEl) {
  if (!tbodyEl) return;
  const q = query(collection(db, 'queues', name, 'items'), orderBy('enqueuedAt'));
  onSnapshot(q, snapshot => {
    tbodyEl.innerHTML = '';
    if (snapshot.empty) {
      tbodyEl.innerHTML = `<tr><td colspan="3">This queue is currently empty.</td></tr>`;
    } else {
      snapshot.docs.forEach((docSnap, idx) => {
        const { name = 'Unnamed', originalName = '' } = docSnap.data();
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

createQueueListener('feedback', feedbackBody);
createQueueListener('beatBattle', beatBattleBody);
