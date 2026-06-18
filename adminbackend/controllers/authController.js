const jwt = require('jsonwebtoken');
const { getAuth } = require('firebase-admin/auth');

const login = async (req, res) => {
  const { username, password } = req.body;

  const targetUsername = process.env.ADMIN_USERNAME || 'admin';
  const targetPassword = process.env.ADMIN_PASSWORD || 'adminpassword';

  if (username === targetUsername && password === targetPassword) {
    const token = jwt.sign(
      { username },
      process.env.JWT_SECRET || 'supersecretadminjwttoken',
      { expiresIn: '24h' }
    );
    return res.json({ token, message: 'Logged in successfully as Admin.' });
  }

  return res.status(401).json({ error: 'Invalid username or password.' });
};

const loginWithGoogle = async (req, res) => {
  const { idToken, pin } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: 'idToken is required.' });
  }

  if (!pin) {
    return res.status(400).json({ error: 'Verification PIN is required.' });
  }

  if (pin !== '7243') {
    return res.status(403).json({ error: 'Access Denied: Invalid security PIN.' });
  }

  try {
    // Verify Firebase ID Token
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const email = decodedToken.email;

    // Check against authorized Google email addresses
    const allowedEmailsStr = process.env.ADMIN_GOOGLE_EMAILS || '';
    const allowedEmails = allowedEmailsStr
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(e => e.length > 0);

    if (allowedEmails.length > 0 && !allowedEmails.includes(email.toLowerCase())) {
      return res.status(403).json({ error: `Access Denied: ${email} is not authorized for Admin access.` });
    }

    // Sign admin JWT
    const token = jwt.sign(
      { username: email, isGoogleAuth: true },
      process.env.JWT_SECRET || 'supersecretadminjwttoken',
      { expiresIn: '24h' }
    );

    return res.json({ token, message: 'Logged in successfully via Google.' });
  } catch (error) {
    return res.status(401).json({ error: 'Firebase authentication failed: ' + error.message });
  }
};

module.exports = {
  login,
  loginWithGoogle
};
