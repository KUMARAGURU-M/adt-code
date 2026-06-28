import React, { useState, useEffect, useCallback } from "react";
import "./RolesPermission.css";

import { apiCall } from "../../utils/api";

// ── Constants ─────────────────────────────────────────────────────
const RESOURCES_LIST = [
  { id: "employees",   label: "Users/Employees",    icon: "👥" },
  { id: "attendance",  label: "Attendance",          icon: "📅" },
  { id: "projects",    label: "Projects",            icon: "📁" },
  { id: "jobs",        label: "Jobs",                icon: "🗂️" },
  { id: "leaves",      label: "Leaves",              icon: "🏖️" },
  { id: "tags",        label: "Tags",                icon: "🏷️" },
  { id: "tasks",       label: "Tasks",               icon: "✅" },
  { id: "processes",   label: "Processes",           icon: "⚙️" },
  { id: "shifts",      label: "Shifts",              icon: "⏱️" },
  { id: "timelogs",    label: "Time Logs",           icon: "➡️" },
  { id: "reports",     label: "Reports",             icon: "📈" },
  { id: "activitylogs",label: "Activity Logs",       icon: "📋" },
  { id: "roles",       label: "Roles & Permissions", icon: "🔐" },
  { id: "invoices",    label: "Invoices",            icon: "💰" },
];

const ACTIONS_LIST = [
  { id: "create",       label: "Create",       desc: "Create new records"     },
  { id: "update",       label: "Update",       desc: "Edit existing records"  },
  { id: "delete",       label: "Delete",       desc: "Delete records"         },
  { id: "approve",      label: "Approve",      desc: "Approve requests"       },
  { id: "export",       label: "Export",       desc: "Export data"            },
  { id: "manage_roles", label: "Manage Roles", desc: "Assign roles to users"  },
  { id: "manage_types", label: "Manage Types", desc: "Manage types/policies"  },
  { id: "bulk_import",  label: "Bulk Import",  desc: "Bulk import data"       },
];

