import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Briefcase, Mail, 
  FileText, Calendar, Trophy, BarChart, Code,
  RefreshCw, AlertCircle, ExternalLink, Info, CheckCircle2, ChevronRight
} from 'lucide-react';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { SiLeetcode, SiCodeforces, SiCodechef, SiGeeksforgeeks } from 'react-icons/si';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import './Profile.css';

// ==========================================
// CUSTOM SVG CHARTS COMPONENT RESOLVERS
// ==========================================

const LeetCodeBarChart = ({ easy = 0, medium = 0, hard = 0 }) => {
  const max = Math.max(easy, medium, hard, 10);
  const getPercent = (val) => (val / max) * 100;
  
  return (
    <div className="svg-chart-container">
      <h4 className="chart-title">LeetCode Difficulty Share</h4>
      <svg viewBox="0 0 200 130" width="100%" height="120px">
        {/* Grid lines */}
        <line x1="30" y1="20" x2="190" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <line x1="30" y1="55" x2="190" y2="55" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <line x1="30" y1="90" x2="190" y2="90" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
        
        {/* Y Axis text labels */}
        <text x="22" y="23" fill="#64748b" fontSize="6.5" textAnchor="end" fontWeight="600">{Math.round(max)}</text>
        <text x="22" y="58" fill="#64748b" fontSize="6.5" textAnchor="end" fontWeight="600">{Math.round(max / 2)}</text>
        <text x="22" y="93" fill="#64748b" fontSize="6.5" textAnchor="end" fontWeight="600">0</text>
        
        <defs>
          <linearGradient id="easyGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.1"/>
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.95"/>
          </linearGradient>
          <linearGradient id="medGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.1"/>
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.95"/>
          </linearGradient>
          <linearGradient id="hardGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.1"/>
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.95"/>
          </linearGradient>
        </defs>
        
        {/* Easy Bar */}
        <rect x="52" y={90 - (getPercent(easy) * 0.7)} width="16" height={getPercent(easy) * 0.7} rx="3" fill="url(#easyGrad)" stroke="#10b981" strokeWidth="0.5" />
        <text x="60" y={84 - (getPercent(easy) * 0.7)} fill="#10b981" fontSize="8.5" textAnchor="middle" fontWeight="800">{easy}</text>
        <text x="60" y="105" fill="#94a3b8" fontSize="7.5" textAnchor="middle" fontWeight="700">Easy</text>
        
        {/* Medium Bar */}
        <rect x="102" y={90 - (getPercent(medium) * 0.7)} width="16" height={getPercent(medium) * 0.7} rx="3" fill="url(#medGrad)" stroke="#f59e0b" strokeWidth="0.5" />
        <text x="110" y={84 - (getPercent(medium) * 0.7)} fill="#f59e0b" fontSize="8.5" textAnchor="middle" fontWeight="800">{medium}</text>
        <text x="110" y="105" fill="#94a3b8" fontSize="7.5" textAnchor="middle" fontWeight="700">Medium</text>
        
        {/* Hard Bar */}
        <rect x="152" y={90 - (getPercent(hard) * 0.7)} width="16" height={getPercent(hard) * 0.7} rx="3" fill="url(#hardGrad)" stroke="#ef4444" strokeWidth="0.5" />
        <text x="160" y={84 - (getPercent(hard) * 0.7)} fill="#ef4444" fontSize="8.5" textAnchor="middle" fontWeight="800">{hard}</text>
        <text x="160" y="105" fill="#94a3b8" fontSize="7.5" textAnchor="middle" fontWeight="700">Hard</text>
      </svg>
    </div>
  );
};

