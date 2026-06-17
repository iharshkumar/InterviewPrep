const express = require('express');
const cors = require('cors');
const config = require('./config/config');
const apiRouter = require('./routes/api');
const connectDB = require('./config/db');
const { initFirebaseAdmin } = require('./config/firebaseAdmin');

const app = express();

app.use(cors());
app.use(express.json());

// Mount API routes
app.use('/api', apiRouter);

// Start the server if file is run directly
if (require.main === module) {
  // Connect to MongoDB and seed if database is empty
  connectDB().then(() => {
    const { seedIfEmpty } = require('./utils/seedLeaderboard');
    seedIfEmpty();
  }).catch(err => {
    console.error('Failed to run database seeder on startup:', err);
  });
  
  // Initialize Firebase Admin
  initFirebaseAdmin();

  app.listen(config.port, () => {
    console.log(`Server listening at http://localhost:${config.port}`);
  });
}

module.exports = app;
