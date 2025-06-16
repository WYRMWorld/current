// setAdmin.js
import admin from 'firebase-admin';

// Initialize the SDK. If you haven’t already, download your service-account JSON
// and set GOOGLE_APPLICATION_CREDENTIALS to point at it, or pass it here:
// admin.initializeApp({
//   credential: admin.credential.cert(require('./path/to/service-account.json'))
// });
admin.initializeApp();

const uid = '1rnngUpU4eQY8SQMST6eTymcPu73';  // your admin’s UID
admin
  .auth()
  .setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log(`Admin claim set for ${uid}`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error setting admin claim:', err);
    process.exit(1);
  });
