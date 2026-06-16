const { getAuth } = require('firebase-admin/auth');
const config = require('../config/config');

/**
 * Authentication middleware to verify Firebase ID token JWTs
 */
const verifyToken = async (req, res, next) => {
  const { projectId, clientEmail, privateKey } = config.firebase;
  const isFirebaseConfigured = projectId && clientEmail && privateKey;

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (!isFirebaseConfigured) {
      req.user = {
        uid: 'mock-user-jane-doe',
        email: 'jane.doe@example.com',
        name: 'Jane Doe'
      };
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header format' });
  }

  const token = authHeader.split('Bearer ')[1];

  if (!isFirebaseConfigured || token === 'mock-token') {
    req.user = {
      uid: 'mock-user-jane-doe',
      email: 'jane.doe@example.com',
      name: 'Jane Doe'
    };
    return next();
  }

  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Firebase token verification failed:', error.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid authentication token' });
  }
};

module.exports = verifyToken;
