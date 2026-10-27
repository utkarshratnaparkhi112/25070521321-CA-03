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
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3000);
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
      if (Array.isArray(data)) {
        setItems(data);
      }
    } catch (err) {
      triggerToast('Could not fetch data from backend', 'error');
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
      triggerToast(isLoginMode ? `Welcome back!` : 'Account successfully created!', 'success');
      setAuthForm({ name: '', email: '', password: '' });
    } catch (err) {
      setAuthError('Backend unreachable on port 5000. Ensure node server.js is running.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('flexi_user');
    setCurrentUser(null);
    setItems([]);
    triggerToast('Logged out successfully', 'info');
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
        triggerToast('Item updated successfully', 'success');
      } else {
        const res = await fetch(API_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const created = await res.json();
        setItems([created, ...items]);
        triggerToast('New item added to MongoDB', 'success');
      }
      closeModal();
    } catch (err) {
      triggerToast('Server request failed', 'error');
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems(items.filter((i) => i._id !== id));
        triggerToast('Item deleted from MongoDB', 'success');
      } else {
        triggerToast('Error deleting item', 'error');
      }
    } catch (err) {
      triggerToast('Server unreachable', 'error');
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
    <div style={styles.appShell}>
      {toast.show && (
        <div style={{ ...styles.toast, ...(toast.type === 'error' ? styles.toastError : styles.toastSuccess) }}>
          <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      <nav style={styles.navBar}>
        <div style={styles.brandGroup}>
          <div style={styles.logoBadge}>⚡</div>
          <div>
            <div style={styles.brandTitle}>FLEXI Enterprise Suite</div>
            <div style={styles.brandSub}>PRN: 25070521321 | Section C | Full-Stack MERN</div>
          </div>
        </div>

        {currentUser && (
          <div style={styles.userNav}>
            <div style={styles.avatar}>
              {(currentUser.name || currentUser.email || 'U')[0].toUpperCase()}
            </div>
            <div style={styles.userMeta}>
              <span style={styles.userName}>{currentUser.name || 'Admin'}</span>
              <span style={styles.userEmail}>{currentUser.email}</span>
            </div>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              Sign Out
            </button>
          </div>
        )}
      </nav>

      <main style={styles.mainContainer}>
        {!currentUser ? (
          <div style={styles.authWrapper}>
            <div style={styles.authCard}>
              <div style={styles.authHeader}>
                <div style={styles.authIconRing}>⚡</div>
                <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: '12px 0 6px 0' }}>
                  {isLoginMode ? 'Sign In to FLEXI' : 'Create an Account'}
                </h2>
                <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
                  {isLoginMode ? 'Enter credentials to manage database records' : 'Set up your credentials below'}
                </p>
              </div>

              {authError && <div style={styles.authErrorAlert}>{authError}</div>}

              <form onSubmit={handleAuth} style={styles.authForm}>
                {!isLoginMode && (
                  <div>
                    <label style={styles.label}>Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Utkarsh Ratnaparkhi"
                      value={authForm.name}
                      onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                      style={styles.textInput}
                    />
                  </div>
                )}

                <div>
                  <label style={styles.label}>Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="utkarsh@example.com"
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    style={styles.textInput}
                  />
                </div>

                <div>
                  <label style={styles.label}>Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    style={styles.textInput}
                  />
                </div>

                <button type="submit" disabled={authLoading} style={styles.primaryBtn}>
                  {authLoading ? 'Verifying...' : isLoginMode ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              <div style={styles.authToggle}>
                {isLoginMode ? "Need an account?" : 'Already registered?'}
                <button
                  type="button"
                  style={styles.textBtn}
                  onClick={() => {
                    setIsLoginMode(!isLoginMode);
                    setAuthError('');
                  }}
                >
                  {isLoginMode ? 'Register here' : 'Login here'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <section style={styles.metricsGrid}>
              <div style={styles.metricCard}>
                <div style={styles.metricLabel}>Total Items</div>
                <div style={styles.metricVal}>{stats.total}</div>
                <div style={styles.metricSub}>MongoDB synced</div>
              </div>
              <div style={styles.metricCard}>
                <div style={styles.metricLabel}>In Progress</div>
                <div style={{ ...styles.metricVal, color: '#f59e0b' }}>{stats.inProgress}</div>
                <div style={styles.metricSub}>Active items</div>
              </div>
              <div style={styles.metricCard}>
                <div style={styles.metricLabel}>Completed</div>
                <div style={{ ...styles.metricVal, color: '#10b981' }}>{stats.completed}</div>
                <div style={styles.metricSub}>Done</div>
              </div>
              <div style={styles.metricCard}>
                <div style={styles.metricLabel}>Progress</div>
                <div style={{ ...styles.metricVal, color: '#6366f1' }}>{stats.score}%</div>
                <div style={styles.progressBarBg}>
                  <div style={{ ...styles.progressBarFill, width: `${stats.score}%` }}></div>
                </div>
              </div>
            </section>

            <div style={styles.actionBar}>
              <div style={styles.searchGroup}>
                <input
                  type="text"
                  placeholder="🔍 Search items by title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={styles.searchInput}
                />

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  style={styles.dropdownInput}
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
                  style={styles.dropdownInput}
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <button onClick={openCreateModal} style={styles.actionAddBtn}>
                + Add New Item
              </button>
            </div>

            <div style={styles.tableCard}>
              <div style={styles.tableCardHeader}>
                <div style={{ fontWeight: '700', fontSize: '15px', color: '#1e293b' }}>
                  Live Compass Collection ({filteredItems.length})
                </div>
                <button onClick={fetchItems} style={styles.refreshIconBtn}>
                  🔄 Refresh
                </button>
              </div>

              {loadingItems ? (
                <div style={styles.loadingState}>Loading MongoDB collection...</div>
              ) : filteredItems.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>📦</div>
                  <div style={{ fontWeight: '600', color: '#334155' }}>No items found</div>
                  <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                    {searchQuery ? 'No match found for that search.' : 'Click "+ Add New Item" to create one.'}
                  </div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.trHead}>
                        <th style={styles.th}>Title</th>
                        <th style={styles.th}>Category</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Created</th>
                        <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item) => (
                        <tr key={item._id} style={styles.trRow}>
                          <td style={styles.tdTitle}>
                            <div style={{ fontWeight: '600', color: '#0f172a' }}>{item.title}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
                              {item._id}
                            </div>
                          </td>
                          <td style={styles.td}>
                            <span style={styles.catBadge}>{item.category || 'General'}</span>
                          </td>
                          <td style={styles.td}>
                            <span
                              style={{
                                ...styles.statusBadge,
                                ...(item.status === 'Completed'
                                  ? styles.statusCompleted
                                  : item.status === 'In Progress'
                                  ? styles.statusInProgress
                                  : styles.statusPending),
                              }}
                            >
                              {item.status || 'Pending'}
                            </span>
                          </td>
                          <td style={styles.tdDate}>
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

      {modalOpen && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                {editingItem ? 'Edit Document' : 'Create Document'}
              </h3>
              <button onClick={closeModal} style={styles.closeBtn}>✕</button>
            </div>

            <form onSubmit={handleSaveItem} style={styles.modalBody}>
              <div>
                <label style={styles.label}>Title</label>
                <input
                  type="text"
                  required
                  placeholder="Task or record title..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={styles.textInput}
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={styles.label}>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={styles.textInput}
                  >
                    <option value="Work">Work</option>
                    <option value="Academic">Academic</option>
                    <option value="General">General</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label style={styles.label}>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={styles.textInput}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" onClick={closeModal} style={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" style={styles.primaryBtn}>
                  {editingItem ? 'Save Changes' : 'Write to MongoDB'}
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
    backgroundColor: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
    color: '#1e293b',
  },
  navBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 28px',
    backgroundColor: '#0f172a',
    color: '#ffffff',
  },
  brandGroup: { display: 'flex', alignItems: 'center', gap: '12px' },
  logoBadge: {
    width: '36px',
    height: '36px',
    backgroundColor: '#2563eb',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  brandTitle: { fontSize: '17px', fontWeight: '700' },
  brandSub: { fontSize: '11px', color: '#94a3b8' },
  userNav: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#2563eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '13px',
    color: '#fff',
  },
  userMeta: { display: 'flex', flexDirection: 'column' },
  userName: { fontSize: '13px', fontWeight: '600' },
  userEmail: { fontSize: '11px', color: '#94a3b8' },
  logoutBtn: {
    background: '#1e293b',
    border: '1px solid #334155',
    color: '#f8fafc',
    padding: '5px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  mainContainer: { maxWidth: '1100px', margin: '24px auto', padding: '0 16px' },
  authWrapper: { display: 'flex', justifyContent: 'center', marginTop: '40px' },
  authCard: {
    width: '100%',
    maxWidth: '400px',
    background: '#ffffff',
    borderRadius: '12px',
    padding: '30px 24px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e2e8f0',
  },
  authHeader: { textAlign: 'center', marginBottom: '20px' },
  authIconRing: {
    width: '46px',
    height: '46px',
    margin: '0 auto',
    borderRadius: '50%',
    background: '#eff6ff',
    color: '#2563eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
  },
  authForm: { display: 'flex', flexDirection: 'column', gap: '14px' },
  authErrorAlert: {
    backgroundColor: '#fef2f2',
    color: '#b91c1c',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    border: '1px solid #fecaca',
    marginBottom: '10px',
  },
  label: { display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' },
  textInput: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '9px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    outline: 'none',
  },
  primaryBtn: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    padding: '10px 16px',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
  },
  authToggle: {
    textAlign: 'center',
    marginTop: '18px',
    fontSize: '13px',
    color: '#64748b',
  },
  textBtn: {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    fontWeight: '600',
    cursor: 'pointer',
    marginLeft: '6px',
    fontSize: '13px',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '14px',
    marginBottom: '20px',
  },
  metricCard: {
    background: '#ffffff',
    borderRadius: '10px',
    padding: '16px',
    border: '1px solid #e2e8f0',
  },
  metricLabel: { fontSize: '12px', color: '#64748b', fontWeight: '500' },
  metricVal: { fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: '4px 0 2px 0' },
  metricSub: { fontSize: '11px', color: '#94a3b8' },
  progressBarBg: {
    height: '6px',
    backgroundColor: '#e2e8f0',
    borderRadius: '4px',
    marginTop: '8px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: '4px',
  },
  actionBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '16px',
  },
  searchGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: '1',
    flexWrap: 'wrap',
  },
  searchInput: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    minWidth: '220px',
    outline: 'none',
  },
  dropdownInput: {
    padding: '8px 10px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    outline: 'none',
    backgroundColor: '#ffffff',
    color: '#334155',
  },
  actionAddBtn: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    padding: '9px 16px',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
  },
  tableCard: {
    background: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.03)',
    overflow: 'hidden',
  },
  tableCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 18px',
    borderBottom: '1px solid #f1f5f9',
  },
  refreshIconBtn: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    padding: '5px 10px',
    borderRadius: '5px',
    fontSize: '12px',
    cursor: 'pointer',
    color: '#475569',
  },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  trHead: { background: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '10px 18px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' },
  trRow: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px 18px', fontSize: '13px' },
  tdTitle: { padding: '12px 18px' },
  tdDate: { padding: '12px 18px', fontSize: '12px', color: '#64748b' },
  catBadge: {
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '500',
    background: '#e0e7ff',
    color: '#3730a3',
  },
  statusBadge: {
    padding: '3px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
  },
  statusCompleted: { background: '#dcfce7', color: '#15803d' },
  statusInProgress: { background: '#fef3c7', color: '#b45309' },
  statusPending: { background: '#f1f5f9', color: '#475569' },
  editBtn: {
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    color: '#1d4ed8',
    padding: '4px 10px',
    borderRadius: '5px',
    fontSize: '11px',
    fontWeight: '600',
    marginRight: '6px',
    cursor: 'pointer',
  },
  deleteBtn: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    padding: '4px 10px',
    borderRadius: '5px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  emptyState: { padding: '40px 16px', textAlign: 'center' },
  loadingState: { padding: '30px 16px', textAlign: 'center', color: '#64748b' },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalBox: {
    background: '#ffffff',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '460px',
    padding: '20px',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: '10px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    color: '#94a3b8',
  },
  modalBody: { display: 'flex', flexDirection: 'column', gap: '12px' },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '8px',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '12px',
  },
  cancelBtn: {
    background: '#f1f5f9',
    border: 'none',
    padding: '8px 14px',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '12px',
    color: '#475569',
    cursor: 'pointer',
  },
  toast: {
    position: 'fixed',
    top: '18px',
    right: '18px',
    zIndex: 1100,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    boxShadow: '0 8px 14px rgba(0,0,0,0.1)',
  },
  toastSuccess: { background: '#10b981', color: '#ffffff' },
  toastError: { background: '#ef4444', color: '#ffffff' },
};