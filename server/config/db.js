const mongoose = require('mongoose');
const config = require('./config');

const connectDB = async () => {
  try {
    const connUri = config.mongodbUri || 'mongodb://localhost:27017/mockprep';
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(connUri);
    
    console.log('MongoDB Connected successfully!');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    // Exit process with failure if DB connection is required
    process.exit(1);
  }
};

module.exports = connectDB;
