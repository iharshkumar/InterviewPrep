const { initializeApp, cert } = require('firebase-admin/app');

const initFirebaseAdmin = () => {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId) {
      console.warn('WARNING: FIREBASE_PROJECT_ID is missing in Admin Backend. Firebase verification will not function.');
      return;
    }

    if (clientEmail && privateKey) {
      try {
        let cleanedPrivateKey = privateKey;
        if ((cleanedPrivateKey.startsWith('"') && cleanedPrivateKey.endsWith('"')) || 
            (cleanedPrivateKey.startsWith("'") && cleanedPrivateKey.endsWith("'"))) {
          cleanedPrivateKey = cleanedPrivateKey.slice(1, -1);
        }
        const formattedPrivateKey = cleanedPrivateKey.replace(/\\n/g, '\n');

        initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey: formattedPrivateKey
          })
        });
        console.log('Admin Backend: Firebase Admin SDK initialized successfully with Service Account credentials!');
        return;
      } catch (error) {
        console.warn('Admin Backend: Failed to initialize with Service Account credentials (e.g. invalid key). Falling back to Project ID only.');
      }
    }

    // Fallback: Initialize with just projectId
    initializeApp({
      projectId
    });
    console.log(`Admin Backend: Firebase Admin SDK initialized successfully using Project ID: ${projectId} (Token verification enabled)`);
  } catch (error) {
    console.error('Admin Backend: Error initializing Firebase Admin SDK:', error.message);
  }
};

module.exports = { initFirebaseAdmin };
