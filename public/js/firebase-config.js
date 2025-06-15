// public/js/firebase-config.js

// Your Firebase configuration
const firebaseConfig = {
  apiKey:            "AIzaSyDHnyLP2EWkPPD3c4JVVGjUphYKASoVEkI",
  authDomain:        "wyrm-collective.firebaseapp.com",
  projectId:         "wyrm-collective",
  storageBucket:     "wyrm-collective.appspot.com",      // <-- corrected bucket host
  messagingSenderId: "450404872617",
  appId:             "1:450404872617:web:9644350024fd570d0614b8",
  measurementId:     "G-E9FPEBEMMX"
};

// Initialize the compat (namespaced) SDK
firebase.initializeApp(firebaseConfig);

// Grab the services off the global `firebase`
const db      = firebase.firestore();
const auth    = firebase.auth();
const storage = firebase.storage();

// Make them available globally if you like
window.db      = db;
window.auth    = auth;
window.storage = storage;
