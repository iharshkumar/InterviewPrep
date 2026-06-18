import React, { useEffect, useState } from 'react';
import { Users, BarChart3, Star, Award, TrendingUp, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch('/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load stats');
        }

        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading analytics dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel" style={{ padding: '24px', color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
        <p>Error: {error}</p>
      </div>
    );
  }

  // Fallbacks for empty states
  const {
    totalUsers = 0,
    totalInterviews = 0,
    avgScore = 0,
    totalProblemsSolved = 0,
    branchDistribution = [],
    experienceDistribution = [],
    topPerformers = []
  } = stats || {};

  // Custom colors for SVG charts
  const colors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '30px', marginBottom: '8px' }}>
          Overview & Insights
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Real-time user engagement, interview results, and coding stats.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '20px',
        marginBottom: '32px' 
      }}>
        {/* Card 1: Total Users */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="glass-panel" 
          style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}
        >
          <div style={{ 
            width: '48px', height: '48px', borderRadius: '12px', 
            background: 'rgba(139, 92, 246, 0.15)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(139, 92, 246, 0.3)'
          }}>
            <Users size={22} color="#A78BFA" />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Users</p>
            <h3 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px' }}>{totalUsers}</h3>
          </div>
        </motion.div>

        {/* Card 2: Total Interviews */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="glass-panel" 
          style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}
        >
          <div style={{ 
            width: '48px', height: '48px', borderRadius: '12px', 
            background: 'rgba(6, 182, 212, 0.15)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(6, 182, 212, 0.3)'
          }}>
            <BarChart3 size={22} color="#22D3EE" />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Interviews Conducted</p>
            <h3 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px' }}>{totalInterviews}</h3>
          </div>
        </motion.div>

        {/* Card 3: Avg Score */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="glass-panel" 
          style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}
        >
          <div style={{ 
            width: '48px', height: '48px', borderRadius: '12px', 
            background: 'rgba(16, 185, 129, 0.15)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            <Star size={22} color="#34D399" />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Average Score</p>
            <h3 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px' }}>{avgScore}%</h3>
          </div>
        </motion.div>

        {/* Card 4: Total Solved */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="glass-panel" 
          style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}
        >
          <div style={{ 
            width: '48px', height: '48px', borderRadius: '12px', 
            background: 'rgba(245, 158, 11, 0.15)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(245, 158, 11, 0.3)'
          }}>
            <Award size={22} color="#FBBF24" />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Coding Solutions</p>
            <h3 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px' }}>{totalProblemsSolved}</h3>
          </div>
        </motion.div>
      </div>

      {/* Analytics Charts Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Chart 1: Branch Distribution */}
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Cpu size={18} color="var(--color-primary)" />
            Branch-wise Distribution
          </h2>
          {branchDistribution.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '40px' }}>No branch data available</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {branchDistribution.map((branch, i) => {
                const maxVal = Math.max(...branchDistribution.map(b => b.value), 1);
                const percent = (branch.value / maxVal) * 100;
                return (
                  <div key={branch.name} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{branch.name}</span>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{branch.value} users</span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        style={{ 
                          height: '100%', 
                          background: `linear-gradient(to right, ${colors[i % colors.length]}, #6D28D9)`,
                          borderRadius: '4px' 
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Chart 2: Experience Distribution */}
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp size={18} color="var(--color-secondary)" />
            User Experience Levels
          </h2>
          {experienceDistribution.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '40px' }}>No experience data available</p>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '20px', minHeight: '180px' }}>
              {/* Premium hand-crafted SVG Doughnut Chart */}
              <div style={{ position: 'relative', width: '150px', height: '150px' }}>
                <svg width="100%" height="100%" viewBox="0 0 42 42" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="4" />
                  {(() => {
                    const total = experienceDistribution.reduce((acc, curr) => acc + curr.value, 0) || 1;
                    let accumulatedPercent = 0;
                    return experienceDistribution.map((exp, i) => {
                      const percent = (exp.value / total) * 100;
                      const strokeDasharray = `${percent} ${100 - percent}`;
                      const strokeDashoffset = 100 - accumulatedPercent;
                      accumulatedPercent += percent;
                      return (
                        <circle 
                          key={exp.name}
                          cx="21" 
                          cy="21" 
                          r="15.915" 
                          fill="transparent" 
                          stroke={colors[i % colors.length]} 
                          strokeWidth="4" 
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                        />
                      );
                    });
                  })()}
                </svg>
                <div style={{ 
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                  textAlign: 'center', fontFamily: 'var(--font-display)'
                }}>
                  <p style={{ fontSize: '20px', fontWeight: 800 }}>{totalUsers}</p>
                  <p style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {experienceDistribution.map((exp, i) => {
                  const total = experienceDistribution.reduce((acc, curr) => acc + curr.value, 0) || 1;
                  const ratio = Math.round((exp.value / total) * 100);
                  return (
                    <div key={exp.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: colors[i % colors.length], display: 'inline-block' }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{exp.name}:</span>
                      <strong style={{ color: '#fff' }}>{exp.value} ({ratio}%)</strong>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Performers Table Card */}
      <div className="glass-panel" style={{ padding: '30px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>
          Top Performing Candidates
        </h2>
        {topPerformers.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '40px' }}>No candidate data available</p>
        ) : (
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Candidate</th>
                  <th>College</th>
                  <th>Branch</th>
                  <th>Score</th>
                  <th>Streak</th>
                </tr>
              </thead>
              <tbody>
                {topPerformers.map((performer, idx) => (
                  <tr key={performer.email}>
                    <td>
                      <span style={{ 
                        display: 'inline-flex', width: '24px', height: '24px', 
                        alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
                        fontWeight: 'bold', fontSize: '12px',
                        background: idx === 0 ? '#FBBF24' : idx === 1 ? '#9CA3AF' : idx === 2 ? '#B45309' : 'rgba(255,255,255,0.05)',
                        color: idx < 3 ? '#000' : 'var(--text-primary)'
                      }}>
                        {idx + 1}
                      </span>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600 }}>{performer.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{performer.email}</div>
                      </div>
                    </td>
                    <td>{performer.college || 'N/A'}</td>
                    <td>
                      <span className="badge badge-purple">{performer.branch || 'Unspecified'}</span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--color-secondary)' }}>{performer.totalScore}</td>
                    <td>🔥 {performer.streak} days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
