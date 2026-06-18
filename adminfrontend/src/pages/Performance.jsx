import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Calendar, Award, CheckCircle2, ChevronRight, Trash2, X, FileText, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Performance = () => {
  const [searchParams] = useSearchParams();
  const userUid = searchParams.get('userUid');
  const navigate = useNavigate();

  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInterview, setSelectedInterview] = useState(null); // Detailed modal view

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const url = userUid 
        ? `/api/admin/interviews?userUid=${encodeURIComponent(userUid)}`
        : '/api/admin/interviews';

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load interview history');
      }

      const data = await response.json();
      setInterviews(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, [userUid]);

  const handleDeleteInterview = async (id) => {
    if (!window.confirm('Are you sure you want to delete this interview record?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/interviews/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete interview record');
      }

      // Close modal if deleted interview is currently selected
      if (selectedInterview && selectedInterview._id === id) {
        setSelectedInterview(null);
      }
      
      fetchInterviews();
    } catch (err) {
      alert('Error deleting interview: ' + err.message);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        {userUid && (
          <button 
            onClick={() => navigate('/users')}
            className="btn-secondary" 
            style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ArrowLeft size={16} />
          </button>
        )}
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '30px', marginBottom: '8px' }}>
            {userUid ? 'Candidate Performance Logs' : 'All Interview Sessions'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            Review AI ratings, question-answer metrics, and transcription feedback logs.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading simulation logs...</p>
        </div>
      ) : error ? (
        <div className="glass-panel" style={{ padding: '24px', color: 'var(--color-danger)' }}>
          <p>Error: {error}</p>
        </div>
      ) : interviews.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p style={{ fontSize: '15px' }}>No interview simulations recorded for this query.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {interviews.map((interview) => (
            <motion.div
              key={interview._id}
              whileHover={{ x: 4 }}
              className="glass-panel glass-panel-hover"
              style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}
            >
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ 
                  width: '40px', height: '40px', borderRadius: '10px', 
                  background: 'rgba(6,182,212,0.1)', display: 'flex', 
                  alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(6,182,212,0.2)'
                }}>
                  <FileText size={20} color="#22D3EE" />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>
                    {interview.type} ({interview.role})
                  </h3>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} />
                      {new Date(interview.date).toLocaleDateString()}
                    </span>
                    {!userUid && (
                      <span style={{ fontWeight: 500, color: 'var(--color-primary)' }}>
                        User: {interview.userName}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                {/* Score badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={18} color="var(--color-warning)" />
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>{interview.score}%</span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => setSelectedInterview(interview)}
                    className="btn-secondary" 
                    style={{ padding: '8px 14px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    View Feedback
                    <ChevronRight size={14} />
                  </button>
                  <button 
                    onClick={() => handleDeleteInterview(interview._id)}
                    className="btn-secondary" 
                    style={{ padding: '8px 10px', borderColor: 'rgba(239,68,68,0.25)', color: '#EF4444' }}
                    title="Delete record"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Interview Feedback Detail Modal Overlay */}
      <AnimatePresence>
        {selectedInterview && (
          <div className="modal-overlay">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel modal-content"
              style={{ padding: '30px', background: '#0F0B1E', maxWidth: '780px' }}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-glass)', paddingBottom: '20px', marginBottom: '20px' }}>
                <div>
                  <span className="badge badge-blue" style={{ marginBottom: '8px' }}>{selectedInterview.type}</span>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, color: '#fff' }}>
                    {selectedInterview.role} Simulation Review
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
                    Candidate: {selectedInterview.userName} ({selectedInterview.userEmail}) • {new Date(selectedInterview.date).toLocaleDateString()}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedInterview(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Overall Score & Summary Feedback */}
              <div style={{ 
                background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '12px', padding: '20px', display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '24px'
              }}>
                <div style={{ 
                  width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 16px rgba(139,92,246,0.3)', flexShrink: 0
                }}>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>{selectedInterview.score}%</span>
                  <span style={{ fontSize: '9px', color: '#DDD', textTransform: 'uppercase', fontWeight: 600 }}>Score</span>
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#C084FC', marginBottom: '4px' }}>Evaluation Summary</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                    {selectedInterview.feedback || 'No summary feedback generated.'}
                  </p>
                </div>
              </div>

              {/* Detailed Questions & Answers */}
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>Detailed Q&A Response Log</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {(!selectedInterview.details || selectedInterview.details.length === 0) ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '16px' }}>No question log details recorded.</p>
                ) : (
                  selectedInterview.details.map((qna, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-secondary)' }}>
                          Question {idx + 1}:
                        </h4>
                        {qna.score !== undefined && (
                          <span className="badge badge-purple" style={{ flexShrink: 0 }}>
                            Score: {qna.score}/10
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '14px', color: '#fff', fontWeight: 500, lineHeight: '1.4' }}>
                        {qna.question}
                      </p>
                      
                      {qna.answer && (
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '6px', borderLeft: '3px solid var(--color-primary)' }}>
                          <h5 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Candidate Response:</h5>
                          <p style={{ fontSize: '13px', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: '1.4' }}>
                            "{qna.answer}"
                          </p>
                        </div>
                      )}

                      {qna.feedback && (
                        <div>
                          <h5 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-success)', textTransform: 'uppercase', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={12} />
                            Feedback:
                          </h5>
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                            {qna.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Close / Action Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-glass)', paddingTop: '20px', marginTop: '24px' }}>
                <button 
                  onClick={() => setSelectedInterview(null)}
                  className="btn-secondary"
                >
                  Close Review
                </button>
                <button 
                  onClick={() => handleDeleteInterview(selectedInterview._id)}
                  className="btn-danger"
                >
                  Delete Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Performance;
