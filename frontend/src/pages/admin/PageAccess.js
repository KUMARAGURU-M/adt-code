import React, { useState, useEffect } from 'react';
import './PageAccess.css';
import apiCall from '../../utils/api';

// ── Page definitions ──────────────────────────────────────────────
// Each page maps to the permission CODE that controls its visibility.
// Pages with permCode = null are always visible (no perm required).
const ALL_PAGES = [
  { name: 'DASHBOARD', icon: '📊', permCode: null, fixed: true },
  { name: 'USER', icon: '👥', permCode: 'employees.view' },
  { name: 'WORKWISE', icon: '➤', permCode: 'timelogs.view' },
  { name: 'DIGICONVERTOR', icon: '🔄', permCode: 'digiconvertor.view' },
  { name: 'ATTENDANCE', icon: '📅', permCode: 'attendance.view' },
  { name: 'PROJECT', icon: '📁', permCode: 'projects.view' },
  { name: 'BOOK/JOB', icon: '📖', permCode: 'jobs.view' },
  { name: 'PRODUCTION', icon: '🏭', permCode: 'production.view' },
  { name: 'TASK', icon: '✅', permCode: 'tasks.view' },
  { name: 'PROCESS', icon: '⚙️', permCode: 'processes.view' },
  { name: 'SHIFT', icon: '🕒', permCode: 'shifts.view' },
  { name: 'TOOL', icon: '🛠️', permCode: 'tools.view' },
  { name: 'LEAVE', icon: '🏖️', permCode: 'leaves.view' },
  { name: 'ROLE & PERMISSION', icon: '🔐', permCode: 'roles.view' },
  { name: 'REPORT', icon: '📈', permCode: 'reports.view' },
  { name: 'HOURLY GRAPH', icon: '📝', permCode: 'hourly_graph.view' },
  { name: 'ACTIVITY LOG', icon: '💻', permCode: 'activity_logs.view' },
  { name: 'TIME LOG', icon: '⏱️', permCode: 'timelogs.view_all' },
  { name: 'INVOICE', icon: '💰', permCode: 'invoices.view' },
  { name: 'CHAT MONITOR', icon: '💬', permCode: 'chat_monitor.view' },
  { name: 'SETTINGS', icon: '🛠️', permCode: 'settings.view' },
  { name: 'PAGE ACCESS', icon: '🔑', permCode: 'page_access.view' },
];

