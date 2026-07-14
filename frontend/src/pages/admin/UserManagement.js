// src/pages/admin/UserManagement.js

import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import './UserManagement.css';
import { apiCall, getRolePrefix } from '../../utils/api';

// ── Static fallback data ─────────────────────────────────────────
const ALL_ROLES = ['Executive', 'Manager', 'Admin', 'Viewer', 'Team Leader'];

const mapRoleName = (roleVal) => {
  if (!roleVal) return 'Executive';
  const match = ALL_ROLES.find(r => r.toLowerCase() === roleVal.toLowerCase());
  return match || (roleVal.charAt(0).toUpperCase() + roleVal.slice(1));
};

/* ─── Overlay wrapper ───────────────────────────────────────────── */
const Modal = ({ onClose, children }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-box" onClick={e => e.stopPropagation()}>
      {children}
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════════
   0. ADD NEW USER
══════════════════════════════════════════════════════════════════ */
const AddUserModal = ({ onClose, onAdd, shifts }) => {
  const [form, setForm] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'executive',
    shiftId: '',
    timezone: 'Asia/Kolkata',
    top: false,
    calendar: false,
    active: true,
  });
  const [errors, setErrors] = useState({});

  const set = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.id.trim()) e.id = 'ID is required.';
    if (!form.name.trim()) e.name = 'Name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email.';
    return e;
  };

  const handleCreate = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onAdd({
      id: form.id.trim(),
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || '-',
      password: form.password || 'Welcome@123',
      role: form.role,
      shiftId: form.shiftId || null,
      top: form.top,
      calendar: form.calendar,
      active: form.active,
    });
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="modal-title">Add New User</h2>

      {/* ID */}
      <div className="form-group">
        <label className="form-label">ID <span className="req">*</span></label>
        <input
          className="form-input"
          placeholder="e.g. EMP006"
          value={form.id}
          onChange={e => set('id', e.target.value)}
        />
        {errors.id && <p className="form-error">{errors.id}</p>}
      </div>

      {/* Name */}
      <div className="form-group">
        <label className="form-label">Name <span className="req">*</span></label>
        <input
          className="form-input"
          value={form.name}
          onChange={e => set('name', e.target.value)}
        />
        {errors.name && <p className="form-error">{errors.name}</p>}
      </div>

      {/* Email */}
      <div className="form-group">
        <label className="form-label">Email <span className="req">*</span></label>
        <input
          className="form-input"
          value={form.email}
          onChange={e => set('email', e.target.value)}
        />
        {errors.email && <p className="form-error">{errors.email}</p>}
      </div>

      {/* Phone */}
      <div className="form-group">
        <label className="form-label">Phone Number</label>
        <input
          className="form-input"
          placeholder="+91 1234567890"
          value={form.phone}
          onChange={e => set('phone', e.target.value)}
        />
      </div>

      {/* Password */}
      <div className="form-group">
        <label className="form-label">Password</label>
        <input
          type="password"
          className="form-input"
          placeholder="Default: Welcome@123"
          value={form.password}
          onChange={e => set('password', e.target.value)}
        />
      </div>

      {/* Profile Photo */}
      <div className="form-group">
        <label className="form-label">Profile Photo</label>
        <input type="file" className="form-input file-input" accept="image/*" />
      </div>

      {/* Role */}
      <div className="form-group">
        <label className="form-label">Role</label>
        <select
          className="form-select"
          value={form.role}
          onChange={e => set('role', e.target.value)}
        >
          {ALL_ROLES.map(r => (
            <option key={r} value={r.toLowerCase()}>{r}</option>
          ))}
        </select>
      </div>

      {/* Shift */}
      <div className="form-group">
        <label className="form-label">Shift</label>
        <select
          className="form-select"
          value={form.shiftId}
          onChange={e => set('shiftId', e.target.value)}
        >
          <option value="">Select Shift</option>
          {shifts.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <p className="form-hint">
          Set the employee's default shift. This will be used automatically when they start tracking time.
        </p>
      </div>

      {/* Timezone */}
      <div className="form-group">
        <label className="form-label">Timezone</label>
        <input
          className="form-input"
          value={form.timezone}
          onChange={e => set('timezone', e.target.value)}
        />
      </div>

      {/* Top Performer */}
      <div className="form-check-group">
        <label className="check-label">
          <input
            type="checkbox"
            checked={form.top}
            onChange={e => set('top', e.target.checked)}
          />
          ⭐ Mark as Top Performer
        </label>
        <p className="form-hint">Top performers will be displayed on the login page.</p>
      </div>

      {/* Calendar Stats */}
      <div className="form-check-group">
        <label className="check-label">
          <input
            type="checkbox"
            checked={form.calendar}
            onChange={e => set('calendar', e.target.checked)}
          />
          Show Calendar Statistics (Weekly/Monthly)
        </label>
        <p className="form-hint">
          Allow this employee to view weekly and monthly calendar statistics in the employee portal.
        </p>
      </div>

      {/* KYC Documents */}
      <div className="form-group">
        <label className="form-label">Onboarding/KYC Documents</label>
        <input type="file" className="form-input file-input" multiple />
      </div>

      {/* Active */}
      <div className="form-check-group">
        <label className="check-label">
          <input
            type="checkbox"
            checked={form.active}
            onChange={e => set('active', e.target.checked)}
          />
          Active
        </label>
        <p className="form-hint">New users are active by default. Uncheck to create an inactive user.</p>
      </div>

      {/* Footer */}
      <div className="modal-actions">
        <button className="btn-cancel" onClick={onClose}>Cancel</button>
        <button className="btn-primary-modal" onClick={handleCreate}>Create</button>
      </div>
    </Modal>
  );
};