const CodeforcesLineChart = ({ history = [] }) => {
  if (!history || history.length === 0) {
    return (
      <div className="svg-chart-container empty-chart-state">
        <h4 className="chart-title">Codeforces Rating Progression</h4>
        <div className="empty-text">No contest rating history available yet.</div>
      </div>
    );
  }

  const ratings = history.map(h => h.rating);
  const minRating = Math.max(Math.min(...ratings, 800) - 100, 0);
  const maxRating = Math.max(...ratings, 1500) + 100;
  const range = maxRating - minRating || 100;

  const graphWidth = 160;
  const graphHeight = 65;
  const startX = 35;
  const startY = 15;

  const points = history.map((h, index) => {
    const x = startX + (index / (history.length - 1 || 1)) * graphWidth;
    const y = startY + graphHeight - ((h.rating - minRating) / range) * graphHeight;
    return { x, y, rating: h.rating, date: h.date };
  });

  const pathD = points.reduce((acc, p, i) => {
    return acc + `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
  }, '');

  return (
    <div className="svg-chart-container">
      <h4 className="chart-title">Codeforces Rating Progression</h4>
      <svg viewBox="0 0 220 105" width="100%" height="110px">
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        <line x1={startX} y1={startY} x2={startX + graphWidth} y2={startY} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <line x1={startX} y1={startY + graphHeight / 2} x2={startX + graphWidth} y2={startY + graphHeight / 2} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <line x1={startX} y1={startY + graphHeight} x2={startX + graphWidth} y2={startY + graphHeight} stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />

        <text x={startX - 6} y={startY + 3} fill="#64748b" fontSize="6.5" textAnchor="end" fontWeight="600">{Math.round(maxRating)}</text>
        <text x={startX - 6} y={startY + graphHeight / 2 + 3} fill="#64748b" fontSize="6.5" textAnchor="end" fontWeight="600">{Math.round(minRating + range / 2)}</text>
        <text x={startX - 6} y={startY + graphHeight + 3} fill="#64748b" fontSize="6.5" textAnchor="end" fontWeight="600">{Math.round(minRating)}</text>

        {points.length > 0 && (
          <path
            d={`${pathD} L ${points[points.length - 1].x} ${startY + graphHeight} L ${points[0].x} ${startY + graphHeight} Z`}
            fill="url(#areaGrad)"
          />
        )}

        <path d={pathD} fill="none" stroke="url(#lineGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {points.slice(-6).map((p, idx) => (
          <g key={idx} className="chart-point">
            <circle cx={p.x} cy={p.y} r="3" fill="#06b6d4" stroke="#030303" strokeWidth="1.2" />
            <title>{`${p.rating} (${p.date})`}</title>
          </g>
        ))}
        
        <text x={startX} y={startY + graphHeight + 12} fill="#64748b" fontSize="6.5" textAnchor="start" fontWeight="600">
          {history[0]?.date}
        </text>
        <text x={startX + graphWidth} y={startY + graphHeight + 12} fill="#64748b" fontSize="6.5" textAnchor="end" fontWeight="600">
          {history[history.length - 1]?.date}
        </text>
      </svg>
    </div>
  );
};

const GitHubLanguagesChart = ({ languages = [] }) => {
  if (!languages || languages.length === 0) {
    return (
      <div className="svg-chart-container empty-chart-state">
        <h4 className="chart-title">GitHub Top Languages</h4>
        <div className="empty-text">No language stats indexed.</div>
      </div>
    );
  }

  const total = languages.reduce((sum, l) => sum + (l.count || 0), 0);
  const colors = ['#6366f1', '#06b6d4', '#ec4899', '#f59e0b', '#10b981'];
  
  let accumulatedPercent = 0;
  const segments = languages.slice(0, 5).map((lang, index) => {
    const percentage = total > 0 ? (lang.count / total) * 100 : 0;
    const strokeDash = `${percentage} ${100 - percentage}`;
    const strokeOffset = 100 - accumulatedPercent + 25; 
    accumulatedPercent += percentage;
    return {
      name: lang.name,
      percentage,
      strokeDash,
      strokeOffset,
      color: colors[index % colors.length]
    };
  });

  return (
    <div className="svg-chart-container language-chart-layout">
      <div className="donut-chart-wrapper">
        <svg viewBox="0 0 36 36" width="85" height="85" className="donut-svg">
          <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="4.5" />
          {segments.map((seg, idx) => (
            <circle
              key={idx}
              cx="18"
              cy="18"
              r="15.915"
              fill="none"
              stroke={seg.color}
              strokeWidth="4.5"
              strokeDasharray={seg.strokeDash}
              strokeDashoffset={seg.strokeOffset}
              strokeLinecap="round"
            />
          ))}
        </svg>
        <div className="donut-center-text">
          <span className="donut-count">{total}</span>
          <span className="donut-label">Index</span>
        </div>
      </div>
      <div className="languages-legend">
        {segments.map((seg, idx) => (
          <div key={idx} className="legend-item">
            <span className="legend-color-dot" style={{ backgroundColor: seg.color, color: seg.color }}></span>
            <span className="legend-name">{seg.name}</span>
            <span className="legend-percent">{Math.round(seg.percentage)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const CodingStrengthGauge = ({ score }) => {
  const percentage = Math.min((score / 1000) * 100, 100);
  
  const getLevel = (s) => {
    if (s < 150) return { title: 'Bronze', color: '#cd7f32', desc: 'Starting your competitive coding journey. Connect handles to rank up.' };
    if (s < 350) return { title: 'Silver', color: '#94a3b8', desc: 'Consistent practice across repositories. Solid foundational problem solving.' };
    if (s < 600) return { title: 'Gold', color: '#f59e0b', desc: 'Strong algorithmic knowledge. Capable of solving intermediate-advanced logic.' };
    if (s < 850) return { title: 'Platinum', color: '#a855f7', desc: 'Expert dynamic programmer. Excellent efficiency, contest ratings, and repos.' };
    return { title: 'Cyber-Titanium', color: '#06b6d4', glow: true, desc: 'God-tier developer status. Dominating coding contests, algorithms, and open source.' };
  };

  const lvl = getLevel(score);

  return (
    <div className="svg-chart-container strength-gauge-layout">
      <div className="gauge-wrapper">
        <svg viewBox="0 0 36 36" width="100" height="100" className="gauge-svg">
          {/* Back track arc */}
          <path 
            d="M 6.858 29.142 A 15.915 15.915 0 1 1 29.142 29.142" 
            fill="none" 
            stroke="rgba(255,255,255,0.03)" 
            strokeWidth="3.5" 
            strokeLinecap="round"
          />
          {/* Glowing active arc representing score */}
          <path 
            d="M 6.858 29.142 A 15.915 15.915 0 1 1 29.142 29.142" 
            fill="none" 
            stroke={lvl.color} 
            strokeWidth="3.5" 
            strokeDasharray={`${percentage * 0.75} ${100 - (percentage * 0.75)}`} 
            strokeLinecap="round"
            style={{ filter: lvl.glow ? 'drop-shadow(0 0 6px #06b6d4)' : 'none' }}
          />
        </svg>
        <div className="gauge-center-text">
          <span className="gauge-score">{score}</span>
          <span className="gauge-level-badge" style={{ color: lvl.color, border: `1px solid rgba(${lvl.glow ? '6,182,212' : '255,255,255'},0.15)` }}>{lvl.title}</span>
        </div>
      </div>
      <div className="gauge-info">
        <span className="rank-title" style={{ color: lvl.color, textShadow: lvl.glow ? '0 0 8px rgba(6,182,212,0.3)' : 'none' }}>{lvl.title} Class Rank</span>
        <p>{lvl.desc}</p>
      </div>
    </div>
  );
};

// ==========================================
// PROFILE COMPONENT DEFINITION
// ==========================================

const Profile = () => {
  const { authFetch, user } = useAuth();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const viewedUid = queryParams.get('uid');

  const [profile, setProfile] = useState(null);
  const [codingData, setCodingData] = useState({ codingProfiles: {}, codingStats: {} });
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    experience: 'mid',
    linkedin: '',
    college: '',
    branch: '',
    batch: '',
    year: '',
    githubUsername: '',
    leetcodeUsername: '',
    codeforcesHandle: '',
    codechefHandle: '',
    gfgUsername: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchAllProfileData = () => {
    const profileUrl = viewedUid ? `/api/profile?uid=${viewedUid}` : '/api/profile';
    const statsUrl = viewedUid ? `/api/profile/coding-stats?uid=${viewedUid}` : '/api/profile/coding-stats';

    Promise.all([
      authFetch(profileUrl).then(res => {
        if (!res.ok) throw new Error('Failed to load profile');
        return res.json();
      }),
      authFetch(statsUrl).then(res => {
        if (!res.ok) throw new Error('Failed to load coding stats');
        return res.json();
      })
    ])
      .then(([profileData, statsData]) => {
        setProfile(profileData);
        setCodingData(statsData);
        setFormData({
          name: profileData.name && profileData.name !== 'AI Candidate' ? profileData.name : (user?.displayName || profileData.name || ''),
          email: profileData.email && profileData.email !== 'user@example.com' ? profileData.email : (user?.email || profileData.email || ''),
          role: profileData.role || 'Software Engineer',
          experience: profileData.experience || 'mid',
          linkedin: profileData.linkedin || '',
          college: profileData.college || '',
          branch: profileData.branch || '',
          batch: profileData.batch || '',
          year: profileData.year || '',
          githubUsername: statsData.codingProfiles?.github || '',
          leetcodeUsername: statsData.codingProfiles?.leetcode || '',
          codeforcesHandle: statsData.codingProfiles?.codeforces || '',
          codechefHandle: statsData.codingProfiles?.codechef || '',
          gfgUsername: statsData.codingProfiles?.gfg || ''
        });
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error loading profile modules:', err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchAllProfileData();
  }, [user, location.search]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error inline when typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSyncProfiles = async () => {
    setIsSyncing(true);
    try {
      const url = viewedUid ? `/api/profile/sync-coding-profiles?uid=${viewedUid}` : '/api/profile/sync-coding-profiles';
      const res = await authFetch(url, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setCodingData(data);
        triggerToast('Coding metrics synced successfully!', 'success');
      } else {
        triggerToast(data.message || 'Sync failed', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Connection error during sync', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const triggerToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setFormErrors({});

    try {
      // 1. Save standard profile fields
      const profileRes = await authFetch('/api/profile', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          experience: formData.experience,
          linkedin: formData.linkedin,
          college: formData.college,
          branch: formData.branch,
          batch: formData.batch,
          year: formData.year
        })
      });

      if (!profileRes.ok) throw new Error('Failed to update standard profile');
      const updatedProfile = await profileRes.json();
      setProfile(prev => ({
        ...prev,
        ...updatedProfile.profile,
        isOwnProfile: true
      }));

      // 2. Save coding handles and trigger fetch
      const codingRes = await authFetch('/api/profile/coding-profiles', {
        method: 'POST',
        body: JSON.stringify({
          github: formData.githubUsername,
          leetcode: formData.leetcodeUsername,
          codeforces: formData.codeforcesHandle,
          codechef: formData.codechefHandle,
          gfg: formData.gfgUsername
        })
      });

      const codingResults = await codingRes.json();
      
      if (codingRes.status === 207 || !codingResults.success) {
        // Handled partial validation errors
        if (codingResults.errors) {
          setFormErrors(codingResults.errors);
          triggerToast('Profile updated, but some handles failed to validate', 'error');
        }
      } else {
        triggerToast('Profile and coding stats updated successfully!', 'success');
      }

      if (codingResults.codingProfiles) {
        setCodingData(codingResults);
      }

      // Refresh all computed stats and historical evaluation logs
      fetchAllProfileData();
    } catch (err) {
      console.error(err);
      triggerToast('Failed to update profile details', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Computations
  const stats = codingData.codingStats || {};
  const hasConnectedProfiles = !!(
    codingData.codingProfiles?.github || 
    codingData.codingProfiles?.leetcode || 
    codingData.codingProfiles?.codeforces ||
    codingData.codingProfiles?.codechef ||
    codingData.codingProfiles?.gfg
  );

  const getCombinedScore = () => {
    const gh = stats.github || {};
    const lc = stats.leetcode || {};
    const cf = stats.codeforces || {};
    const cc = stats.codechef || {};
    const gfg = stats.gfg || {};
    
    const ghScore = Math.min((gh.totalStars || 0) * 20 + (gh.contributions || 0) * 1.5 + (gh.repositories || 0) * 3, 1000);
    const lcScore = Math.min((lc.totalSolved || 0) * 3 + (lc.contestRating || 0) * 0.4, 1000);
    const cfScore = Math.min((cf.currentRating || 0) * 0.5 + (cf.problemsSolved || 0) * 3, 1000);
    const ccScore = Math.min((cc.rating || 0) * 0.5 + (cc.problemsSolved || 0) * 3, 1000);
    const gfgScore = Math.min((gfg.score || 0) + (gfg.problemsSolved || 0) * 2, 1000);
    
    const totalConnected = [gh.lastSyncedAt, lc.lastSyncedAt, cf.lastSyncedAt, cc.lastSyncedAt, gfg.lastSyncedAt].filter(Boolean).length;
    if (totalConnected === 0) return 0;
    
    return Math.round((ghScore + lcScore + cfScore + ccScore + gfgScore) / totalConnected);
  };

  const strengthScore = getCombinedScore();

  // Find last sync timestamp
  const getLastSyncedAtString = () => {
    const times = [
      stats.github?.lastSyncedAt,
      stats.leetcode?.lastSyncedAt,
      stats.codeforces?.lastSyncedAt,
      stats.codechef?.lastSyncedAt,
      stats.gfg?.lastSyncedAt
    ].filter(Boolean).map(t => new Date(t));
    if (times.length === 0) return null;
    const maxTime = new Date(Math.max(...times));
    return maxTime.toLocaleString();
  };

  const lastSyncedTimestamp = getLastSyncedAtString();

  const isReadOnly = profile && !profile.isOwnProfile;

  if (isLoading) {
    return (
      <div className="profile-page">
        <div className="loading-container-skele">
          <RefreshCw className="spinning" size={40} />
          <p style={{ marginTop: '16px' }}>Decrypting user profile indexes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        
        {/* Left Column: Profile Card Form */}
        <motion.div 
          className="profile-card"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="profile-header">
            <div className="profile-avatar-circle">
              <User size={40} />
            </div>
            <div className="profile-meta">
              <h2>{profile?.name}</h2>
              <p>{profile?.role}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label>Name</label>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange}
                required
                disabled={isReadOnly}
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange}
                required
                disabled={isReadOnly}
              />
            </div>

            <div className="form-group">
              <label>Target Role</label>
              <input 
                type="text" 
                name="role" 
                value={formData.role} 
                onChange={handleChange}
                required
                disabled={isReadOnly}
              />
            </div>

            <div className="form-group">
              <label>Experience Level</label>
              <select name="experience" value={formData.experience} onChange={handleChange} disabled={isReadOnly}>
                <option value="junior">Junior Developer (0-2 years)</option>
                <option value="mid">Mid-Level Developer (2-5 years)</option>
                <option value="senior">Senior Developer (5+ years)</option>
              </select>
            </div>

            <div className="form-group">
              <label>College / University</label>
              <input 
                type="text" 
                name="college" 
                value={formData.college} 
                onChange={handleChange}
                placeholder="e.g. PES College of Engineering"
                disabled={isReadOnly}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Branch / Department</label>
                <input 
                  type="text" 
                  name="branch" 
                  value={formData.branch} 
                  onChange={handleChange}
                  placeholder="e.g. CSE"
                  disabled={isReadOnly}
                />
              </div>

              <div className="form-group">
                <label>Graduation Batch</label>
                <input 
                  type="text" 
                  name="batch" 
                  value={formData.batch} 
                  onChange={handleChange}
                  placeholder="e.g. 2026"
                  disabled={isReadOnly}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Academic Year</label>
              <select name="year" value={formData.year} onChange={handleChange} disabled={isReadOnly}>
                <option value="">Select Academic Year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Graduated">Graduated</option>
              </select>
            </div>

            <div className="form-group">
              <label>LinkedIn URL</label>
              <div className="input-with-icon">
                <FaLinkedin size={16} className="input-field-icon" />
                <input 
                  type="url" 
                  name="linkedin" 
                  value={formData.linkedin} 
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/username"
                  disabled={isReadOnly}
                />
              </div>
            </div>

            {/* Coding Profiles Form Section */}
            <div className="coding-profiles-form-section">
              <h3 className="coding-profiles-title">
                <Code size={16} /> Connected Coding Profiles
              </h3>
              
              <div className="form-group">
                <label>GitHub Username</label>
                <div className="input-with-icon">
                  <FaGithub size={16} className="input-field-icon" />
                  <input 
                    type="text" 
                    name="githubUsername" 
                    value={formData.githubUsername} 
                    onChange={handleChange}
                    placeholder="github_username"
                    className={formErrors.github ? 'input-error-border' : ''}
                    disabled={isReadOnly}
                  />
                </div>
                {formErrors.github && <span className="input-error-msg"><AlertCircle size={10} /> {formErrors.github}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>LeetCode Username</label>
                  <div className="input-with-icon">
                    <SiLeetcode size={16} className="input-field-icon" />
                    <input 
                      type="text" 
                      name="leetcodeUsername" 
                      value={formData.leetcodeUsername} 
                      onChange={handleChange}
                      placeholder="leetcode_username"
                      className={formErrors.leetcode ? 'input-error-border' : ''}
                      disabled={isReadOnly}
                    />
                  </div>
                  {formErrors.leetcode && <span className="input-error-msg"><AlertCircle size={10} /> {formErrors.leetcode}</span>}
                </div>
                
                <div className="form-group">
                  <label>Codeforces Handle</label>
                  <div className="input-with-icon">
                    <SiCodeforces size={16} className="input-field-icon" />
                    <input 
                      type="text" 
                      name="codeforcesHandle" 
                      value={formData.codeforcesHandle} 
                      onChange={handleChange}
                      placeholder="cf_handle"
                      className={formErrors.codeforces ? 'input-error-border' : ''}
                      disabled={isReadOnly}
                    />
                  </div>
                  {formErrors.codeforces && <span className="input-error-msg"><AlertCircle size={10} /> {formErrors.codeforces}</span>}
                </div>
              </div>

              <div className="form-row" style={{ marginTop: '12px' }}>
                <div className="form-group">
                  <label>CodeChef Handle</label>
                  <div className="input-with-icon">
                    <SiCodechef size={16} className="input-field-icon" />
                    <input 
                      type="text" 
                      name="codechefHandle" 
                      value={formData.codechefHandle} 
                      onChange={handleChange}
                      placeholder="codechef_handle"
                      className={formErrors.codechef ? 'input-error-border' : ''}
                      disabled={isReadOnly}
                    />
                  </div>
                  {formErrors.codechef && <span className="input-error-msg"><AlertCircle size={10} /> {formErrors.codechef}</span>}
                </div>
                
                <div className="form-group">
                  <label>GeeksforGeeks Username</label>
                  <div className="input-with-icon">
                    <SiGeeksforgeeks size={16} className="input-field-icon" />
                    <input 
                      type="text" 
                      name="gfgUsername" 
                      value={formData.gfgUsername} 
                      onChange={handleChange}
                      placeholder="gfg_username"
                      className={formErrors.gfg ? 'input-error-border' : ''}
                      disabled={isReadOnly}
                    />
                  </div>
                  {formErrors.gfg && <span className="input-error-msg"><AlertCircle size={10} /> {formErrors.gfg}</span>}
                </div>
              </div>
            </div>

            {!isReadOnly && (
              <Button type="submit" variant="primary" className="save-btn" disabled={isSaving || isSyncing}>
                {isSaving ? 'Validating & Syncing...' : 'Save Changes'}
              </Button>
            )}
          </form>
        </motion.div>

        {/* Right Column: Performance Stats and Activity History */}
        <motion.div 
          className="profile-details-column"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {/* Summary Stats Widgets */}
          <div className="stats-grid">
            <div className="stat-card">
              <Trophy className="stat-icon" size={24} />
              <span className="stat-value">{profile?.stats?.interviewsCompleted}</span>
              <span className="stat-label">Interviews Run</span>
            </div>
            <div className="stat-card">
              <BarChart className="stat-icon" size={24} />
              <span className="stat-value">{profile?.stats?.avgScore}%</span>
              <span className="stat-label">Avg Tech Score</span>
            </div>
            <div className="stat-card">
              <FileText className="stat-icon" size={24} />
              <span className="stat-value">{profile?.resumeFilename ? '1' : '0'}</span>
              <span className="stat-label">Resumes Parsed</span>
            </div>
          </div>

          {/* Connected Profiles Analytics Dashboard */}
          <div className="coding-performance-dashboard glass-panel">
            <div className="dashboard-head">
              <h3>
                <Trophy size={18} className="section-title-icon text-cyan" />
                Coding Performance Dashboard
              </h3>
              {hasConnectedProfiles && !isReadOnly && (
                <button 
                  onClick={handleSyncProfiles} 
                  className={`sync-refresh-btn ${isSyncing ? 'loading' : ''}`}
                  disabled={isSyncing || isSaving}
                >
                  <RefreshCw size={14} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Profiles'}</span>
                </button>
              )}
            </div>

            {!hasConnectedProfiles ? (
              <div className="empty-stats-state">
                <Info size={36} color="var(--color-primary)" />
                <p>No developer platforms connected.</p>
                <span className="small-helper">Enter your usernames in the left panel to display coding activity charts.</span>
              </div>
            ) : (
              <div className="analytics-body">
                {/* Synced Info */}
                {lastSyncedTimestamp && (
                  <div className="sync-timestamp-bar">
                    <span>Last Synced: {lastSyncedTimestamp}</span>
                  </div>
                )}

                {/* Summary Metrics Row */}
                <div className="summary-badges-row">
                  <div className="badge-item">
                    <span className="badge-title">GitHub Repos</span>
                    <span className="badge-number text-cyan">{stats.github?.repositories || 0}</span>
                  </div>
                  <div className="badge-item">
                    <span className="badge-title">LeetCode Solved</span>
                    <span className="badge-number text-purple">{stats.leetcode?.totalSolved || 0}</span>
                  </div>
                  <div className="badge-item">
                    <span className="badge-title">CF Rating</span>
                    <span className="badge-number text-magenta">{stats.codeforces?.currentRating || 0}</span>
                  </div>
                  {stats.codechef?.rating > 0 && (
                    <div className="badge-item">
                      <span className="badge-title">CodeChef</span>
                      <span className="badge-number text-amber-500">{stats.codechef?.rating || 0}</span>
                    </div>
                  )}
                  {stats.gfg?.problemsSolved > 0 && (
                    <div className="badge-item">
                      <span className="badge-title">GFG Solved</span>
                      <span className="badge-number text-emerald-500">{stats.gfg?.problemsSolved || 0}</span>
                    </div>
                  )}
                </div>

                {/* Charts Grid */}
                <div className="charts-grid-container">
                  <div className="chart-item-card">
                    <LeetCodeBarChart 
                      easy={stats.leetcode?.easySolved} 
                      medium={stats.leetcode?.mediumSolved} 
                      hard={stats.leetcode?.hardSolved} 
                    />
                  </div>
                  <div className="chart-item-card">
                    <GitHubLanguagesChart languages={stats.github?.topLanguages} />
                  </div>
                  <div className="chart-item-card span-col-2">
                    <CodeforcesLineChart history={stats.codeforces?.ratingHistory} />
                  </div>
                  <div className="chart-item-card span-col-2">
                    <CodingStrengthGauge score={strengthScore} />
                  </div>
                </div>

                {/* Recent Activity Sections */}
                <div className="activity-lists-grid">
                  {/* GitHub Projects */}
                  {stats.github?.latestRepos?.length > 0 && (
                    <div className="activity-list-card">
                      <h5>Latest GitHub Projects</h5>
                      <div className="list-items-wrapper">
                        {stats.github.latestRepos.map((r, i) => (
                          <a href={r.url} target="_blank" rel="noreferrer" key={i} className="activity-row-item">
                            <div className="row-main">
                              <span className="item-name text-cyan">{r.name}</span>
                              <span className="item-desc">{r.description || 'No description'}</span>
                            </div>
                            <div className="row-meta">
                              <span className="item-badge-lang">{r.language}</span>
                              <span className="item-stars">★ {r.stars}</span>
                            </div>
                            <ChevronRight size={14} className="chevron-icon" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Codeforces History */}
                  {stats.codeforces?.ratingHistory?.length > 0 && (
                    <div className="activity-list-card">
                      <h5>Recent Contests Participated</h5>
                      <div className="list-items-wrapper">
                        {stats.codeforces.ratingHistory.slice(-5).reverse().map((c, i) => (
                          <div key={i} className="activity-row-item no-link">
                            <div className="row-main">
                              <span className="item-name">{c.contestName}</span>
                              <span className="item-desc">{c.date}</span>
                            </div>
                            <div className="row-meta">
                              <span className="rating-history-badge">Rating: {c.rating}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Active Resume Section */}
          <div className="resume-section">
            <h3 className="section-title">
              <FileText size={18} className="section-title-icon" />
              Active Resume
            </h3>
            <div className="resume-details-card">
              <div className="resume-file-info">
                <FileText size={16} className="resume-file-info-icon" />
                <span>{profile?.resumeFilename || 'No resume uploaded'}</span>
              </div>
              <div className="resume-preview-box">
                {profile?.resumeText || 'Upload your PDF resume on the dashboard to populate your credentials...'}
              </div>
            </div>
          </div>

          {/* Recent Evaluations */}
          <div className="history-section">
            <h3 className="section-title">
              <Calendar size={18} className="section-title-icon" />
              Recent Evaluations
            </h3>
            <div className="history-card">
              <div className="history-table-wrapper">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Role Profile</th>
                      <th>Date Evaluated</th>
                      <th>Type</th>
                      <th style={{ textAlign: 'right' }}>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile?.history?.map(item => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: '600' }}>{item.role}</td>
                        <td>{item.date}</td>
                        <td>{item.type}</td>
                        <td style={{ textAlign: 'right' }}>
                          <span className={`score-badge ${item.score >= 85 ? 'score-high' : 'score-mid'}`}>
                            {item.score}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </motion.div>
      </div>

      {/* Success Save Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            className={`toast ${toastType}`}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          >
            {toastType === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
