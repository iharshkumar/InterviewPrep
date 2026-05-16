import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, MessageSquare, PhoneOff, CheckCircle, Clock } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import Scene from '../components/Scene';
import Button from '../components/Button';
import './InterviewRoom.css';

const InterviewRoom = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const { questions, role } = location.state || { questions: [], role: 'unknown' };
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes (3600 seconds)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef(null);
  const intendedListeningRef = useRef(false);
  const videoRef = useRef(null);

  // Setup Live Webcam
  useEffect(() => {
    let stream = null;
    
    const startCamera = async () => {
      try {
        if (camOn) {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } else {
          if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(t => t.stop());
            videoRef.current.srcObject = null;
          }
        }
      } catch (err) {
        console.error("Camera access denied or error:", err);
        alert("Camera error: " + err.message + "\n\nPlease ensure your browser allows camera access for localhost.");
      }
    };
    
    startCamera();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [camOn]);

  useEffect(() => {
    if (!questions || questions.length === 0) {
      alert("No questions found. Redirecting to dashboard.");
      navigate('/dashboard');
    }
  }, [questions, navigate]);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (val) => {
    setAnswers({ ...answers, [currentQuestionIndex]: val });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const toggleListening = () => {
    if (intendedListeningRef.current) {
      intendedListeningRef.current = false;
      setIsListening(false);
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Speech Recognition. Please use Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      if (finalTranscript) {
        setAnswers(prev => ({
          ...prev,
          [currentQuestionIndex]: (prev[currentQuestionIndex] || '') + finalTranscript
        }));
      }
      
      setInterimText(interimTranscript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === 'not-allowed') {
        alert("Microphone access blocked! Please click the camera/mic icon in your browser's URL bar and allow access.");
        intendedListeningRef.current = false;
      }
    };

    recognition.onend = () => {
      if (intendedListeningRef.current) {
        // Automatically restart to prevent it from getting stuck/pausing
        try {
          recognition.start();
        } catch (e) {}
      } else {
        setIsListening(false);
        setInterimText('');
      }
    };

    intendedListeningRef.current = true;
    setIsListening(true);
    recognition.start();
    recognitionRef.current = recognition;
  };

  // Cleanup recognition on unmount or question change
  useEffect(() => {
    if (intendedListeningRef.current && recognitionRef.current) {
      intendedListeningRef.current = false;
      setIsListening(false);
      recognitionRef.current.stop();
    }
    return () => {
      if (recognitionRef.current) {
        intendedListeningRef.current = false;
        recognitionRef.current.stop();
      }
    };
  }, [currentQuestionIndex]);

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:3001/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, questions, role }),
      });
      const data = await response.json();
      navigate('/results', { state: { result: data } });
    } catch (error) {
      console.error("Evaluation failed:", error);
      alert("Failed to evaluate. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (!questions || questions.length === 0) return null;

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="interview-room-fullscreen">
      {/* Header with Timer and Navigation */}
      <div className="interview-header glass-panel">
        <div className="header-left">
          <MessageSquare size={20} className="text-primary" />
          <h2 style={{ fontSize: '1.25rem' }}>Question {currentQuestionIndex + 1} of {questions.length}</h2>
          <span className="question-type-badge">
            {currentQuestion.type === 'mcq' ? 'Multiple Choice' : 'Subjective'}
          </span>
        </div>
        
        <div className="timer-badge-top">
          <Clock size={18} />
          <span className={timeLeft < 300 ? 'text-red' : ''}>{formatTime(timeLeft)}</span>
        </div>

        <div className="header-right">
           <Button variant="primary" className="end-call-btn" onClick={() => navigate('/dashboard')}>
            <PhoneOff size={16} /> Quit
          </Button>
        </div>
      </div>

      <div className="interview-body">
        {/* Main Full-Screen Question Panel */}
        <div className="main-question-panel glass-panel">
          <div className="question-container-large">
            <h3 className="question-text-large">{currentQuestion.question}</h3>
            
            <div className="answer-section-large">
              {currentQuestion.type === 'mcq' ? (
                <div className="mcq-options-large">
                  {currentQuestion.options?.map((option, idx) => (
                    <label key={idx} className={`mcq-label-large ${answers[currentQuestionIndex] === option ? 'selected' : ''}`}>
                      <input 
                        type="radio" 
                        name={`q-${currentQuestionIndex}`} 
                        value={option}
                        checked={answers[currentQuestionIndex] === option}
                        onChange={() => handleAnswerChange(option)}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              ) : (
                <div className="subjective-wrapper">
                  <div className="subjective-toolbar">
                    <button 
                      className={`dictate-btn ${isListening ? 'listening' : ''}`}
                      onClick={toggleListening}
                      title={isListening ? "Stop listening" : "Start speaking"}
                    >
                      <Mic size={18} />
                      {isListening ? "Listening... (Click to stop)" : "Dictate Answer"}
                    </button>
                  </div>
                  <textarea 
                    className="subjective-input-large" 
                    placeholder="Type or dictate your detailed answer here..."
                    value={(answers[currentQuestionIndex] || '') + (isListening ? interimText : '')}
                    onChange={(e) => {
                      // Only allow manual typing to update state if we are not actively overwriting it with voice
                      setAnswers(prev => ({...prev, [currentQuestionIndex]: e.target.value}));
                    }}
                    rows={10}
                  />
                </div>
              )}
            </div>
            
            <div className="question-navigation-large">
              <Button variant="secondary" onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
                Previous
              </Button>
              
              {currentQuestionIndex === questions.length - 1 ? (
                <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Evaluating...' : 'Submit Interview'}
                </Button>
              ) : (
                <Button variant="primary" onClick={handleNext}>
                  Next Question
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Side Panel for 3D AI and User Cam */}
        <div className="interview-side-widgets">
          <div className="ai-widget glass-panel">
            <Scene />
            <div className="widget-label pulsing">AI Interviewer</div>
          </div>
          
          <div className="user-widget glass-panel">
            {camOn ? (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="live-video"
              />
            ) : (
              <div className="cam-placeholder-small offline">
                <VideoOff size={24} />
              </div>
            )}
            <div className="widget-label">You</div>
          </div>

          <div className="controls-widget glass-panel">
            <button className={`control-btn-small ${!micOn ? 'muted' : ''}`} onClick={() => setMicOn(!micOn)}>
              {micOn ? <Mic size={18} /> : <MicOff size={18} />}
            </button>
            <button className={`control-btn-small ${!camOn ? 'muted' : ''}`} onClick={() => setCamOn(!camOn)}>
              {camOn ? <Video size={18} /> : <VideoOff size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewRoom;
