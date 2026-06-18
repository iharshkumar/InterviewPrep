import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertCircle, ArrowRight, ShieldCheck, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, googleProvider, isFirebaseConfigured } from '../config/firebase';
import { signInWithPopup } from 'firebase/auth';

const Login = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // PIN Verification States
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState(['', '', '', '']);
  const [pinError, setPinError] = useState('');
  const [verifyingPin, setVerifyingPin] = useState(false);
  const [tempIdToken, setTempIdToken] = useState('');

  const navigate = useNavigate();
  const pinRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // Focus the first PIN input when modal is shown
  useEffect(() => {
    if (showPinModal && pinRefs[0].current) {
      setTimeout(() => {
        pinRefs[0].current.focus();
      }, 100);
    }
  }, [showPinModal]);

  const handleGoogleSignIn = async () => {
    setError('');
    setPinError('');
    
    if (!isFirebaseConfigured) {
      setError('Firebase Client configuration is missing. Google sign-in is disabled.');
      return;
    }

    setLoading(true);

    try {
      // Trigger Google popup Auth
      const result = await signInWithPopup(auth, googleProvider);
      
      // Get the ID token from Firebase
      const idToken = await result.user.getIdToken();
      setTempIdToken(idToken);
      
      // Reset PIN inputs and show modal
      setPin(['', '', '', '']);
      setShowPinModal(true);
    } catch (err) {
      console.error('Google Sign-In error:', err);
      setError(err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const submitGoogleAuthWithPin = async (token, pinString) => {
    setVerifyingPin(true);
    setPinError('');

    try {
      // Post the ID token and PIN to the Admin Backend for verification
      const response = await fetch('/api/admin/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: token, pin: pinString }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Google Sign-In verification failed.');
      }

      localStorage.setItem('adminToken', data.token);
      setShowPinModal(false);
      navigate('/dashboard');
    } catch (err) {
      console.error('PIN verification error:', err);
      setPinError(err.message);
      // Reset PIN inputs and refocus first input
      setPin(['', '', '', '']);
      if (pinRefs[0].current) {
        pinRefs[0].current.focus();
      }
    } finally {
      setVerifyingPin(false);
    }
  };

  const handlePinChange = (index, value) => {
    // Only allow single digits
    if (value !== '' && !/^[0-9]$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Auto-focus next field
    if (value !== '' && index < 3) {
      pinRefs[index + 1].current.focus();
    }

    // Auto-submit if all digits are entered
    const pinString = newPin.join('');
    if (pinString.length === 4 && newPin.every(digit => digit !== '')) {
      submitGoogleAuthWithPin(tempIdToken, pinString);
    }
  };

  const handlePinKeyDown = (index, e) => {
    // Handle backspace back-navigation
    if (e.key === 'Backspace' && pin[index] === '' && index > 0) {
      const newPin = [...pin];
      newPin[index - 1] = '';
      setPin(newPin);
      pinRefs[index - 1].current.focus();
    }
  };

  const handlePinPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d{4}$/.test(pastedData)) return;

    const digits = pastedData.split('');
    setPin(digits);
    submitGoogleAuthWithPin(tempIdToken, pastedData);
  };

  const closePinModal = () => {
    setShowPinModal(false);
    setTempIdToken('');
    setPin(['', '', '', '']);
    setPinError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative'
    }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '40px 30px',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          background: 'rgba(15, 12, 30, 0.65)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 10 }}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 24px rgba(139, 92, 246, 0.45)',
              marginBottom: '16px'
            }}
          >
            <Lock size={28} color="#fff" />
          </motion.div>
          <h1 style={{ 
            fontFamily: 'var(--font-display)', 
            fontWeight: 800, 
            fontSize: '24px',
            background: 'linear-gradient(to right, #fff, #A78BFA)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '6px'
          }}>
            Admin Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Authorized Administrative Access Only
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#F87171',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '24px'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </motion.div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <p style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            textAlign: 'center',
            lineHeight: 1.6
          }}>
            Sign in with an authorized Google account to view performance stats, manage active candidate pools, and customize simulations.
          </p>

          {/* Google Sign In Button */}
          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleSignIn}
            className="btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '12px 18px',
              fontSize: '15px',
              fontWeight: 600,
              boxShadow: '0 4px 16px rgba(139, 92, 246, 0.25)'
            }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '10px' }}>
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#ffffff"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#ffffff" opacity="0.85"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#ffffff" opacity="0.85"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#ffffff" opacity="0.9"/>
            </svg>
            {loading ? 'Processing...' : 'Sign In with Google'}
          </button>
        </div>
      </motion.div>

      {/* 4-Digit Security PIN Overlay Modal */}
      <AnimatePresence>
        {showPinModal && (
          <div className="modal-overlay" style={{ background: 'rgba(5, 3, 10, 0.85)' }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="glass-panel"
              style={{
                width: '100%',
                maxWidth: '400px',
                padding: '36px 30px',
                border: '1px solid rgba(6, 182, 212, 0.35)',
                background: 'rgba(12, 10, 24, 0.85)',
                boxShadow: '0 0 32px rgba(6, 182, 212, 0.15)',
                position: 'relative'
              }}
            >
              {/* Close Button */}
              <button
                onClick={closePinModal}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={18} />
              </button>

              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(6, 182, 212, 0.1)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  boxShadow: '0 0 16px rgba(6, 182, 212, 0.2)'
                }}>
                  <ShieldCheck size={26} color="var(--color-secondary)" />
                </div>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '20px',
                  color: '#fff',
                  marginBottom: '6px'
                }}>
                  Security Access PIN
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5 }}>
                  Enter the 4-digit administration access key to verify your identity.
                </p>
              </div>

              {pinError && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    color: '#F87171',
                    fontSize: '12.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '20px'
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{pinError}</span>
                </motion.div>
              )}

              {/* Pin inputs */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '12px',
                marginBottom: '28px'
              }}>
                {pin.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={pinRefs[idx]}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(idx, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(idx, e)}
                    onPaste={idx === 0 ? handlePinPaste : undefined}
                    disabled={verifyingPin}
                    style={{
                      width: '56px',
                      height: '56px',
                      textAlign: 'center',
                      fontSize: '24px',
                      fontWeight: 'bold',
                      borderRadius: '10px',
                      border: '1px solid rgba(6, 182, 212, 0.25)',
                      background: 'rgba(255, 255, 255, 0.03)',
                      color: '#fff',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)'
                    }}
                    className="glass-input"
                  />
                ))}
              </div>

              {/* Loader indicator while verifying */}
              <div style={{ display: 'flex', justifyContent: 'center', height: '24px' }}>
                {verifyingPin && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-secondary)', fontSize: '13px' }}>
                    <RefreshCw size={14} className="spin-animation" style={{ animation: 'spin-keyframe 1.5s linear infinite' }} />
                    <span>Verifying administrative clearance...</span>
                  </div>
                )}
              </div>

              {/* Keyframe injection helper */}
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes spin-keyframe {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;

