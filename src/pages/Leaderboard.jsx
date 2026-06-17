import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Search, Flame, RefreshCw, Clock, Crown, 
  ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Minus, Filter, Sparkles
} from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { SiLeetcode, SiCodeforces, SiCodechef, SiGeeksforgeeks } from 'react-icons/si';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import './Leaderboard.css';
import { auth, isFirebaseConfigured } from '../config/firebase';

const PlatformIcon = ({ platform, size = 16, className = '' }) => {
  switch (platform.toLowerCase()) {
    case 'github':
      return <FaGithub size={size} className={`text-slate-400 ${className}`} />;
    case 'leetcode':
      return <SiLeetcode size={size} className={`text-amber-500 ${className}`} />;
    case 'codeforces':
      return <SiCodeforces size={size} className={`text-blue-500 ${className}`} />;
    case 'codechef':
      return <SiCodechef size={size} className={`text-amber-700 ${className}`} />;
    case 'gfg':
    case 'geeksforgeeks':
      return <SiGeeksforgeeks size={size} className={`text-emerald-500 ${className}`} />;
    default:
      return null;
  }
};

const Leaderboard = () => {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // API states
  const [users, setUsers] = useState([]);
  const [topThree, setTopThree] = useState([]);
  const [filtersData, setFiltersData] = useState({
    colleges: [],
    branches: [],
    batches: [],
    years: [],
    totalUsers: 0,
    lastUpdated: null
  });

  // UI state
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [topThreeLoading, setTopThreeLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync state variables from URL query parameters
  const search = searchParams.get('search') || '';
  const college = searchParams.get('college') || '';
  const branch = searchParams.get('branch') || '';
  const batch = searchParams.get('batch') || '';
  const year = searchParams.get('year') || '';
  const platform = searchParams.get('platform') || 'all';
  const sortBy = searchParams.get('sortBy') || 'totalScore';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  const timeframe = searchParams.get('timeframe') || 'allTime';
  const page = parseInt(searchParams.get('page'), 10) || 1;
  const limit = 10;

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalUsers: 0,
    totalPages: 1
  });

  // Local state for debounced search input
  const [searchInput, setSearchInput] = useState(search);

  // Sync local search input with URL search param
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Debounced search logic
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== search) {
        updateQueryParam('search', searchInput, true);
      }
    }, 450);

    return () => clearTimeout(handler);
  }, [searchInput]);

  // Helper to update a query param in URL
  const updateQueryParam = (key, value, resetPage = false) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (resetPage) {
      params.delete('page');
    }
    setSearchParams(params);
  };

  // Fetch unique filter options & global stats
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const q = new URLSearchParams(searchParams);
      // Stats options shouldn't include page/limit to represent overall totals
      q.delete('page');
      q.delete('limit');

      const res = await authFetch(`/api/leaderboard/stats?${q.toString()}`);
      if (!res.ok) throw new Error('Failed to load filter metadata');
      const data = await res.json();
      if (data.success) {
        setFiltersData(data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch top 3 podium candidates
  const fetchTopThree = async () => {
    setTopThreeLoading(true);
    try {
      const q = new URLSearchParams(searchParams);
      q.delete('page');
      q.delete('limit');

      const res = await authFetch(`/api/leaderboard/top-three?${q.toString()}`);
      if (!res.ok) throw new Error('Failed to load podium candidates');
      const data = await res.json();
      if (data.success) {
        setTopThree(data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTopThreeLoading(false);
    }
  };

  // Fetch main leaderboard data list (remaining rank list)
  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams(searchParams);
      q.set('page', page.toString());
      q.set('limit', limit.toString());

      const res = await authFetch(`/api/leaderboard?${q.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch leaderboard records');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error(err);
      setError('Connection failure. Could not decrypt leaderboard parameters.');
    } finally {
      setLoading(false);
    }
  };

  const [updateTrigger, setUpdateTrigger] = useState(0);

  // Trigger loading when search params or database updates occur
  useEffect(() => {
    fetchLeaderboard();
    fetchTopThree();
    fetchStats();
  }, [searchParams, updateTrigger]);

  // Setup SSE connection for real-time updates
  useEffect(() => {
    let eventSource = null;
    let reconnectTimeout = null;

    const connectSSE = async () => {
      try {
        let token = 'mock-token';
        if (isFirebaseConfigured && auth && auth.currentUser) {
          try {
            token = await auth.currentUser.getIdToken();
          } catch (tokenErr) {
            console.error('Failed to retrieve Firebase ID token for SSE:', tokenErr);
          }
        }
        
        const sseUrl = `/api/leaderboard/realtime?token=${encodeURIComponent(token)}`;
        eventSource = new EventSource(sseUrl);

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'update') {
              setUpdateTrigger(prev => prev + 1);
            }
          } catch (e) {
            console.error('Failed to parse SSE payload:', e);
          }
        };

        eventSource.onerror = (err) => {
          if (eventSource) {
            eventSource.close();
          }
          reconnectTimeout = setTimeout(connectSSE, 5000);
        };
      } catch (err) {
        console.error('SSE initialization error:', err);
      }
    };

    connectSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  // Handle Sort changes
  const handleSortChange = (newSortBy) => {
    const order = (sortBy === newSortBy && sortOrder === 'desc') ? 'asc' : 'desc';
    const params = new URLSearchParams(searchParams);
    params.set('sortBy', newSortBy);
    params.set('sortOrder', order);
    params.delete('page');
    setSearchParams(params);
  };

  const toggleSortOrder = () => {
    const order = sortOrder === 'desc' ? 'asc' : 'desc';
    updateQueryParam('sortOrder', order, true);
  };

  // Format sync timestamp
  const getFormattedTime = (dateStr) => {
    if (!dateStr) return 'Offline';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString();
  };

  // Helper for mock rank changes
  const renderRankChange = (index) => {
    const changes = [3, -1, 0, 2, -2, 1, 0];
    const change = changes[index % changes.length];

    if (change > 0) {
      return <span className="rank-change change-up"><ArrowUp size={12} /> {change}</span>;
    } else if (change < 0) {
      return <span className="rank-change change-down"><ArrowDown size={12} /> {Math.abs(change)}</span>;
    }
    return <span className="rank-change change-flat"><Minus size={12} /></span>;
  };

  return (
    <motion.div 
      className="leaderboard-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="leaderboard-container">
        
        {/* Header section */}
        <div className="leaderboard-header glass-panel">
          <div className="header-info">
            <div className="header-title-row">
              <Trophy className="header-trophy-icon" size={32} />
              <div>
                <h1 className="gradient-text">Global Coding Leaderboard</h1>
                <p className="subtitle">Ranked by aggregate capability metrics across platforms</p>
              </div>
            </div>
            
            <div className="header-stats">
              <div className="stat-pill">
                <span className="pill-dot glow-green"></span>
                <span className="pill-label">Live Status:</span>
                <span className="pill-val">Active</span>
              </div>
              <div className="stat-pill">
                <span className="pill-label">Ranked Users:</span>
                <span className="pill-val">{filtersData.totalUsers}</span>
              </div>
              {filtersData.lastUpdated && (
                <div className="stat-pill">
                  <Clock size={12} className="pill-icon" />
                  <span className="pill-label">Last Sync:</span>
                  <span className="pill-val">{getFormattedTime(filtersData.lastUpdated)}</span>
                </div>
              )}
            </div>
          </div>
          <div className="header-graphic">
            <Sparkles className="sparkles-icon" size={48} />
          </div>
        </div>

        {/* Timeframe selector tabs */}
        <div className="timeframe-tabs">
          {['allTime', 'month', 'week'].map((tab) => (
            <button
              key={tab}
              className={`tab-btn ${timeframe === tab ? 'active' : ''}`}
              onClick={() => updateQueryParam('timeframe', tab, true)}
            >
              {tab === 'allTime' && 'All Time'}
              {tab === 'month' && 'This Month'}
              {tab === 'week' && 'This Week'}
              {timeframe === tab && (
                <motion.div 
                  className="active-tab-indicator" 
                  layoutId="activeTab"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Top 3 Podium Section */}
        <div className="podium-section">
          {topThreeLoading ? (
            // Podium loading skeleton
            <div className="podium-wrapper">
              <div className="podium-card skeleton second-place"></div>
              <div className="podium-card skeleton first-place"></div>
              <div className="podium-card skeleton third-place"></div>
            </div>
          ) : topThree.length > 0 ? (
            <div className="podium-wrapper">
              {/* 2nd Place Card */}
              {topThree[1] && (
                <motion.div 
                  className="podium-card second-place glass-panel"
                  onClick={() => navigate(`/profile?uid=${topThree[1].firebaseUid}`)}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <div className="podium-rank">2</div>
                  <div className="podium-avatar-wrapper rank-2-border">
                    {topThree[1].codingStats?.github?.avatarUrl ? (
                      <img src={topThree[1].codingStats.github.avatarUrl} alt="" className="podium-avatar" />
                    ) : (
                      <div className="podium-avatar initials">{topThree[1].name.slice(0, 2).toUpperCase()}</div>
                    )}
                  </div>
                  <h3 className="podium-name">{topThree[1].name}</h3>
                  <p className="podium-college">{topThree[1].college || 'No College'}</p>
                  
                  <div className="podium-score-row">
                    <div className="score-item">
                      <span className="score-lbl">Score</span>
                      <span className="score-val text-cyan">
                        {timeframe === 'week' ? topThree[1].weeklyScore : (timeframe === 'month' ? topThree[1].monthlyScore : topThree[1].totalScore)}
                      </span>
                    </div>
                    {topThree[1].streak > 0 && (
                      <div className="score-item">
                        <Flame size={12} className="streak-icon" />
                        <span className="score-val text-amber-500">{topThree[1].streak}</span>
                      </div>
                    )}
                  </div>
                  <div className="podium-badge rank-2-badge">Silver Tier</div>
                  {renderRankChange(1)}
                </motion.div>
              )}

              {/* 1st Place Card - Displayed in middle and styled larger */}
              {topThree[0] && (
                <motion.div 
                  className="podium-card first-place glass-panel"
                  onClick={() => navigate(`/profile?uid=${topThree[0].firebaseUid}`)}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  whileHover={{ y: -5 }}
                >
                  <Crown className="crown-icon" size={32} />
                  <div className="podium-rank">1</div>
                  <div className="podium-avatar-wrapper rank-1-border">
                    {topThree[0].codingStats?.github?.avatarUrl ? (
                      <img src={topThree[0].codingStats.github.avatarUrl} alt="" className="podium-avatar" />
                    ) : (
                      <div className="podium-avatar initials">{topThree[0].name.slice(0, 2).toUpperCase()}</div>
                    )}
                  </div>
                  <h3 className="podium-name">{topThree[0].name}</h3>
                  <p className="podium-college">{topThree[0].college || 'No College'}</p>
                  
                  <div className="podium-score-row">
                    <div className="score-item">
                      <span className="score-lbl">Score</span>
                      <span className="score-val text-cyan font-large">
                        {timeframe === 'week' ? topThree[0].weeklyScore : (timeframe === 'month' ? topThree[0].monthlyScore : topThree[0].totalScore)}
                      </span>
                    </div>
                    {topThree[0].streak > 0 && (
                      <div className="score-item">
                        <Flame size={14} className="streak-icon" />
                        <span className="score-val text-amber-500 font-large">{topThree[0].streak}</span>
                      </div>
                    )}
                  </div>
                  <div className="podium-badge rank-1-badge">Grand Master</div>
                  {renderRankChange(0)}
                </motion.div>
              )}

              {/* 3rd Place Card */}
              {topThree[2] && (
                <motion.div 
                  className="podium-card third-place glass-panel"
                  onClick={() => navigate(`/profile?uid=${topThree[2].firebaseUid}`)}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  whileHover={{ y: -5 }}
                >
                  <div className="podium-rank">3</div>
                  <div className="podium-avatar-wrapper rank-3-border">
                    {topThree[2].codingStats?.github?.avatarUrl ? (
                      <img src={topThree[2].codingStats.github.avatarUrl} alt="" className="podium-avatar" />
                    ) : (
                      <div className="podium-avatar initials">{topThree[2].name.slice(0, 2).toUpperCase()}</div>
                    )}
                  </div>
                  <h3 className="podium-name">{topThree[2].name}</h3>
                  <p className="podium-college">{topThree[2].college || 'No College'}</p>
                  
                  <div className="podium-score-row">
                    <div className="score-item">
                      <span className="score-lbl">Score</span>
                      <span className="score-val text-cyan">
                        {timeframe === 'week' ? topThree[2].weeklyScore : (timeframe === 'month' ? topThree[2].monthlyScore : topThree[2].totalScore)}
                      </span>
                    </div>
                    {topThree[2].streak > 0 && (
                      <div className="score-item">
                        <Flame size={12} className="streak-icon" />
                        <span className="score-val text-amber-500">{topThree[2].streak}</span>
                      </div>
                    )}
                  </div>
                  <div className="podium-badge rank-3-badge">Bronze Tier</div>
                  {renderRankChange(2)}
                </motion.div>
              )}
            </div>
          ) : (
            <div className="podium-empty glass-panel">
              <p>No podium contenders matching the active filters.</p>
            </div>
          )}
        </div>

        {/* Filter bar and controls */}
        <div className="filter-controls-container glass-panel">
          <div className="filter-main-row">
            
            {/* Search Input */}
            <div className="search-wrapper">
              <Search className="search-icon" size={16} />
              <input 
                type="text" 
                placeholder="Search candidates by name, college..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            {/* Dropdown Filters */}
            <div className="dropdowns-group">
              <div className="filter-select-wrapper">
                <Filter size={12} className="select-icon" />
                <select 
                  value={college} 
                  onChange={(e) => updateQueryParam('college', e.target.value, true)}
                >
                  <option value="all">All Colleges</option>
                  {filtersData.colleges.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="filter-select-wrapper">
                <select 
                  value={branch} 
                  onChange={(e) => updateQueryParam('branch', e.target.value, true)}
                >
                  <option value="all">All Branches</option>
                  {filtersData.branches.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="filter-select-wrapper">
                <select 
                  value={year} 
                  onChange={(e) => updateQueryParam('year', e.target.value, true)}
                >
                  <option value="all">All Years</option>
                  {filtersData.years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div className="filter-select-wrapper">
                <select 
                  value={batch} 
                  onChange={(e) => updateQueryParam('batch', e.target.value, true)}
                >
                  <option value="all">All Batches</option>
                  {filtersData.batches.map((bt) => (
                    <option key={bt} value={bt}>{bt}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Platform chips row */}
          <div className="platform-chips-row">
            <span className="chips-title">Platform:</span>
            <div className="chips-group">
              {['all', 'github', 'leetcode', 'codeforces', 'codechef', 'gfg'].map((p) => (
                <button
                  key={p}
                  className={`chip-btn ${platform === p ? 'active' : ''}`}
                  onClick={() => updateQueryParam('platform', p, true)}
                >
                  {p !== 'all' && <PlatformIcon platform={p} size={12} className="chip-plat-icon" />}
                  <span>{p === 'all' ? 'All Platforms' : (p === 'gfg' ? 'GeeksforGeeks' : p.charAt(0).toUpperCase() + p.slice(1))}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sorting configuration row */}
          <div className="sorting-row">
            <div className="sorting-group">
              <span className="sorting-title">Sort By:</span>
              <div className="sort-buttons">
                {[
                  { value: 'totalScore', label: 'Total Score' },
                  { value: 'problemsSolved', label: 'Problems Solved' },
                  { value: 'contestRating', label: 'Contest Rating' },
                  { value: 'streak', label: 'Streak' },
                  { value: 'weeklyScore', label: 'Weekly Score' }
                ].map((item) => (
                  <button
                    key={item.value}
                    className={`sort-btn ${sortBy === item.value ? 'active' : ''}`}
                    onClick={() => handleSortChange(item.value)}
                  >
                    <span>{item.label}</span>
                    {sortBy === item.value && (
                      sortOrder === 'desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <Button variant="secondary" onClick={toggleSortOrder} className="toggle-order-btn">
              {sortOrder === 'desc' ? 'High → Low' : 'Low → High'}
            </Button>
          </div>
        </div>

        {/* Main Leaderboard Table */}
        <div className="leaderboard-table-wrapper glass-panel">
          {loading ? (
            // Skeleton table
            <div className="loading-table-skeletons">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="table-row-skeleton"></div>
              ))}
            </div>
          ) : error ? (
            <div className="table-error-state">
              <p>{error}</p>
            </div>
          ) : users.length === 0 ? (
            <div className="table-empty-state">
              <p>No candidates found matching selected parameters.</p>
            </div>
          ) : (
            <div className="scrollable-table">
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th className="th-rank">Rank</th>
                    <th className="th-user">User</th>
                    <th>College</th>
                    <th>Branch</th>
                    <th className="text-center">Year</th>
                    <th className="text-right th-highlight">Total Score</th>
                    <th className="text-right">GitHub Score</th>
                    <th className="text-right">LeetCode Score</th>
                    <th className="text-right">Codeforces Rating</th>
                    <th className="text-right">CodeChef Rating</th>
                    <th className="text-center">Streak</th>
                    <th className="text-right">Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((item, index) => {
                    const globalRank = (page - 1) * limit + index + 1;
                    return (
                      <tr 
                        key={item.firebaseUid} 
                        onClick={() => navigate(`/profile?uid=${item.firebaseUid}`)}
                        className="table-row-interactive"
                      >
                        <td className="th-rank font-bold text-center">
                          <span className={`rank-number-badge ${globalRank === 1 ? 'gold' : (globalRank === 2 ? 'silver' : (globalRank === 3 ? 'bronze' : ''))}`}>
                            {globalRank}
                          </span>
                        </td>
                        <td className="th-user">
                          <div className="user-info-cell">
                            <div className="user-avatar-wrapper">
                              {item.codingStats?.github?.avatarUrl ? (
                                <img src={item.codingStats.github.avatarUrl} alt="" className="cell-avatar" />
                              ) : (
                                <div className="cell-avatar initials">{item.name.slice(0, 2).toUpperCase()}</div>
                              )}
                            </div>
                            <div>
                              <span className="user-cell-name">{item.name}</span>
                              <span className="user-cell-role">{item.role}</span>
                            </div>
                          </div>
                        </td>
                        <td className="text-truncate" style={{ maxWidth: '140px' }} title={item.college}>
                          {item.college || '—'}
                        </td>
                        <td>{item.branch || '—'}</td>
                        <td className="text-center">{item.year ? item.year.replace(' Year', '') : '—'}</td>
                        
                        <td className="text-right font-bold th-highlight text-cyan">
                          {timeframe === 'week' ? item.weeklyScore : (timeframe === 'month' ? item.monthlyScore : item.totalScore)}
                        </td>
                        
                        <td className="text-right">
                          <div className="plat-score-cell">
                            <PlatformIcon platform="github" size={10} className="plat-cell-icon" />
                            <span>{item.codingStats?.github?.score || 0}</span>
                          </div>
                        </td>
                        
                        <td className="text-right">
                          <div className="plat-score-cell">
                            <PlatformIcon platform="leetcode" size={10} className="plat-cell-icon" />
                            <span>{item.codingStats?.leetcode?.score || 0}</span>
                          </div>
                        </td>
                        
                        <td className="text-right">
                          <div className="plat-score-cell">
                            <PlatformIcon platform="codeforces" size={10} className="plat-cell-icon" />
                            <span>{item.codingStats?.codeforces?.currentRating || 0}</span>
                          </div>
                        </td>
                        
                        <td className="text-right">
                          <div className="plat-score-cell">
                            <PlatformIcon platform="codechef" size={10} className="plat-cell-icon" />
                            <span>{item.codingStats?.codechef?.rating || 0}</span>
                          </div>
                        </td>

                        <td className="text-center">
                          {item.streak > 0 ? (
                            <div className="streak-badge">
                              <Flame size={12} className="streak-badge-icon" />
                              <span>{item.streak}</span>
                            </div>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        
                        <td className="text-right text-muted text-small">
                          {item.lastActive ? new Date(item.lastActive).toLocaleDateString() : 'Offline'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination navigation controls */}
        {pagination.totalPages > 1 && !loading && (
          <div className="pagination-wrapper">
            <Button 
              variant="secondary" 
              onClick={() => updateQueryParam('page', page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft size={16} />
              <span>Prev</span>
            </Button>
            
            <div className="pagination-pages">
              {[...Array(pagination.totalPages)].map((_, i) => {
                const pg = i + 1;
                return (
                  <button
                    key={pg}
                    className={`page-num-btn ${page === pg ? 'active' : ''}`}
                    onClick={() => updateQueryParam('page', pg)}
                  >
                    {pg}
                  </button>
                );
              })}
            </div>

            <Button 
              variant="secondary" 
              onClick={() => updateQueryParam('page', page + 1)}
              disabled={page === pagination.totalPages}
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </Button>
          </div>
        )}

      </div>
    </motion.div>
  );
};

export default Leaderboard;
