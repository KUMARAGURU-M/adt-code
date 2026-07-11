import React, { useState, useEffect, useCallback } from "react";
import "./Tools.css";

import { apiCall } from "../../utils/api";

// ── Helpers ───────────────────────────────────────────────────────
const roleClass = (role) => ({
  Admin: "role--admin",
  Manager: "role--manager",
  Employee: "role--employee",
  Viewer: "role--viewer",
}[role] || "role--employee");

const avatarColor = (initial = "A") => {
  const colors = [
    "#6c63ff", "#00b894", "#e17055",
    "#0984e3", "#a29bfe", "#fd79a8",
  ];
  return colors[(initial || "A").charCodeAt(0) % colors.length];
};

// ── Icons ─────────────────────────────────────────────────────────
function AccessIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      width="16" height="16">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}
function DeleteIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
      <path fillRule="evenodd"
        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002
           2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011
           2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1
           1 0 102 0V8a1 1 0 00-1-1z"
        clipRule="evenodd" />
    </svg>
  );
}

// ── Modal ─────────────────────────────────────────────────────────
function Modal({ title, onClose, children, confirm }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-box${confirm ? " modal-box--confirm" : ""}`}
        onClick={e => e.stopPropagation()}>
        {confirm && <div className="modal-warn-icon">⚠️</div>}
        <h2 className="modal-title">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ onCancel, onConfirm, confirmLabel, danger,
  disabled }) {
  return (
    <div className="modal-actions">
      <button className="modal-btn-cancel" onClick={onCancel}>
        Cancel
      </button>
      <button
        className={`modal-btn-confirm${danger ? " modal-btn-confirm--danger" : ""
          }`}
        onClick={onConfirm}
        disabled={disabled}>
        {confirmLabel}
      </button>
    </div>
  );
}

// ── Employee Table ────────────────────────────────────────────────
function EmployeeTable({
  entries, toolName, allUsers,
  onEditAccess, onRemoveUser,
  showDropdown, setShowDropdown,
  onAddUser,
}) {
  // Users not yet in the list for this tool
  const listedUserIds = new Set(entries.map(e => e.userId));
  const availableUsers = allUsers.filter(u => !listedUserIds.has(u.id));

  return (
    <div className="tm-section tm-section--emp">
      <div className="tm-section-header">
        <span className="tm-section-title">
          {toolName} — Employee Access
        </span>

        <div className="tm-dropdown-wrapper">
          <button className="tm-btn-add"
            onClick={() => setShowDropdown(p => !p)}>
            + Add Employee ▾
          </button>

          {showDropdown && (
            <div className="tm-dropdown-menu">
              {availableUsers.length === 0 ? (
                <div className="tm-dropdown-item" style={{
                  color: "#aaa", cursor: "default"
                }}>
                  All users already added
                </div>
              ) : availableUsers.map(u => (
                <button key={u.id} className="tm-dropdown-item"
                  onClick={() => {
                    onAddUser(u);
                    setShowDropdown(false);
                  }}>
                  {u.fullName || u.email}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="tm-table-container">
        <table className="tm-table tm-table--emp">
          <thead>
            <tr>
              <th>Photo</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Access</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={6} className="tm-empty">
                  No employees added yet. Click "+ Add Employee" to add.
                </td>
              </tr>
            ) : entries.map(emp => {
              const initial = (emp.employeeName || emp.email || "A")[0]
                .toUpperCase();
              return (
                <tr key={emp.userId} className="tm-row">
                  <td>
                    <div className="emp-avatar"
                      style={{ background: avatarColor(initial) }}>
                      {initial}
                    </div>
                  </td>
                  <td className="tm-cell-name col-left">
                    {emp.employeeName}
                  </td>
                  <td className="tm-cell-muted">{emp.email}</td>
                  <td>
                    <span className={`emp-role ${roleClass(emp.role)}`}>
                      {emp.role || "Employee"}
                    </span>
                  </td>
                  <td>
                    <span className={`tm-access-badge ${emp.access === "Granted"
                      ? "tm-access-badge--granted"
                      : "tm-access-badge--denied"
                      }`}>
                      {emp.access}
                    </span>
                  </td>
                  <td>
                    <div className="tm-actions">
                      <button
                        className="tm-action-btn tm-action-btn--edit"
                        title="Toggle Access"
                        onClick={() => onEditAccess(emp)}>
                        <AccessIcon />
                      </button>
                      <button
                        className="tm-action-btn tm-action-btn--delete"
                        title="Remove Employee"
                        onClick={() => onRemoveUser(emp)}>
                        <DeleteIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════
export default function Tools() {
  const [activeTab, setActiveTab] = useState(null); // toolId string
  const [tools, setTools] = useState([]);   // ToolDto[]

  // Per-tool access lists: toolId -> ToolAccessDto[]
  const [accessMap, setAccessMap] = useState({});

  // All system users for dropdown
  const [allUsers, setAllUsers] = useState([]);

  const [loading, setLoading] = useState(true);

  // Dropdown visibility per tool
  const [showDropdown, setShowDropdown] = useState(false);

  // Access toggle modal
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [selEntry, setSelEntry] = useState(null);
  const [modalAccess, setModalAccess] = useState("Denied");
  const [saving, setSaving] = useState(false);

  // Remove confirm modal
  const [showDelModal, setShowDelModal] = useState(false);
  const [delEntry, setDelEntry] = useState(null);

  // ── Load tools + users ────────────────────────────────────────
  const loadTools = useCallback(async () => {
    try {
      setLoading(true);
      const [toolList, userList] = await Promise.all([
        apiCall("/tools"),
        apiCall("/users"),
      ]);
      setTools(toolList || []);
      setAllUsers((userList || []).map(u => ({
        id: u.id,
        fullName: u.fullName || u.email,
        email: u.email,
        role: u.role || "Employee",
      })));
      if (toolList && toolList.length > 0) {
        setActiveTab(toolList[0].id);
      }
    } catch (e) {
      console.error("Failed to load tools:", e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTools(); }, [loadTools]);

  // ── Load access list when tab changes ────────────────────────
  const loadAccess = useCallback(async (toolId) => {
    if (!toolId) return;
    try {
      const data = await apiCall(`/tools/${toolId}/access`);
      setAccessMap(prev => ({ ...prev, [toolId]: data || [] }));
    } catch (e) {
      console.error("Failed to load access:", e.message);
    }
  }, []);

  useEffect(() => {
    if (activeTab) loadAccess(activeTab);
  }, [activeTab, loadAccess]);

  const currentTool = tools.find(t => t.id === activeTab);
  const currentEntries = accessMap[activeTab] || [];

  // ── Add user to tool (sets initial Denied row) ────────────────
  const handleAddUser = useCallback(async (user) => {
    const tool = tools.find(t => t.id === activeTab);
    if (!tool) return;
    try {
      await apiCall("/tools/access", "POST", {
        toolId: activeTab,
        userId: user.id,
        access: "Denied",
      });
      await loadAccess(activeTab);
    } catch (e) {
      alert("Error adding user: " + e.message);
    }
  }, [activeTab, tools, loadAccess]);

  // ── Open access toggle modal ───────────────────────────────────
  const openAccessModal = (entry) => {
    setSelEntry(entry);
    setModalAccess(entry.access);
    setShowAccessModal(true);
  };

  const handleSaveAccess = async () => {
    if (!selEntry) return;
    setSaving(true);
    try {
      await apiCall("/tools/access", "POST", {
        toolId: activeTab,
        userId: selEntry.userId,
        access: modalAccess,
      });
      setShowAccessModal(false);
      await loadAccess(activeTab);
    } catch (e) {
      alert("Error saving access: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Remove user from tool ──────────────────────────────────────
  const handleRemoveUser = async () => {
    if (!delEntry) return;
    try {
      await apiCall(
        `/tools/${activeTab}/access/${delEntry.userId}`, "DELETE");
      setShowDelModal(false);
      await loadAccess(activeTab);
    } catch (e) {
      alert("Error removing user: " + e.message);
    }
  };

  // ── Render ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="tm-wrapper">
        <div style={{ padding: "40px", textAlign: "center", color: "#888" }}>
          Loading tools...
        </div>
      </div>
    );
  }

  return (
    <div className="tm-wrapper">

      {/* Header */}
      <div className="tm-page-header">
        <div className="tm-page-title">
          <span className="tm-icon">🔧</span>
          <h1>Tools Management</h1>
        </div>
      </div>

      {/* Tabs — one per tool from DB */}
      <div className="tm-tabs">
        {tools.map(t => (
          <button key={t.id}
            className={`tm-tab${activeTab === t.id ? " tm-tab--active" : ""}`}
            onClick={() => {
              setActiveTab(t.id);
              setShowDropdown(false);
            }}>
            <span className="tm-tab-icon">
              {t.name === "Digital Convertor" ? "💻" : "🔍"}
            </span>
            {t.name}
          </button>
        ))}
      </div>

      {/* Current tool table */}
      {currentTool && (
        <EmployeeTable
          entries={currentEntries}
          toolName={currentTool.name}
          allUsers={allUsers}
          onEditAccess={openAccessModal}
          onRemoveUser={entry => {
            setDelEntry(entry);
            setShowDelModal(true);
          }}
          showDropdown={showDropdown}
          setShowDropdown={setShowDropdown}
          onAddUser={handleAddUser}
        />
      )}

      {/* ── Access Toggle Modal ── */}
      {showAccessModal && selEntry && (
        <Modal title="Tool Access"
          onClose={() => setShowAccessModal(false)}>
          <div className="access-toggle-container">
            <span className="access-toggle-label">
              {activeTab === tools[0]?.id
                ? "Give Digital Convertor Tool access to"
                : "Give OCR Tool access to"}{" "}
              <strong>{selEntry.employeeName}</strong>
            </span>
            <label className="toggle-switch">
              <input type="checkbox"
                checked={modalAccess === "Granted"}
                onChange={() => setModalAccess(
                  prev => prev === "Granted" ? "Denied" : "Granted"
                )} />
              <span className="toggle-slider" />
            </label>
          </div>
          <p className="access-toggle-status">
            {modalAccess === "Granted"
              ? <span className="access-status--granted">
                ✓ Access will be granted
              </span>
              : <span className="access-status--revoked">
                ✗ Access will be revoked
              </span>
            }
          </p>
          <ModalActions
            onCancel={() => setShowAccessModal(false)}
            onConfirm={handleSaveAccess}
            confirmLabel="Save"
            disabled={saving}
          />
        </Modal>
      )}

      {/* ── Remove Confirm Modal ── */}
      {showDelModal && delEntry && (
        <Modal title="Remove Employee"
          onClose={() => setShowDelModal(false)}
          confirm>
          <p className="modal-confirm-text">
            Are you sure you want to remove{" "}
            <strong>{delEntry.employeeName}</strong> from{" "}
            <strong>{currentTool?.name}</strong>?
          </p>
          <ModalActions
            onCancel={() => setShowDelModal(false)}
            onConfirm={handleRemoveUser}
            confirmLabel="OK, Remove"
            danger
          />
        </Modal>
      )}
    </div>
  );
}