// ── RolesPermission ───────────────────────────────────────────────
const RolesPermission = () => {
  const [roles,       setRoles]       = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading,     setLoading]     = useState(true);

  // Pagination for permissions
  const [permPage,       setPermPage]       = useState(0);
  const [permTotalPages, setPermTotalPages] = useState(0);
  const [permTotal,      setPermTotal]      = useState(0);
  const [permResource,   setPermResource]   = useState("");
  const [permSize,       setPermSize]       = useState(25);

  // Role modal
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole,     setEditingRole]     = useState(null);
  const [roleForm,        setRoleForm]        = useState({
    name: "", description: "", isActive: true
  });
  const [roleSaving,  setRoleSaving]  = useState(false);
  const [roleErrors,  setRoleErrors]  = useState({});

  // Delete modal
  const [isDeleteOpen,  setIsDeleteOpen]  = useState(false);
  const [deletingRole,  setDeletingRole]  = useState(null);
  const [deleting,      setDeleting]      = useState(false);

  // Assign permissions modal
  const [isAssignOpen,      setIsAssignOpen]      = useState(false);
  const [assigningRole,     setAssigningRole]     = useState(null);
  const [selectedPermIds,   setSelectedPermIds]   = useState([]);
  const [allPermsForAssign, setAllPermsForAssign] = useState([]);
  const [assignSaving,      setAssignSaving]      = useState(false);

  // Create permission modal
  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [permResources,   setPermResources]   = useState([]);
  const [permActions,     setPermActions]     = useState([]);
  const [permDesc,        setPermDesc]        = useState("");
  const [permActive,      setPermActive]      = useState(true);
  const [permSaving,      setPermSaving]      = useState(false);

  // ── Load data ─────────────────────────────────────────────────
  const loadRoles = useCallback(async () => {
    try {
      const data = await apiCall("/roles");
      setRoles(data || []);
    } catch (e) { console.error(e.message); }
  }, []);

  const loadPermissions = useCallback(async (page = 0, resource = "", size = permSize) => {
    try {
      const params = new URLSearchParams({ page, size });
      if (resource) params.set("resource", resource);
      const data = await apiCall(`/roles/permissions?${params}`);
      setPermissions(data.content || []);
      setPermTotalPages(data.totalPages || 0);
      setPermTotal(data.totalElements || 0);
      setPermPage(page);
    } catch (e) { console.error(e.message); }
  }, [permSize]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadRoles(), loadPermissions(0, "")]);
    setLoading(false);
  }, [loadRoles, loadPermissions]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Role handlers ─────────────────────────────────────────────
  const openAddRole = () => {
    setEditingRole(null);
    setRoleForm({ name:"", description:"", isActive:true });
    setRoleErrors({});
    setIsRoleModalOpen(true);
  };

  const openEditRole = (role) => {
    setEditingRole(role);
    setRoleForm({
      name:        role.name,
      description: role.description || "",
      isActive:    role.isActive,
    });
    setRoleErrors({});
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = async () => {
    const e = {};
    if (!roleForm.name.trim()) e.name = "Name is required.";
    if (Object.keys(e).length) { setRoleErrors(e); return; }
    setRoleSaving(true);
    try {
      if (editingRole) {
        await apiCall(`/roles/${editingRole.id}`, "PUT", roleForm);
      } else {
        await apiCall("/roles", "POST", roleForm);
      }
      setIsRoleModalOpen(false);
      await loadRoles();
    } catch (err) { alert("Error: " + err.message); }
    finally { setRoleSaving(false); }
  };

  const handleDeleteRole = async () => {
    setDeleting(true);
    try {
      await apiCall(`/roles/${deletingRole.id}`, "DELETE");
      setIsDeleteOpen(false);
      await loadRoles();
    } catch (err) { alert("Error: " + err.message); }
    finally { setDeleting(false); }
  };

  // ── Assign permissions ────────────────────────────────────────
  const openAssignModal = async (role) => {
    setAssigningRole(role);
    setAssignSaving(false);
    try {
      // Load all permissions for selection
      const all = await apiCall("/roles/permissions/all");
      setAllPermsForAssign(all || []);
      // Pre-select currently assigned permissions
      setSelectedPermIds(role.permissionIds || []);
    } catch (e) { console.error(e.message); }
    setIsAssignOpen(true);
  };

  const toggleAssignPerm = (permId) => {
    setSelectedPermIds(prev =>
      prev.includes(permId)
        ? prev.filter(id => id !== permId)
        : [...prev, permId]
    );
  };

  const handleSaveAssign = async () => {
    setAssignSaving(true);
    try {
      await apiCall(`/roles/${assigningRole.id}/permissions`, "PUT", {
        permissionIds: selectedPermIds,
      });
      setIsAssignOpen(false);
      await loadRoles();
    } catch (err) { alert("Error: " + err.message); }
    finally { setAssignSaving(false); }
  };

  const toggleAllPerms = () => {
    if (selectedPermIds.length === allPermsForAssign.length) {
      setSelectedPermIds([]);
    } else {
      setSelectedPermIds(allPermsForAssign.map(p => p.id));
    }
  };

  // ── Create permissions ────────────────────────────────────────
  const openPermModal = () => {
    setPermResources([]);
    setPermActions([]);
    setPermDesc("");
    setPermActive(true);
    setIsPermModalOpen(true);
  };

  const toggleResource = (id) => {
    setPermResources(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  const toggleAction = (id) => {
    setPermActions(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const handleSavePermissions = async () => {
    if (!permResources.length || !permActions.length) return;
    setPermSaving(true);
    try {
      await apiCall("/roles/permissions", "POST", {
        resources:   permResources,
        actions:     permActions,
        description: permDesc || null,
        isActive:    permActive,
      });
      setIsPermModalOpen(false);
      await loadPermissions(0, permResource);
    } catch (err) { alert("Error: " + err.message); }
    finally { setPermSaving(false); }
  };

  const handleDeletePermission = async (id) => {
    if (!window.confirm("Delete this permission?")) return;
    try {
      await apiCall(`/roles/permissions/${id}`, "DELETE");
      await loadPermissions(permPage, permResource);
    } catch (err) { alert("Error: " + err.message); }
  };

  const totalNewPerms = permResources.length * permActions.length;
  const allResourcesSel = permResources.length === RESOURCES_LIST.length;
  const allActionsSel   = permActions.length   === ACTIONS_LIST.length;
  const allAssignSel    = selectedPermIds.length === allPermsForAssign.length
                          && allPermsForAssign.length > 0;

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="rp-container">

      {/* Header */}
      <div className="rp-header-bar">
        <h2>
          <span role="img" aria-label="lock" style={{ marginRight:8 }}>
            🔐
          </span>
          Role & Permission Management
        </h2>
        <div className="rp-header-actions">
          <button className="rp-btn rp-btn-primary"
            onClick={openAddRole}>
            + Add Role
          </button>
          <button className="rp-btn rp-btn-success"
            onClick={openPermModal}>
            + Add Permission
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding:"40px", textAlign:"center", color:"#888" }}>
          Loading...
        </div>
      ) : (
        <>
          {/* ── Roles Grid ── */}
          <div className="rp-section">
            <h3 className="rp-section-title">Roles</h3>
            <div className="rp-grid rp-roles-grid">
              {roles.map(role => (
                <div key={role.id} className="rp-card">
                  <div className="rp-card-header">
                    <h4 className="rp-card-title">{role.name}</h4>
                    {role.isActive && (
                      <span className="rp-badge rp-badge-active">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="rp-card-body">
                    <p className="rp-card-desc">{role.description}</p>
                    <p className="rp-card-perm-count">
                      {role.permissionIds?.length ?? 0} permissions
                    </p>
                  </div>
                  <div className="rp-card-actions">
                    <button className="rp-icon-btn rp-icon-btn-edit"
                      onClick={() => openEditRole(role)}
                      title="Edit Role">✏️</button>
                    <button className="rp-icon-btn rp-icon-btn-assign"
                      onClick={() => openAssignModal(role)}
                      title="Assign Permissions">🔐</button>
                    <button className="rp-icon-btn rp-icon-btn-delete"
                      onClick={() => {
                        setDeletingRole(role);
                        setIsDeleteOpen(true);
                      }}
                      title="Delete Role">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Permissions Grid ── */}
          <div className="rp-section">
            <div className="rp-section-header">
              <h3 className="rp-section-title">Permissions</h3>
              <select className="rp-filter-select"
                value={permResource}
                onChange={e => {
                  setPermResource(e.target.value);
                  loadPermissions(0, e.target.value);
                }}>
                <option value="">All Resources</option>
                {RESOURCES_LIST.map(r => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className="rp-grid rp-permissions-grid">
              {permissions.length === 0 ? (
                <div style={{ gridColumn:"1/-1", textAlign:"center",
                              color:"#aaa", padding:"32px" }}>
                  No permissions found.
                  {" "}Click "+ Add Permission" to create some.
                </div>
              ) : permissions.map(perm => (
                <div key={perm.id} className="rp-perm-card">
                  <div className="rp-perm-card-header">
                    <h5 className="rp-perm-name">{perm.name}</h5>
                    <button
                      className="rp-perm-delete-btn"
                      onClick={() => handleDeletePermission(perm.id)}
                      title="Delete permission">🗑️</button>
                  </div>
                  <div className="rp-perm-id">
                    {perm.resource} · {perm.action}
                  </div>
                  <p className="rp-perm-desc">{perm.description}</p>
                  {!perm.isActive && (
                    <span style={{ fontSize:"0.7rem", color:"#dc2626" }}>
                      Inactive
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Permissions pagination */}
            {permTotal > 0 && (
              <div className="rp-pagination">
                <div className="rp-items-per-page">
                  <label>Items per page:</label>
                  <select
                    value={permSize}
                    onChange={e => {
                      const newSize = Number(e.target.value);
                      setPermSize(newSize);
                      loadPermissions(0, permResource, newSize);
                    }}
                  >
                    {[10, 25, 50, 100].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div className="rp-pagination-info">
                  Page {permPage + 1} of {permTotalPages}
                  {" "}({permTotal} total)
                </div>
                {permTotalPages > 1 && (
                  <div className="rp-pagination-controls">
                    <button disabled={permPage === 0}
                      onClick={() => loadPermissions(
                        permPage - 1, permResource)}>
                      ‹
                    </button>
                    {Array.from(
                      { length: Math.min(permTotalPages, 5) }, (_, i) => i
                    ).map(n => (
                      <button key={n}
                        className={permPage === n ? "rp-active-page" : ""}
                        onClick={() => loadPermissions(n, permResource)}>
                        {n + 1}
                      </button>
                    ))}
                    <button disabled={permPage >= permTotalPages - 1}
                      onClick={() => loadPermissions(
                        permPage + 1, permResource)}>
                      ›
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ══ DELETE ROLE MODAL ══ */}
      {isDeleteOpen && (
        <div className="rp-modal-overlay">
          <div className="rp-modal rp-modal-confirm">
            <div className="rp-modal-header rp-modal-header-danger">
              <div className="rp-confirm-icon">🗑️</div>
              <h2>Delete Role</h2>
            </div>
            <div className="rp-modal-body rp-confirm-body">
              <p className="rp-confirm-message">
                Are you sure you want to delete the role{" "}
                <strong>"{deletingRole?.name}"</strong>?
              </p>
              <p className="rp-confirm-warning">
                ⚠️ This action cannot be undone. All permissions
                assigned to this role will be removed.
              </p>
            </div>
            <div className="rp-modal-footer">
              <button className="rp-btn rp-btn-secondary"
                onClick={() => setIsDeleteOpen(false)}>
                Cancel
              </button>
              <button className="rp-btn rp-btn-danger"
                onClick={handleDeleteRole} disabled={deleting}>
                {deleting ? "Deleting..." : "Yes, Delete Role"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ CREATE / EDIT ROLE MODAL ══ */}
      {isRoleModalOpen && (
        <div className="rp-modal-overlay">
          <div className="rp-modal">
            <div className="rp-modal-header">
              <h2>{editingRole ? "Edit Role" : "Create Role"}</h2>
            </div>
            <div className="rp-modal-body">
              <div className="rp-form-group">
                <label>Name <span style={{ color:"red" }}>*</span></label>
                <input type="text"
                  value={roleForm.name}
                  onChange={e => setRoleForm(p =>
                    ({ ...p, name: e.target.value }))}
                  placeholder="e.g., Manager, Viewer" />
                {roleErrors.name && (
                  <span style={{ color:"red", fontSize:"0.8rem" }}>
                    {roleErrors.name}
                  </span>
                )}
              </div>
              <div className="rp-form-group">
                <label>Description</label>
                <textarea rows={4}
                  value={roleForm.description}
                  onChange={e => setRoleForm(p =>
                    ({ ...p, description: e.target.value }))}
                  placeholder="Role description" />
              </div>
              <div className="rp-form-checkbox">
                <input type="checkbox" id="roleActive"
                  checked={roleForm.isActive}
                  onChange={e => setRoleForm(p =>
                    ({ ...p, isActive: e.target.checked }))} />
                <label htmlFor="roleActive">Active</label>
              </div>
            </div>
            <div className="rp-modal-footer">
              <button className="rp-btn rp-btn-secondary"
                onClick={() => setIsRoleModalOpen(false)}>
                Cancel
              </button>
              <button className="rp-btn rp-btn-primary"
                onClick={handleSaveRole} disabled={roleSaving}>
                {roleSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ ASSIGN PERMISSIONS MODAL ══ */}
      {isAssignOpen && (
        <div className="rp-modal-overlay">
          <div className="rp-modal rp-modal-lg">
            <div className="rp-modal-header">
              <h2>Assign Permissions to {assigningRole?.name}</h2>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <span style={{ fontSize:"0.82rem", color:"#6b7280" }}>
                  {selectedPermIds.length}/{allPermsForAssign.length} selected
                </span>
                <button
                  className={`rp-btn rp-btn-select-all ${
                    allAssignSel ? "rp-btn-deselect" : ""
                  }`}
                  onClick={toggleAllPerms}>
                  {allAssignSel ? "✕ Deselect All" : "✓ Select All"}
                </button>
              </div>
            </div>
            <div className="rp-modal-body rp-modal-body-scrollable">
              {/* Group by resource */}
              {RESOURCES_LIST.map(res => {
                const resPerms = allPermsForAssign.filter(
                  p => p.resource === res.id);
                if (resPerms.length === 0) return null;
                return (
                  <div key={res.id} style={{ marginBottom:16 }}>
                    <div style={{
                      fontWeight:600, fontSize:"0.8rem",
                      color:"#6b7280", marginBottom:6,
                      textTransform:"uppercase", letterSpacing:"0.05em"
                    }}>
                      {res.icon} {res.label}
                    </div>
                    <div className="rp-grid rp-assign-perm-grid">
                      {resPerms.map(perm => (
                        <div key={perm.id}
                          className={`rp-assign-perm-item ${
                            selectedPermIds.includes(perm.id)
                              ? "selected" : ""
                          }`}
                          onClick={() => toggleAssignPerm(perm.id)}>
                          <input type="checkbox"
                            checked={selectedPermIds.includes(perm.id)}
                            readOnly />
                          <div className="rp-assign-perm-info">
                            <span className="rp-assign-perm-name">
                              {perm.name}
                            </span>
                            <span className="rp-assign-perm-id">
                              {perm.action}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {/* Permissions without a matching resource group */}
              {(() => {
                const resourceIds = RESOURCES_LIST.map(r => r.id);
                const others = allPermsForAssign.filter(
                  p => !resourceIds.includes(p.resource));
                if (others.length === 0) return null;
                return (
                  <div>
                    <div style={{
                      fontWeight:600, fontSize:"0.8rem",
                      color:"#6b7280", marginBottom:6
                    }}>
                      Other
                    </div>
                    <div className="rp-grid rp-assign-perm-grid">
                      {others.map(perm => (
                        <div key={perm.id}
                          className={`rp-assign-perm-item ${
                            selectedPermIds.includes(perm.id)
                              ? "selected" : ""
                          }`}
                          onClick={() => toggleAssignPerm(perm.id)}>
                          <input type="checkbox"
                            checked={selectedPermIds.includes(perm.id)}
                            readOnly />
                          <div className="rp-assign-perm-info">
                            <span className="rp-assign-perm-name">
                              {perm.name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="rp-modal-footer">
              <button className="rp-btn rp-btn-secondary"
                onClick={() => setIsAssignOpen(false)}>
                Cancel
              </button>
              <button className="rp-btn rp-btn-info"
                onClick={handleSaveAssign} disabled={assignSaving}>
                {assignSaving
                  ? "Saving..."
                  : `Assign ${selectedPermIds.length} Permissions`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ CREATE PERMISSION MODAL ══ */}
      {isPermModalOpen && (
        <div className="rp-modal-overlay">
          <div className="rp-modal rp-modal-lg rp-create-perm-modal">
            <div className="rp-modal-header">
              <h2>Create Permission</h2>
            </div>
            <div className="rp-modal-body rp-modal-body-scrollable">

              {/* Step 1: Resources */}
              <div className="rp-step-section">
                <div className="rp-step-header">
                  <h4>Step 1: Select Resource</h4>
                  <button
                    className={`rp-btn rp-btn-select-all ${
                      allResourcesSel ? "rp-btn-deselect" : ""
                    }`}
                    onClick={() => setPermResources(
                      allResourcesSel
                        ? []
                        : RESOURCES_LIST.map(r => r.id)
                    )}>
                    {allResourcesSel ? "✕ Deselect All" : "✓ Select All"}
                  </button>
                </div>
                <div className="rp-resource-grid">
                  {RESOURCES_LIST.map(res => (
                    <div key={res.id}
                      className={`rp-resource-item ${
                        permResources.includes(res.id) ? "selected" : ""
                      }`}
                      onClick={() => toggleResource(res.id)}>
                      <input type="checkbox"
                        checked={permResources.includes(res.id)}
                        readOnly />
                      <span className="rp-resource-icon">{res.icon}</span>
                      <span className="rp-resource-label">{res.label}</span>
                    </div>
                  ))}
                </div>
                {permResources.length > 0 && (
                  <div className="rp-step-count-badge">
                    {permResources.length} resource
                    {permResources.length !== 1 ? "s" : ""} selected
                  </div>
                )}
              </div>

              {/* Step 2: Actions */}
              <div className="rp-step-section" style={{ marginTop:20 }}>
                <div className="rp-step-header">
                  <h4>Step 2: Select Actions</h4>
                  <button
                    className={`rp-btn rp-btn-select-all ${
                      allActionsSel ? "rp-btn-deselect" : ""
                    }`}
                    onClick={() => setPermActions(
                      allActionsSel
                        ? []
                        : ACTIONS_LIST.map(a => a.id)
                    )}>
                    {allActionsSel ? "✕ Deselect All" : "✓ Select All"}
                  </button>
                </div>
                <div className="rp-action-grid">
                  {ACTIONS_LIST.map(action => (
                    <div key={action.id}
                      className={`rp-action-item ${
                        permActions.includes(action.id) ? "selected" : ""
                      }`}
                      onClick={() => toggleAction(action.id)}>
                      <input type="checkbox"
                        checked={permActions.includes(action.id)}
                        readOnly />
                      <div className="rp-action-info">
                        <span className="rp-action-label">
                          {action.label}
                        </span>
                        <span className="rp-action-desc">
                          {action.desc}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {permActions.length > 0 && (
                  <div className="rp-step-count-badge rp-step-count-badge-green">
                    {permActions.length} action
                    {permActions.length !== 1 ? "s" : ""} selected
                  </div>
                )}
              </div>

              {/* Preview */}
              {totalNewPerms > 0 && (
                <>
                  <div className="rp-summary-box" style={{ marginTop:20 }}>
                    <p>
                      <strong>Resources:</strong>{" "}
                      {permResources.map(r =>
                        RESOURCES_LIST.find(res => res.id === r)?.label
                      ).join(", ")}
                    </p>
                    <p>
                      <strong>Actions:</strong>{" "}
                      {permActions.map(a =>
                        ACTIONS_LIST.find(al => al.id === a)?.label
                      ).join(", ")}
                    </p>
                    <p className="rp-text-muted">
                      {totalNewPerms} permission
                      {totalNewPerms !== 1 ? "s" : ""} will be created
                      (duplicates skipped)
                    </p>
                  </div>

                  <div className="rp-generated-box" style={{ marginTop:16 }}>
                    <h5>📝 Auto-generated Names:</h5>
                    <div className="rp-generated-list">
                      {permResources.map(resource =>
                        permActions.map(action => (
                          <div key={`${resource}.${action}`}
                            className="rp-generated-name">
                            {resource}.{action}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}

              <div className="rp-form-group" style={{ marginTop:16 }}>
                <label>Description (Optional)</label>
                <textarea rows={3}
                  value={permDesc}
                  onChange={e => setPermDesc(e.target.value)}
                  placeholder="Optional description for these permissions" />
              </div>

              <div className="rp-form-checkbox" style={{ marginTop:8 }}>
                <input type="checkbox" id="permActive"
                  checked={permActive}
                  onChange={e => setPermActive(e.target.checked)} />
                <label htmlFor="permActive">Active</label>
              </div>
            </div>

            <div className="rp-modal-footer">
              <button className="rp-btn rp-btn-secondary"
                onClick={() => setIsPermModalOpen(false)}>
                Cancel
              </button>
              <button className="rp-btn rp-btn-success"
                onClick={handleSavePermissions}
                disabled={totalNewPerms === 0 || permSaving}>
                {permSaving
                  ? "Creating..."
                  : `Create ${totalNewPerms > 0 ? totalNewPerms : ""} Permission${totalNewPerms !== 1 ? "s" : ""}`
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesPermission;