import React, {
  useState, useEffect, useMemo, useCallback
} from 'react';
import './ShiftManagement.css';
import { apiCall, getCurrentUser } from '../../utils/api';

// ── Constants ─────────────────────────────────────────────────────
const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];
const SHIFT_NAME_OPTIONS = [
  '1st Shift', '2nd Shift', 'Night Shift', 'General Shift'
];

// ── Helpers ───────────────────────────────────────────────────────
const fmt12 = (t) => {
  if (!t) return '-';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', {
    month: 'numeric', day: 'numeric', year: 'numeric'
  })
    : '-';

// Map backend → frontend shape
const mapShift = (s) => ({
  id: s.id,
  name: s.name,
  startTime: s.startTime || '',
  endTime: s.endTime || '',
  description: s.description || '',
  active: s.isActive,
  created: s.createdAt,
  assignedEmployees: (s.assignedEmployees || []).map(e => ({
    id: e.userId,
    name: e.fullName,
    email: e.email,
  })),
});

// ── Modal Overlay ─────────────────────────────────────────────────
const Modal = ({ onClose, children }) => (
  <div className="sm-modal-overlay" onClick={onClose}>
    <div className="sm-modal-box" onClick={e => e.stopPropagation()}>
      {children}
    </div>
  </div>
);

