import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api/flexi';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');

  const [items, setItems] = useState([]);
  const [itemForm, setItemForm] = useState({ title: '', category: 'General', status: 'Pending' });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');

  // Fetch all items when logged in
  useEffect(() => {
    if (currentUser) {
      fetchItems();
    }
  }, [currentUser]);

  const fetchItems = async () => {
    try {
      const res = await fetch(API_BASE);
      const data = await res.json();
      if (Array.isArray(data)) setItems(data);
    } catch (err) {
      console.error('Failed to fetch items:', err);
    }
  };

  // Auth Submit (Login / Signup)
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
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
        return;
      }

      setCurrentUser(data.user);
      setMessage(isLoginMode ? 'Welcome back!' : 'Registered successfully!');
    } catch (err) {
      setAuthError('Cannot reach server on port 5000. Is the backend running?');
    }
  };

  // Create or Update Item
  const handleItemSubmit = async (e) => {
    e.preventDefault();
    if (!itemForm.title.trim()) return;

    try {
      if (editingId) {
        // PUT update
        const res = await fetch(`${API_BASE}/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemForm),
        });
        const updated = await res.json();
        setItems(items.map((it) => (it._id === editingId ? updated : it)));
        setEditingId(null);
        setMessage('Item updated successfully');
      } else {
        // POST create
        const res = await fetch(API_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemForm),
        });
        const created = await res.json();
        setItems([created, ...items]);
        setMessage('Item added to MongoDB');
      }
      setItemForm({ title: '', category: 'General', status: 'Pending' });
    } catch (err) {
      setMessage('Operation failed. Check server console.');
    }
  };

  // Edit setup
  const startEdit = (item) => {
    setEditingId(item._id);
    setItemForm({ title: item.title, category: item.category, status: item.status });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setItemForm({ title: '', category: 'General', status: 'Pending' });
  };

  // Delete Item
  const handleDelete = async (id) => {
    try {
      await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      setItems(items.filter((it) => it._id !== id));
      setMessage('Item deleted from MongoDB');
    } catch (err) {
      setMessage('Failed to delete item.');
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div>
          <h1 style={{ margin: 0, fontSize: '26px' }}>⚡ FLEXI Management System</h1>
          <p style={{ margin: '4px 0 0 0', opacity: 0.8, fontSize: '14px' }}>
            PRN: 25070521321 | Section C | Full-Stack MERN
          </p>
        </div>
        {currentUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>👤 <strong>{currentUser.name || currentUser.email}</strong></span>
            <button
              style={styles.btnSecondary}
              onClick={() => {
                setCurrentUser(null);
                setItems([]);
              }}
            >
              Logout
            </button>
          </div>
        )}
      </header>

      {message && (
        <div style={styles.alertBar}>
          {message}
          <span style={{ cursor: 'pointer', float: 'right' }} onClick={() => setMessage('')}>×</span>
        </div>
      )}

      {/* Main Content Area */}
      {!currentUser ? (
        // AUTH VIEW (LOGIN / REGISTER)
        <div style={styles.card}>
          <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
            {isLoginMode ? 'Log In to FLEXI' : 'Create an Account'}
          </h2>

          {authError && <div style={styles.errorBox}>{authError}</div>}

          <form onSubmit={handleAuthSubmit} style={styles.form}>
            {!isLoginMode && (
              <input
                style={styles.input}
                type="text"
                placeholder="Full Name"
                required
                value={authForm.name}
                onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
              />
            )}
            <input
              style={styles.input}
              type="email"
              placeholder="Email Address"
              required
              value={authForm.email}
              onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
            />
            <input
              style={styles.input}
              type="password"
              placeholder="Password"
              required
              value={authForm.password}
              onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
            />
            <button style={styles.btnPrimary} type="submit">
              {isLoginMode ? 'Login' : 'Sign Up'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px' }}>
            {isLoginMode ? "Don't have an account? " : 'Already registered? '}
            <button
              style={styles.linkBtn}
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setAuthError('');
              }}
            >
              {isLoginMode ? 'Register here' : 'Login here'}
            </button>
          </p>
        </div>
      ) : (
        // CRUD DASHBOARD VIEW
        <div>
          {/* Create / Edit Form */}
          <div style={styles.card}>
            <h3>{editingId ? '✏️ Edit Record' : '➕ Add New Item'}</h3>
            <form onSubmit={handleItemSubmit} style={styles.crudForm}>
              <input
                style={{ ...styles.input, flex: 2 }}
                type="text"
                placeholder="Item Title / Task name"
                required
                value={itemForm.title}
                onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
              />
              <select
                style={{ ...styles.input, flex: 1 }}
                value={itemForm.category}
                onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
              >
                <option value="General">General</option>
                <option value="Work">Work</option>
                <option value="Academic">Academic</option>
                <option value="Urgent">Urgent</option>
              </select>
              <select
                style={{ ...styles.input, flex: 1 }}
                value={itemForm.status}
                onChange={(e) => setItemForm({ ...itemForm, status: e.target.value })}
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
              <button style={styles.btnPrimary} type="submit">
                {editingId ? 'Update' : 'Save'}
              </button>
              {editingId && (
                <button type="button" style={styles.btnSecondary} onClick={cancelEdit}>
                  Cancel
                </button>
              )}
            </form>
          </div>

          {/* Records Table */}
          <div style={styles.card}>
            <h3>📊 Records in MongoDB Compass ({items.length})</h3>
            {items.length === 0 ? (
              <p style={{ color: '#888' }}>No records found in database. Add one above!</p>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr style={{ background: '#f5f5f7', textAlign: 'left' }}>
                    <th style={styles.th}>Title</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item._id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={styles.td}><strong>{item.title}</strong></td>
                      <td style={styles.td}>
                        <span style={styles.badgeCategory}>{item.category || 'General'}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.badgeStatus(item.status)}>{item.status || 'Pending'}</span>
                      </td>
                      <td style={styles.td}>
                        <button style={styles.btnEdit} onClick={() => startEdit(item)}>Edit</button>
                        <button style={styles.btnDelete} onClick={() => handleDelete(item._id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '900px',
    margin: '30px auto',
    padding: '0 20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#333',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#1f2937',
    color: '#fff',
    padding: '20px 24px',
    borderRadius: '10px',
    marginBottom: '20px',
  },
  card: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    padding: '24px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '14px' },
  crudForm: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  input: {
    padding: '10px 14px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '15px',
    outline: 'none',
  },
  btnPrimary: {
    background: '#2563eb',
    color: '#fff',
    padding: '10px 18px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  btnSecondary: {
    background: '#4b5563',
    color: '#fff',
    padding: '8px 14px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  btnEdit: {
    background: '#e0e7ff',
    color: '#3730a3',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    marginRight: '8px',
    cursor: 'pointer',
  },
  btnDelete: {
    background: '#fee2e2',
    color: '#991b1b',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    cursor: 'pointer',
    fontWeight: '600',
    padding: 0,
  },
  alertBar: {
    background: '#dcfce7',
    color: '#166534',
    padding: '12px 18px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #bbf7d0',
  },
  errorBox: {
    background: '#fee2e2',
    color: '#991b1b',
    padding: '10px 14px',
    borderRadius: '6px',
    marginBottom: '14px',
  },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '12px' },
  th: { padding: '12px', fontSize: '14px', fontWeight: '600', color: '#4b5563' },
  td: { padding: '12px', fontSize: '14px' },
  badgeCategory: {
    background: '#f3f4f6',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
  },
  badgeStatus: (status) => ({
    background: status === 'Completed' ? '#dcfce7' : status === 'In Progress' ? '#fef3c7' : '#f3f4f6',
    color: status === 'Completed' ? '#166534' : status === 'In Progress' ? '#92400e' : '#374151',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
  }),
};