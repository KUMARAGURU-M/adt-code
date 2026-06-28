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

const getProjectBadgeClass = (projectName) => {
  if (!projectName) return 'proj-badge-default';
  let hash = 0;
  for (let i = 0; i < projectName.length; i++) {
    hash = projectName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % 8;
  return `proj-badge proj-badge-${index}`;
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

  useEffect(() => {
    loadProjects();
    loadClients();
  }, [loadProjects, loadClients]);

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

  // ── Validation ─────────────────────────────────────────────
  const validate = (f) => {
    const e = {};
    if (!f.name.trim()) e.name = "Name is required.";
    if (!f.billingType) e.billingType = "Billing Type is required.";
    if (!f.complexity) e.complexity = "Complexity Level is required.";
    if (!f.ratePerPage || isNaN(f.ratePerPage)) {
      e.ratePerPage = "Valid rate required.";
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
    const e = validate(form);
    if (Object.keys(e).length) { setErrors(e); return; }
    try {
      setSaving(true);
      await apiCall("/projects", "POST", {
        name: form.name.trim(),
        description: form.description || null,
        type: form.billingType,
        complexityLevel: form.complexity,
        ratePerPage: parseFloat(form.ratePerPage) || 0,
        hourlyRate: parseFloat(form.hourlyRate) || null,
        clientId: form.clientId || null,
        isActive: form.active,
      });
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
      active: project.status === "Active",
    });
    setErrors({});
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    const e = validate(form);
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
        <button className="btn-add-project" onClick={handleOpenAdd}>
          + Add Project
        </button>
      </div>

      {/* ── Table ── */}
      <div className="pm-table-container">
        <table className="pm-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
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
                <td colSpan={7} className="pm-empty">
                  No projects found. Click "+ Add Project" to create one.
                </td>
              </tr>
            ) : paginatedProjects.map((project) => (
              <tr key={project.id} className="pm-row">
                <td className="pm-name">
                  <span className={getProjectBadgeClass(project.name)}>
                    {project.name}
                  </span>
                </td>
                <td className="pm-desc">{project.description || "-"}</td>
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
    </div>
  );
}

// ── ProjectForm Component ─────────────────────────────────────────
function ProjectForm({ form, errors, onChange, showActive, clients = [] }) {
  return (
    <div className="form-body">

      {/* Name */}
      <div className="form-group">
        <label className="form-label">
          Name <span className="required">*</span>
        </label>
        <input
          className={`form-input ${errors.name ? "form-input--error" : ""}`}
          value={form.name}
          onChange={e => onChange("name", e.target.value)}
          placeholder="Project name"
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
      {clients.length > 0 && (
        <div className="form-group">
          <label className="form-label">Client (Optional)</label>
          <select
            className="form-select"
            value={form.clientId || ""}
            onChange={e =>
              onChange("clientId", e.target.value || null)
            }
          >
            <option value="">-- No Client --</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.companyName}
              </option>
            ))}
          </select>
        </div>
      )}

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

      {/* Complexity Level */}
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

      {/* Rate Per Page */}
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