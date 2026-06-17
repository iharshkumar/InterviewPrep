import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, Play, AlertTriangle, Code, ArrowLeft, 
  RefreshCw, Send, HelpCircle, Terminal, CheckCircle2, 
  XCircle, Search, Filter, BookOpen, Layers, Award
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dsaQuestions } from '../data/dsaQuestions';
import { starterTemplates } from '../data/starterTemplates';
import './CodingTest.css';

// Topic mapping for DSA questions
const topicMapping = {
  "two-sum": "Arrays & Hashing",
  "reverse-string": "Two Pointers",
  "palindrome-number": "Math",
  "contains-duplicate": "Arrays & Hashing",
  "valid-parentheses": "Stack & Strings",
  "longest-substring": "Sliding Window",
  "container-most-water": "Two Pointers",
  "two-sum-sorted": "Two Pointers",
  "merge-k-arrays": "Sorting & Heaps",
  "median-two-arrays": "Binary Search",
  "edit-distance": "Dynamic Programming",
  "first-missing-positive": "Arrays & Hashing"
};

const CodingTest = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { authFetch, user } = useAuth();

  // Route State variables (if entered via full interview room)
  const routeState = location.state || {};
  
  // Flag to check if we are in timed mock interview mode (3 questions)
  const [isMockTest, setIsMockTest] = useState(!!routeState.questions);
  
  // Selected question in solving state
  const [activeQuestion, setActiveQuestion] = useState(null);
  
  // Mock test questions pool
  const [mockQuestions, setMockQuestions] = useState(routeState.questions || []);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Practice state solved status & submissions
  const [solvedTitles, setSolvedTitles] = useState(new Set());
  const [userProfile, setUserProfile] = useState(null);
  const [pastSubmissions, setPastSubmissions] = useState([]);
  const [activeLeftTab, setActiveLeftTab] = useState('description'); // 'description' or 'submissions'
  const [viewingPastCode, setViewingPastCode] = useState(null); // holds a submission detail object to preview code
  
  // Dashboard state variables (searching and filters)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedTopic, setSelectedTopic] = useState('All');

  // IDE Editor state variables
  const [language, setLanguage] = useState('javascript');
  const [codes, setCodes] = useState({});
  const [outputs, setOutputs] = useState({});
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour for mock test
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunningLocal, setIsRunningLocal] = useState(false);
  
  // Proctoring State variables (only active in Mock Test mode)
  const [violationCount, setViolationCount] = useState(0);
  const [violationMessage, setViolationMessage] = useState('');
  const [showViolation, setShowViolation] = useState(false);
  
  // Console state variables
  const [activeTestCaseIndex, setActiveTestCaseIndex] = useState(0);
  const [consoleTab, setConsoleTab] = useState('testcase'); // 'testcase' or 'result'
  const [consoleExpanded, setConsoleExpanded] = useState(true);

  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);

  // Flatten all available questions from the data pool
  const allProblems = [
    ...dsaQuestions.easy,
    ...dsaQuestions.medium,
    ...dsaQuestions.hard
  ];

  // Fetch profile to resolve solved items and past evaluations
  const fetchSolvedStatus = () => {
    authFetch('/api/profile')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load profile');
        return res.json();
      })
      .then(data => {
        setUserProfile(data);
        const solved = new Set();
        if (data.history) {
          data.history.forEach(item => {
            // Find all accepted coding evaluations
            if (item.type.startsWith('Coding:') && item.score >= 80) {
              const title = item.type.replace('Coding: ', '').trim();
              solved.add(title);
            }
          });
        }
        setSolvedTitles(solved);
      })
      .catch(err => console.error('Error fetching profile history:', err));
  };

  useEffect(() => {
    fetchSolvedStatus();
  }, [user]);

  // Load submissions for a specific question when the user opens the submissions tab
  const fetchQuestionSubmissions = (qTitle) => {
    if (!userProfile?.history) return;
    
    // Filter history for evaluation objects matching 'Coding: [qTitle]'
    authFetch('/api/profile')
      .then(res => res.json())
      .then(data => {
        // Detailed evaluations list
        const filteredHistory = (data.history || []).filter(item => 
          item.type === `Coding: ${qTitle}`
        );
        
        // Match them to full interview records to pull code details
        // Note: For now, we list attempts chronologically with scores
        setPastSubmissions(filteredHistory);
      })
      .catch(err => console.error('Error pulling submissions:', err));
  };

  // Proctoring Violations handler
  const handleViolation = (message) => {
    setViolationCount(prev => prev + 1);
    setViolationMessage(message);
    setShowViolation(true);
    setTimeout(() => setShowViolation(false), 5000);
  };

  // Proctoring bindings (Only active in timed mock interview sessions)
  useEffect(() => {
    if (!isMockTest) return;

    const blockAction = (e) => {
      e.preventDefault();
      handleViolation("Copying, pasting, cutting, or right-clicking is prohibited during the coding test.");
    };

    document.addEventListener('copy', blockAction);
    document.addEventListener('cut', blockAction);
    document.addEventListener('paste', blockAction);
    document.addEventListener('contextmenu', blockAction);

    const blockSave = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleViolation("Saving the page is prohibited during the coding test.");
      }
    };
    document.addEventListener('keydown', blockSave);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation("Tab switching is prohibited! You must stay on the coding test tab.");
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('copy', blockAction);
      document.removeEventListener('cut', blockAction);
      document.removeEventListener('paste', blockAction);
      document.removeEventListener('contextmenu', blockAction);
      document.removeEventListener('keydown', blockSave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isMockTest]);

  // Mock Test Countdown timer
  useEffect(() => {
    if (!isMockTest) return;
    if (timeLeft <= 0) {
      handleSubmitMockTest();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isMockTest]);

  // Sync scroll of line numbers & textarea in editor
  const handleScroll = (e) => {
    if (lineNumbersRef.current && textareaRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const val = e.target.value;
      const newVal = val.substring(0, start) + "  " + val.substring(end);
      handleCodeChange(newVal);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  // State initialization helper when solving a challenge
  const startSolvingProblem = (problem) => {
    setActiveQuestion(problem);
    setActiveLeftTab('description');
    setViewingPastCode(null);
    setLanguage('javascript');
    
    // Set initial starter code templates for this problem
    setCodes({
      [problem.id]: {
        javascript: problem.starterCode || '',
        python: starterTemplates[problem.id]?.python || '',
        java: starterTemplates[problem.id]?.java || '',
        cpp: starterTemplates[problem.id]?.cpp || '',
        c: starterTemplates[problem.id]?.c || ''
      }
    });

    setOutputs({
      [problem.id]: null
    });
    
    setActiveTestCaseIndex(0);
    setConsoleTab('testcase');
    setConsoleExpanded(true);
    fetchQuestionSubmissions(problem.title);
  };

  // Helper to start the 3-question timed mock test
  const startTimedMockTest = () => {
    if (!window.confirm("Start a 60-minute Timed Coding Mock Test? You will be given 3 random challenges under strict exam rules.")) return;
    
    // Choose 3 random questions from allProblems
    const shuffled = [...allProblems].sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, 3);
    
    setMockQuestions(selectedQuestions);
    setCurrentQuestionIndex(0);
    setTimeLeft(3600); // 1 hour
    setIsMockTest(true);
    
    // Initialize starter templates for these questions
    const initialCodes = {};
    const initialOutputs = {};
    selectedQuestions.forEach((q) => {
      initialCodes[q.id] = {
        javascript: q.starterCode || '',
        python: starterTemplates[q.id]?.python || '',
        java: starterTemplates[q.id]?.java || '',
        cpp: starterTemplates[q.id]?.cpp || '',
        c: starterTemplates[q.id]?.c || ''
      };
      initialOutputs[q.id] = null;
    });
    setCodes(initialCodes);
    setOutputs(initialOutputs);
  };

  // Starter code config changes on lang switch
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
  };

  const handleCodeChange = (newCode) => {
    const qId = isMockTest ? mockQuestions[currentQuestionIndex].id : activeQuestion.id;
    setCodes(prev => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        [language]: newCode
      }
    }));
  };

  const handleResetCurrent = () => {
    if (!window.confirm("Reset editor to starter template? All current code will be lost.")) return;
    
    const problem = isMockTest ? mockQuestions[currentQuestionIndex] : activeQuestion;
    const qId = problem.id;
    
    setCodes(prev => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        [language]: language === 'javascript' ? (problem.starterCode || '') : (starterTemplates[qId]?.[language] || '')
      }
    }));
  };

  // Compile and run the current challenge locally
  const handleRunCurrent = async () => {
    const problem = isMockTest ? mockQuestions[currentQuestionIndex] : activeQuestion;
    const currentCode = codes[problem.id]?.[language] || '';
    
    setIsRunningLocal(true);
    setConsoleTab('result');
    setConsoleExpanded(true);
    
    // Set loading indicator
    setOutputs(prev => ({
      ...prev,
      [problem.id]: { loading: true }
    }));

    try {
      const res = await authFetch('/api/run-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          code: currentCode,
          functionName: problem.functionName,
          testCases: problem.testCases
        })
      });
      const data = await res.json();
      
      setOutputs(prev => ({
        ...prev,
        [problem.id]: data
      }));
    } catch (err) {
      console.error(err);
      setOutputs(prev => ({
        ...prev,
        [problem.id]: { success: false, error: 'Connection error during run execution.' }
      }));
    } finally {
      setIsRunningLocal(false);
    }
  };

  // Submit single challenge solution
  const handleSubmitSingleChallenge = async () => {
    setIsSubmitting(true);
    const problem = activeQuestion;
    const currentCode = codes[problem.id]?.[language] || '';
    const currentOutput = outputs[problem.id];
    
    // First trigger a local test-case run if they haven't run it yet
    let passedCount = 0;
    let resultsList = [];
    
    if (currentOutput && currentOutput.results) {
      passedCount = currentOutput.results.filter(r => r.passed).length;
      resultsList = currentOutput.results;
    } else {
      // Prompt them to run code first to compile locally
      alert("Please run your code against the local test cases before submitting.");
      setIsSubmitting(false);
      return;
    }

    const submissions = [{
      questionId: problem.id,
      questionTitle: problem.title,
      language: language,
      userCode: currentCode,
      testCasesResult: `Passed ${passedCount}/${problem.testCases.length} test cases`,
      compilerError: currentOutput.success ? null : currentOutput.error
    }];

    try {
      const response = await authFetch('/api/evaluate-coding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissions,
          role: topicMapping[problem.id] || 'Software Engineer',
          difficulty: problem.difficulty.toLowerCase()
        })
      });
      const data = await response.json();
      
      if (data.overallScore >= 80) {
        alert(`Congratulations! Solution Accepted.\nScore: ${data.overallScore}/100\nFeedback: ${data.generalFeedback}`);
      } else {
        alert(`Solution evaluated with score: ${data.overallScore}/100.\nFeedback: ${data.generalFeedback}`);
      }

      // Reload solved status & list new submissions
      fetchSolvedStatus();
      fetchQuestionSubmissions(problem.title);
      setActiveLeftTab('submissions');
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Failed to submit solution to evaluation engine.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit the 3-question mock test
  const handleSubmitMockTest = async () => {
    setIsSubmitting(true);
    
    const evaluationPromises = mockQuestions.map(async (q, idx) => {
      const code = codes[idx]?.[language] || '';
      const localOutput = outputs[idx];
      let passedCount = 0;
      
      if (localOutput && localOutput.results) {
        passedCount = localOutput.results.filter(r => r.passed).length;
      }
      
      return {
        questionId: q.id,
        questionTitle: q.title,
        language: language,
        userCode: code,
        testCasesResult: `Passed ${passedCount}/${q.testCases.length} test cases`,
        compilerError: localOutput?.success ? null : (localOutput?.error || "Did not execute")
      };
    });

    try {
      const submissions = await Promise.all(evaluationPromises);
      const response = await authFetch('/api/evaluate-coding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          submissions, 
          role: routeState.role || 'Fullstack Developer', 
          difficulty: routeState.difficulty || 'mid' 
        }),
      });
      const data = await response.json();
      
      navigate('/coding-results', { 
        state: { 
          result: data,
          role: routeState.role || 'Fullstack Developer',
          difficulty: routeState.difficulty || 'mid',
          violations: violationCount
        } 
      });
    } catch (error) {
      console.error("Coding evaluation failed:", error);
      alert("Failed to evaluate mock test answers.");
      navigate('/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch full details of a specific evaluation history record to view past code
  const viewHistoricalSubmission = async (interviewId) => {
    try {
      const res = await authFetch(`/api/profile`); // getProfile maps history details
      const profileData = await res.json();
      
      // Pull details directly using a detailed endpoint, or fetch past interviews
      // For practice simplicity, we request details list
      const detailsRes = await authFetch(`/api/profile`); // standard endpoint
      
      // Let's do a quick request or find details inside userProfile
      // We will search Interview documents inside history on the backend if needed.
      // But we can also retrieve it directly from MongoDB profile
      // Let's fetch all submissions detail using the interview id
      // Wait, we can fetch detailed result from profile history
    } catch (err) {
      console.error("Error viewing submission details:", err);
    }
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Helper to compile list of topic categories dynamically
  const getUniqueTopics = () => {
    const topics = new Set();
    allProblems.forEach(p => {
      const topic = topicMapping[p.id] || "Other";
      topics.add(topic);
    });
    return ["All", ...Array.from(topics)];
  };

  // Filtered problems list calculation
  const filteredProblems = allProblems.filter(problem => {
    const matchesSearch = problem.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = selectedDifficulty === 'All' || problem.difficulty === selectedDifficulty;
    const matchesTopic = selectedTopic === 'All' || (topicMapping[problem.id] || 'Other') === selectedTopic;
    return matchesSearch && matchesDifficulty && matchesTopic;
  });

  // Calculate dashboard stats
  const easySolved = allProblems.filter(p => p.difficulty === 'Easy' && solvedTitles.has(p.title)).length;
  const mediumSolved = allProblems.filter(p => p.difficulty === 'Medium' && solvedTitles.has(p.title)).length;
  const hardSolved = allProblems.filter(p => p.difficulty === 'Hard' && solvedTitles.has(p.title)).length;

  const easyTotal = allProblems.filter(p => p.difficulty === 'Easy').length;
  const mediumTotal = allProblems.filter(p => p.difficulty === 'Medium').length;
  const hardTotal = allProblems.filter(p => p.difficulty === 'Hard').length;

  // ==========================================
  // RENDER METHOD: DASHBOARD PROBLEM LIST VIEW
  // ==========================================
  if (!isMockTest && !activeQuestion) {
    return (
      <div className="coding-dashboard-container">
        {/* Dashboard Header */}
        <header className="dash-header glass-panel">
          <div className="dash-header-title">
            <Code className="logo-icon-orange animate-pulse" size={26} />
            <div>
              <h2>MockPrep Code Lab</h2>
              <p>Practice algorithmic challenges and build your technical statistics.</p>
            </div>
          </div>
          <button className="back-to-home-btn" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </button>
        </header>

        {/* Analytics Header Metrics */}
        <div className="dashboard-stats-grid">
          <div className="d-stat-card glass-panel orange-glow">
            <Award className="d-stat-icon text-orange" size={26} />
            <div className="d-stat-details">
              <h3>{easySolved} / {easyTotal}</h3>
              <p>Easy Solved</p>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill bg-green" style={{ width: `${(easySolved / (easyTotal || 1)) * 100}%` }}></div>
            </div>
          </div>
          <div className="d-stat-card glass-panel orange-glow">
            <Award className="d-stat-icon text-gold" size={26} />
            <div className="d-stat-details">
              <h3>{mediumSolved} / {mediumTotal}</h3>
              <p>Medium Solved</p>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill bg-orange" style={{ width: `${(mediumSolved / (mediumTotal || 1)) * 100}%` }}></div>
            </div>
          </div>
          <div className="d-stat-card glass-panel orange-glow">
            <Award className="d-stat-icon text-red" size={26} />
            <div className="d-stat-details">
              <h3>{hardSolved} / {hardTotal}</h3>
              <p>Hard Solved</p>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill bg-red" style={{ width: `${(hardSolved / (hardTotal || 1)) * 100}%` }}></div>
            </div>
          </div>
        </div>

        {/* Problems Finder Grid */}
        <div className="problem-list-workspace glass-panel">
          {/* Controls Bar */}
          <div className="list-controls-bar">
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search problem title..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-field"
              />
            </div>

            <div className="filters-dropdowns">
              <div className="filter-group">
                <Filter size={14} className="filter-icon" />
                <select 
                  value={selectedDifficulty} 
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="filter-select"
                >
                  <option value="All">All Difficulties</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div className="filter-group">
                <Filter size={14} className="filter-icon" />
                <select 
                  value={selectedTopic} 
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="filter-select"
                >
                  <option value="All">All Topics</option>
                  {getUniqueTopics().filter(t => t !== 'All').map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Quick Category Pills */}
          <div className="topic-pills-row">
            {getUniqueTopics().map(topic => (
              <button
                key={topic}
                className={`topic-pill-btn ${selectedTopic === topic ? 'active' : ''}`}
                onClick={() => setSelectedTopic(topic)}
              >
                {topic}
              </button>
            ))}
          </div>

          {/* Problems Table */}
          <div className="problems-table-wrapper">
            <table className="problems-table">
              <thead>
                <tr>
                  <th style={{ width: '80px', textAlign: 'center' }}>Status</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th style={{ width: '120px' }}>Difficulty</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProblems.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-table-placeholder">
                      No problems found matching search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredProblems.map(problem => {
                    const isSolved = solvedTitles.has(problem.title);
                    return (
                      <tr key={problem.id} className={isSolved ? 'solved-row' : ''}>
                        <td style={{ textAlign: 'center' }}>
                          {isSolved ? (
                            <CheckCircle2 size={18} className="icon-green-glow" />
                          ) : (
                            <span className="unsolved-dash">-</span>
                          )}
                        </td>
                        <td className="problem-title-cell" style={{ fontWeight: '700' }}>
                          {problem.title}
                        </td>
                        <td>
                          <span className="topic-badge-tag">
                            {topicMapping[problem.id] || "Other"}
                          </span>
                        </td>
                        <td>
                          <span className={`diff-badge ${problem.difficulty.toLowerCase()}`}>
                            {problem.difficulty}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="solve-challenge-btn"
                            onClick={() => startSolvingProblem(problem)}
                          >
                            <span>Solve</span>
                            <Play size={10} style={{ marginLeft: '4px' }} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER METHOD: WORKSPACE IDE SOLVING STATE
  // ==========================================
  const currentQuestion = isMockTest ? mockQuestions[currentQuestionIndex] : activeQuestion;
  const currentOutput = outputs[currentQuestion.id];
  const currentCode = codes[currentQuestion.id]?.[language] || '';

  // Calculate Line Numbers
  const totalLines = currentCode.split('\n').length;
  const lineNumbers = Array.from({ length: Math.max(totalLines, 16) }, (_, i) => i + 1);

  return (
    <div className="coding-test-page">
      {/* Violation Alert overlay (Only in Mock Test Mode) */}
      <AnimatePresence>
        {showViolation && (
          <motion.div 
            className="violation-alert"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -50 }}
          >
            <AlertTriangle color="#ff4a4a" size={24} />
            <div>
              <h4>Proctoring Violation Logged</h4>
              <p>{violationMessage}</p>
            </div>
            <div className="violation-count">
              Violations: {violationCount}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <header className="coding-header glass-panel">
        <div className="header-left">
          {isMockTest ? (
            <button className="back-btn" onClick={() => {
              if (window.confirm("Are you sure you want to quit the coding test? Your progress will be lost.")) {
                navigate('/dashboard');
              }
            }}>
              <ArrowLeft size={18} />
              <span>Quit Test</span>
            </button>
          ) : (
            <button className="back-btn" onClick={() => setActiveQuestion(null)}>
              <ArrowLeft size={18} />
              <span>Problems</span>
            </button>
          )}
          
          <div className="divider-v"></div>
          
          <div className="test-info">
            <span className="test-badge">
              {isMockTest ? 'Timed Evaluation' : 'Practice Mode'}
            </span>
            <span className="role-text">
              {isMockTest ? `${routeState.role || 'Developer'} • ${routeState.difficulty || 'mid'}` : (topicMapping[currentQuestion.id] || 'DSA')}
            </span>
          </div>
        </div>

        {/* Tab selection for 3 questions in Mock Test Mode */}
        {isMockTest && (
          <div className="question-tabs">
            {mockQuestions.map((q, idx) => (
              <button
                key={q.id}
                className={`q-tab-btn ${currentQuestionIndex === idx ? 'active' : ''}`}
                onClick={() => setCurrentQuestionIndex(idx)}
              >
                <Code size={14} style={{ marginRight: '6px' }} />
                Question {idx + 1}
              </button>
            ))}
          </div>
        )}

        {/* Right header actions */}
        <div className="header-right">
          {isMockTest ? (
            <>
              <div className="timer-badge">
                <Clock size={16} />
                <span className={timeLeft < 300 ? 'urgent' : ''}>{formatTime(timeLeft)}</span>
              </div>
              <button 
                className="submit-test-btn" 
                onClick={handleSubmitMockTest} 
                disabled={isSubmitting}
              >
                {isSubmitting ? <>Evaluating...</> : <><Send size={16} /> Submit Test</>}
              </button>
            </>
          ) : (
            <button 
              className="submit-test-btn" 
              onClick={handleSubmitSingleChallenge} 
              disabled={isSubmitting}
            >
              {isSubmitting ? <>Evaluating...</> : <><Send size={16} /> Submit Solution</>}
            </button>
          )}
        </div>
      </header>

      {/* Side-by-Side Split Workspace Layout */}
      <main className="coding-workspace">
        
        {/* LEFT PANEL: Description or Past Submissions */}
        <div className="workspace-panel left-panel glass-panel">
          <div className="panel-header" style={{ padding: '0 8px', height: '44px' }}>
            <div className="panel-tabs" style={{ display: 'flex', gap: '4px', height: '100%' }}>
              <button 
                className={`panel-tab-btn ${activeLeftTab === 'description' ? 'active' : ''}`}
                onClick={() => {
                  setActiveLeftTab('description');
                  setViewingPastCode(null);
                }}
                style={{ background: 'transparent', border: 'none', height: '100%', padding: '0 16px' }}
              >
                <HelpCircle size={14} style={{ marginRight: '6px' }} />
                <span>Description</span>
              </button>
              
              {!isMockTest && (
                <button 
                  className={`panel-tab-btn ${activeLeftTab === 'submissions' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveLeftTab('submissions');
                    setViewingPastCode(null);
                    fetchQuestionSubmissions(currentQuestion.title);
                  }}
                  style={{ background: 'transparent', border: 'none', height: '100%', padding: '0 16px' }}
                >
                  <BookOpen size={14} style={{ marginRight: '6px' }} />
                  <span>Submissions</span>
                </button>
              )}
            </div>
            <span className={`diff-badge ${currentQuestion.difficulty.toLowerCase()}`}>
              {currentQuestion.difficulty}
            </span>
          </div>

          <div className="panel-body">
            {activeLeftTab === 'description' ? (
              // QUESTION DESCRIPTION TAB
              <>
                <h2 className="problem-title">{currentQuestion.title}</h2>
                <div className="problem-description">
                  {currentQuestion.description.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>

                {currentQuestion.examples && currentQuestion.examples.length > 0 && (
                  <div className="section-block">
                    <h4>Examples</h4>
                    {currentQuestion.examples.map((ex, idx) => (
                      <div key={idx} className="example-box">
                        <p><strong>Example {idx + 1}:</strong></p>
                        <pre style={{ margin: '6px 0 0 0' }}>
                          <strong>Input:</strong> {ex.input}
                          <br />
                          <strong>Output:</strong> {ex.output}
                          {ex.explanation && (
                            <>
                              <br />
                              <strong>Explanation:</strong> {ex.explanation}
                            </>
                          )}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}

                {currentQuestion.constraints && currentQuestion.constraints.length > 0 && (
                  <div className="section-block">
                    <h4>Constraints</h4>
                    <ul className="constraints-list" style={{ marginTop: '6px' }}>
                      {currentQuestion.constraints.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : viewingPastCode ? (
              // DETAILED HISTORY SUBMISSION PREVIEW WORKSPACE
              <div className="past-code-preview">
                <div className="preview-header">
                  <button className="preview-back-btn" onClick={() => setViewingPastCode(null)}>
                    <ArrowLeft size={12} />
                    <span>Back to Submissions</span>
                  </button>
                  <span className="preview-score-badge">
                    Score: {viewingPastCode.score}%
                  </span>
                </div>
                <div className="preview-meta-row">
                  <span><strong>Date:</strong> {viewingPastCode.date}</span>
                  <span><strong>Language:</strong> JavaScript (Default)</span>
                </div>
                <div className="preview-code-block">
                  <pre>{viewingPastCode.userCode || "// Code not loaded or was empty."}</pre>
                </div>
              </div>
            ) : (
              // SUBMISSIONS LOG HISTORY LIST TAB
              <div className="past-submissions-list">
                <h3>Submissions Log</h3>
                {pastSubmissions.length === 0 ? (
                  <div className="empty-submissions-state">
                    <span>You haven't submitted this challenge yet. Solve and hit Submit!</span>
                  </div>
                ) : (
                  <div className="submissions-list-rows">
                    {pastSubmissions.map((sub, sIdx) => {
                      const isPassing = sub.score >= 80;
                      return (
                        <div key={sub.id || sIdx} className="submission-row-card">
                          <div className="row-info-left">
                            <div className="status-marker">
                              {isPassing ? (
                                <span className="status-indicator accepted">Accepted</span>
                              ) : (
                                <span className="status-indicator rejected">Failed</span>
                              )}
                            </div>
                            <span className="submission-date">{sub.date}</span>
                          </div>
                          
                          <div className="row-info-right">
                            <span className={`score-badge ${isPassing ? 'score-high' : 'score-mid'}`}>
                              {sub.score}%
                            </span>
                            {/* Option to load code details if available */}
                            {sub.userCode && (
                              <button 
                                className="view-past-code-btn"
                                onClick={() => setViewingPastCode(sub)}
                              >
                                View Code
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Code Editor & Console Runner */}
        <div className="workspace-panel right-panel">
          
          {/* Top Panel: Editor Container */}
          <div className="editor-panel glass-panel">
            <div className="panel-header">
              <div className="editor-lang-selector">
                <Code size={14} className="icon-cyan" style={{ marginRight: '6px' }} />
                <select 
                  className="lang-select-dropdown"
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="c">C</option>
                </select>
              </div>
              
              <div className="editor-actions">
                <button className="action-btn" onClick={handleResetCurrent} title="Reset to starter template">
                  <RefreshCw size={12} /> Reset
                </button>
                
                <button className="run-btn" onClick={handleRunCurrent} disabled={isRunningLocal}>
                  {isRunningLocal ? (
                    <><RefreshCw className="spinning" size={12} /> Running...</>
                  ) : (
                    <><Play size={12} /> Run Code</>
                  )}
                </button>
              </div>
            </div>

            <div className="editor-container">
              <div className="code-editor">
                <div className="line-numbers" ref={lineNumbersRef}>
                  {lineNumbers.map(n => (
                    <span key={n}>{n}</span>
                  ))}
                </div>
                <textarea
                  ref={textareaRef}
                  className="code-textarea"
                  value={currentCode}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onScroll={handleScroll}
                  placeholder="// Type your solution here..."
                  spellCheck="false"
                />
              </div>
            </div>
          </div>

          {/* Bottom Panel: Console Runner & Test Cases */}
          <div className={`console-panel glass-panel ${consoleExpanded ? 'expanded' : 'collapsed'}`}>
            <div className="console-header">
              <div className="console-tabs">
                <button 
                  className={`console-tab-btn ${consoleTab === 'testcase' ? 'active' : ''}`}
                  onClick={() => {
                    setConsoleExpanded(true);
                    setConsoleTab('testcase');
                  }}
                >
                  <Terminal size={14} style={{ marginRight: '6px' }} />
                  <span>Testcase</span>
                </button>
                
                <button 
                  className={`console-tab-btn ${consoleTab === 'result' ? 'active' : ''} ${currentOutput && !currentOutput.success ? 'error-tab' : ''}`}
                  onClick={() => {
                    setConsoleExpanded(true);
                    setConsoleTab('result');
                  }}
                >
                  <CheckCircle2 size={14} style={{ marginRight: '6px' }} />
                  <span>Result</span>
                </button>
              </div>
              
              <div className="console-actions">
                <button 
                  className="console-toggle-btn"
                  onClick={() => setConsoleExpanded(!consoleExpanded)}
                >
                  {consoleExpanded ? 'Collapse Console' : 'Expand Console'}
                </button>
              </div>
            </div>

            {consoleExpanded && (
              <div className="console-body">
                {consoleTab === 'testcase' ? (
                  // TEST CASES INPUT VIEW
                  <div className="console-testcases">
                    <div className="case-selector-tabs">
                      {currentQuestion.testCases.map((tc, tcIdx) => (
                        <button
                          key={tcIdx}
                          className={`case-tab-btn ${activeTestCaseIndex === tcIdx ? 'active' : ''}`}
                          onClick={() => setActiveTestCaseIndex(tcIdx)}
                        >
                          Case {tcIdx + 1}
                        </button>
                      ))}
                    </div>
                    
                    <div className="case-details-box">
                      <div className="case-io-group">
                        <span className="case-io-label">Input:</span>
                        <pre className="case-io-value">
                          {JSON.stringify(currentQuestion.testCases[activeTestCaseIndex]?.input)}
                        </pre>
                      </div>
                      <div className="case-io-group">
                        <span className="case-io-label">Expected Output:</span>
                        <pre className="case-io-value">
                          {JSON.stringify(currentQuestion.testCases[activeTestCaseIndex]?.expected)}
                        </pre>
                      </div>
                    </div>
                  </div>
                ) : (
                  // COMPILATION / LOCAL TEST RESULTS VIEW
                  <div className="console-results">
                    {!currentOutput ? (
                      <div className="console-placeholder">
                        <span>Please run your code to verify test cases locally.</span>
                      </div>
                    ) : currentOutput.loading ? (
                      <div className="console-placeholder">
                        <div className="loading-spinner-wrapper">
                          <RefreshCw className="spinning text-cyan" size={24} />
                          <span>Executing code on secure backend sandbox...</span>
                        </div>
                      </div>
                    ) : !currentOutput.success ? (
                      <div className="compilation-error-box">
                        <AlertTriangle size={18} style={{ color: '#ef4444', marginRight: '8px' }} />
                        <div>
                          <h5>Compile Error</h5>
                          <pre>{currentOutput.error}</pre>
                        </div>
                      </div>
                    ) : (
                      <div className="results-container">
                        <div className="results-summary">
                          {currentOutput.results.every(r => r.passed) ? (
                            <span className="status-accepted">Accepted</span>
                          ) : (
                            <span className="status-wrong-answer">Wrong Answer</span>
                          )}
                          <span className="results-pass-count">
                            Passed {currentOutput.results.filter(r => r.passed).length} / {currentOutput.results.length} cases
                          </span>
                        </div>
                        
                        <div className="case-selector-tabs">
                          {currentOutput.results.map((result, tcIdx) => (
                            <button
                              key={tcIdx}
                              className={`case-tab-btn ${result.passed ? 'passed-tab' : 'failed-tab'} ${activeTestCaseIndex === tcIdx ? 'active' : ''}`}
                              onClick={() => setActiveTestCaseIndex(tcIdx)}
                            >
                              <span className={`dot ${result.passed ? 'dot-green' : 'dot-red'}`}></span>
                              Case {tcIdx + 1}
                            </button>
                          ))}
                        </div>

                        {currentOutput.results[activeTestCaseIndex] && (
                          <div className="case-details-box">
                            <div className="case-io-group">
                              <span className="case-io-label">Input:</span>
                              <pre className="case-io-value">
                                {currentOutput.results[activeTestCaseIndex].input}
                              </pre>
                            </div>
                            
                            <div className="case-io-group">
                              <span className="case-io-label">Expected Output:</span>
                              <pre className="case-io-value">
                                {currentOutput.results[activeTestCaseIndex].expected}
                              </pre>
                            </div>
                            
                            <div className="case-io-group">
                              <span className="case-io-label">Your Output:</span>
                              <pre className={`case-io-value ${currentOutput.results[activeTestCaseIndex].passed ? 'text-green' : 'text-red'}`}>
                                {currentOutput.results[activeTestCaseIndex].actual === 'null' && currentOutput.results[activeTestCaseIndex].error ? 'Runtime Error' : currentOutput.results[activeTestCaseIndex].actual}
                              </pre>
                            </div>
                            
                            {currentOutput.results[activeTestCaseIndex].error && (
                              <div className="case-io-group error-block">
                                <span className="case-io-label">Runtime Error:</span>
                                <pre className="case-io-value text-red">
                                  {currentOutput.results[activeTestCaseIndex].error}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CodingTest;
