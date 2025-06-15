// public/js/firebase-config.js

// Fire SDKs are loaded via <script> tags in each HTML page

// Your web app’s Firebase configuration
const firebaseConfig = {
  apiKey:     "AIzaSyDHnyLP2EWkPPD3c4JVVGjUphYKASoVEkI",
  authDomain: "wyrm-collective.firebaseapp.com",
  projectId:  "wyrm-collective",
  storageBucket: "wyrm-collective.firebasestorage.app",
  messagingSenderId: "450404872617",
  appId:      "1:450404872617:web:9644350024fd570d0614b8"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Expose the services you need
const db      = firebase.firestore();
const storage = firebase.storage();
const auth    = firebase.auth();
