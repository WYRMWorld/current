// public/js/firebase-config.js

// Your Firebase config
const firebaseConfig = {
  apiKey:            "AIzaSyDHnyLP2EWkPPD3c4JVVGjUphYKASoVEkI",
  authDomain:        "wyrm-collective.firebaseapp.com",
  projectId:         "wyrm-collective",
  storageBucket:     "wyrm-collective.appspot.com",
  messagingSenderId: "450404872617",
  appId:             "1:450404872617:web:9644350024fd570d0614b8",
  measurementId:     "G-E9FPEBEMMX"
};

// Initialize Firebase compat SDK
firebase.initializeApp(firebaseConfig);

// Expose auth & db globally
window.auth = firebase.auth();
window.db   = firebase.firestore();
window.storage = firebase.storage();
