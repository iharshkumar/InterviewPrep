const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const adminRouter = require('./routes/admin');
const { initFirebaseAdmin } = require('./config/firebaseAdmin');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/admin', adminRouter);

// Database connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables.');
    }
    
    await mongoose.connect(mongoUri);
    console.log('Admin Backend: Local MongoDB Connected successfully!');

    // Sibling backend mongoose connection (handles isolated node_modules locally)
    try {
      const backendMongoose = require('../backend/node_modules/mongoose');
      if (backendMongoose !== mongoose) {
        await backendMongoose.connect(mongoUri);
        console.log('Admin Backend: Sibling Backend MongoDB Connected successfully!');
      }
    } catch (err) {
      console.warn('Admin Backend: Note - Sibling backend mongoose not connected relatives:', err.message);
    }
  } catch (error) {
    console.error('Admin Backend: Database connection failed:', error.message);
    process.exit(1);
  }
};

// Start Server
if (require.main === module) {
  // Initialize Firebase Admin
  initFirebaseAdmin();

  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Admin Backend server listening at http://localhost:${PORT}`);
    });
  });
}

module.exports = app;
