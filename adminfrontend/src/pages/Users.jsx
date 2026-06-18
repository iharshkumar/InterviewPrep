import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Edit2, Trash2, ShieldAlert, X, Check, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null); // User currently being edited
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // User ID flagged for deletion
  const navigate = useNavigate();

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load users');
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  // Handle save edit details
  const handleEditSave = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/users/${selectedUser.firebaseUid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(selectedUser)
      });

      if (!response.ok) {
        throw new Error('Failed to update user details');
      }

      // Close modal and refresh users list
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      alert('Error updating user: ' + err.message);
    }
  };

  // Handle delete user
  const handleDeleteUser = async (uid) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/users/${uid}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      setShowDeleteConfirm(null);
      fetchUsers();
    } catch (err) {
      alert('Error deleting user: ' + err.message);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '30px', marginBottom: '8px' }}>
            Candidate Directory
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            Manage active profiles, adjust metrics/streaks, or review individual credentials.
          </p>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search candidates, college, branch..."
            className="glass-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: '40px' }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Retrieving active candidates...</p>
        </div>
      ) : error ? (
        <div className="glass-panel" style={{ padding: '24px', color: 'var(--color-danger)' }}>
          <p>Error: {error}</p>
        </div>
      ) : users.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p style={{ fontSize: '15px' }}>No candidates match your query.</p>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div className="table-container" style={{ marginTop: 0 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Candidate Name</th>
                  <th>Contact Email</th>
                  <th>College & Branch</th>
                  <th>Score (Tot/Wk)</th>
                  <th>Streak</th>
                  <th>Solved</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.firebaseUid}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{user.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Role: {user.role}</div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <div>{user.college || 'N/A'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-secondary)', marginTop: '2px' }}>{user.branch || 'Unspecified'}</div>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--color-secondary)' }}>{user.totalScore}</strong>
                      <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>/</span>
                      <span style={{ color: 'var(--color-success)', fontSize: '13px' }}>{user.weeklyScore}</span>
                    </td>
                    <td>🔥 {user.streak} days</td>
                    <td>{user.problemsSolved}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => setSelectedUser({ ...user })}
                          className="btn-secondary" 
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                          title="Edit details"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => navigate(`/performance?userUid=${user.firebaseUid}`)}
                          className="btn-secondary" 
                          style={{ padding: '6px 10px', fontSize: '12px', borderColor: 'rgba(6,182,212,0.3)', color: '#22D3EE' }}
                          title="View performance logs"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={() => setShowDeleteConfirm(user.firebaseUid)}
                          className="btn-secondary" 
                          style={{ padding: '6px 10px', fontSize: '12px', borderColor: 'rgba(239,68,68,0.3)', color: '#EF4444' }}
                          title="Delete user profile"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit User Modal Overlay */}
      <AnimatePresence>
        {selectedUser && (
          <div className="modal-overlay">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel modal-content"
              style={{ padding: '30px', background: '#120E22' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800 }}>Edit Candidate Credentials</h2>
                <button 
                  onClick={() => setSelectedUser(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleEditSave} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Form Group: Name & Email */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Full Name</label>
                    <input
                      type="text"
                      required
                      value={selectedUser.name || ''}
                      onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                      className="glass-input"
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Email Address</label>
                    <input
                      type="email"
                      required
                      value={selectedUser.email || ''}
                      onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                      className="glass-input"
                    />
                  </div>
                </div>

                {/* Form Group: Role & Experience */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Professional Role</label>
                    <input
                      type="text"
                      value={selectedUser.role || ''}
                      onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                      className="glass-input"
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Experience Level</label>
                    <select
                      value={selectedUser.experience || 'mid'}
                      onChange={(e) => setSelectedUser({ ...selectedUser, experience: e.target.value })}
                      className="glass-input glass-select"
                    >
                      <option value="entry">Entry Level</option>
                      <option value="mid">Mid Level</option>
                      <option value="senior">Senior Level</option>
                    </select>
                  </div>
                </div>

                {/* Form Group: College, Branch & Batch */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>College</label>
                    <input
                      type="text"
                      value={selectedUser.college || ''}
                      onChange={(e) => setSelectedUser({ ...selectedUser, college: e.target.value })}
                      className="glass-input"
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Branch</label>
                    <input
                      type="text"
                      value={selectedUser.branch || ''}
                      onChange={(e) => setSelectedUser({ ...selectedUser, branch: e.target.value })}
                      className="glass-input"
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Batch Year</label>
                    <input
                      type="text"
                      value={selectedUser.batch || ''}
                      onChange={(e) => setSelectedUser({ ...selectedUser, batch: e.target.value })}
                      className="glass-input"
                    />
                  </div>
                </div>

                {/* Form Group: Scores & Streak metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Score</label>
                    <input
                      type="number"
                      value={selectedUser.totalScore ?? 0}
                      onChange={(e) => setSelectedUser({ ...selectedUser, totalScore: parseInt(e.target.value) || 0 })}
                      className="glass-input"
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Weekly Score</label>
                    <input
                      type="number"
                      value={selectedUser.weeklyScore ?? 0}
                      onChange={(e) => setSelectedUser({ ...selectedUser, weeklyScore: parseInt(e.target.value) || 0 })}
                      className="glass-input"
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Streak (Days)</label>
                    <input
                      type="number"
                      value={selectedUser.streak ?? 0}
                      onChange={(e) => setSelectedUser({ ...selectedUser, streak: parseInt(e.target.value) || 0 })}
                      className="glass-input"
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Solved Problems</label>
                    <input
                      type="number"
                      value={selectedUser.problemsSolved ?? 0}
                      onChange={(e) => setSelectedUser({ ...selectedUser, problemsSolved: parseInt(e.target.value) || 0 })}
                      className="glass-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                  <button 
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="btn-primary"
                  >
                    <Check size={16} />
                    Save Adjustments
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal Overlay */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="modal-overlay">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel"
              style={{ width: '100%', maxWidth: '400px', padding: '30px', background: '#1C0E1C', border: '1px solid rgba(239,68,68,0.25)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#EF4444', marginBottom: '16px' }}>
                <ShieldAlert size={28} />
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700 }}>Confirm Profile Deletion</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5', marginBottom: '24px' }}>
                Are you sure you want to permanently delete this candidate? This action is irreversible and will delete all their simulated interview session records.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  onClick={() => setShowDeleteConfirm(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDeleteUser(showDeleteConfirm)}
                  className="btn-danger"
                >
                  Delete Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Users;
