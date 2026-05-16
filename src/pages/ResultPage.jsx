import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Award, ChevronLeft, BarChart3, MessageSquareText } from 'lucide-react';
import Button from '../components/Button';
import './ResultPage.css';

const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { result } = location.state || {};

  useEffect(() => {
    if (!result) {
      navigate('/dashboard');
    }
  }, [result, navigate]);

  if (!result) return null;

  return (
    <div className="result-page">
      <motion.div 
        className="result-container glass-panel"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="result-header">
          <Award className="award-icon" size={64} />
          <h1>Interview Completed</h1>
          <p>Here is your detailed performance analysis.</p>
        </div>

        <div className="score-section">
          <div className="score-circle">
            <span className="score-value">{result.overallScore || result.score || 0}</span>
            <span className="score-max">/100</span>
          </div>
          <div className="score-details">
            <h3><BarChart3 size={20} /> Overall Score</h3>
            <p>Your performance was evaluated based on the accuracy of your MCQs and the depth of your subjective answers.</p>
          </div>
        </div>

        <div className="feedback-section">
          <h3><MessageSquareText size={20} /> AI Feedback</h3>
          <div className="feedback-content">
            {result.generalFeedback ? (
              <p>{result.generalFeedback}</p>
            ) : result.feedback ? (
              <p>{result.feedback}</p>
            ) : (
              <p>Great job! Review your answers to prepare even better for your next interview.</p>
            )}
          </div>
        </div>

        {/* Detailed Results Breakdown */}
        {result.detailedResults && result.detailedResults.length > 0 && (
          <div className="detailed-results-section">
            <h3 className="section-title">Question Breakdown</h3>
            <div className="detailed-results-list">
              {result.detailedResults.map((item, idx) => (
                <div key={idx} className="detailed-result-card">
                  <div className="card-header">
                    <h4>Question {idx + 1}</h4>
                    <span className={`score-badge ${item.score?.toLowerCase().includes('correct') ? 'correct' : 'partial'}`}>
                      {item.score}
                    </span>
                  </div>
                  <p className="question-text">{item.question}</p>
                  
                  <div className="answer-comparison">
                    <div className="user-answer-block">
                      <h5>Your Answer:</h5>
                      <p>{item.userAnswer || "No answer provided."}</p>
                    </div>
                    <div className="correct-solution-block">
                      <h5>Ideal Solution / Explanation:</h5>
                      <p>{item.correctSolution}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="result-actions">
          <Button variant="primary" onClick={() => navigate('/dashboard')}>
            <ChevronLeft size={18} /> Back to Dashboard
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default ResultPage;
