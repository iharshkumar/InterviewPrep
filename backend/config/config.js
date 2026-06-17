module.exports = {
  port: process.env.PORT || 3001,
  groqApiKey: process.env.GROQ_API_KEY,
  mongodbUri: process.env.MONGODB_URI,
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY
  }
};
