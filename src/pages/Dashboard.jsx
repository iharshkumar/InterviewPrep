import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Clock, TrendingUp, History, UploadCloud, FileText, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [role, setRole] = useState('frontend');
  const [difficulty, setDifficulty] = useState('mid');
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      await uploadFile(selectedFile);
    } else {
      alert('Please upload a PDF file.');
    }
  };

  const uploadFile = async (fileToUpload) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('resume', fileToUpload);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setResumeText(data.text);
      } else {
        alert('Upload failed: ' + data.error);
      }
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Failed to connect to server.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleStartSession = async (section) => {
    if (!resumeText) {
      alert('Please wait for the resume to finish parsing, or upload a resume.');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, role, difficulty, section }),
      });
      
      const data = await response.json();
      if (data.questions) {
        // We start with HR, so the remaining sections are Technical and Behavioral
        const pendingSections = ['Technical', 'Behavioral'];
        
        // Navigate to interview room and pass questions via state
        navigate('/interview', { 
          state: { 
            questions: data.questions, 
            role,
            difficulty,
            resumeText,
            pendingSections,
            allQuestions: data.questions,
            allAnswers: {}
          } 
        });
      } else {
        alert('Failed to generate questions: ' + (data.details || data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      alert('Failed to connect to server.');
    } finally {
      setIsGenerating(false);
    }
  };



  return (
    <div className="dashboard-page">
      <motion.div 
        className="dashboard-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="dashboard-title">Welcome back, User</h1>
        <p className="dashboard-subtitle">Ready for your next mock interview?</p>
      </motion.div>

      <div className="dashboard-grid">
        {/* Upload Zone */}
        <motion.div 
          className="glass-panel upload-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="upload-header">
            <h3>Upload Resume</h3>
            <p className="dashboard-subtitle" style={{ fontSize: '0.875rem' }}>PDF format only</p>
          </div>
          
          <div 
            className={`upload-zone ${file ? 'has-file' : ''}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".pdf" 
              style={{ display: 'none' }} 
            />
            
            {isUploading ? (
              <div className="upload-state">
                <Loader2 className="spinning" size={32} />
                <p>Parsing resume...</p>
              </div>
            ) : file ? (
              <div className="upload-state success">
                <FileText size={32} color="#10b981" />
                <p>{file.name}</p>
                <span className="small-text">Click to change</span>
              </div>
            ) : (
              <div className="upload-state">
                <UploadCloud size={32} />
                <p>Click or drag to upload</p>
              </div>
            )}
          </div>
        </motion.div>


      </div>

      <motion.div 
        className="glass-panel action-panel"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="action-content">
          <h2>Start a New Interview</h2>
          <p>Choose a role and difficulty to begin your AI-powered mock interview.</p>
          
          <div className="action-form">
            <select 
              className="custom-select" 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="frontend">Frontend Developer</option>
              <option value="backend">Backend Developer</option>
              <option value="fullstack">Fullstack Developer</option>
              <option value="data">Data Scientist</option>
              <option value="devops">DevOps Engineer</option>
              <option value="mobile">Mobile Developer (iOS/Android)</option>
              <option value="uiux">UI/UX Designer</option>
              <option value="qa">QA Engineer</option>
              <option value="product">Product Manager</option>
              <option value="ai">AI/ML Engineer</option>
            </select>
            
            <select 
              className="custom-select"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="junior">Junior</option>
              <option value="mid">Mid-Level</option>
              <option value="senior">Senior</option>
            </select>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px', width: '100%', flexWrap: 'wrap' }}>
              <Button 
                variant="primary" 
                onClick={() => handleStartSession('HR')}
                disabled={isGenerating || isUploading}
                style={{ background: 'linear-gradient(to right, #6366f1, #a855f7)', border: 'none', flex: 1, minWidth: '220px' }}
              >
                {isGenerating ? (
                  <><Loader2 className="spinning" size={18} /> Generating...</>
                ) : (
                  <><Play size={18} /> Start Full Interview (60 min)</>
                )}
              </Button>
            </div>
          </div>
          {!resumeText && <p className="warning-text mt-2" style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '8px' }}>Please upload your resume first to start the Full sequential interview.</p>}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
