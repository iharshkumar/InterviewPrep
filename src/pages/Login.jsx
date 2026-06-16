import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import './Login.css';

const Login = () => {
  const { user, login, signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if user is already authenticated
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError(null);
    setEmail('');
    setPassword('');
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      console.error('Google Sign-In error:', err);
      setError('Failed to sign in with Google. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (activeTab === 'login') {
        await login(email, password);
      } else {
        await signup(email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      console.error('Authentication error:', err);
      // Map Firebase errors to user-friendly messages
      let message = 'Failed to authenticate. Please check your credentials.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        message = 'Invalid email or password.';
      } else if (err.code === 'auth/email-already-in-use') {
        message = 'This email is already in use.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Invalid email address format.';
      }
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          
          <div className="login-header">
            <div className="login-logo-circle">
              <Bot size={32} />
            </div>
            <h1>MOCKPREP.AI</h1>
            <p>Develop your interview capability with AI</p>
          </div>

          <div className="login-tabs">
            <button 
              className={`login-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => handleTabChange('login')}
            >
              Sign In
            </button>
            <button 
              className={`login-tab-btn ${activeTab === 'signup' ? 'active' : ''}`}
              onClick={() => handleTabChange('signup')}
            >
              Create Account
            </button>
          </div>

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                placeholder="you@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit" 
              variant="primary" 
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? 'Processing...' 
                : activeTab === 'login' 
                  ? 'Sign In' 
                  : 'Get Started'
              }
            </Button>

            <div className="login-divider">
              <span>OR</span>
            </div>

            <button 
              type="button" 
              className="google-btn"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
            >
              <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '10px' }}>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <span>Sign In with Google</span>
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default Login;
