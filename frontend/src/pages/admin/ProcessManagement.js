import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './ProcessManagement.css';
import { apiCall } from '../../utils/api';

// ── Helpers ───────────────────────────────────────────────────────
const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', {
        month: 'numeric', day: 'numeric', year: 'numeric'
      })
    : '-';

const mapProcess = (p) => ({
  id:          p.id,
  name:        p.name,
  description: p.description || '',
  active:      p.isActive,
  created:     p.createdAt,
});

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

// ── Modal Overlay ─────────────────────────────────────────────────
const Modal = ({ onClose, children }) => (
  <div className="pm-modal-overlay" onClick={onClose}>
    <div className="pm-modal-box" onClick={e => e.stopPropagation()}>
      {children}
    </div>
  </div>
);

// ── Edit Modal ────────────────────────────────────────────────────
const EditModal = ({ process, onClose, onUpdate }) => {
  const [name,   setName]   = useState(process.name);
  const [desc,   setDesc]   = useState(process.description);
  const [active, setActive] = useState(process.active);
  const [err,    setErr]    = useState('');
  const [saving, setSaving] = useState(false);

  const handleUpdate = async () => {
    if (!name.trim()) { setErr('Process name is required.'); return; }
    setSaving(true);
    try {
      await onUpdate(process.id, {
        name:        name.trim(),
        description: desc,
        isActive:    active,
      });
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="pm-modal-title">Edit Process</h2>

      <div className="pm-form-group">
        <label className="pm-form-label">
          Process Name <span className="pm-req">*</span>
        </label>
        <input
          className={`pm-form-input${err ? ' input-error' : ''}`}
          placeholder="e.g., XML - Tagging"
          value={name}
          onChange={e => { setName(e.target.value); setErr(''); }}
        />
        {err && <p className="pm-form-error">{err}</p>}
      </div>

      <div className="pm-form-group">
        <label className="pm-form-label">Description</label>
        <textarea
          className="pm-form-textarea"
          placeholder="Optional description"
          value={desc}
          rows={4}
          onChange={e => setDesc(e.target.value)}
        />
      </div>

      <div className="pm-check-group">
        <label className="pm-check-label">
          <input
            type="checkbox"
            checked={active}
            onChange={e => setActive(e.target.checked)}
          />
          Active
        </label>
      </div>

      <div className="pm-modal-actions">
        <button className="pm-btn-cancel" onClick={onClose}>
          Cancel
        </button>
        <button
          className="pm-btn-primary"
          onClick={handleUpdate}
          disabled={saving}
        >
          {saving ? 'Updating...' : 'Update Process'}
        </button>
      </div>
    </Modal>
  );
};

// ── Delete Modal ──────────────────────────────────────────────────
const DeleteModal = ({ process, onClose, onDelete }) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(process.id);
      onClose();
    } catch (e) {
      alert('Error deleting process: ' + e.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="pm-delete-modal">
        <div className="pm-delete-icon">🗑️</div>
        <h2 className="pm-modal-title">Delete Process</h2>
        <p className="pm-delete-msg">
          Are you sure you want to delete{' '}
          <strong>"{process.name}"</strong>?<br />
          This action cannot be undone.
        </p>
        <div className="pm-modal-actions centered">
          <button className="pm-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="pm-btn-danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ═════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════
const ProcessManagement = () => {
  const [processes,  setProcesses]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [modal,      setModal]      = useState(null);

  // Add form state
  const [showAddForm, setShowAddForm] = useState(true);
  const [newName,     setNewName]     = useState('');
  const [newDesc,     setNewDesc]     = useState('');
  const [newActive,   setNewActive]   = useState(true);
  const [addErr,      setAddErr]      = useState('');
  const [creating,    setCreating]    = useState(false);

  // Pagination
  const [perPage, setPerPage] = useState(25);
  const [page,    setPage]    = useState(1);

  // ── Load processes ──────────────────────────────────────────
  const loadProcesses = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiCall('/processes/all');
      setProcesses(data.map(mapProcess));
    } catch (err) {
      setError('Failed to load processes: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProcesses();
  }, [loadProcesses]);

  // ── Pagination ──────────────────────────────────────────────
  const totalItems = processes.length;
  const totalPages = Math.ceil(totalItems / perPage);
  const startIdx   = (page - 1) * perPage;

  const pageRows = useMemo(
    () => processes.slice(startIdx, startIdx + perPage),
    [processes, startIdx, perPage]
  );

  const handlePerPage = (val) => {
    setPerPage(val);
    setPage(1);
  };

  const open  = (type, process) => setModal({ type, process });
  const close = ()               => setModal(null);

  // ── Create process ──────────────────────────────────────────
  const handleCreate = async () => {
    if (!newName.trim()) {
      setAddErr('Process name is required.');
      return;
    }
    setCreating(true);
    try {
      await apiCall('/processes', 'POST', {
        name:        newName.trim(),
        description: newDesc || null,
        isActive:    newActive,
      });
      setNewName('');
      setNewDesc('');
      setNewActive(true);
      setAddErr('');
      await loadProcesses();
    } catch (err) {
      setAddErr(err.message);
    } finally {
      setCreating(false);
    }
  };

  // ── Update process ──────────────────────────────────────────
  const handleUpdate = async (id, payload) => {
    await apiCall(`/processes/${id}`, 'PUT', payload);
    await loadProcesses();
  };

  // ── Delete process ──────────────────────────────────────────
  const handleDelete = async (id) => {
    await apiCall(`/processes/${id}`, 'DELETE');
    await loadProcesses();
  };

  // ── Render ──────────────────────────────────────────────────
  if (loading) return (
    <div className="pm-container">
      <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
        Loading processes...
      </div>
    </div>
  );

  if (error) return (
    <div className="pm-container">
      <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>
        {error}
        <br />
        <button onClick={loadProcesses} style={{ marginTop: '12px' }}>
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="pm-container">

      {/* ── Page Header ── */}
      <div className="pm-page-header">
        <div className="pm-page-title">
          <span className="pm-page-icon">⚙️</span>
          <h2>Process Management</h2>
        </div>
        <button
          className="pm-add-header-btn"
          onClick={() => setShowAddForm(v => !v)}
        >
          {showAddForm ? '✕ Close Form' : '+ Add Process'}
        </button>
      </div>

      {/* ── Add New Process Form Card ── */}
      {showAddForm && (
        <div className="pm-add-card">
          <h3 className="pm-add-card-title">Add New Process</h3>

          <div className="pm-form-group">
            <label className="pm-form-label">
              Process Name <span className="pm-req">*</span>
            </label>
            <input
              className={`pm-form-input${addErr ? ' input-error' : ''}`}
              placeholder="e.g., XML - Tagging"
              value={newName}
              onChange={e => { setNewName(e.target.value); setAddErr(''); }}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
            {addErr && <p className="pm-form-error">{addErr}</p>}
          </div>

          <div className="pm-form-group">
            <label className="pm-form-label">Description</label>
            <textarea
              className="pm-form-textarea"
              placeholder="Optional description"
              value={newDesc}
              rows={4}
              onChange={e => setNewDesc(e.target.value)}
            />
          </div>

          <div className="pm-check-group">
            <label className="pm-check-label">
              <input
                type="checkbox"
                checked={newActive}
                onChange={e => setNewActive(e.target.checked)}
              />
              Active
            </label>
          </div>

          <button
            className="pm-create-btn"
            onClick={handleCreate}
            disabled={creating}
          >
            {creating ? 'Creating...' : 'Create Process'}
          </button>
        </div>
      )}

      {/* ── All Processes Table Card ── */}
      <div className="pm-table-card">
        <div className="pm-table-header">
          <h3 className="pm-table-title">
            All Processes ({totalItems})
          </h3>
        </div>

        <div className="pm-table-wrapper">
          <table className="pm-table">
            <thead>
              <tr>
                <th className="col-name">Process</th>
                <th className="col-desc">Description</th>
                <th className="col-status">Status</th>
                <th className="col-created">Created</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan="5" className="pm-empty">
                    No processes found.
                  </td>
                </tr>
              ) : pageRows.map(proc => (
                <tr key={proc.id}>
                  <td className="td-name">{proc.name}</td>
                  <td className="td-desc">
                    {proc.description || (
                      <span className="pm-dash">-</span>
                    )}
                  </td>
                  <td>
                    <span className={`pm-status-badge${
                      proc.active ? ' active' : ' inactive'
                    }`}>
                      {proc.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="td-created">{fmt(proc.created)}</td>
                  <td>
                    <div className="pm-action-btns">
                      <button
                        className="pm-act-edit"
                        title="Edit Process"
                        onClick={() => open('edit', proc)}
                      >
                        ✏️
                      </button>
                      <button
                        className="pm-act-del"
                        title="Delete Process"
                        onClick={() => open('delete', proc)}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Pagination Footer ── */}
        <div className="pm-pagination">
          <div className="pm-per-page">
            <span>Items per page:</span>
            <select
              value={perPage}
              onChange={e => handlePerPage(Number(e.target.value))}
            >
              {ITEMS_PER_PAGE_OPTIONS.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div className="pm-page-info">
            Showing {totalItems === 0 ? 0 : startIdx + 1} to{' '}
            {Math.min(startIdx + perPage, totalItems)} of{' '}
            {totalItems} items
          </div>

          {totalPages > 1 && (
            <div className="pm-page-nav">
              <button
                className="pm-nav-btn"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                ‹
              </button>

              {Array.from(
                { length: totalPages }, (_, i) => i + 1
              ).map(n => (
                <button
                  key={n}
                  className={`pm-nav-btn${
                    page === n ? ' active-page' : ''
                  }`}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ))}

              <button
                className="pm-nav-btn"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                ›
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {modal?.type === 'edit' && (
        <EditModal
          process={modal.process}
          onClose={close}
          onUpdate={handleUpdate}
        />
      )}
      {modal?.type === 'delete' && (
        <DeleteModal
          process={modal.process}
          onClose={close}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default ProcessManagement;