import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Award, ChevronLeft, BarChart3, MessageSquareText, ShieldAlert, Cpu, CheckCircle, Code, Eye, EyeOff } from 'lucide-react';
import Button from '../components/Button';
import './CodingResult.css';

const CodingResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { result, role = 'Developer', difficulty = 'mid', violations = 0 } = location.state || {};
  const [selectedQuestionIdx, setSelectedQuestionIdx] = useState(0);
  const [showOptimalCode, setShowOptimalCode] = useState({});

  useEffect(() => {
    if (!result) {
      navigate('/dashboard');
    }
  }, [result, navigate]);

  if (!result) return null;

  const toggleOptimalCode = (idx) => {
    setShowOptimalCode(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const detailedResults = result.detailedResults || [];
  const currentResult = detailedResults[selectedQuestionIdx];

  // Count total test cases passed vs total
  let totalPassed = 0;
  let totalTests = 0;
  detailedResults.forEach(r => {
    if (r.testCasesResult) {
      // Parse e.g. "Passed 2/3 test cases"
      const match = r.testCasesResult.match(/Passed (\d+)\/(\d+)/);
      if (match) {
        totalPassed += parseInt(match[1]);
        totalTests += parseInt(match[2]);
      }
    }
  });

  return (
    <div className="coding-result-page">
      <motion.div 
        className="result-wrapper"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header Block */}
        <div className="results-hero glass-panel">
          <Award className="award-icon-hero" size={56} />
          <h1>Coding Assessment Report</h1>
          <p>AI-Powered Performance & Algorithm Efficiency Evaluation</p>
          <div className="metadata-row">
            <span>Role: {role}</span>
            <span className="dot">•</span>
            <span>Difficulty: {difficulty}</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-box glass-panel score-box-panel">
            <div className="score-ring">
              <span className="score-number">{result.overallScore || 0}</span>
              <span className="score-label">/100</span>
            </div>
            <div className="stat-desc">
              <h4>Coding Performance Score</h4>
              <p>Evaluated based on compiler outputs, space/time complexity, and code hygiene.</p>
            </div>
          </div>

          <div className="stat-box glass-panel text-stat-panel">
            <div className="inner-stat">
              <CheckCircle size={32} className="success-icon" />
              <div>
                <h3>{totalTests > 0 ? `${totalPassed} / ${totalTests}` : 'N/A'}</h3>
                <span className="small-stat-lbl">Test Cases Passed</span>
              </div>
            </div>
            <div className="inner-stat">
              <ShieldAlert size={32} className={violations > 2 ? 'danger-icon' : 'warning-icon'} />
              <div>
                <h3>{violations}</h3>
                <span className="small-stat-lbl">Proctoring Violations</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Overview Critique */}
        <div className="general-critique-panel glass-panel">
          <div className="panel-title-area">
            <MessageSquareText size={20} className="text-primary" />
            <h3>General Feedback</h3>
          </div>
          <p className="general-feedback-text">{result.generalFeedback || "Review your responses for each question to see compiler correctness and optimal implementation details."}</p>
        </div>

        {/* Split Code Inspector */}
        {detailedResults.length > 0 && (
          <div className="code-inspector-block">
            <div className="inspector-tabs">
              <h3>Question Breakdown</h3>
              <div className="tabs-list">
                {detailedResults.map((item, idx) => (
                  <button
                    key={idx}
                    className={`tab-btn ${selectedQuestionIdx === idx ? 'active' : ''}`}
                    onClick={() => setSelectedQuestionIdx(idx)}
                  >
                    Q{idx + 1}: {item.questionTitle}
                  </button>
                ))}
              </div>
            </div>

            {currentResult && (
              <div className="inspector-panel glass-panel">
                <div className="inspector-header">
                  <div className="inspector-header-left">
                    <h4>{currentResult.questionTitle}</h4>
                    <span className="case-pass-badge">{currentResult.testCasesResult}</span>
                  </div>
                  <div className="score-badge-q">
                    Score: {currentResult.score || 'N/A'}
                  </div>
                </div>

                <div className="complexity-bar">
                  <div className="complexity-badge">
                    <Cpu size={14} /> Time: <strong>{currentResult.timeComplexity || 'O(n)'}</strong>
                  </div>
                  <div className="complexity-badge">
                    <Cpu size={14} /> Space: <strong>{currentResult.spaceComplexity || 'O(1)'}</strong>
                  </div>
                </div>

                {/* Left/Right Split Code & Review */}
                <div className="inspector-split">
                  {/* Left: User Code */}
                  <div className="split-side code-side">
                    <div className="side-header">
                      <span>Submitted Solution ({currentResult.language?.toUpperCase() || 'JAVASCRIPT'})</span>
                      <button className="optimal-toggle" onClick={() => toggleOptimalCode(selectedQuestionIdx)}>
                        {showOptimalCode[selectedQuestionIdx] ? (
                          <>
                            <EyeOff size={14} />
                            View Mine
                          </>
                        ) : (
                          <>
                            <Eye size={14} />
                            View Optimal
                          </>
                        )}
                      </button>
                    </div>
                    
                    <div className="code-view-container">
                      <pre className="code-view-pre">
                        <code>
                          {showOptimalCode[selectedQuestionIdx] 
                            ? currentResult.optimalCode 
                            : currentResult.userCode || "// No code submitted for this question."}
                        </code>
                      </pre>
                    </div>
                  </div>

                  {/* Right: AI Critique */}
                  <div className="split-side review-side">
                    <div className="side-header">
                      <span>AI Code Critique</span>
                    </div>
                    <div className="critique-content">
                      <p>{currentResult.critique}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="results-actions">
          <Button variant="primary" onClick={() => navigate('/dashboard')}>
            <ChevronLeft size={18} /> Back to Dashboard
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default CodingResult;
