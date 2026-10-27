import React, { useState, useEffect, useMemo } from 'react';

const API_BASE = 'http://localhost:5000/api/flexi';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('flexi_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ title: '', category: 'Work', status: 'Pending' });

  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  const triggerToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3200);
  };

  useEffect(() => {
    if (currentUser) {
      fetchItems();
    }
  }, [currentUser]);

  const fetchItems = async () => {
    setLoadingItems(true);
    try {
      const res = await fetch(API_BASE);
      const data = await res.json();
      if (Array.isArray(data)) setItems(data);
    } catch (err) {
      triggerToast('Could not fetch documents from backend', 'error');
    } finally {
      setLoadingItems(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    const endpoint = isLoginMode ? `${API_BASE}/login` : `${API_BASE}/signup`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm),
      });

      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error || 'Authentication failed');
        setAuthLoading(false);
        return;
      }

      setCurrentUser(data.user);
      localStorage.setItem('flexi_user', JSON.stringify(data.user));
      triggerToast(isLoginMode ? `Authenticated as ${data.user.name || 'User'}` : 'Workspace account activated', 'success');
      setAuthForm({ name: '', email: '', password: '' });
    } catch (err) {
      setAuthError('Backend cluster offline on port 5000. Start server.js first.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('flexi_user');
    setCurrentUser(null);
    setItems([]);
    triggerToast('Session terminated', 'info');
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({ title: '', category: 'Work', status: 'Pending' });
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({ title: item.title, category: item.category || 'General', status: item.status || 'Pending' });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      if (editingItem) {
        const res = await fetch(`${API_BASE}/${editingItem._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const updated = await res.json();
        setItems(items.map((i) => (i._id === editingItem._id ? updated : i)));
        triggerToast('Record modified and synced', 'success');
      } else {
        const res = await fetch(API_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const created = await res.json();
        setItems([created, ...items]);
        triggerToast('Document written to MongoDB', 'success');
      }
      closeModal();
    } catch (err) {
      triggerToast('I/O error during persistence', 'error');
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Permanently delete this MongoDB document?')) return;
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems(items.filter((i) => i._id !== id));
        triggerToast('Document removed from cluster', 'success');
      } else {
        triggerToast('Failed to drop record', 'error');
      }
    } catch (err) {
      triggerToast('Server offline', 'error');
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const titleMatch = item.title ? item.title.toLowerCase().includes(searchQuery.toLowerCase()) : false;
      const catMatch = filterCategory === 'All' || item.category === filterCategory;
      const statusMatch = filterStatus === 'All' || item.status === filterStatus;
      return titleMatch && catMatch && statusMatch;
    });
  }, [items, searchQuery, filterCategory, filterStatus]);

  const stats = useMemo(() => {
    const total = items.length;
    const completed = items.filter((i) => i.status === 'Completed').length;
    const inProgress = items.filter((i) => i.status === 'In Progress').length;
    const pending = items.filter((i) => i.status === 'Pending').length;
    const score = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, pending, score };
  }, [items]);

  return (
    <div className="flexi-root" style={styles.appShell}>
      {/* Dynamic Keyframe & Reset Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background-color: #0b0f17; }
        .flexi-root { font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; }
        .kpi-hover { transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease; }
        .kpi-hover:hover { transform: translateY(-2px); border-color: rgba(255,255,255,0.18) !important; box-shadow: 0 12px 30px -10px rgba(0,0,0,0.5) !important; }
        .row-hover { transition: background 0.15s ease; }
        .row-hover:hover { background-color: rgba(255, 255, 255, 0.02) !important; }
        .custom-select {
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 10px center;
          background-size: 14px;
          padding-right: 32px !important;
        }
        @keyframes pulseDot {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.6); }
          70% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        .pulse-live { animation: pulseDot 2s infinite cubic-bezier(0.4, 0, 0.6, 1); }
      `}</style>

      {/* Floating Modern Toast */}
      {toast.show && (
        <div style={{ ...styles.toast, ...(toast.type === 'error' ? styles.toastError : styles.toastSuccess) }}>
          <div style={styles.toastIcon}>
            {toast.type === 'error' ? '✕' : '✓'}
          </div>
          <span style={{ fontSize: '13px', fontWeight: '500' }}>{toast.message}</span>
        </div>
      )}

      {/* Glass Top Navigation */}
      <header style={styles.navBar}>
        <div style={styles.navInner}>
          <div style={styles.brandGroup}>
            <div style={styles.logoMark}>
              <span style={{ transform: 'translateY(-1px)' }}>⚡</span>
            </div>
            <div>
              <div style={styles.brandText}>
                FLEXI <span style={styles.brandBadge}>PRO</span>
              </div>
              <div style={styles.brandSub}>PRN: 25070521321 • Sec C • MongoDB Cloud Node</div>
            </div>
          </div>

          {currentUser ? (
            <div style={styles.userNav}>
              <div style={styles.mongoStatusTag}>
                <span className="pulse-live" style={styles.mongoStatusDot} />
                <span>Compass 27017 Active</span>
              </div>
              <div style={styles.userDivider} />
              <div style={styles.userProfile}>
                <div style={styles.userAvatar}>
                  {(currentUser.name || currentUser.email || 'U')[0].toUpperCase()}
                </div>
                <div style={styles.userInfoCol}>
                  <span style={styles.userNameText}>{currentUser.name || 'Utkarsh'}</span>
                  <span style={styles.userEmailText}>{currentUser.email}</span>
                </div>
              </div>
              <button onClick={handleLogout} style={styles.signOutBtn}>
                Sign Out
              </button>
            </div>
          ) : (
            <div style={styles.mongoStatusTag}>
              <span className="pulse-live" style={styles.mongoStatusDot} />
              <span>Engine Ready</span>
            </div>
          )}
        </div>
      </header>

      {/* Main App Workspace */}
      <main style={styles.mainContainer}>
        {!currentUser ? (
          /* Authentication View */
          <div style={styles.authWrapper}>
            <div style={styles.authCard}>
              <div style={styles.authHeader}>
                <div style={styles.authIconRing}>⚡</div>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#f8fafc', margin: '14px 0 6px 0' }}>
                  {isLoginMode ? 'Access Workspace' : 'Create Workspace Account'}
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
                  {isLoginMode ? 'Authenticate to manage your MongoDB collections' : 'Configure credentials for local database interaction'}
                </p>
              </div>

              {authError && <div style={styles.authErrorAlert}>{authError}</div>}

              <form onSubmit={handleAuth} style={styles.authForm}>
                {!isLoginMode && (
                  <div>
                    <label style={styles.fieldLabel}>FULL NAME</label>
                    <input
                      type="text"
                      required
                      placeholder="Utkarsh Ratnaparkhi"
                      value={authForm.name}
                      onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                      style={styles.textInput}
                    />
                  </div>
                )}

                <div>
                  <label style={styles.fieldLabel}>EMAIL ADDRESS</label>
                  <input
                    type="email"
                    required
                    placeholder="utkarsh@domain.com"
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    style={styles.textInput}
                  />
                </div>

                <div>
                  <label style={styles.fieldLabel}>PASSWORD</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    style={styles.textInput}
                  />
                </div>

                <button type="submit" disabled={authLoading} style={styles.primaryAuthBtn}>
                  {authLoading ? 'Verifying Cluster...' : isLoginMode ? 'Authenticate Session' : 'Register Account'}
                </button>
              </form>

              <div style={styles.authToggle}>
                <span style={{ color: '#64748b' }}>
                  {isLoginMode ? "Need to create a new user?" : 'Already registered?'}
                </span>
                <button
                  type="button"
                  style={styles.authToggleBtn}
                  onClick={() => {
                    setIsLoginMode(!isLoginMode);
                    setAuthError('');
                  }}
                >
                  {isLoginMode ? 'Register here' : 'Sign in'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* High-End Enterprise Dashboard */
          <div>
            {/* KPI Overview Strip */}
            <div style={styles.kpiGrid}>
              <div className="kpi-hover" style={styles.kpiCard}>
                <div style={styles.kpiCardTop}>
                  <span style={styles.kpiCardTitle}>TOTAL PERSISTED</span>
                  <div style={{ ...styles.kpiBadge, background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa' }}>DB</div>
                </div>
                <div style={styles.kpiValue}>{stats.total}</div>
                <div style={styles.kpiCaption}>Documents in Compass</div>
              </div>

              <div className="kpi-hover" style={styles.kpiCard}>
                <div style={styles.kpiCardTop}>
                  <span style={styles.kpiCardTitle}>ACTIVE PIPELINE</span>
                  <div style={{ ...styles.kpiBadge, background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24' }}>RUN</div>
                </div>
                <div style={{ ...styles.kpiValue, color: '#fbbf24' }}>{stats.inProgress}</div>
                <div style={styles.kpiCaption}>Pending final review</div>
              </div>

              <div className="kpi-hover" style={styles.kpiCard}>
                <div style={styles.kpiCardTop}>
                  <span style={styles.kpiCardTitle}>COMPLETED</span>
                  <div style={{ ...styles.kpiBadge, background: 'rgba(34, 197, 94, 0.1)', color: '#4ade80' }}>DONE</div>
                </div>
                <div style={{ ...styles.kpiValue, color: '#4ade80' }}>{stats.completed}</div>
                <div style={styles.kpiCaption}>Verified operations</div>
              </div>

              <div className="kpi-hover" style={styles.kpiCard}>
                <div style={styles.kpiCardTop}>
                  <span style={styles.kpiCardTitle}>COMPLETION RATE</span>
                  <div style={{ ...styles.kpiBadge, background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8' }}>KPI</div>
                </div>
                <div style={{ ...styles.kpiValue, color: '#818cf8' }}>{stats.score}%</div>
                <div style={styles.metricTrack}>
                  <div style={{ ...styles.metricTrackFill, width: `${stats.score}%` }} />
                </div>
              </div>
            </div>

            {/* Filter & Command Header */}
            <div style={styles.commandBar}>
              <div style={styles.searchCluster}>
                <div style={styles.searchWrapper}>
                  <span style={styles.searchPrefix}>⌕</span>
                  <input
                    type="text"
                    placeholder="Search collection records..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={styles.searchInput}
                  />
                </div>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="custom-select"
                  style={styles.minimalSelect}
                >
                  <option value="All">All Categories</option>
                  <option value="Work">Work</option>
                  <option value="Academic">Academic</option>
                  <option value="General">General</option>
                  <option value="Urgent">Urgent</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="custom-select"
                  style={styles.minimalSelect}
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <button onClick={openCreateModal} style={styles.addRecordBtn}>
                <span style={{ fontSize: '15px' }}>+</span> Write Document
              </button>
            </div>

            {/* Premium Table Card */}
            <div style={styles.tablePanel}>
              <div style={styles.tablePanelHeader}>
                <div style={styles.tablePanelHeading}>
                  <span>Live Collection: <code>flexiitems</code></span>
                  <span style={styles.recordCounter}>{filteredItems.length} records</span>
                </div>
                <button onClick={fetchItems} style={styles.syncBtn}>
                  <span>↻</span> Sync
                </button>
              </div>

              {loadingItems ? (
                <div style={styles.emptyState}>Querying MongoDB database...</div>
              ) : filteredItems.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={{ fontSize: '32px', marginBottom: '10px' }}>📦</div>
                  <div style={{ fontWeight: '600', color: '#f1f5f9', fontSize: '15px' }}>No records found</div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                    {searchQuery ? 'Adjust your search queries or active filters.' : 'Click "Write Document" above to insert your first record.'}
                  </div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>RECORD / OBJECT ID</th>
                        <th style={styles.th}>CATEGORY</th>
                        <th style={styles.th}>EXECUTION STATUS</th>
                        <th style={styles.th}>TIMESTAMP</th>
                        <th style={{ ...styles.th, textAlign: 'right' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item) => (
                        <tr key={item._id} className="row-hover" style={styles.tr}>
                          <td style={styles.td}>
                            <div style={styles.recordTitle}>{item.title}</div>
                            <div style={styles.objectIdTag}>{item._id}</div>
                          </td>
                          <td style={styles.td}>
                            <span style={styles.categoryPill}>{item.category || 'General'}</span>
                          </td>
                          <td style={styles.td}>
                            <span
                              style={{
                                ...styles.statusPill,
                                ...(item.status === 'Completed'
                                  ? styles.pillCompleted
                                  : item.status === 'In Progress'
                                  ? styles.pillProgress
                                  : styles.pillPending),
                              }}
                            >
                              <span
                                style={{
                                  ...styles.statusDot,
                                  backgroundColor:
                                    item.status === 'Completed'
                                      ? '#22c55e'
                                      : item.status === 'In Progress'
                                      ? '#f59e0b'
                                      : '#64748b',
                                }}
                              />
                              {item.status || 'Pending'}
                            </span>
                          </td>
                          <td style={{ ...styles.td, color: '#64748b', fontSize: '13px' }}>
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Today'}
                          </td>
                          <td style={{ ...styles.td, textAlign: 'right' }}>
                            <button onClick={() => openEditModal(item)} style={styles.editBtn}>
                              Edit
                            </button>
                            <button onClick={() => handleDeleteItem(item._id)} style={styles.deleteBtn}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Glassmorphic Modal Dialog */}
      {modalOpen && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTop}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#f8fafc' }}>
                  {editingItem ? 'Edit Document' : 'Insert Document'}
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Target: <code>flexi_db.flexiitems</code>
                </div>
              </div>
              <button onClick={closeModal} style={styles.modalCloseBtn}>✕</button>
            </div>

            <form onSubmit={handleSaveItem} style={styles.modalForm}>
              <div>
                <label style={styles.fieldLabel}>TITLE OR DESCRIPTION</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement JWT authentication layer"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={styles.textInput}
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={styles.fieldLabel}>CATEGORY</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="custom-select"
                    style={styles.textInput}
                  >
                    <option value="Work">Work</option>
                    <option value="Academic">Academic</option>
                    <option value="General">General</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label style={styles.fieldLabel}>EXECUTION STATUS</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="custom-select"
                    style={styles.textInput}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={closeModal} style={styles.modalCancelBtn}>
                  Cancel
                </button>
                <button type="submit" style={styles.modalSubmitBtn}>
                  {editingItem ? 'Commit Changes' : 'Write Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  appShell: {
    minHeight: '100vh',
    backgroundColor: '#090d16',
    color: '#f8fafc',
    paddingBottom: '60px',
  },
  navBar: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  navInner: {
    maxWidth: '1160px',
    margin: '0 auto',
    padding: '14px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandGroup: { display: 'flex', alignItems: 'center', gap: '12px' },
  logoMark: {
    width: '36px',
    height: '36px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: 'bold',
    boxShadow: '0 0 20px rgba(59, 130, 246, 0.35)',
  },
  brandText: { fontSize: '16px', fontWeight: '800', letterSpacing: '-0.3px', color: '#ffffff' },
  brandBadge: {
    fontSize: '10px',
    fontWeight: '700',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    color: '#60a5fa',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '4px',
    padding: '2px 5px',
    marginLeft: '6px',
    letterSpacing: '0.5px',
  },
  brandSub: { fontSize: '11px', color: '#64748b', marginTop: '2px' },
  userNav: { display: 'flex', alignItems: 'center', gap: '14px' },
  mongoStatusTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(34, 197, 94, 0.08)',
    border: '1px solid rgba(34, 197, 94, 0.2)',
    padding: '5px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#4ade80',
  },
  mongoStatusDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: '#22c55e',
  },
  userDivider: { width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.08)' },
  userProfile: { display: 'flex', alignItems: 'center', gap: '10px' },
  userAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #1e293b, #0f172a)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: '700',
    color: '#60a5fa',
  },
  userInfoCol: { display: 'flex', flexDirection: 'column' },
  userNameText: { fontSize: '13px', fontWeight: '600', color: '#f1f5f9' },
  userEmailText: { fontSize: '11px', color: '#64748b' },
  signOutBtn: {
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: '#cbd5e1',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  mainContainer: { maxWidth: '1160px', margin: '28px auto', padding: '0 24px' },
  authWrapper: { display: 'flex', justifyContent: 'center', marginTop: '40px' },
  authCard: {
    width: '100%',
    maxWidth: '400px',
    background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
    backdropFilter: 'blur(16px)',
    borderRadius: '16px',
    padding: '36px 30px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  },
  authHeader: { textAlign: 'center', marginBottom: '24px' },
  authIconRing: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.25)',
    color: '#60a5fa',
    fontSize: '22px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
  },
  authForm: { display: 'flex', flexDirection: 'column', gap: '16px' },
  authErrorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    color: '#f87171',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '12px',
    marginBottom: '8px',
  },
  fieldLabel: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.6px',
    color: '#94a3b8',
    marginBottom: '6px',
  },
  textInput: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#ffffff',
    fontSize: '13px',
    outline: 'none',
  },
  primaryAuthBtn: {
    marginTop: '6px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    color: '#ffffff',
    border: 'none',
    padding: '11px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.35)',
  },
  authToggle: { textAlign: 'center', marginTop: '20px', fontSize: '13px' },
  authToggleBtn: {
    background: 'none',
    border: 'none',
    color: '#60a5fa',
    fontWeight: '600',
    cursor: 'pointer',
    marginLeft: '6px',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  kpiCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    border: '1px solid rgba(255, 255, 255, 0.07)',
    borderRadius: '14px',
    padding: '20px',
    backdropFilter: 'blur(12px)',
  },
  kpiCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  kpiCardTitle: { fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.6px' },
  kpiBadge: { padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '700' },
  kpiValue: { fontSize: '32px', fontWeight: '800', color: '#f8fafc', margin: '8px 0 4px 0', letterSpacing: '-1px' },
  kpiCaption: { fontSize: '12px', color: '#64748b' },
  metricTrack: {
    height: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: '4px',
    marginTop: '10px',
    overflow: 'hidden',
  },
  metricTrackFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #6366f1, #818cf8)',
    borderRadius: '4px',
  },
  commandBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  searchCluster: { display: 'flex', alignItems: 'center', gap: '10px', flex: '1', flexWrap: 'wrap' },
  searchWrapper: { position: 'relative', flex: '1', minWidth: '240px' },
  searchPrefix: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#64748b',
    fontSize: '16px',
  },
  searchInput: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '8px',
    padding: '9px 12px 9px 34px',
    color: '#f8fafc',
    fontSize: '13px',
    outline: 'none',
  },
  minimalSelect: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '8px',
    padding: '9px 12px',
    color: '#cbd5e1',
    fontSize: '13px',
    outline: 'none',
    cursor: 'pointer',
  },
  addRecordBtn: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    color: '#ffffff',
    border: 'none',
    padding: '9px 18px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '13px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
  },
  tablePanel: {
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    border: '1px solid rgba(255, 255, 255, 0.07)',
    borderRadius: '14px',
    backdropFilter: 'blur(12px)',
    overflow: 'hidden',
  },
  tablePanelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
  },
  tablePanelHeading: { fontSize: '13px', fontWeight: '600', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' },
  recordCounter: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    color: '#94a3b8',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
  },
  syncBtn: {
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '5px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#cbd5e1',
    cursor: 'pointer',
  },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  th: {
    padding: '12px 20px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: '0.6px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
  },
  tr: { borderBottom: '1px solid rgba(255, 255, 255, 0.04)' },
  td: { padding: '16px 20px', fontSize: '13px' },
  recordTitle: { fontWeight: '600', color: '#f8fafc', fontSize: '14px' },
  objectIdTag: { fontSize: '11px', color: '#64748b', fontFamily: 'monospace', marginTop: '2px' },
  categoryPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    color: '#cbd5e1',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  statusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '600',
  },
  statusDot: { width: '6px', height: '6px', borderRadius: '50%' },
  pillCompleted: { backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.2)' },
  pillProgress: { backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.2)' },
  pillPending: { backgroundColor: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.2)' },
  editBtn: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.25)',
    color: '#60a5fa',
    padding: '5px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    marginRight: '8px',
    cursor: 'pointer',
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    color: '#f87171',
    padding: '5px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  emptyState: { padding: '60px 20px', textAlign: 'center' },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(3, 7, 18, 0.8)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalBox: {
    backgroundColor: '#0f172a',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '460px',
    padding: '24px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
  },
  modalTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '18px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '14px',
  },
  modalCloseBtn: { background: 'none', border: 'none', fontSize: '16px', color: '#64748b', cursor: 'pointer' },
  modalForm: { display: 'flex', flexDirection: 'column', gap: '14px' },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '10px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    paddingTop: '16px',
  },
  modalCancelBtn: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '9px 16px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '13px',
    color: '#94a3b8',
    cursor: 'pointer',
  },
  modalSubmitBtn: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    border: 'none',
    color: '#ffffff',
    padding: '9px 18px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.35)',
  },
  toast: {
    position: 'fixed',
    top: '20px',
    right: '24px',
    zIndex: 1100,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 16px',
    borderRadius: '10px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(16px)',
  },
  toastIcon: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  toastSuccess: {
    background: 'rgba(15, 23, 42, 0.9)',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    color: '#4ade80',
  },
  toastError: {
    background: 'rgba(15, 23, 42, 0.9)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#f87171',
  },
};