/* ══════════════════════════════════════════════════════════════════
   1. ASSIGN PROJECT & PROCESS
══════════════════════════════════════════════════════════════════ */
const AssignProjectModal = ({ user, onClose, projects, processes, onSave }) => {
  const [selProjects, setSelProjects] = useState([]);
  const [selProcesses, setSelProcesses] = useState([]);

  const toggle = (arr, setArr, val) =>
    setArr(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);

  const selectAll = (list, setArr) =>
    setArr(prev => prev.length === list.length ? [] : list.map(i => i.id));

  const handleSave = () => {
    onSave(user.id, selProjects, selProcesses);
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="modal-title">Assign Projects &amp; Processes to {user.name}</h2>

      <div className="assign-columns">
        <div className="assign-col">
          <div className="assign-col-header">
            <span className="assign-col-icon">📁</span>
            <strong>Projects</strong>
          </div>
          <div className="assign-list">
            <label className="assign-check select-all">
              <input
                type="checkbox"
                checked={selProjects.length === projects.length && projects.length > 0}
                onChange={() => selectAll(projects, setSelProjects)}
              />
              Select All ({selProjects.length}/{projects.length})
            </label>
            {projects.map(p => (
              <label key={p.id} className="assign-check">
                <input
                  type="checkbox"
                  checked={selProjects.includes(p.id)}
                  onChange={() => toggle(selProjects, setSelProjects, p.id)}
                />
                {p.name}
              </label>
            ))}
          </div>
        </div>

        <div className="assign-col">
          <div className="assign-col-header">
            <span className="assign-col-icon">⚙️</span>
            <strong>Processes</strong>
          </div>
          <div className="assign-list">
            <label className="assign-check select-all">
              <input
                type="checkbox"
                checked={selProcesses.length === processes.length && processes.length > 0}
                onChange={() => selectAll(processes, setSelProcesses)}
              />
              Select All ({selProcesses.length}/{processes.length})
            </label>
            {processes.map(p => (
              <label key={p.id} className="assign-check">
                <input
                  type="checkbox"
                  checked={selProcesses.includes(p.id)}
                  onChange={() => toggle(selProcesses, setSelProcesses, p.id)}
                />
                {p.name}
              </label>
            ))}
          </div>
        </div>
      </div>

      <p className="assign-note">
        📝 Note: Only assigned projects and processes will appear in the employee's dropdown when they log in.
      </p>

      <div className="modal-actions">
        <button className="btn-cancel" onClick={onClose}>Cancel</button>
        <button className="btn-primary-modal" onClick={handleSave}>Save Assignments</button>
      </div>
    </Modal>
  );
};

