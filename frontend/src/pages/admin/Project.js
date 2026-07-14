import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import "./Project.css";
import { apiCall } from "../../utils/api";


// ── Constants ─────────────────────────────────────────────────────
const BILLING_TYPES = ["Per Page", "Hourly", "Per Article", "Per KB"];
const COMPLEXITY_LEVELS = ["Simple", "Medium", "Complex", "Heavy Complex"];

const emptyForm = {
  name: "",
  description: "",
  billingType: "Per Page",
  complexity: "Medium",
  ratePerPage: "0.00",
  hourlyRate: "0.00",
  active: true,
  workflowId: "",
  complexitiesSelected: {
    "Simple": false,
    "Medium": false,
    "Complex": false,
    "Heavy Complex": false
  },
  complexityRates: {
    "Simple": "0.00",
    "Medium": "0.00",
    "Complex": "0.00",
    "Heavy Complex": "0.00"
  }
};

// ── Helpers ───────────────────────────────────────────────────────
const getComplexityClass = (value) => {
  if (!value) return "";
  const val = value.toLowerCase().replace(/\s+/g, "");
  if (val.includes("simple")) return "complexity-simple";
  if (val.includes("heavycomplex")) return "complexity-heavycomplex";
  if (val.includes("complex")) return "complexity-complex";
  if (val.includes("medium")) return "complexity-medium";
  return "";
};

// Map backend response → frontend shape
const mapProject = (p) => ({
  id: p.id,
  name: p.name,
  description: p.description || "",
  billingType: p.type,
  complexity: p.complexityLevel,
  rate: p.ratePerPage && parseFloat(p.ratePerPage) > 0
    ? `₹${parseFloat(p.ratePerPage).toFixed(2)}`
    : "-",
  rateRaw: p.ratePerPage || "0.00",
  hourlyRate: p.hourlyRate || "0.00",
  clientId: p.clientId || null,
  clientName: p.clientName || null,
  workflowId: p.workflowId || "",
  workflowName: p.workflowName || null,
  status: p.isActive ? "Active" : "Inactive",
});

