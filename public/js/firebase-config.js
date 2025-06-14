// public/js/firebase-config.js
// (Load v9.23.0 SDKs via <script> tags—no analytics module)

// Firebase configuration
const firebaseConfig = {
  apiKey:     "AIzaSyDHnyLP2EWkPPD3c4JVVGjUphYKASoVEkI",
  authDomain: "wyrm-collective.firebaseapp.com",
  projectId:  "wyrm-collective",
  storageBucket: "wyrm-collective.firebasestorage.app",
  messagingSenderId: "450404872617",
  appId:      "1:450404872617:web:9644350024fd570d0614b8"
};

// Initialize
firebase.initializeApp(firebaseConfig);
// Globals
const db      = firebase.firestore();
const storage = firebase.storage();
const auth    = firebase.auth();