// ── Helpers ───────────────────────────────────────────────────────
function Toast({ message, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return <div className={`pa-toast ${type}`}>{message}</div>;
}

function PageGrid({ checkedCodes, deniedCodes = new Set(), roleCodes = new Set(), onToggle, disabled }) {
  return (
    <div className="pa-pages-grid">
      {ALL_PAGES.map(pg => {
        const isRoleInherited = pg.permCode && roleCodes.has(pg.permCode);
        const isChecked = pg.fixed || (pg.permCode && (
          (isRoleInherited && !deniedCodes.has(pg.permCode)) ||
          checkedCodes.has(pg.permCode)
        ));
        return (
          <div
            key={pg.name}
            className={`pa-page-card${isChecked ? ' checked' : ''}${pg.fixed ? ' fixed' : ''}${isRoleInherited ? ' role-inherited' : ''}`}
            onClick={() => {
              if (pg.fixed || disabled || !pg.permCode) return;
              onToggle(pg.permCode);
            }}
          >
            <span className="pa-page-icon">{pg.icon}</span>
            <div className="pa-page-label-container" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span className="pa-page-label">{pg.name}</span>
              {isRoleInherited && (
                <span className="pa-role-badge-mini" style={{
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  color: '#6366f1',
                  background: '#ede9fe',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  width: 'fit-content',
                  marginTop: '2px'
                }}>
                  via Role
                </span>
              )}
            </div>
            <div className="pa-checkbox">
              {isChecked && <span className="pa-checkbox-tick">✓</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// TAB 1 — By Role
// ─────────────────────────────────────────────────────────────────
function ByRoleTab() {
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [allPermissions, setAllPermissions] = useState([]);   // all Permission objects
  const [rolePermIds, setRolePermIds] = useState(new Set()); // current role's perm IDs
  const [checkedCodes, setCheckedCodes] = useState(new Set()); // page codes selected
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Load roles + all permissions once
  useEffect(() => {
    Promise.all([
      apiCall('/roles'),
      apiCall('/roles/permissions/all'),
    ]).then(([r, p]) => {
      setRoles(r || []);
      setAllPermissions(p || []);
    }).catch(console.error);
  }, []);

  // Build a map: code → id
  const codeToId = {};
  const idToCode = {};
  allPermissions.forEach(p => {
    codeToId[p.name] = p.id;
    idToCode[p.id] = p.name;
  });

  // When role selected — load its permissions
  const handleRoleChange = async (roleId) => {
    setSelectedRoleId(roleId);
    if (!roleId) { setCheckedCodes(new Set()); setRolePermIds(new Set()); return; }
    setLoading(true);
    try {
      const role = await apiCall(`/roles/${roleId}`);
      const ids = new Set(role.permissionIds || []);
      setRolePermIds(ids);
      // derive checked page codes
      const codes = new Set();
      ids.forEach(id => {
        const code = idToCode[id];
        if (code) codes.add(code);
      });
      setCheckedCodes(codes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleCode = (code) => {
    setCheckedCodes(prev => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedRoleId) return;
    setSaving(true);
    try {
      // Keep all existing non-page-view permissions,
      // replace page-view permissions with newly selected ones
      const pageViewCodes = new Set(
        ALL_PAGES.filter(p => p.permCode).map(p => p.permCode)
      );

      // Existing non-page-view perm IDs (keep as-is)
      const nonPagePermIds = [];
      rolePermIds.forEach(id => {
        const code = idToCode[id];
        if (!pageViewCodes.has(code)) nonPagePermIds.push(id);
      });

      // New page-view perm IDs (from checkedCodes)
      const pagePermIds = [];
      checkedCodes.forEach(code => {
        const id = codeToId[code];
        if (id) pagePermIds.push(id);
      });

      const newPermIds = [...new Set([...nonPagePermIds, ...pagePermIds])];

      await apiCall(`/roles/${selectedRoleId}/permissions`, 'PUT', {
        permissionIds: newPermIds,
      });
      setToast({ message: 'Role page access saved successfully!', type: 'success' });
    } catch (e) {
      setToast({ message: 'Failed to save: ' + e.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {toast && <Toast {...toast} onDone={() => setToast(null)} />}

      <div className="pa-info-banner">
        ℹ️ Select a role to manage which pages are accessible to users with that role.
        Existing action permissions (create, delete, etc.) will not be affected.
      </div>

      <div className="pa-selector-block">
        <label className="pa-selector-label">Select Role</label>
        <select
          className="pa-select"
          value={selectedRoleId}
          onChange={e => handleRoleChange(e.target.value)}
        >
          <option value="">— Choose a role —</option>
          {roles.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="pa-loading"><span className="pa-spinner" /> Loading permissions...</div>
      ) : !selectedRoleId ? (
        <div className="pa-placeholder">
          <div className="pa-placeholder-icon">🎭</div>
          <p>Select a role above to manage its page access.</p>
        </div>
      ) : (
        <>
          <div className="pa-section-label">Page Access for "{roles.find(r => r.id === selectedRoleId)?.name}"</div>
          <PageGrid checkedCodes={checkedCodes} onToggle={toggleCode} disabled={saving} />
          <div className="pa-footer">
            <button className="pa-btn-reset" onClick={() => handleRoleChange(selectedRoleId)}>
              Reset
            </button>
            <button className="pa-btn-save" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : '💾 Save Role Access'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// TAB 2 — By Employee
// ─────────────────────────────────────────────────────────────────
function ByEmployeeTab() {
  const [allEmployees, setAllEmployees] = useState([]);   // full list
  const [filterText, setFilterText] = useState('');   // local filter
  const [loadingEmps, setLoadingEmps] = useState(true);
  const [selectedEmp, setSelectedEmp] = useState(null);

  const [allPermissions, setAllPermissions] = useState([]);
  const [grantedCodes, setGrantedCodes] = useState(new Set());
  const [deniedCodes, setDeniedCodes] = useState(new Set());
  const [roleCodes, setRoleCodes] = useState(new Set());
  const [empLoading, setEmpLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Load all employees + all permissions on mount
  useEffect(() => {
    Promise.all([
      apiCall('/users?size=1000'),
      apiCall('/roles/permissions/all'),
    ]).then(([userData, perms]) => {
      const list = Array.isArray(userData)
        ? userData
        : (userData.content || []);
      setAllEmployees(list);
      setAllPermissions(perms || []);
    }).catch(console.error)
      .finally(() => setLoadingEmps(false));
  }, []);

  const codeToId = {};
  const idToCode = {};
  allPermissions.forEach(p => { codeToId[p.name] = p.id; idToCode[p.id] = p.name; });

  // Filtered list for the dropdown
  const filtered = filterText.trim()
    ? allEmployees.filter(e =>
      (e.fullName || '').toLowerCase().includes(filterText.toLowerCase()) ||
      (e.email || '').toLowerCase().includes(filterText.toLowerCase()) ||
      (e.userCode || '').toLowerCase().includes(filterText.toLowerCase())
    )
    : allEmployees;

  const handleSelectEmp = async (emp) => {
    if (!emp) { setSelectedEmp(null); setGrantedCodes(new Set()); setDeniedCodes(new Set()); setRoleCodes(new Set()); return; }
    setSelectedEmp(emp);
    setEmpLoading(true);
    try {
      const [directData, all] = await Promise.all([
        apiCall(`/user-page-access/${emp.id}`),
        apiCall(`/user-page-access/${emp.id}/all`),
      ]);
      const gSet = new Set(directData?.granted || []);
      const dSet = new Set(directData?.denied || []);
      const allSet = new Set(all || []);

      const roleSet = new Set();
      allSet.forEach(c => {
        if (!gSet.has(c)) roleSet.add(c);
      });
      dSet.forEach(c => {
        roleSet.add(c);
      });

      setGrantedCodes(gSet);
      setDeniedCodes(dSet);
      setRoleCodes(roleSet);
    } catch {
      setGrantedCodes(new Set());
      setDeniedCodes(new Set());
      setRoleCodes(new Set());
    } finally {
      setEmpLoading(false);
    }
  };

  const toggleCode = (code) => {
    const isRoleInherited = roleCodes.has(code);
    if (isRoleInherited) {
      setDeniedCodes(prev => {
        const next = new Set(prev);
        next.has(code) ? next.delete(code) : next.add(code);
        return next;
      });
    } else {
      setGrantedCodes(prev => {
        const next = new Set(prev);
        next.has(code) ? next.delete(code) : next.add(code);
        return next;
      });
    }
  };

  const handleSave = async () => {
    if (!selectedEmp) return;
    setSaving(true);
    try {
      const grantedIds = [];
      const deniedIds = [];
      grantedCodes.forEach(code => { const id = codeToId[code]; if (id) grantedIds.push(id); });
      deniedCodes.forEach(code => { const id = codeToId[code]; if (id) deniedIds.push(id); });

      await apiCall(`/user-page-access/${selectedEmp.id}/bulk`, 'PUT', {
        grantedIds,
        deniedIds,
      });
      setToast({ message: `Page access for ${selectedEmp.fullName || selectedEmp.email} saved!`, type: 'success' });
    } catch (e) {
      setToast({ message: 'Failed to save: ' + e.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  return (
    <div>
      {toast && <Toast {...toast} onDone={() => setToast(null)} />}

      <div className="pa-info-banner">
        ℹ️ Select an employee from the dropdown, then toggle which pages they can access directly.
        These grants are in addition any role-based permissions they already have.
      </div>

      {/* Employee selector */}
      <div className="pa-selector-block">
        <label className="pa-selector-label">Select Employee</label>

        {/* Filter input */}
        <input
          className="pa-filter-input"
          placeholder="Type to filter by name, email or code..."
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
          disabled={loadingEmps}
        />

        {/* Dropdown */}
        {loadingEmps ? (
          <div className="pa-loading"><span className="pa-spinner" /> Loading employees...</div>
        ) : (
          <select
            className="pa-select"
            value={selectedEmp?.id || ''}
            onChange={e => {
              const emp = allEmployees.find(em => em.id === e.target.value) || null;
              handleSelectEmp(emp);
            }}
          >
            <option value="">— Choose an employee —</option>
            {filtered.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.fullName || emp.email}
                {emp.userCode ? ` (${emp.userCode})` : ''}
                {emp.role ? ` — ${emp.role}` : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Selected employee card */}
      {selectedEmp && !empLoading && (
        <div className="pa-emp-card">
          <div className="pa-emp-avatar">{getInitials(selectedEmp.fullName || selectedEmp.email)}</div>
          <div className="pa-emp-info">
            <div className="pa-emp-name">{selectedEmp.fullName || selectedEmp.email}</div>
            <div className="pa-emp-meta">{selectedEmp.userCode} · {selectedEmp.email}</div>
          </div>
          {selectedEmp.role && <span className="pa-emp-role-badge">{selectedEmp.role}</span>}
        </div>
      )}

      {/* Page access toggles */}
      {empLoading ? (
        <div className="pa-loading"><span className="pa-spinner" /> Loading employee access...</div>
      ) : selectedEmp ? (
        <>
          <div className="pa-section-label">
            Direct Page Access for "{selectedEmp.fullName || selectedEmp.email}"
          </div>
          <PageGrid checkedCodes={grantedCodes} deniedCodes={deniedCodes} roleCodes={roleCodes} onToggle={toggleCode} disabled={saving} />
          <div className="pa-footer">
            <button className="pa-btn-reset" onClick={() => handleSelectEmp(selectedEmp)}>Reset</button>
            <button className="pa-btn-save" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : '💾 Save Employee Access'}
            </button>
          </div>
        </>
      ) : !loadingEmps ? (
        <div className="pa-placeholder">
          <div className="pa-placeholder-icon">👤</div>
          <p>Select an employee above to manage their direct page access.</p>
        </div>
      ) : null}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────
export default function PageAccess({ hideHeader = false }) {
  const [activeTab, setActiveTab] = useState('role');

  return (
    <div className="pa-container">
      {/* Header */}
      {!hideHeader && (
        <div className="pa-header">
          <div className="pa-header-icon">🔑</div>
          <div>
            <h1>Page Access Management</h1>
            <p>Control which pages each role or employee can access in the system.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="pa-tabs">
        <button
          className={`pa-tab${activeTab === 'role' ? ' active' : ''}`}
          onClick={() => setActiveTab('role')}
        >
          🎭 By Role
        </button>
        <button
          className={`pa-tab${activeTab === 'employee' ? ' active' : ''}`}
          onClick={() => setActiveTab('employee')}
        >
          👤 By Employee
        </button>
      </div>

      {/* Content */}
      <div className="pa-card">
        {activeTab === 'role' ? <ByRoleTab /> : <ByEmployeeTab />}
      </div>
    </div>
  );
}