// ═════════════════════════════════════════════════════════════════
export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientDraft, setClientDraft] = useState({ name: "", address: "" });

  // Workflows state
  const [workflows, setWorkflows] = useState([]);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [workflowDraftName, setWorkflowDraftName] = useState("");
  const [editingWorkflowId, setEditingWorkflowId] = useState(null);
  const [editingWorkflowName, setEditingWorkflowName] = useState("");

  // Clients management state
  const [showClientManagerModal, setShowClientManagerModal] = useState(false);
  const [clientDraftName, setClientDraftName] = useState("");
  const [clientDraftAddress, setClientDraftAddress] = useState("");
  const [editingClientId, setEditingClientId] = useState(null);
  const [editingClientName, setEditingClientName] = useState("");
  const [editingClientAddress, setEditingClientAddress] = useState("");

  const location = useLocation();

  // ── Load data ──────────────────────────────────────────────
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await apiCall("/projects/all");
      setProjects(data.map(mapProject));
    } catch (err) {
      setError("Failed to load projects: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadClients = useCallback(async () => {
    try {
      const data = await apiCall("/clients");
      setClients(data);
    } catch (err) {
      console.warn("Could not load clients:", err.message);
    }
  }, []);

  const loadWorkflows = useCallback(async () => {
    try {
      const data = await apiCall("/projects/workflows");
      setWorkflows(data);
    } catch (err) {
      console.warn("Could not load workflows:", err.message);
    }
  }, []);

  useEffect(() => {
    loadProjects();
    loadClients();
    loadWorkflows();
  }, [loadProjects, loadClients, loadWorkflows]);

  useEffect(() => {
    if (location.state?.openAddProject) {
      handleOpenAdd();
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // ── Pagination ─────────────────────────────────────────────
  const totalItems = projects.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedProjects = projects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ── Workflow CRUD Handlers ─────────────────────────────────
  const handleCreateWorkflow = async () => {
    if (!workflowDraftName.trim()) {
      alert("Task Name is required.");
      return;
    }
    try {
      await apiCall("/projects/workflows", "POST", { name: workflowDraftName.trim() });
      setWorkflowDraftName("");
      loadWorkflows();
    } catch (err) {
      alert("Error creating Task Name: " + err.message);
    }
  };

  const handleUpdateWorkflow = async (id) => {
    if (!editingWorkflowName.trim()) {
      alert("Task Name is required.");
      return;
    }
    try {
      await apiCall(`/projects/workflows/${id}`, "PUT", { name: editingWorkflowName.trim() });
      setEditingWorkflowId(null);
      setEditingWorkflowName("");
      loadWorkflows();
      loadProjects();
    } catch (err) {
      alert("Error updating Task Name: " + err.message);
    }
  };

  const handleDeleteWorkflow = async (id) => {
    if (!window.confirm("Are you sure you want to delete this Task Name?")) {
      return;
    }
    try {
      await apiCall(`/projects/workflows/${id}`, "DELETE");
      loadWorkflows();
      loadProjects();
    } catch (err) {
      alert("Error deleting Task Name: " + err.message);
    }
  };

  // ── Client CRUD Handlers in Manager ────────────────────────
  const handleCreateClientInManager = async () => {
    if (!clientDraftName.trim()) {
      alert("Client name is required.");
      return;
    }
    try {
      await apiCall("/clients", "POST", {
        companyName: clientDraftName.trim(),
        addressLine1: clientDraftAddress.trim()
      });
      setClientDraftName("");
      setClientDraftAddress("");
      loadClients();
    } catch (err) {
      alert("Error creating client: " + err.message);
    }
  };

  const handleUpdateClientInManager = async (id) => {
    if (!editingClientName.trim()) {
      alert("Client name is required.");
      return;
    }
    try {
      await apiCall(`/clients/${id}`, "PUT", {
        companyName: editingClientName.trim(),
        addressLine1: editingClientAddress.trim()
      });
      setEditingClientId(null);
      setEditingClientName("");
      setEditingClientAddress("");
      loadClients();
      loadProjects();
    } catch (err) {
      alert("Error updating client: " + err.message);
    }
  };

  const handleDeleteClientInManager = async (id) => {
    if (!window.confirm("Are you sure you want to delete this client?")) {
      return;
    }
    try {
      await apiCall(`/clients/${id}`, "DELETE");
      loadClients();
      loadProjects();
    } catch (err) {
      alert("Error deleting client: " + err.message);
    }
  };

  // ── Validation ─────────────────────────────────────────────
  const validate = (f, isEdit = false) => {
    const e = {};
    if (!f.name.trim()) e.name = "Project is required.";
    if (!f.billingType) e.billingType = "Billing Type is required.";
    if (isEdit) {
      if (!f.complexity) e.complexity = "Complexity Level is required.";
      if (!f.ratePerPage || isNaN(f.ratePerPage) || parseFloat(f.ratePerPage) < 0) {
        e.ratePerPage = "Valid rate required.";
      }
    } else {
      const selected = Object.keys(f.complexitiesSelected || {}).filter(
        c => f.complexitiesSelected[c]
      );
      if (selected.length === 0) {
        e.complexities = "At least one complexity level must be selected.";
      } else {
        selected.forEach(comp => {
          const r = f.complexityRates?.[comp];
          if (!r || isNaN(r) || parseFloat(r) < 0) {
            e[`rate_${comp}`] = "Valid rate required.";
          }
        });
      }
    }
    return e;
  };

  // ── Add ────────────────────────────────────────────────────
  const handleOpenAdd = () => {
    setForm(emptyForm);
    setErrors({});
    setShowAddModal(true);
  };

  const handleCreate = async () => {
    const e = validate(form, false);
    if (Object.keys(e).length) { setErrors(e); return; }
    try {
      setSaving(true);
      const selected = Object.keys(form.complexitiesSelected || {}).filter(
        c => form.complexitiesSelected[c]
      );

      for (const comp of selected) {
        const rate = parseFloat(form.complexityRates?.[comp]) || 0;
        await apiCall("/projects", "POST", {
          name: `${form.name.trim()}`,
          description: form.description || null,
          type: form.billingType,
          complexityLevel: comp,
          ratePerPage: rate,
          hourlyRate: parseFloat(form.hourlyRate) || null,
          clientId: form.clientId || null,
          workflowId: form.workflowId || null,
          isActive: form.active,
        });
      }

      await loadProjects();
      setShowAddModal(false);
    } catch (err) {
      alert("Error creating project: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Edit ───────────────────────────────────────────────────
  const handleOpenEdit = (project) => {
    setSelectedProject(project);
    setForm({
      name: project.name,
      description: project.description || "",
      billingType: project.billingType,
      complexity: project.complexity,
      ratePerPage: parseFloat(project.rateRaw || 0).toFixed(2),
      hourlyRate: parseFloat(project.hourlyRate || 0).toFixed(2),
      clientId: project.clientId || null,
      workflowId: project.workflowId || "",
      active: project.status === "Active",
      complexitiesSelected: {
        "Simple": false,
        "Medium": false,
        "Complex": false,
        "Heavy Complex": false
      },
      complexityRates: {
        "Simple": "0.00",
        "Medium": "0.00",
        "Complex": "0.00",
        "Heavy Complex": "0.00"
      }
    });
    setErrors({});
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    const e = validate(form, true);
    if (Object.keys(e).length) { setErrors(e); return; }
    try {
      setSaving(true);
      await apiCall(`/projects/${selectedProject.id}`, "PUT", {
        name: form.name.trim(),
        description: form.description || null,
        type: form.billingType,
        complexityLevel: form.complexity,
        ratePerPage: parseFloat(form.ratePerPage) || 0,
        hourlyRate: parseFloat(form.hourlyRate) || null,
        clientId: form.clientId || null,
        workflowId: form.workflowId || null,
        isActive: form.active,
      });
      await loadProjects();
      setShowEditModal(false);
    } catch (err) {
      alert("Error updating project: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────
  const handleOpenDelete = (project) => {
    setSelectedProject(project);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    try {
      await apiCall(`/projects/${selectedProject.id}`, "DELETE");
      await loadProjects();
      setShowDeleteConfirm(false);
    } catch (err) {
      alert("Error deleting project: " + err.message);
    }
  };

  const handleSaveClient = async () => {
    if (!clientDraft.name.trim()) {
      alert("Company Name is required.");
      return;
    }
    try {
      const created = await apiCall('/clients', 'POST', {
        companyName: clientDraft.name.trim(),
        addressLine1: clientDraft.address.trim()
      });
      await loadClients();
      setForm(prev => ({ ...prev, clientId: created.id }));
      setShowClientModal(false);
      setClientDraft({ name: "", address: "" });
    } catch (err) {
      alert("Error saving client: " + err.message);
    }
  };



  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  // ── Render ─────────────────────────────────────────────────
  if (loading) return (
    <div className="pm-wrapper">
      <div style={{ padding: "40px", textAlign: "center", color: "#888" }}>
        Loading projects...
      </div>
    </div>
  );

  if (error) return (
    <div className="pm-wrapper">
      <div style={{ padding: "40px", textAlign: "center", color: "red" }}>
        {error}
        <br />
        <button onClick={loadProjects} style={{ marginTop: "12px" }}>
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="pm-wrapper">

      {/* ── Header ── */}
      <div className="pm-header">
        <div className="pm-title">
          <svg className="pm-folder-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24" fill="#f6ad55"
            width="22" height="22">
            <path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0
                     0 2-2V8a2 2 0 0 0-2-2h-8l-2-2z"/>
          </svg>
          <h1>Project Management</h1>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn-add-project" style={{ background: "#038e52ff" }} onClick={() => setShowClientManagerModal(true)}>
            💼 Manage Client
          </button>
          <button className="btn-add-project" style={{ background: "#4a5568" }} onClick={() => setShowWorkflowModal(true)}>
            ⚙️ Manage Task Name
          </button>
          <button className="btn-add-project" onClick={handleOpenAdd}>
            + Add Project
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="pm-table-container">
        <table className="pm-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Project</th>
              <th>Task Name</th>
              <th>Type</th>
              <th>Complexity</th>
              <th>Rate</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProjects.length === 0 ? (
              <tr>
                <td colSpan={8} className="pm-empty">
                  No projects found. Click "+ Add Project" to create one.
                </td>
              </tr>
            ) : paginatedProjects.map((project) => (
              <tr key={project.id} className="pm-row">
                <td className="pm-client">{project.clientName || "-"}</td>
                <td className="pm-name">{project.name}</td>
                <td className="pm-workflow">
                  {project.workflowName ? (
                    <span className="badge badge--workflow" style={{ background: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd", fontWeight: 700 }}>
                      {project.workflowName}
                    </span>
                  ) : (
                    "-"
                  )}
                </td>
                <td>
                  <span className="badge badge--billing">
                    {project.billingType}
                  </span>
                </td>
                <td>
                  <span className={`badge ${getComplexityClass(
                    project.complexity)}`}>
                    {project.complexity}
                  </span>
                </td>
                <td className="pm-rate">{project.rate}</td>
                <td>
                  <span className={`badge badge--status ${project.status === "Active"
                    ? "badge--active"
                    : "badge--inactive"
                    }`}>
                    {project.status}
                  </span>
                </td>
                <td className="pm-actions">
                  <button
                    className="action-btn action-btn--edit"
                    onClick={() => handleOpenEdit(project)}
                    title="Edit"
                  >✏️</button>
                  <button
                    className="action-btn action-btn--delete"
                    onClick={() => handleOpenDelete(project)}
                    title="Delete"
                  >🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      <div className="pm-pagination">
        <div className="pm-pagination-left">
          <label>Items per page:</label>
          <select
            value={itemsPerPage}
            onChange={e => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            {[10, 25, 50, 100].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div className="pm-pagination-right">
          {totalPages > 1 && (
            <>
              <button
                className="page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >‹</button>
              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >›</button>
            </>
          )}
          <span className="page-count">
            Showing {Math.min(
              (currentPage - 1) * itemsPerPage + 1, totalItems
            )} to {Math.min(
              currentPage * itemsPerPage, totalItems
            )} of {totalItems} items
          </span>
        </div>
      </div>

      {/* ── Add Modal ── */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Add New Project</h2>
            <ProjectForm
              form={form}
              errors={errors}
              onChange={handleFormChange}
              showActive={false}
              clients={clients}
              workflows={workflows}
              onAddClient={() => setShowClientManagerModal(true)}
              onAddWorkflow={() => setShowWorkflowModal(true)}
            />
            <div className="modal-actions">
              <button className="btn-cancel"
                onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button className="btn-submit"
                onClick={handleCreate}
                disabled={saving}>
                {saving ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Edit Project</h2>
            <ProjectForm
              form={form}
              errors={errors}
              onChange={handleFormChange}
              showActive={true}
              clients={clients}
              workflows={workflows}
              onAddClient={() => setShowClientManagerModal(true)}
              onAddWorkflow={() => setShowWorkflowModal(true)}
            />
            <div className="modal-actions">
              <button className="btn-cancel"
                onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
              <button className="btn-submit"
                onClick={handleUpdate}
                disabled={saving}>
                {saving ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {showDeleteConfirm && (
        <div className="modal-overlay"
          onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal modal--confirm"
            onClick={e => e.stopPropagation()}>
            <div className="confirm-icon">⚠️</div>
            <h2 className="modal-title">Delete Project</h2>
            <p className="confirm-text">
              Are you sure you want to delete{" "}
              <strong>{selectedProject?.name}</strong>?
              This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="btn-cancel"
                onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button className="btn-danger" onClick={handleDelete}>
                OK, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Client Modal ── */}
      {showClientModal && (
        <div className="modal-overlay" onClick={() => setShowClientModal(false)} style={{ zIndex: 3000 }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Add New Client</h2>
            <div className="form-body">
              <div className="form-group">
                <label className="form-label">
                  Company Name <span className="required">*</span>
                </label>
                <input
                  className="form-input"
                  value={clientDraft.name}
                  onChange={e => setClientDraft(d => ({ ...d, name: e.target.value }))}
                  placeholder="Company name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Company Address</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={clientDraft.address}
                  onChange={e => setClientDraft(d => ({ ...d, address: e.target.value }))}
                  placeholder="Full address"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowClientModal(false)}>
                Cancel
              </button>
              <button className="btn-submit" onClick={handleSaveClient}>
                Add Client
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Workflow Management Modal ── */}
      {showWorkflowModal && (
        <div className="modal-overlay" onClick={() => setShowWorkflowModal(false)} style={{ zIndex: 2000 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <h2 className="modal-title">Manage Task Name</h2>

            {/* Create new workflow form */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <input
                className="form-input"
                style={{ flex: 1, marginBottom: 0 }}
                placeholder="New Task Name..."
                value={workflowDraftName}
                onChange={e => setWorkflowDraftName(e.target.value)}
              />
              <button className="btn-submit" style={{ marginTop: 0, padding: "8px 16px" }} onClick={handleCreateWorkflow}>
                Add
              </button>
            </div>

            <div style={{ maxHeight: "250px", overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "6px" }}>
              {workflows.length === 0 ? (
                <div style={{ padding: "16px", textAlign: "center", color: "#a0aec0" }}>
                  No Task Names defined yet.
                </div>
              ) : (
                workflows.map(w => (
                  <div key={w.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderBottom: "1px solid #e2e8f0" }}>
                    {editingWorkflowId === w.id ? (
                      <input
                        className="form-input"
                        style={{ flex: 1, marginBottom: 0, padding: "4px 8px", fontSize: "13px" }}
                        value={editingWorkflowName}
                        onChange={e => setEditingWorkflowName(e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <span style={{ fontSize: "14px", color: "#2d3748" }}>{w.name}</span>
                    )}

                    <div style={{ display: "flex", gap: "6px" }}>
                      {editingWorkflowId === w.id ? (
                        <>
                          <button
                            className="action-btn"
                            onClick={() => handleUpdateWorkflow(w.id)}
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px" }}
                            title="Save"
                          >
                            💾
                          </button>
                          <button
                            className="action-btn"
                            onClick={() => {
                              setEditingWorkflowId(null);
                              setEditingWorkflowName("");
                            }}
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px" }}
                            title="Cancel"
                          >
                            ❌
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="action-btn"
                            onClick={() => {
                              setEditingWorkflowId(w.id);
                              setEditingWorkflowName(w.name);
                            }}
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px" }}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            className="action-btn"
                            onClick={() => handleDeleteWorkflow(w.id)}
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px" }}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: "16px" }}>
              <button className="btn-cancel" onClick={() => setShowWorkflowModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Client Management Modal ── */}
      {showClientManagerModal && (
        <div className="modal-overlay" onClick={() => setShowClientManagerModal(false)} style={{ zIndex: 2000 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: "600px" }}>
            <h2 className="modal-title">Manage Client</h2>

            {/* Create new client form */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px", background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <h4 style={{ margin: 0, fontSize: "13px", color: "#475569" }}>Add Client</h4>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  className="form-input"
                  style={{ flex: 1, marginBottom: 0 }}
                  placeholder="Client Name..."
                  value={clientDraftName}
                  onChange={e => setClientDraftName(e.target.value)}
                />
                <input
                  className="form-input"
                  style={{ flex: 1, marginBottom: 0 }}
                  placeholder="Client Address (Optional)..."
                  value={clientDraftAddress}
                  onChange={e => setClientDraftAddress(e.target.value)}
                />
                <button className="btn-submit" style={{ marginTop: 0, padding: "8px 16px" }} onClick={handleCreateClientInManager}>
                  Add
                </button>
              </div>
            </div>

            <div style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "6px" }}>
              {clients.length === 0 ? (
                <div style={{ padding: "16px", textAlign: "center", color: "#a0aec0" }}>
                  No client defined yet.
                </div>
              ) : (
                clients.map(c => (
                  <div key={c.id} style={{ display: "flex", flexDirection: "column", padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>
                    {editingClientId === c.id ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <input
                            className="form-input"
                            style={{ flex: 1, marginBottom: 0, padding: "4px 8px", fontSize: "13px" }}
                            value={editingClientName}
                            onChange={e => setEditingClientName(e.target.value)}
                            placeholder="Client Name..."
                            autoFocus
                          />
                          <input
                            className="form-input"
                            style={{ flex: 1, marginBottom: 0, padding: "4px 8px", fontSize: "13px" }}
                            value={editingClientAddress}
                            onChange={e => setEditingClientAddress(e.target.value)}
                            placeholder="Client Address..."
                          />
                          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            <button
                              className="action-btn"
                              onClick={() => handleUpdateClientInManager(c.id)}
                              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px" }}
                              title="Save"
                            >
                              💾
                            </button>
                            <button
                              className="action-btn"
                              onClick={() => {
                                setEditingClientId(null);
                                setEditingClientName("");
                                setEditingClientAddress("");
                              }}
                              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px" }}
                              title="Cancel"
                            >
                              ❌
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: "14px", fontWeight: 600, color: "#2d3748" }}>{c.companyName}</span>
                          {c.addressLine1 && (
                            <span style={{ fontSize: "11px", color: "#718096" }}>{c.addressLine1}</span>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            className="action-btn"
                            onClick={() => {
                              setEditingClientId(c.id);
                              setEditingClientName(c.companyName);
                              setEditingClientAddress(c.addressLine1 || "");
                            }}
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px" }}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            className="action-btn"
                            onClick={() => handleDeleteClientInManager(c.id)}
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px" }}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: "16px" }}>
              <button className="btn-cancel" onClick={() => setShowClientManagerModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ProjectForm Component ─────────────────────────────────────────
function ProjectForm({ form, errors, onChange, showActive, clients = [], workflows = [], onAddClient, onAddWorkflow }) {
  return (
    <div className="form-body">

      {/* Name */}
      <div className="form-group">
        <label className="form-label">
          Project <span className="required">*</span>
        </label>
        <input
          className={`form-input ${errors.name ? "form-input--error" : ""}`}
          value={form.name}
          onChange={e => onChange("name", e.target.value)}
          placeholder="Project"
        />
        {errors.name && (
          <span className="form-error">{errors.name}</span>
        )}
      </div>

      {/* Description */}
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea
          className="form-textarea"
          value={form.description}
          onChange={e => onChange("description", e.target.value)}
          rows={3}
          placeholder="Optional description..."
        />
      </div>

      {/* Client (optional) */}
      <div className="form-group">
        <label className="form-label">Client (Optional)</label>
        <div style={{ display: "flex", gap: "8px" }}>
          <select
            className="form-select"
            value={form.clientId || ""}
            onChange={e =>
              onChange("clientId", e.target.value || null)
            }
            style={{ flex: 1 }}
          >
            <option value="">-- No Client --</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.companyName}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn-submit"
            onClick={onAddClient}
            style={{
              padding: "9px 15px",
              fontSize: "0.82rem",
              whiteSpace: "nowrap",
              marginTop: 0,
              background: "#00a3ff",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 700
            }}
          >
            + Manage Client
          </button>
        </div>
      </div>

      {/* Workflow (optional) */}
      <div className="form-group">
        <label className="form-label">Task Name (Optional)</label>
        <div style={{ display: "flex", gap: "8px" }}>
          <select
            className={`form-select ${errors.workflowId ? "form-select--error" : ""}`}
            value={form.workflowId || ""}
            onChange={e => onChange("workflowId", e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="">-- No Task Name --</option>
            {workflows.map(w => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn-submit"
            onClick={onAddWorkflow}
            style={{
              padding: "9px 15px",
              fontSize: "0.82rem",
              whiteSpace: "nowrap",
              marginTop: 0,
              background: "#4a5568",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 700
            }}
          >
            + Add Task Name
          </button>
        </div>
      </div>

      {/* Billing Type */}
      <div className="form-group">
        <label className="form-label">
          Type <span className="required">*</span>
        </label>
        <select
          className={`form-select ${errors.billingType ? "form-input--error" : ""
            }`}
          value={form.billingType}
          onChange={e => onChange("billingType", e.target.value)}
        >
          {BILLING_TYPES.map(t => (
            <option key={t}>{t}</option>
          ))}
        </select>
        {errors.billingType && (
          <span className="form-error">{errors.billingType}</span>
        )}
      </div>

      {!showActive ? (
        <div className="form-group">
          <label className="form-label" style={{ fontWeight: 600, marginBottom: "8px" }}>
            Complexity Levels & Rates <span className="required">*</span>
          </label>
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            background: "#f8fafc",
            padding: "12px",
            borderRadius: "6px",
            border: "1px solid #edf2f7"
          }}>
            {COMPLEXITY_LEVELS.map(comp => {
              const isChecked = form.complexitiesSelected?.[comp] || false;
              const rateVal = form.complexityRates?.[comp] || "0.00";
              const rateErr = errors[`rate_${comp}`];

              return (
                <div key={comp} style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  padding: "6px",
                  borderRadius: "4px",
                  background: isChecked ? "#fff" : "transparent",
                  border: isChecked ? "1px solid #edf2f7" : "1px solid transparent"
                }}>
                  <label className="checkbox-label" style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    margin: 0,
                    flex: 1
                  }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={e => {
                        const updatedSelected = { ...form.complexitiesSelected, [comp]: e.target.checked };
                        onChange("complexitiesSelected", updatedSelected);
                        onChange("complexities", undefined);
                      }}
                    />
                    <span className={`badge ${getComplexityClass(comp)}`}>
                      {comp}
                    </span>
                  </label>

                  <div style={{ display: "flex", flexDirection: "column", width: "120px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ fontSize: "0.82rem", color: "#a0aec0" }}>₹</span>
                      <input
                        className={`form-input ${rateErr ? "form-input--error" : ""}`}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={rateVal}
                        disabled={!isChecked}
                        onChange={e => {
                          const updatedRates = { ...form.complexityRates, [comp]: e.target.value };
                          onChange("complexityRates", updatedRates);
                          onChange(`rate_${comp}`, undefined);
                        }}
                        style={{
                          margin: 0,
                          padding: "5px 8px",
                          fontSize: "0.82rem",
                          textAlign: "right",
                          background: isChecked ? "#fff" : "#edf2f7",
                          cursor: isChecked ? "text" : "not-allowed"
                        }}
                      />
                    </div>
                    {rateErr && (
                      <span className="form-error" style={{ fontSize: "0.72rem", marginTop: "2px", textAlign: "right" }}>
                        {rateErr}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {errors.complexities && (
            <span className="form-error" style={{ marginTop: "4px" }}>{errors.complexities}</span>
          )}
        </div>
      ) : (
        <>
          <div className="form-group">
            <label className="form-label">
              Complexity Level <span className="required">*</span>
            </label>
            <select
              className={`form-select ${errors.complexity ? "form-input--error" : ""
                } ${getComplexityClass(form.complexity)}`}
              value={form.complexity}
              onChange={e => onChange("complexity", e.target.value)}
            >
              {COMPLEXITY_LEVELS.map(c => (
                <option key={c} value={c}
                  className={getComplexityClass(c)}>
                  {c}
                </option>
              ))}
            </select>
            {errors.complexity && (
              <span className="form-error">{errors.complexity}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              Rate Per Page (₹) <span className="required">*</span>
            </label>
            <input
              className={`form-input ${errors.ratePerPage ? "form-input--error" : ""
                }`}
              type="number"
              min="0"
              step="0.01"
              value={form.ratePerPage}
              onChange={e => onChange("ratePerPage", e.target.value)}
            />
            <span className="form-hint">
              Amount per page for PDF/EPUB/XML/HTML conversion
            </span>
            {errors.ratePerPage && (
              <span className="form-error">{errors.ratePerPage}</span>
            )}
          </div>
        </>
      )}

      {/* Hourly Rate */}
      <div className="form-group">
        <label className="form-label">
          Hourly Rate (₹){" "}
          <span className="optional">(Optional)</span>
        </label>
        <input
          className="form-input"
          type="number"
          min="0"
          step="0.01"
          value={form.hourlyRate}
          onChange={e => onChange("hourlyRate", e.target.value)}
        />
        <span className="form-hint">
          For additional time-based calculations or reference
        </span>
      </div>

      {/* Active checkbox (edit only) */}
      {showActive && (
        <div className="form-group form-group--checkbox">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.active}
              onChange={e => onChange("active", e.target.checked)}
            />
            <span className="checkbox-text">Active</span>
          </label>
        </div>
      )}
    </div>
  );
}