/* ══════════════════════════════════════════════════════════════════
   2. ASSIGN ROLE
══════════════════════════════════════════════════════════════════ */
const AssignRoleModal = ({ user, onClose, onAssign }) => {
  const [role, setRole] = useState('');

  const handleAssign = () => {
    if (!role) { alert('Please select a role.'); return; }
    onAssign(user.id, role);
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="modal-title">Assign Role to {user.name}</h2>

      <div className="form-group">
        <label className="form-label">Select Role</label>
        <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
          <option value="">-- Select Role --</option>
          {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="modal-actions">
        <button className="btn-cancel" onClick={onClose}>Cancel</button>
        <button className="btn-primary-modal" onClick={handleAssign}>Assign Role</button>
      </div>
    </Modal>
  );
};

/* ══════════════════════════════════════════════════════════════════
   3. IMPERSONATE USER
══════════════════════════════════════════════════════════════════ */
const ImpersonateModal = ({ user, onClose, onContinue }) => {
  const handleContinue = () => {
    onContinue(user.id);
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="modal-title">👤 Impersonate User</h2>

      <div className="impersonate-info">
        <p className="impersonate-label">You are about to impersonate:</p>
        <div className="impersonate-user-card">
          <strong>{user.name}</strong>
          <span>{user.email}</span>
        </div>
        <div className="impersonate-warning">
          ⚠️ The employee portal will open in a new window. All actions will be logged with your admin account.
        </div>
      </div>

      <div className="modal-actions">
        <button className="btn-cancel" onClick={onClose}>Cancel</button>
        <button className="btn-primary-modal" onClick={handleContinue}>Continue</button>
      </div>
    </Modal>
  );
};

/* ══════════════════════════════════════════════════════════════════
   4. SET PASSWORD
══════════════════════════════════════════════════════════════════ */
const SetPasswordModal = ({ user, onClose, onSet }) => {
  const [pw, setPw] = useState('');
  const [cpw, setCpw] = useState('');
  const [err, setErr] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);

  const handleSet = () => {
    if (pw.length < 6) { setErr('Password must be at least 6 characters.'); return; }
    if (pw !== cpw) { setErr('Passwords do not match.'); return; }
    onSet(user.id, pw);
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="modal-title">Set Password — {user.name}</h2>

      <div className="form-group">
        <label className="form-label">New Password <span className="req">*</span></label>
        <div className="pwd-input-wrap">
          <input
            type={showPw ? 'text' : 'password'}
            className="form-input"
            placeholder="Enter new password (min 6 characters)"
            value={pw}
            onChange={e => { setPw(e.target.value); setErr(''); }}
          />
          <button type="button" className="pwd-toggle-btn" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
            {showPw ? '🙈' : '👁'}
          </button>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Confirm Password <span className="req">*</span></label>
        <div className="pwd-input-wrap">
          <input
            type={showCpw ? 'text' : 'password'}
            className="form-input"
            placeholder="Confirm new password"
            value={cpw}
            onChange={e => { setCpw(e.target.value); setErr(''); }}
          />
          <button type="button" className="pwd-toggle-btn" onClick={() => setShowCpw(v => !v)} tabIndex={-1}>
            {showCpw ? '🙈' : '👁'}
          </button>
        </div>
      </div>

      {err && <p className="form-error">{err}</p>}

      <div className="modal-actions">
        <button className="btn-cancel" onClick={onClose}>Cancel</button>
        <button className="btn-primary-modal" onClick={handleSet}>Set Password</button>
      </div>
    </Modal>
  );
};

