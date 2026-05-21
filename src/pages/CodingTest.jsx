import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Play, AlertTriangle, Code, ArrowLeft, RefreshCw, Send, HelpCircle, Terminal, CheckCircle2, XCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { starterTemplates } from '../data/starterTemplates';
import './CodingTest.css';

const CodingTest = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { 
    questions = [], 
    role = 'Developer', 
    difficulty = 'mid', 
    resumeText = '' 
  } = location.state || {};

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour (3600 seconds)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [violationMessage, setViolationMessage] = useState('');
  const [showViolation, setShowViolation] = useState(false);
  const [activeTestCaseIndex, setActiveTestCaseIndex] = useState(0);
  const [consoleTab, setConsoleTab] = useState('testcase'); // 'testcase' or 'result'
  const [consoleExpanded, setConsoleExpanded] = useState(true);
  const lineNumbersRef = useRef(null);

  const [languages, setLanguages] = useState({ 0: 'javascript', 1: 'javascript', 2: 'javascript' });
  const language = languages[currentQuestionIndex];

  // Initialize codes state with starter code for each question and language
  const [codes, setCodes] = useState(() => {
    const initialCodes = {};
    questions.forEach((q, idx) => {
      initialCodes[idx] = {
        javascript: q.starterCode || '',
        python: starterTemplates[q.id]?.python || '',
        java: starterTemplates[q.id]?.java || '',
        cpp: starterTemplates[q.id]?.cpp || '',
        c: starterTemplates[q.id]?.c || ''
      };
    });
    return initialCodes;
  });

  // Track run outputs for each question (results of compiler run)
  const [outputs, setOutputs] = useState({
    0: null,
    1: null,
    2: null
  });

  const textareaRef = useRef(null);

  // Proctoring Violations
  const handleViolation = (message) => {
    setViolationCount(prev => prev + 1);
    setViolationMessage(message);
    setShowViolation(true);
    setTimeout(() => setShowViolation(false), 5000);
  };

  // Block copy, paste, cut, right-click
  useEffect(() => {
    const blockAction = (e) => {
      e.preventDefault();
      handleViolation("Copying, pasting, cutting, or right-clicking is prohibited during the coding test.");
    };

    document.addEventListener('copy', blockAction);
    document.addEventListener('cut', blockAction);
    document.addEventListener('paste', blockAction);
    document.addEventListener('contextmenu', blockAction);

    return () => {
      document.removeEventListener('copy', blockAction);
      document.removeEventListener('cut', blockAction);
      document.removeEventListener('paste', blockAction);
      document.removeEventListener('contextmenu', blockAction);
    };
  }, []);

  // Block Save shortcut (Ctrl+S / Cmd+S)
  useEffect(() => {
    const blockSave = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleViolation("Saving the page is prohibited during the coding test.");
      }
    };
    document.addEventListener('keydown', blockSave);
    return () => document.removeEventListener('keydown', blockSave);
  }, []);

  // Tab switching detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation("Tab switching is prohibited! You must stay on the coding test tab.");
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Countdown timer
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
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Deep equality comparison helper for JS outputs
  const isEqual = (a, b) => {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (a && b && typeof a === 'object') {
      if (Array.isArray(a)) {
        if (!Array.isArray(b) || a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
          if (!isEqual(a[i], b[i])) return false;
        }
        return true;
      }
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      for (const key of keysA) {
        if (!isEqual(a[key], b[key])) return false;
      }
      return true;
    }
    return false;
  };

  // Compiler: Runs user's code locally (JS) or on the secure simulated backend (Python, C, C++, Java)
  const runCode = async (codeIndex) => {
    const q = questions[codeIndex];
    if (!q) return;

    const lang = languages[codeIndex];
    const currentCode = codes[codeIndex]?.[lang] || '';

    setConsoleExpanded(true);
    setConsoleTab('result');

    // Show loading state in outputs
    setOutputs(prev => ({
      ...prev,
      [codeIndex]: { loading: true }
    }));

    if (lang === 'javascript') {
      const testCases = q.testCases;
      const functionName = q.functionName;
      const results = [];
      let hasCompileError = false;
      let compileErrorMsg = "";

      try {
        // Evaluate user code safely using Function constructor
        const runner = new Function('args', `
          ${currentCode}
          if (typeof ${functionName} !== 'function') {
            throw new Error("Function '${functionName}' is not defined. Ensure your function name is exactly '${functionName}'.");
          }
          return ${functionName}(...args);
        `);

        for (let i = 0; i < testCases.length; i++) {
          const tc = testCases[i];
          try {
            const clonedInput = JSON.parse(JSON.stringify(tc.input));
            const actual = runner(clonedInput);
            const passed = isEqual(actual, tc.expected);

            results.push({
              index: i + 1,
              input: JSON.stringify(tc.input),
              expected: JSON.stringify(tc.expected),
              actual: JSON.stringify(actual),
              passed,
              error: null
            });
          } catch (err) {
            results.push({
              index: i + 1,
              input: JSON.stringify(tc.input),
              expected: JSON.stringify(tc.expected),
              actual: null,
              passed: false,
              error: err.message
            });
          }
        }
      } catch (err) {
        hasCompileError = true;
        compileErrorMsg = err.message;
      }

      const runOutput = {
        success: !hasCompileError,
        error: compileErrorMsg || null,
        results
      };

      setOutputs(prev => ({
        ...prev,
        [codeIndex]: runOutput
      }));
    } else {
      // Remote compilation via backend `/api/run-code`
      try {
        const response = await fetch('/api/run-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language: lang,
            code: currentCode,
            functionName: q.functionName,
            testCases: q.testCases
          })
        });

        if (!response.ok) {
          throw new Error(`Server returned status ${response.status}`);
        }

        const data = await response.json();
        setOutputs(prev => ({
          ...prev,
          [codeIndex]: data
        }));
      } catch (err) {
        setOutputs(prev => ({
          ...prev,
          [codeIndex]: {
            success: false,
            error: `Failed to compile/execute code: ${err.message}`,
            results: []
          }
        }));
      }
    }
  };

  const handleRunCurrent = () => {
    runCode(currentQuestionIndex);
  };

  const getStarterCode = (q, lang) => {
    if (lang === 'javascript') {
      return q?.starterCode || '';
    }
    return starterTemplates[q?.id]?.[lang] || '';
  };

  const handleResetCurrent = () => {
    if (window.confirm(`Are you sure you want to reset the ${language} code for this question? This will wipe your current solution.`)) {
      setCodes(prev => ({
        ...prev,
        [currentQuestionIndex]: {
          ...prev[currentQuestionIndex],
          [language]: getStarterCode(questions[currentQuestionIndex], language)
        }
      }));
      setOutputs(prev => ({
        ...prev,
        [currentQuestionIndex]: null
      }));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const { selectionStart, selectionEnd, value } = textarea;
      const newValue = value.substring(0, selectionStart) + "  " + value.substring(selectionEnd);
      
      setCodes(prev => ({
        ...prev,
        [currentQuestionIndex]: {
          ...prev[currentQuestionIndex],
          [language]: newValue
        }
      }));

      // Set cursor position back after state update
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + 2;
      }, 0);
    }
  };

  const handleCodeChange = (val) => {
    setCodes(prev => ({
      ...prev,
      [currentQuestionIndex]: {
        ...prev[currentQuestionIndex],
        [language]: val
      }
    }));
  };

  const handleLanguageChange = (newLang) => {
    setLanguages(prev => ({
      ...prev,
      [currentQuestionIndex]: newLang
    }));
  };

  const handleScroll = (e) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.target.scrollTop;
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    // Compute the test cases passed for each question right before submit (JS locally, others backend)
    const evaluationPromises = questions.map(async (q, idx) => {
      const lang = languages[idx];
      const code = codes[idx]?.[lang] || '';
      const testCases = q.testCases;
      const functionName = q.functionName;

      if (lang === 'javascript') {
        let passedCount = 0;
        let compileError = null;

        try {
          const runner = new Function('args', `
            ${code}
            if (typeof ${functionName} !== 'function') {
              throw new Error("Function '${functionName}' is not defined.");
            }
            return ${functionName}(...args);
          `);

          testCases.forEach(tc => {
            try {
              const clonedInput = JSON.parse(JSON.stringify(tc.input));
              const actual = runner(clonedInput);
              if (isEqual(actual, tc.expected)) {
                passedCount++;
              }
            } catch(e) {}
          });
        } catch (err) {
          compileError = err.message;
        }

        return {
          questionId: q.id,
          questionTitle: q.title,
          language: lang,
          userCode: code,
          testCasesResult: `Passed ${passedCount}/${testCases.length} test cases`,
          compilerError: compileError
        };
      } else {
        try {
          const response = await fetch('/api/run-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              language: lang,
              code,
              functionName,
              testCases
            })
          });

          if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
          }

          const data = await response.json();
          let passedCount = 0;
          if (data.success && data.results) {
            passedCount = data.results.filter(r => r.passed).length;
          }

          return {
            questionId: q.id,
            questionTitle: q.title,
            language: lang,
            userCode: code,
            testCasesResult: data.success 
              ? `Passed ${passedCount}/${testCases.length} test cases`
              : `Compile Error`,
            compilerError: data.success ? null : data.error
          };
        } catch (err) {
          return {
            questionId: q.id,
            questionTitle: q.title,
            language: lang,
            userCode: code,
            testCasesResult: `Compile Error`,
            compilerError: `Failed to evaluate code: ${err.message}`
          };
        }
      }
    });

    try {
      const submissions = await Promise.all(evaluationPromises);
      const response = await fetch('/api/evaluate-coding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissions, role, difficulty }),
      });
      const data = await response.json();
      
      navigate('/coding-results', { 
        state: { 
          result: data,
          role,
          difficulty,
          violations: violationCount
        } 
      });
    } catch (error) {
      console.error("Coding evaluation failed:", error);
      alert("Failed to evaluate code. Submitting anyway, but details might be missing.");
      navigate('/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="coding-test-loading">
        <h3>No questions selected. Returning to dashboard...</h3>
        <button onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentOutput = outputs[currentQuestionIndex];
  const currentCode = codes[currentQuestionIndex]?.[language] || '';

  // For Line Numbers count
  const totalLines = currentCode.split('\n').length;
  const lineNumbers = Array.from({ length: Math.max(totalLines, 16) }, (_, i) => i + 1);

  return (
    <div className="coding-test-page">
      {/* Violation Alert overlay */}
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

      {/* Workspace Header */}
      <header className="coding-header glass-panel">
        <div className="header-left">
          <button className="back-btn" onClick={() => {
            if (window.confirm("Are you sure you want to quit the coding test? Your progress will be lost.")) {
              navigate('/dashboard');
            }
          }}>
            <ArrowLeft size={18} />
            <span>Quit</span>
          </button>
          
          <div className="divider-v"></div>
          
          <div className="test-info">
            <span className="test-badge">Coding Interview</span>
            <span className="role-text">{role} • {difficulty}</span>
          </div>
        </div>

        {/* Question selectors (Tabs) */}
        <div className="question-tabs">
          {questions.map((q, idx) => (
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

        <div className="header-right">
          <div className="timer-badge">
            <Clock size={16} />
            <span className={timeLeft < 300 ? 'urgent' : ''}>{formatTime(timeLeft)}</span>
          </div>
          <button 
            className="submit-test-btn" 
            onClick={handleSubmit} 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>Evaluating...</>
            ) : (
              <>
                <Send size={16} />
                Submit Test
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="coding-workspace">
        {/* Left Panel: Instructions, Examples, Constraints */}
        <div className="workspace-panel left-panel glass-panel">
          <div className="panel-header">
            <div className="panel-tabs">
              <button className="panel-tab-btn active">
                <HelpCircle size={14} style={{ marginRight: '6px' }} />
                <span>Description</span>
              </button>
            </div>
            <span className="difficulty-badge">{currentQuestion.difficulty}</span>
          </div>

          <div className="panel-body">
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
                    <pre>
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
                <ul className="constraints-list">
                  {currentQuestion.constraints.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Code Editor (top) and Console (bottom) */}
        <div className="workspace-panel right-panel">
          {/* Editor Container Panel */}
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
                <button className="action-btn" onClick={handleResetCurrent} title="Reset to starter code">
                  <RefreshCw size={14} /> Reset
                </button>
                
                <button className="run-btn" onClick={handleRunCurrent}>
                  <Play size={14} /> Run Code
                </button>
              </div>
            </div>

            <div className="editor-container">
              {/* Custom Code Editor Workspace */}
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

          {/* Console / Output area */}
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
                  title={consoleExpanded ? "Collapse Console" : "Expand Console"}
                >
                  {consoleExpanded ? 'Collapse Console' : 'Expand Console'}
                </button>
              </div>
            </div>
            
            {consoleExpanded && (
              <div className="console-body">
                {consoleTab === 'testcase' ? (
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
                  <div className="console-results">
                    {!currentOutput ? (
                      <div className="console-placeholder">
                        <span>Please run your code to verify test cases locally.</span>
                      </div>
                    ) : currentOutput.loading ? (
                      <div className="console-placeholder">
                        <div className="loading-spinner-wrapper">
                          <RefreshCw className="animate-spin text-cyan" size={24} />
                          <span>Executing code on secure backend...</span>
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
