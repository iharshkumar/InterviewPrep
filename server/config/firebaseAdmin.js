const { initializeApp, cert } = require('firebase-admin/app');
const config = require('./config');

const initFirebaseAdmin = () => {
  try {
    const { projectId, clientEmail, privateKey } = config.firebase;
    
    if (!projectId || !clientEmail || !privateKey) {
      console.warn('WARNING: Firebase Admin credentials are missing in your environment config. Auth middleware will run in simulated development mode.');
      return;
    }
    
    // Format the private key correctly to handle escaped newlines
    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
    
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: formattedPrivateKey
      })
    });
    
    console.log('Firebase Admin SDK initialized successfully!');
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error.message);
  }
};

module.exports = {
  initFirebaseAdmin
};