/* ══════════════════════════════════════════════════════════════════
   5. RESET PASSWORD
══════════════════════════════════════════════════════════════════ */
const ResetPasswordModal = ({ user, onClose }) => {
  const handleReset = () => {
    alert(`Password reset link sent to ${user.email}.`);
    onClose();
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="modal-title">🔄 Reset Password</h2>

      <div className="impersonate-info">
        <p className="impersonate-label">A password reset link will be sent to:</p>
        <div className="impersonate-user-card">
          <strong>{user.name}</strong>
          <span>{user.email}</span>
        </div>
        <div
          className="impersonate-warning"
          style={{ background: '#e0f2fe', borderColor: '#0ea5e9', color: '#0c4a6e' }}
        >
          ℹ️ The user will receive an email with instructions to reset their password.
        </div>
      </div>

      <div className="modal-actions">
        <button className="btn-cancel" onClick={onClose}>Cancel</button>
        <button className="btn-primary-modal" onClick={handleReset}>Send Reset Link</button>
      </div>
    </Modal>
  );
};

/* ══════════════════════════════════════════════════════════════════
   6. EDIT USER
══════════════════════════════════════════════════════════════════ */
const EditUserModal = ({ user, onClose, onUpdate, shifts }) => {
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone === '-' ? '' : user.phone,
    role: user.role,
    shiftId: user.shiftId || '',
    timezone: 'Asia/Kolkata',
    top: user.top,
    calendar: true,
    active: user.status === 'Active',
  });

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleUpdate = () => {
    onUpdate({
      ...user,
      name: form.name,
      email: form.email,
      phone: form.phone || '-',
      role: form.role,
      shiftId: form.shiftId || null,
      top: form.top,
      status: form.active ? 'Active' : 'Inactive',
      initial: form.name.charAt(0).toUpperCase(),
    });
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="modal-title">Edit User</h2>

      <div className="form-group">
        <label className="form-label">ID</label>
        <input className="form-input" value={user.userCode} disabled style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#64748b' }} />
      </div>

      <div className="form-group">
        <label className="form-label">Name <span className="req">*</span></label>
        <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">Email</label>
        <input className="form-input" value={form.email} onChange={e => set('email', e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">Phone Number</label>
        <input className="form-input" placeholder="+91 1234567890" value={form.phone} onChange={e => set('phone', e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">Profile Photo</label>
        <input type="file" className="form-input file-input" accept="image/*" />
      </div>

      <div className="form-group">
        <label className="form-label">Role</label>
        <select className="form-select" value={form.role} onChange={e => set('role', e.target.value)}>
          {ALL_ROLES.map(r => <option key={r} value={r.toLowerCase()}>{r}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Shift</label>
        <select className="form-select" value={form.shiftId} onChange={e => set('shiftId', e.target.value)}>
          <option value="">-- None --</option>
          {shifts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <p className="form-hint">Set the employee's default shift. This will be used automatically when they start tracking time.</p>
      </div>

      <div className="form-group">
        <label className="form-label">Timezone</label>
        <input className="form-input" value={form.timezone} onChange={e => set('timezone', e.target.value)} />
      </div>

      <div className="form-check-group">
        <label className="check-label">
          <input type="checkbox" checked={form.top} onChange={e => set('top', e.target.checked)} />
          ⭐ Mark as Top Performer
        </label>
        <p className="form-hint">Top performers will be displayed on the login page.</p>
      </div>

      <div className="form-check-group">
        <label className="check-label">
          <input type="checkbox" checked={form.calendar} onChange={e => set('calendar', e.target.checked)} />
          Show Calendar Statistics (Weekly/Monthly)
        </label>
        <p className="form-hint">Allow this employee to view weekly and monthly calendar statistics in the employee portal.</p>
      </div>

      <div className="form-group">
        <label className="form-label">Onboarding/KYC Documents</label>
        <input type="file" className="form-input file-input" multiple />
      </div>

      <div className="form-check-group">
        <label className="check-label">
          <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} />
          Active
        </label>
        <p className="form-hint">Deactivate to prevent this user from logging in.</p>
      </div>

      <div className="modal-actions">
        <button className="btn-cancel" onClick={onClose}>Cancel</button>
        <button className="btn-primary-modal" onClick={handleUpdate}>Update</button>
      </div>
    </Modal>
  );
};

/* ══════════════════════════════════════════════════════════════════
   7. DELETE USER
══════════════════════════════════════════════════════════════════ */
const DeleteModal = ({ user, onClose, onDelete }) => {
  const handleDelete = () => {
    onDelete(user.id);
  };

  return (
    <Modal onClose={onClose}>
      <div className="delete-modal">
        <div className="delete-icon">🗑️</div>
        <h2 className="modal-title">Delete User</h2>
        <p className="delete-msg">
          Are you sure you want to delete <strong>{user.name}</strong>?<br />
          This action cannot be undone.
        </p>
        <div className="modal-actions centered">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-danger-modal" onClick={handleDelete}>Delete</button>
        </div>
      </div>
    </Modal>
  );
};

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [modal, setModal] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const location = useLocation();

  // ── Load users from API ──────────────────────────────────────
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiCall('/users');
      const mapped = data.map(u => ({
        id: u.id,
        userCode: u.userCode,
        initial: u.fullName ? u.fullName.charAt(0).toUpperCase() : '?',
        name: u.fullName,
        email: u.email,
        phone: u.phone || '-',
        role: u.role ? u.role.toLowerCase() : 'executive',
        shiftId: u.shiftId || null,
        shift: u.shift || '-',
        top: u.isTopPerformer,
        status: u.isActive ? 'Active' : 'Inactive',
      }));
      const rolePriority = {
        'admin': 1,
        'manager': 2,
        'team leader': 3,
        'employee': 4,
        'viewer': 5
      };
      mapped.sort((a, b) => {
        const priorityA = rolePriority[a.role.toLowerCase()] || 99;
        const priorityB = rolePriority[b.role.toLowerCase()] || 99;
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        return (a.userCode || '').localeCompare(b.userCode || '', undefined, { numeric: true, sensitivity: 'base' });
      });
      setUsers(mapped);
    } catch (err) {
      setError('Failed to load users: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Load dropdown data from API ──────────────────────────────
  const loadDropdownData = useCallback(async () => {
    try {
      const [proj, proc, shift] = await Promise.all([
        apiCall('/projects'),
        apiCall('/processes'),
        apiCall('/shifts'),
      ]);
      setProjects(proj.map(p => ({ id: p.id, name: p.name })));
      setProcesses(proc.map(p => ({ id: p.id, name: p.name })));
      setShifts(shift.map(s => ({ id: s.id, name: s.name })));
    } catch (err) {
      console.warn('Failed to load dropdown data:', err.message);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadDropdownData();
  }, [loadUsers, loadDropdownData]);

  useEffect(() => {
    if (location.state?.openAddUser) {
      setShowAddUser(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const open = (type, user) => setModal({ type, user });
  const close = () => setModal(null);

  // ── API-backed handlers ──────────────────────────────────────

  const handleAdd = async (formData) => {
    try {
      await apiCall('/users', 'POST', {
        userCode: formData.id,
        fullName: formData.name,
        email: formData.email,
        // Fix: treat empty string as null too
        phone: formData.phone && formData.phone !== '-' ? formData.phone : null,
        password: formData.password || 'Welcome@123',
        roleName: mapRoleName(formData.role),
        shiftId: formData.shiftId || null,
        isTopPerformer: formData.top,
        showCalendarStats: formData.calendar,
        isActive: formData.active,
      });
      await loadUsers();
      setShowAddUser(false);
    } catch (err) {
      alert('Error creating user: ' + err.message);
    }
  };

  const handleUpdate = async (updatedUser) => {
    try {
      await apiCall(`/users/${updatedUser.id}`, 'PUT', {
        fullName: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone !== '-' ? updatedUser.phone : null,
        roleName: mapRoleName(updatedUser.role),
        shiftId: updatedUser.shiftId || null,
        isTopPerformer: updatedUser.top,
        isActive: updatedUser.status === 'Active',
      });
      await loadUsers();
      close();
    } catch (err) {
      alert('Error updating user: ' + err.message);
    }
  };

  const handleDelete = async (userId) => {
    try {
      await apiCall(`/users/${userId}`, 'DELETE');
      await loadUsers();
      close();
    } catch (err) {
      alert('Error deleting user: ' + err.message);
    }
  };

  const handleSetPassword = async (userId, newPassword) => {
    try {
      await apiCall(`/users/${userId}/set-password`, 'POST', {
        newPassword,
        confirmPassword: newPassword,
      });
      alert('Password updated successfully.');
      close();
    } catch (err) {
      alert('Error setting password: ' + err.message);
    }
  };

  const handleAssignRole = async (userId, roleName) => {
    try {
      await apiCall(`/users/${userId}/assign-role`, 'POST', { roleName });
      await loadUsers();
      alert(`Role "${roleName}" assigned successfully.`);
      close();
    } catch (err) {
      alert('Error assigning role: ' + err.message);
    }
  };

  const handleAssignProjects = async (userId, projectIds, processIds) => {
    try {
      await apiCall(`/users/${userId}/assign-projects`, 'POST', {
        projectIds,
        processIds,
      });
      alert('Assignments saved successfully.');
      close();
    } catch (err) {
      alert('Error saving assignments: ' + err.message);
    }
  };

  const handleImpersonate = async (userId) => {
    try {
      const data = await apiCall(`/auth/impersonate/${userId}`, 'POST');
      localStorage.setItem('impersonateToken', data.accessToken);
      localStorage.setItem('impersonateRefresh', data.refreshToken);
      localStorage.setItem('impersonateUser', JSON.stringify({
        userId: data.userId,
        fullName: data.fullName,
        email: data.email,
        roles: data.roles,
        permissions: data.permissions
      }));
      const prefix = getRolePrefix(data.roles);
      window.open(`/#/${prefix}/dashboard`, '_blank');
      close();
    } catch (err) {
      alert('Error impersonating user: ' + err.message);
    }
  };

  // ── Top scroll sync refs ─────────────────────────────────────
  const topScrollRef = React.useRef(null);
  const bottomScrollRef = React.useRef(null);

  useEffect(() => {
    const topEl = topScrollRef.current;
    const bottomEl = bottomScrollRef.current;
    if (!topEl || !bottomEl) return;

    const resizeObserver = new ResizeObserver(() => {
      const firstChild = bottomEl.firstElementChild;
      if (firstChild) {
        const tableWidth = firstChild.offsetWidth;
        const innerDummy = topEl.firstElementChild;
        if (innerDummy) innerDummy.style.width = `${tableWidth}px`;
      }
    });
    resizeObserver.observe(bottomEl);

    let isSyncingTop = false, isSyncingBottom = false;
    const handleTopScroll = () => {
      if (!isSyncingBottom) {
        isSyncingTop = true;
        bottomEl.scrollLeft = topEl.scrollLeft;
        isSyncingTop = false;
      }
    };
    const handleBottomScroll = () => {
      if (!isSyncingTop) {
        isSyncingBottom = true;
        topEl.scrollLeft = bottomEl.scrollLeft;
        isSyncingBottom = false;
      }
    };
    topEl.addEventListener('scroll', handleTopScroll);
    bottomEl.addEventListener('scroll', handleBottomScroll);
    return () => {
      resizeObserver.disconnect();
      topEl.removeEventListener('scroll', handleTopScroll);
      bottomEl.removeEventListener('scroll', handleBottomScroll);
    };
  }, [users]);

  // ── Render ───────────────────────────────────────────────────
  if (loading) return (
    <div className="user-mgmt-container">
      <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
        Loading users...
      </div>
    </div>
  );

  if (error) return (
    <div className="user-mgmt-container">
      <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>
        {error}
      </div>
    </div>
  );

  return (
    <div className="user-mgmt-container">

      {/* ── Header ── */}
      <div className="mgmt-header">
        <div className="header-left">
          <span className="mgmt-icon">👥</span>
          <h2>User Management</h2>
        </div>
        <button className="add-user-btn" onClick={() => setShowAddUser(true)}>
          + Add User
        </button>
      </div>

      {/* ── Top Scrollbar ── */}
      <div className="double-scroll-top" ref={topScrollRef}>
        <div className="double-scroll-top-inner" />
      </div>

      {/* ── Table ── */}
      <div className="table-wrapper" ref={bottomScrollRef}>
        <table className="user-table">
          <thead>
            <tr>
              <th>Photo</th>
              <th>ID</th>
              <th className="th-name">Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Shift</th>
              <th>Top Performer</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                  No users found. Click "+ Add User" to create one.
                </td>
              </tr>
            ) : users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="avatar-circle">{user.initial}</div>
                </td>
                <td className="user-code-col">
                  <strong>{user.userCode}</strong>
                </td>
                <td className="td-name col-left">{user.name}</td>
                <td>{user.email}</td>
                <td>{user.phone}</td>
                <td>
                  <span className={`role-badge ${user.role.toLowerCase().replace(/\s+/g, '-')}`}>
                    {user.role}
                  </span>
                </td>
                <td>{user.shift}</td>
                <td>
                  {user.top && (
                    <span className="top-performer">⭐ Top Performer</span>
                  )}
                </td>
                <td>
                  <span className={`status-badge ${user.status.toLowerCase()}`}>
                    {user.status?.toUpperCase()}
                  </span>
                </td>

                {/* ── Action Dropdown ── */}
                <td>
                  <select
                    className="action-dropdown"
                    defaultValue=""
                    onChange={e => {
                      const action = e.target.value;
                      if (action) open(action, user);
                      e.target.value = '';
                    }}
                  >
                    <option value="" disabled>⚙️ Actions</option>
                    <option value="assign">🗒️ Assign Project &amp; Process</option>
                    <option value="role">🔐 Assign Role</option>
                    <option value="impersonate">👤 Impersonate User</option>
                    <option value="setpw">🔑 Set Password</option>
                    <option value="resetpw">🔄 Reset Password</option>
                    <option value="edit">✏️ Edit User</option>
                    <option value="delete">🗑️ Delete User</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Add User Modal ── */}
      {showAddUser && (
        <AddUserModal
          onClose={() => setShowAddUser(false)}
          onAdd={handleAdd}
          shifts={shifts}
        />
      )}

      {/* ── Action Modals ── */}
      {modal?.type === 'assign' && (
        <AssignProjectModal
          user={modal.user}
          onClose={close}
          projects={projects}
          processes={processes}
          onSave={handleAssignProjects}
        />
      )}
      {modal?.type === 'role' && (
        <AssignRoleModal
          user={modal.user}
          onClose={close}
          onAssign={handleAssignRole}
        />
      )}
      {modal?.type === 'impersonate' && (
        <ImpersonateModal
          user={modal.user}
          onClose={close}
          onContinue={handleImpersonate}
        />
      )}
      {modal?.type === 'setpw' && (
        <SetPasswordModal
          user={modal.user}
          onClose={close}
          onSet={handleSetPassword}
        />
      )}
      {modal?.type === 'resetpw' && (
        <ResetPasswordModal
          user={modal.user}
          onClose={close}
        />
      )}
      {modal?.type === 'edit' && (
        <EditUserModal
          user={modal.user}
          onClose={close}
          onUpdate={handleUpdate}
          shifts={shifts}
        />
      )}
      {modal?.type === 'delete' && (
        <DeleteModal
          user={modal.user}
          onClose={close}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default UserManagement;
