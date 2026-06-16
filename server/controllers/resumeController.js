const pdfParse = require('pdf-parse');
const User = require('../models/User');

/**
 * Handle resume file upload and PDF content extraction, storing it in the user's MongoDB profile
 */
const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const dataBuffer = req.file.buffer;
    const data = await pdfParse(dataBuffer);
    
    // Scopes the parsed content to the logged-in candidate profile
    if (req.user && req.user.uid) {
      await User.findOneAndUpdate(
        { firebaseUid: req.user.uid },
        { 
          $set: { 
            resumeFilename: req.file.originalname,
            resumeText: data.text
          }
        },
        { upsert: true }
      );
    }
    
    res.json({ 
      success: true, 
      text: data.text,
      filename: req.file.originalname
    });
  } catch (error) {
    console.error('Error parsing PDF:', error);
    res.status(500).json({ error: 'Failed to parse resume' });
  }
};

module.exports = {
  uploadResume
};