// ── Edit Shift Modal ──────────────────────────────────────────────
const EditModal = ({ shift, onClose, onUpdate }) => {
  const [name, setName] = useState(shift.name);
  const [startTime, setStartTime] = useState(shift.startTime);
  const [endTime, setEndTime] = useState(shift.endTime);
  const [desc, setDesc] = useState(shift.description);
  const [active, setActive] = useState(shift.active);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const handleUpdate = async () => {
    if (!name.trim()) { setErr('Shift name is required.'); return; }
    setSaving(true);
    try {
      await onUpdate(shift.id, {
        name, startTime, endTime,
        description: desc, isActive: active,
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
      <h2 className="sm-modal-title">✏️ Edit Shift</h2>

      <div className="sm-form-group">
        <label className="sm-form-label">
          Shift Name <span className="sm-req">*</span>
        </label>
        <select
          className={`sm-form-input${err ? ' input-error' : ''}`}
          value={name}
          onChange={e => { setName(e.target.value); setErr(''); }}
        >
          <option value="">Select Shift</option>
          {SHIFT_NAME_OPTIONS.map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        {err && <p className="sm-form-error">{err}</p>}
      </div>

      <div className="sm-form-row">
        <div className="sm-form-group">
          <label className="sm-form-label">Start Time</label>
          <input type="time" className="sm-form-input"
            value={startTime}
            onChange={e => setStartTime(e.target.value)} />
        </div>
        <div className="sm-form-group">
          <label className="sm-form-label">End Time</label>
          <input type="time" className="sm-form-input"
            value={endTime}
            onChange={e => setEndTime(e.target.value)} />
        </div>
      </div>

      <div className="sm-form-group">
        <label className="sm-form-label">Description</label>
        <textarea className="sm-form-textarea"
          placeholder="Optional description"
          value={desc} rows={3}
          onChange={e => setDesc(e.target.value)} />
      </div>

      <div className="sm-check-group">
        <label className="sm-check-label">
          <input type="checkbox" checked={active}
            onChange={e => setActive(e.target.checked)} />
          Active
        </label>
      </div>

      <div className="sm-modal-actions">
        <button className="sm-btn-cancel" onClick={onClose}>Cancel</button>
        <button className="sm-btn-primary" onClick={handleUpdate}
          disabled={saving}>
          {saving ? 'Updating...' : 'Update Shift'}
        </button>
      </div>
    </Modal>
  );
};

// ── Delete Modal ──────────────────────────────────────────────────
const DeleteModal = ({ shift, onClose, onDelete }) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(shift.id);
      onClose();
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="sm-delete-modal">
        <div className="sm-delete-icon">🗑️</div>
        <h2 className="sm-modal-title">Delete Shift</h2>
        <p className="sm-delete-msg">
          Are you sure you want to delete{' '}
          <strong>"{shift.name}"</strong>?<br />
          This will also remove all allotted employees from this shift.<br />
          <em>This action cannot be undone.</em>
        </p>
        <div className="sm-modal-actions centered">
          <button className="sm-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="sm-btn-danger" onClick={handleDelete}
            disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ── Allotment Column ──────────────────────────────────────────────
const AllotmentColumn = ({
  shift,
  allottedList,
  isAssigned,
  globalAllottedIds,
  allEmployees,
  onAddEmployee,
  onRemoveEmployee,
  onAssign,
  assigning,
}) => {
  const availableEmployees = allEmployees.filter(
    e => !globalAllottedIds.has(e.id)
  );

  return (
    <div className={`sm-allot-column${isAssigned ? ' is-assigned' : ''}`}>

      {/* Header */}
      <div className="sm-allot-header">
        <div className="sm-allot-title-wrapper">
          <h4>{shift.name}</h4>
          <span className="sm-allot-time-range">
            {fmt12(shift.startTime)} – {fmt12(shift.endTime)}
          </span>
          <span className="sm-allot-count">
            {allottedList.length} Allotted
          </span>
        </div>
        <div className="sm-allot-header-right">
          <span className={`sm-status-badge${shift.active ? ' active' : ' inactive'
            }`}>
            {shift.active ? 'Active' : 'Inactive'}
          </span>
          {isAssigned && (
            <span className="sm-allot-badge-success">✓ Assigned</span>
          )}
        </div>
      </div>

      {/* Employee Dropdown */}
      <div className="sm-allot-select-wrapper">
        <select
          className="sm-allot-select"
          value=""
          onChange={e => {
            if (e.target.value) {
              onAddEmployee(shift.id, e.target.value);
            }
          }}
          disabled={!shift.active}
        >
          <option value="" disabled>
            {shift.active ? '+ Add Employee' : 'Shift is inactive'}
          </option>
          {availableEmployees.map(emp => (
            <option key={emp.id} value={emp.id}>
              {emp.name}
            </option>
          ))}
          {availableEmployees.length === 0 && (
            <option disabled>All employees allotted</option>
          )}
        </select>
      </div>

      {/* Employee List */}
      <div className="sm-shift-box">
        {allottedList.length === 0 ? (
          <div className="sm-shift-empty">
            <span>No employees allotted</span>
          </div>
        ) : (
          <div className="sm-shift-list">
            {allottedList.map(emp => (
              <div key={emp.id} className="sm-shift-item">
                <span className="sm-shift-item-avatar">👤</span>
                <span className="sm-shift-item-name">{emp.name}</span>
                <button
                  type="button"
                  className="sm-shift-item-remove"
                  onClick={() => onRemoveEmployee(shift.id, emp.id)}
                  title={`Remove ${emp.name}`}
                >✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assign Button */}
      <div className="sm-allot-actions">
        <button
          type="button"
          className={`sm-assign-btn${isAssigned ? ' btn-success' : ''}`}
          onClick={() => onAssign(shift.id)}
          disabled={
            allottedList.length === 0 ||
            !shift.active ||
            assigning === shift.id
          }
        >
          {assigning === shift.id
            ? 'Saving...'
            : isAssigned
              ? '✓ Saved & Assigned'
              : '💾 Assign Shift'}
        </button>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════
const ShiftManagement = () => {

  const [shifts, setShifts] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newActive, setNewActive] = useState(true);
  const [addErr, setAddErr] = useState('');
  const [creating, setCreating] = useState(false);

  const currentUser = getCurrentUser();
  const hasPermission = (perm) => currentUser?.roles?.includes('Admin') || currentUser?.permissions?.includes(perm);

  // Allotment board state
  // { [shiftId]: { id, name, email }[] }
  const [allotments, setAllotments] = useState({});
  const [assignedFlags, setAssignedFlags] = useState({});
  const [assigning, setAssigning] = useState(null);

  // Pagination
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);

  // ── Load data ──────────────────────────────────────────────
  const loadShifts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiCall('/shifts/all');
      const mapped = data.map(mapShift);
      setShifts(mapped);

      // Initialize allotments from currently assigned employees
      const initAllotments = {};
      const initFlags = {};
      mapped.forEach(s => {
        initAllotments[s.id] = s.assignedEmployees || [];
        initFlags[s.id] = s.assignedEmployees?.length > 0;
      });
      setAllotments(initAllotments);
      setAssignedFlags(initFlags);

    } catch (err) {
      setError('Failed to load shifts: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEmployees = useCallback(async () => {
    try {
      const data = await apiCall('/shifts/employees');
      setAllEmployees(data.map(e => ({
        id: e.userId,
        name: e.fullName,
        email: e.email,
        currentShiftId: e.currentShiftId,
        currentShiftName: e.currentShiftName,
      })));
    } catch (err) {
      console.warn('Could not load employees:', err.message);
    }
  }, []);

  useEffect(() => {
    loadShifts();
    loadEmployees();
  }, [loadShifts, loadEmployees]);

  // ── Derived: all employee IDs in any allotment column ──────
  const globalAllottedIds = useMemo(() => {
    const ids = new Set();
    Object.values(allotments).forEach(list =>
      list.forEach(emp => ids.add(emp.id))
    );
    return ids;
  }, [allotments]);

  // ── Pagination ──────────────────────────────────────────────
  const totalItems = shifts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * perPage;

  const pageRows = useMemo(
    () => shifts.slice(startIdx, startIdx + perPage),
    [shifts, startIdx, perPage]
  );

  const handlePerPage = (val) => { setPerPage(val); setPage(1); };

  const open = (type, shift) => setModal({ type, shift });
  const close = () => setModal(null);

  // ── Create shift ────────────────────────────────────────────
  const handleCreate = async () => {
    if (!newName.trim()) {
      setAddErr('Please select a shift name.');
      return;
    }
    setCreating(true);
    try {
      const created = await apiCall('/shifts', 'POST', {
        name: newName.trim(),
        startTime: newStartTime || null,
        endTime: newEndTime || null,
        description: newDesc || null,
        isActive: newActive,
      });

      const mapped = mapShift(created);
      setShifts(prev => [...prev, mapped]);
      setAllotments(prev => ({ ...prev, [mapped.id]: [] }));
      setAssignedFlags(prev => ({ ...prev, [mapped.id]: false }));

      setNewName('');
      setNewStartTime('');
      setNewEndTime('');
      setNewDesc('');
      setNewActive(true);
      setAddErr('');
    } catch (err) {
      setAddErr(err.message);
    } finally {
      setCreating(false);
    }
  };

  // ── Update shift ────────────────────────────────────────────
  const handleUpdate = useCallback(async (id, payload) => {
    const updated = await apiCall(`/shifts/${id}`, 'PUT', payload);
    const mapped = mapShift(updated);
    setShifts(prev => prev.map(s => s.id === id ? mapped : s));
    setAssignedFlags(prev => ({ ...prev, [id]: false }));
  }, []);

  // ── Delete shift ────────────────────────────────────────────
  const handleDelete = useCallback(async (id) => {
    await apiCall(`/shifts/${id}`, 'DELETE');
    setShifts(prev => prev.filter(s => s.id !== id));
    setAllotments(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setAssignedFlags(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  // ── Allotment Board: add employee to column ─────────────────
  const handleAddEmployee = useCallback((shiftId, empId) => {
    const emp = allEmployees.find(e => e.id === empId);
    if (!emp) return;
    setAllotments(prev => ({
      ...prev,
      [shiftId]: [...(prev[shiftId] || []), {
        id: emp.id, name: emp.name, email: emp.email
      }],
    }));
    setAssignedFlags(prev => ({ ...prev, [shiftId]: false }));
  }, [allEmployees]);

  // ── Allotment Board: remove employee from column ────────────
  const handleRemoveEmployee = useCallback((shiftId, empId) => {
    setAllotments(prev => ({
      ...prev,
      [shiftId]: (prev[shiftId] || []).filter(e => e.id !== empId),
    }));
    setAssignedFlags(prev => ({ ...prev, [shiftId]: false }));
  }, []);

  // ── Allotment Board: commit assignment to backend ───────────
  const handleAssign = useCallback(async (shiftId) => {
    const employees = allotments[shiftId] || [];
    if (employees.length === 0) return;

    setAssigning(shiftId);
    try {
      await apiCall(`/shifts/${shiftId}/assign`, 'POST', {
        userIds: employees.map(e => e.id),
      });

      // Update local shift record with new assignments
      setShifts(prev => prev.map(s =>
        s.id === shiftId
          ? { ...s, assignedEmployees: employees }
          : s
      ));
      setAssignedFlags(prev => ({ ...prev, [shiftId]: true }));

      // Reload employees to update currentShiftName
      await loadEmployees();

    } catch (err) {
      alert('Error assigning shift: ' + err.message);
    } finally {
      setAssigning(null);
    }
  }, [allotments, loadEmployees]);

  // ── Render ──────────────────────────────────────────────────
  if (loading) return (
    <div className="sm-container">
      <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
        Loading shifts...
      </div>
    </div>
  );

  if (error) return (
    <div className="sm-container">
      <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>
        {error}
        <br />
        <button onClick={loadShifts} style={{ marginTop: '12px' }}>
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="sm-container">

      {/* ── Page Header ── */}
      <div className="sm-page-header">
        <div className="sm-page-title">
          <span className="sm-page-icon">🕒</span>
          <h2>Shift Management</h2>
        </div>
        {hasPermission('shifts.manage') && (
          <button
            className="sm-add-header-btn"
            onClick={() => setShowAddForm(v => !v)}
          >
            {showAddForm ? '✕ Close Form' : '+ Add Shift'}
          </button>
        )}
      </div>

      {/* ── Add New Shift Form ── */}
      {showAddForm && (
        <div className="sm-add-card">
          <h3 className="sm-add-card-title">Add New Shift</h3>

          <div className="sm-form-group">
            <label className="sm-form-label">
              Shift Name <span className="sm-req">*</span>
            </label>
            <select
              className={`sm-form-input${addErr ? ' input-error' : ''}`}
              value={newName}
              onChange={e => { setNewName(e.target.value); setAddErr(''); }}
            >
              <option value="">Select Shift</option>
              {SHIFT_NAME_OPTIONS.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            {addErr && <p className="sm-form-error">{addErr}</p>}
          </div>

          <div className="sm-form-row">
            <div className="sm-form-group">
              <label className="sm-form-label">Start Time</label>
              <input type="time" className="sm-form-input"
                value={newStartTime}
                onChange={e => setNewStartTime(e.target.value)} />
            </div>
            <div className="sm-form-group">
              <label className="sm-form-label">End Time</label>
              <input type="time" className="sm-form-input"
                value={newEndTime}
                onChange={e => setNewEndTime(e.target.value)} />
            </div>
          </div>

          <div className="sm-form-group">
            <label className="sm-form-label">Description</label>
            <textarea className="sm-form-textarea"
              placeholder="Optional description"
              value={newDesc} rows={3}
              onChange={e => setNewDesc(e.target.value)} />
          </div>

          <div className="sm-check-group">
            <label className="sm-check-label">
              <input type="checkbox" checked={newActive}
                onChange={e => setNewActive(e.target.checked)} />
              Active
            </label>
          </div>

          <button className="sm-create-btn" onClick={handleCreate}
            disabled={creating}>
            {creating ? 'Creating...' : '＋ Create Shift'}
          </button>
        </div>
      )}

      {/* ── Allotment Board ── */}
      {hasPermission('shifts.manage') && shifts.length > 0 && (
        <div className="sm-allot-card">
          <div className="sm-allot-card-header">
            <h3 className="sm-allot-card-title">
              <span className="sm-allot-card-icon">👥</span>
              Shift Allotment &amp; Assignment Board
            </h3>
            <p className="sm-allot-card-subtitle">
              Select employees for each shift, then click{' '}
              <strong>Assign Shift</strong> to save.
              Editing allotments un-saves the assignment until
              you re-assign.
            </p>
          </div>

          <div
            className="sm-allot-grid"
            style={{
              gridTemplateColumns: `repeat(${Math.min(shifts.length, 4)
                }, 1fr)`,
            }}
          >
            {shifts.map(shift => (
              <AllotmentColumn
                key={shift.id}
                shift={shift}
                allottedList={allotments[shift.id] || []}
                isAssigned={!!assignedFlags[shift.id]}
                globalAllottedIds={globalAllottedIds}
                allEmployees={allEmployees}
                onAddEmployee={handleAddEmployee}
                onRemoveEmployee={handleRemoveEmployee}
                onAssign={handleAssign}
                assigning={assigning}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── All Shifts Table ── */}
      <div className="sm-table-card">
        <div className="sm-table-header">
          <h3 className="sm-table-title">
            All Shifts ({totalItems})
          </h3>
        </div>

        <div className="sm-table-wrapper">
          {totalItems === 0 ? (
            <div className="sm-empty-state">
              <p>No shifts found. Create your first shift above.</p>
            </div>
          ) : (
            <table className="sm-table">
              <thead>
                <tr>
                  <th className="col-name">Name</th>
                  <th className="col-time">Start Time</th>
                  <th className="col-time">End Time</th>
                  <th className="col-desc">Description</th>
                  <th className="col-status">Status</th>
                  <th className="col-assigned">Assigned Employees</th>
                  <th className="col-created">Created</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map(shift => (
                  <tr key={shift.id}>
                    <td className="td-name col-left">{shift.name}</td>
                    <td className="td-time">
                      {fmt12(shift.startTime)}
                    </td>
                    <td className="td-time">
                      {fmt12(shift.endTime)}
                    </td>
                    <td className="td-desc">
                      {shift.description || (
                        <span className="sm-dash">—</span>
                      )}
                    </td>
                    <td>
                      <span className={`sm-status-badge${shift.active ? ' active' : ' inactive'
                        }`}>
                        {shift.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="td-assigned">
                      {shift.assignedEmployees?.length > 0 ? (
                        <div className="sm-assigned-chips">
                          {shift.assignedEmployees
                            .slice(0, 3)
                            .map(emp => (
                              <span key={emp.id} className="sm-chip">
                                {emp.name}
                              </span>
                            ))}
                          {shift.assignedEmployees.length > 3 && (
                            <span className="sm-chip sm-chip-more">
                              +{shift.assignedEmployees.length - 3} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="sm-dash sm-not-assigned">
                          Not assigned
                        </span>
                      )}
                    </td>
                    <td className="td-created">
                      {fmtDate(shift.created)}
                    </td>
                    <td>
                      {hasPermission('shifts.manage') && (
                        <div className="sm-action-btns">
                          <button className="sm-act-edit"
                            title="Edit Shift"
                            onClick={() => open('edit', shift)}>
                            ✏️
                          </button>
                          <button className="sm-act-del"
                            title="Delete Shift"
                            onClick={() => open('delete', shift)}>
                            🗑️
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="sm-pagination">
            <div className="sm-per-page">
              <span>Items per page:</span>
              <select value={perPage}
                onChange={e => handlePerPage(Number(e.target.value))}>
                {ITEMS_PER_PAGE_OPTIONS.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div className="sm-page-info">
              Showing {startIdx + 1} to{' '}
              {Math.min(startIdx + perPage, totalItems)} of{' '}
              {totalItems} items
            </div>

            {totalPages > 1 && (
              <div className="sm-page-nav">
                <button className="sm-nav-btn"
                  disabled={safePage === 1}
                  onClick={() => setPage(p => p - 1)}>‹</button>
                {Array.from(
                  { length: totalPages }, (_, i) => i + 1
                ).map(n => (
                  <button key={n}
                    className={`sm-nav-btn${safePage === n ? ' active-page' : ''
                      }`}
                    onClick={() => setPage(n)}>
                    {n}
                  </button>
                ))}
                <button className="sm-nav-btn"
                  disabled={safePage === totalPages}
                  onClick={() => setPage(p => p + 1)}>›</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {modal?.type === 'edit' && (
        <EditModal shift={modal.shift} onClose={close}
          onUpdate={handleUpdate} />
      )}
      {modal?.type === 'delete' && (
        <DeleteModal shift={modal.shift} onClose={close}
          onDelete={handleDelete} />
      )}
    </div>
  );
};

export default ShiftManagement;





