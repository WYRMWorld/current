import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js';

const firebaseConfig = {
  apiKey: "AIzaSyDHnyLP2EWkPPD3c4JVVGjUphYKASoVEkI",
  authDomain: "wyrm-collective.firebaseapp.com",
  projectId: "wyrm-collective",
  storageBucket: "wyrm-collective.firebasestorage.app", // <-- corrected bucket name
  messagingSenderId: "450404872617",
  appId: "1:450404872617:web:9644350024fd570d0614b8",
  measurementId: "G-E9FPEBEMMX"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);