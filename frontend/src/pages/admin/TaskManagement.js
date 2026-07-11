import React, {
  useState, useEffect, useCallback
} from "react";
import { useLocation } from "react-router-dom";
import "./TaskManagement.css";
import { apiCall } from "../../utils/api";

// ── Constants ─────────────────────────────────────────────────────
const ALL_STATUSES = [
  "FINISH", "WIP", "YTS", "RTU", "UPLOADED", "PENDING", "HOLD", "QUERY"
];

// ── Helpers ───────────────────────────────────────────────────────
const fmtDue = (d) => {
  if (!d) return "-";
  try {
    const parts = d.split("-");
    if (parts.length < 3) return d;
    const [y, m, day] = parts;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthIdx = parseInt(m, 10) - 1;
    const monthName = months[monthIdx] || m;
    return `${day}-${monthName}-${y}`;
  } catch {
    return d;
  }
};

const badgeClass = (s) => {
  const lower = s?.toLowerCase() || "";
  if (["finish", "completed", "uploaded"].includes(lower)) return "completed";
  if (["wip", "inprogress", "rtu"].includes(lower)) return "inprogress";
  if (["yts", "pending"].includes(lower)) return "pending";
  if (["hold", "query", "cancelled"].includes(lower)) return "cancelled";
  if (lower === "archived") return "archived";
  return "pending";
};

// Map backend response → frontend shape
const mapTask = (t) => ({
  id: t.id,
  title: t.taskTitle || "",
  projectId: t.projectId || null,
  project: t.projectName || "",
  clientId: t.clientId || null,
  client: t.clientName || "",
  workflowId: t.workflowId || null,
  workflow: t.workflowName || "",
  processId: t.processId || null,
  processes: t.processName ? [t.processName] : [],
  processIds: t.processId ? [t.processId] : [],
  jobs: (t.jobs || []).map(j => ({
    id: j.jobId,
    label: [j.jobIdCode, j.titleName, j.xmlIsbn]
      .filter(Boolean).join(" / "),
    isbn: j.xmlIsbn,
    pages: j.pageCount,
    assignedPages: j.assignedPages,
  })),
  employees: (t.employees || []).map(e => ({
    id: e.userId,
    name: e.fullName,
    assignedPages: e.assignedPages,
    status: e.status,
  })),
  status: t.status || "PENDING",
  date: t.assignedDate || "",
  dueDate: t.dueDate || "",
  pages: t.assignedPagesStr || t.assignedPages?.toString() || "",
  chapter: t.chapterArticleBatch || "",
  estimateHours: t.estimateHours?.toString() || "0.0",
  description: t.description || "",
  complexity: t.complexity || "",
  totalPages: t.totalPages || "",
  serverPath: t.serverPath || "",
  assignedBy: t.assignedByName || "",
});

// ── CheckboxList ──────────────────────────────────────────────────
function CheckboxList({ title, icon, items, selected, onChange,
  allowDeselect, labelKey = null, valueKey = null }) {
  const getValue = (item) => valueKey ? item[valueKey] : item;
  const getLabel = (item) => labelKey ? item[labelKey] : item;
  const allSel = items.length > 0 &&
    items.every(i => selected.includes(getValue(i)));

  const toggle = (item) => {
    const val = getValue(item);
    onChange(selected.includes(val)
      ? selected.filter(s => s !== val)
      : [...selected, val]);
  };

  return (
    <div className="tm-checkbox-section">
      <div className="tm-checkbox-section-header">
        <div className="tm-checkbox-section-meta">
          <span style={{ fontSize: "0.82rem" }}>{icon}</span>
          <span className="tm-checkbox-section-title">{title}</span>
          {selected.length > 0 && (
            <span className="tm-selected-count">
              ({selected.length} selected)
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {allowDeselect && selected.length > 0 && (
            <button className="tm-deselect-btn" onClick={() => onChange([])}>
              Deselect All
            </button>
          )}
          {!allSel && (
            <button className="tm-select-all-btn"
              onClick={() => onChange(items.map(getValue))}>
              Select All
            </button>
          )}
        </div>
      </div>
      <div className="tm-checkbox-list">
        {items.map(item => {
          const val = getValue(item);
          const lbl = getLabel(item);
          return (
            <label key={val}
              className={`tm-checkbox-item ${selected.includes(val) ? "checked" : ""}`}>
              <input
                type="checkbox"
                checked={selected.includes(val)}
                onChange={() => toggle(item)}
              />
              <span style={{ lineHeight: 1.3 }}>
                {typeof lbl === "string"
                  ? lbl.replace("\n", " ")
                  : lbl}
              </span>
            </label>
          );
        })}
        {items.length === 0 && (
          <div style={{ color: "#a0aec0", padding: "8px", fontSize: "0.8rem" }}>
            No items available
          </div>
        )}
      </div>
    </div>
  );
}

// ── Overlay ───────────────────────────────────────────────────────
const Overlay = ({ onClose, children }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div onClick={e => e.stopPropagation()}>{children}</div>
  </div>
);

// ── TaskModal ─────────────────────────────────────────────────────
function TaskModal({ mode, task, onClose, onSave,
  projects = [], clients = [], workflows = [], processes = [], employees = [] }) {

  const emptyForm = {
    title: "", projectId: null, processIds: [],
    jobIds: [], employeeIds: [],
    status: "PENDING", date: "", dueDate: "",
    estimateHours: "0.0", description: "",
    pagesType: "", pagesStart: "", pagesEnd: "",
    chapterType: "", chapterStart: "", chapterEnd: "",
    assignedBy: null, totalPages: "", complexity: "",
    serverPath: "",
    clientId: "",
    workflowId: "",
  };

  const [form, setForm] = useState(() => {
    if (!task) return { ...emptyForm };
    const proj = projects.find(p => p.id === task.projectId);
    return {
      title: task.title,
      projectId: task.projectId,
      processIds: task.processIds || [],
      jobIds: task.jobs ? task.jobs.map(j => j.id) : [],
      employeeIds: task.employees ? task.employees.map(e => e.id) : [],
      status: task.status,
      date: task.date,
      dueDate: task.dueDate,
      estimateHours: task.estimateHours,
      description: task.description,
      pagesType: task.pages === "All Pages"
        ? "All Pages"
        : task.pages?.includes(" - ")
          ? "Start Page - End Page"
          : task.pages ? "Start Page - End Page" : "",
      pagesStart: task.pages?.includes(" - ")
        ? task.pages.split(" - ")[0] : task.pages || "",
      pagesEnd: task.pages?.includes(" - ")
        ? task.pages.split(" - ")[1] : "",
      chapterType: ["Full Book", "All Article", "All Batch", "All Chapter"]
        .includes(task.chapter)
        ? task.chapter
        : task.chapter?.includes(" - ")
          ? "Start Page - End Page"
          : task.chapter ? "Start Page - End Page" : "",
      chapterStart: task.chapter?.includes(" - ")
        ? task.chapter.split(" - ")[0] : task.chapter || "",
      chapterEnd: task.chapter?.includes(" - ")
        ? task.chapter.split(" - ")[1] : "",
      assignedBy: null, // will be set by user
      totalPages: task.totalPages?.toString() || "",
      complexity: task.complexity || "",
      serverPath: task.serverPath || "",
      clientId: proj?.clientId || "",
      workflowId: proj?.workflowId || "",
    };
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showComplexity, setShowComplexity] = useState(!!form.complexity);

  const [initialJobIds] = useState(() => task && task.jobs ? task.jobs.map(j => j.id) : []);

  // Jobs available for selected project
  const [projectJobs, setProjectJobs] = useState([]);

  useEffect(() => {
    if (!form.projectId) { setProjectJobs([]); return; }
    apiCall(`/jobs/by-project/${form.projectId}`)
      .then(data => {
        // Filter jobs based on status: exclude Completed / FINISH, unless already selected
        const filtered = data.filter(j => {
          const isSelected = initialJobIds.includes(j.id);
          const isAvailable = j.status !== "FINISH" && j.status !== "Completed" && j.status !== "Completed / Finish";
          return isSelected || isAvailable;
        });
        setProjectJobs(filtered.map(j => ({
          id: j.id,
          label: `${[j.jobIdCode, j.titleName, j.xmlIsbn].filter(Boolean).join(" / ")} (Status: ${j.status || "PENDING"})`,
          pages: j.pageCount,
          workflowId: j.workflowId,
          clientId: j.clientId,
          status: j.status,
        })));
      })
      .catch(() => setProjectJobs([]));
  }, [form.projectId, initialJobIds]);

  const setF = (k, v) => {
    setForm(p => {
      const next = { ...p, [k]: v };
      if (k === "clientId") {
        next.projectId = "";
        next.workflowId = "";
        next.jobIds = [];
        next.totalPages = "";
        next.pagesType = "";
        next.pagesStart = "";
        next.pagesEnd = "";
      }
      if (k === "projectId") {
        const proj = projects.find(p => p.id === v);
        if (proj) {
          next.clientId = proj.clientId || "";
          next.workflowId = proj.workflowId || "";
        }
        next.jobIds = [];
        next.totalPages = "";
        next.pagesType = "";
        next.pagesStart = "";
        next.pagesEnd = "";
      }
      if (k === "jobIds" && v.length > 0) {
        // Auto-fill totalPages from first selected job
        const firstJob = projectJobs.find(j => j.id === v[0]);
        if (firstJob?.pages) {
          next.totalPages = firstJob.pages.toString();
          // Auto-select "All Pages" when a book is chosen
          next.pagesType = "All Pages";
          next.pagesStart = "";
          next.pagesEnd = "";
        }
      }
      if (k === "jobIds" && v.length === 0) {
        next.totalPages = "";
        next.pagesType = "";
        next.pagesStart = "";
        next.pagesEnd = "";
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [k]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.projectId) e.projectId = "Project is required.";
    if (!form.processIds.length) e.processIds = "Select at least one process.";
    if (!form.employeeIds.length) e.employeeIds = "Select at least one employee.";
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    let finalPages = form.pagesType;
    if (form.pagesType === "Start Page - End Page") {
      finalPages = [form.pagesStart, form.pagesEnd]
        .filter(Boolean).join(" - ");
    }

    // Calculate the numeric assignedPages to store for tracking
    let numericAssignedPages = null;
    if (form.pagesType === "All Pages" && form.totalPages) {
      numericAssignedPages = parseInt(form.totalPages) || null;
    } else if (form.pagesType === "Start Page - End Page") {
      const start = parseInt(form.pagesStart) || 0;
      const end = parseInt(form.pagesEnd) || 0;
      if (start > 0 && end >= start) {
        numericAssignedPages = end - start + 1;
      }
    }

    let finalChapter = form.chapterType;
    if (form.chapterType === "Start Page - End Page") {
      finalChapter = [form.chapterStart, form.chapterEnd]
        .filter(Boolean).join(" - ");
    }

    setSaving(true);
    try {
      await onSave({
        projectId: form.projectId,
        processIds: form.processIds,
        taskTitle: form.title || null,
        description: form.description || null,
        status: form.status,
        dueDate: form.dueDate || null,
        assignedPagesStr: finalPages || null,
        assignedPages: numericAssignedPages,
        complexity: showComplexity ? form.complexity : null,
        chapterArticleBatch: finalChapter || null,
        estimateHours: parseFloat(form.estimateHours) || null,
        serverPath: form.serverPath || null,
        assignedBy: form.assignedBy || null,
        totalPages: parseInt(form.totalPages) || null,
        jobAssignments: form.jobIds.map(id => ({
          jobId: id, assignedPages: numericAssignedPages
        })),
        employeeAssignments: form.employeeIds.map(id => ({
          userId: id, assignedPages: numericAssignedPages
        })),
      }, task?.id);
      onClose();
    } catch (err) {
      alert("Error saving task: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredJobs = projectJobs.filter(j => {
    if (form.workflowId && j.workflowId !== form.workflowId) return false;
    if (form.status) {
      const taskStatusLower = form.status.toLowerCase();
      const jobStatusLower = (j.status || "").toLowerCase();
      const isTaskCompleted = ["finish", "completed", "completed / finish"].includes(taskStatusLower);
      const isJobCompleted = ["finish", "completed", "completed / finish"].includes(jobStatusLower);
      if (isTaskCompleted) {
        if (!isJobCompleted) return false;
      } else {
        if (jobStatusLower !== taskStatusLower) return false;
      }
    }
    return true;
  });

  return (
    <Overlay onClose={onClose}>
      <div className="tm-modal">

        {/* Header */}
        <div className="tm-modal-header">
          <div className="tm-modal-header-left">
            <span style={{ fontSize: "1.1rem" }}>✅</span>
            <h2 className="tm-modal-title">
              {mode === "add" ? "Add New Task" : "Edit Task"}
            </h2>
          </div>
          <button className="tm-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="tm-modal-body">

          {/* Client Select */}
          <div>
            <div className="tm-field-label">💼 Client</div>
            <select
              className="tm-form-select"
              value={form.clientId || ""}
              onChange={e => setF("clientId", e.target.value || "")}
            >
              <option value="">Select Client</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.companyName}</option>
              ))}
            </select>
          </div>

          {/* Project Select */}
          <div>
            <div className="tm-field-label">
              📁 Project <span className="req">*</span>
            </div>
            <select
              className={`tm-form-select ${errors.projectId ? "tm-form-input--error" : ""}`}
              value={form.projectId || ""}
              onChange={e => setF("projectId", e.target.value || null)}
              disabled={!form.clientId}
            >
              <option value="">Select Publisher / Project</option>
              {(form.clientId
                ? projects.filter(p => p.clientId === form.clientId)
                : projects
              ).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {errors.projectId && (
              <span className="tm-form-error">{errors.projectId}</span>
            )}
          </div>

          {/* Workflow Select */}
          <div>
            <div className="tm-field-label">⚙️ Task Name</div>
            <select
              className="tm-form-select"
              value={form.workflowId || ""}
              onChange={e => setF("workflowId", e.target.value || "")}
            >
              <option value="">Select Task Name</option>
              {workflows.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Status & Date */}
          <div className="tm-two-col">
            <div>
              <div className="tm-field-label">🏷️ Status</div>
              <select className="tm-form-select" value={form.status}
                onChange={e => setF("status", e.target.value)}>
                {ALL_STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="tm-field-label">📅 Date</div>
              <input type="date" className="tm-form-input"
                value={form.date}
                onChange={e => setF("date", e.target.value)} />
            </div>
          </div>

          {/* Book/Job */}
          <div>
            <div className="tm-field-label">📖 Book/Job</div>
            {!form.projectId ? (
              <div className="tm-job-placeholder">
                📌 Please select a Project first
              </div>
            ) : (
              <CheckboxList
                title="Available Jobs"
                icon="📖"
                items={filteredJobs}
                selected={form.jobIds}
                onChange={v => setF("jobIds", v)}
                allowDeselect
                valueKey="id"
                labelKey="label"
              />
            )}
          </div>

          {/* Pages & Complexity */}
          <div className="tm-two-col">
            <div>
              <div className="tm-field-label">📄 Pages</div>
              <input type="number" className="tm-form-input"
                placeholder="Job pages"
                value={form.totalPages}
                onChange={e => setF("totalPages", e.target.value)} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", height: "24px" }}>
                <label className="tm-checkbox-item"
                  style={{ borderBottom: "none", padding: 0, background: "none" }}>
                  <input
                    type="checkbox"
                    checked={showComplexity}
                    onChange={e => {
                      setShowComplexity(e.target.checked);
                      if (!e.target.checked) setF("complexity", "");
                      else setF("complexity", "Simple");
                    }}
                  />
                  <span style={{
                    fontWeight: 600, color: "#4a5568",
                    fontSize: "0.82rem"
                  }}>
                    Add Complexity
                  </span>
                </label>
              </div>
              <div style={{ marginTop: "5px" }}>
                {showComplexity ? (
                  <select className="tm-form-select" value={form.complexity}
                    onChange={e => setF("complexity", e.target.value)}>
                    <option value="Simple">Simple</option>
                    <option value="Medium">Medium</option>
                    <option value="Complex">Complex</option>
                    <option value="Heavy Complex">Heavy Complex</option>
                  </select>
                ) : (
                  <select className="tm-form-select" disabled
                    style={{ opacity: 0.5, cursor: "not-allowed" }}>
                    <option>Complexity Not Added</option>
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Process */}
          <div>
            <div className="tm-field-label">
              ⚙️ Process (Stage) <span className="req">*</span>
            </div>
            <CheckboxList
              title="Processes"
              icon="⚙️"
              items={processes}
              selected={form.processIds}
              onChange={v => setF("processIds", v)}
              allowDeselect={false}
              valueKey="id"
              labelKey="name"
            />
            {errors.processIds && (
              <span className="tm-form-error">{errors.processIds}</span>
            )}
          </div>

          {/* Task Title */}
          <div>
            <div className="tm-field-label">
              🏷️ Task Title
              <span className="tm-field-hint">
                (Optional · Auto-generated if empty)
              </span>
            </div>
            <input className="tm-form-input"
              placeholder="Enter task title or leave blank for auto-generation"
              value={form.title}
              onChange={e => setF("title", e.target.value)} />
          </div>

          {/* Employees */}
          <div>
            <div className="tm-field-label">
              👥 Assigned Employee(s) <span className="req">*</span>
            </div>
            <CheckboxList
              title="Employees"
              icon="👤"
              items={employees}
              selected={form.employeeIds}
              onChange={v => setF("employeeIds", v)}
              allowDeselect={false}
              valueKey="id"
              labelKey="fullName"
            />
            {errors.employeeIds && (
              <span className="tm-form-error">{errors.employeeIds}</span>
            )}
          </div>

          {/* Assigned By */}
          <div>
            <div className="tm-field-label">👤 Assigned By</div>
            <select className="tm-form-select"
              value={form.assignedBy || ""}
              onChange={e => setF("assignedBy", e.target.value || null)}>
              <option value="">Select Employee</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.fullName}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <div className="tm-field-label">📝 Description</div>
            <textarea className="tm-form-textarea"
              placeholder="Enter task description (optional)"
              value={form.description}
              onChange={e => setF("description", e.target.value)}
              rows={3} />
          </div>

          {/* Estimate Hours + Due Date */}
          <div className="tm-two-col">
            <div>
              <div className="tm-field-label">⏱️ Estimate Hours</div>
              <input className="tm-form-input" type="number"
                min="0" step="0.1"
                value={form.estimateHours}
                onChange={e => setF("estimateHours", e.target.value)} />
            </div>
            <div>
              <div className="tm-field-label">📅 Due Date</div>
              <input type="date" className="tm-form-input"
                value={form.dueDate}
                onChange={e => setF("dueDate", e.target.value)} />
            </div>
          </div>

          {/* Assigned Pages & Chapter */}
          <div className="tm-two-col">
            <div>
              <div className="tm-field-label">📄 Assigned Pages</div>
              <select className="tm-form-select" value={form.pagesType}
                onChange={e => setF("pagesType", e.target.value)}>
                <option value="">-- Select --</option>
                <option value="All Pages">All Pages</option>
                <option value="Start Page - End Page">Start-End Page</option>
              </select>
              {/* Read-only hint when auto-filled from book */}
              {form.pagesType === "All Pages" && form.totalPages && (
                <div style={{
                  marginTop: '6px',
                  fontSize: '0.78rem',
                  color: '#2d6a4f',
                  background: '#d8f3dc',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontWeight: 600,
                }}>
                  ✅ All {form.totalPages} pages assigned
                </div>
              )}
              {form.pagesType === "Start Page - End Page" && (
                <div className="tm-two-col" style={{ marginTop: "8px" }}>
                  <input className="tm-form-input" placeholder="Start"
                    type="number" min="1"
                    value={form.pagesStart}
                    onChange={e => setF("pagesStart", e.target.value)} />
                  <input className="tm-form-input" placeholder="End"
                    type="number" min="1"
                    value={form.pagesEnd}
                    onChange={e => setF("pagesEnd", e.target.value)} />
                </div>
              )}
              {/* Show computed count for Start-End */}
              {form.pagesType === "Start Page - End Page"
                && form.pagesStart && form.pagesEnd
                && parseInt(form.pagesEnd) >= parseInt(form.pagesStart) && (
                  <div style={{
                    marginTop: '6px',
                    fontSize: '0.78rem',
                    color: '#1e40af',
                    background: '#dbeafe',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontWeight: 600,
                  }}>
                    📄 {parseInt(form.pagesEnd) - parseInt(form.pagesStart) + 1} pages assigned
                  </div>
                )}
            </div>

            <div>
              <div className="tm-field-label">📑 Chapter / Article / Batch</div>
              <select className="tm-form-select" value={form.chapterType}
                onChange={e => setF("chapterType", e.target.value)}>
                <option value="">-- Select --</option>
                <option value="Full Book">Full Book</option>
                <option value="All Article">All Article</option>
                <option value="All Batch">All Batch</option>
                <option value="All Chapter">All Chapter</option>
                <option value="Start Page - End Page">
                  Start A/B/C - End A/B/C
                </option>
              </select>
              {form.chapterType === "Start Page - End Page" && (
                <div className="tm-two-col" style={{ marginTop: "8px" }}>
                  <input className="tm-form-input" placeholder="Start"
                    value={form.chapterStart}
                    onChange={e => setF("chapterStart", e.target.value)} />
                  <input className="tm-form-input" placeholder="End"
                    value={form.chapterEnd}
                    onChange={e => setF("chapterEnd", e.target.value)} />
                </div>
              )}
            </div>
          </div>

          {/* Path */}
          <div>
            <div className="tm-field-label">🔗 Path</div>
            <input className="tm-form-input"
              placeholder="Enter file/folder path"
              value={form.serverPath}
              onChange={e => setF("serverPath", e.target.value)} />
          </div>

        </div>

        <div className="tm-modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-create-task" onClick={handleSave}
            disabled={saving}>
            ✦ {saving
              ? (mode === "add" ? "Creating..." : "Updating...")
              : (mode === "add" ? "Create Task" : "Update Task")}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ═════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════
export default function TaskManagement() {

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterClient, setFilterClient] = useState("");
  const [filterWorkflow, setFilterWorkflow] = useState("");
  const [filterProcess, setFilterProcess] = useState("");
  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Pagination
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const location = useLocation();

  // ── Load reference data ─────────────────────────────────────
  const loadDropdowns = useCallback(async () => {
    try {
      const [proj, proc, emp, cl, wf] = await Promise.all([
        apiCall("/projects"),
        apiCall("/processes"),
        apiCall("/users"),
        apiCall("/clients"),
        apiCall("/projects/workflows"),
      ]);
      setProjects(proj.map(p => ({
        id: p.id,
        name: p.name,
        clientId: p.clientId,
        workflowId: p.workflowId,
      })));
      setProcesses(proc.map(p => ({ id: p.id, name: p.name })));
      setEmployees(emp.map(e => ({
        id: e.id, fullName: e.fullName
      })));
      setClients(cl || []);
      setWorkflows(wf || []);
    } catch (err) {
      console.warn("Could not load dropdowns:", err.message);
    }
  }, []);

  // ── Load tasks ──────────────────────────────────────────────
  const loadTasks = useCallback(async (pg = 0, params = {}) => {
    try {
      setLoading(true);
      setError("");
      const query = new URLSearchParams({
        page: pg,
        size: itemsPerPage,
        ...(params.projectId && { projectId: params.projectId }),
        ...(params.clientId && { clientId: params.clientId }),
        ...(params.workflowId && { workflowId: params.workflowId }),
        ...(params.processId && { processId: params.processId }),
        ...(params.employeeId && { userId: params.employeeId }),
        ...(params.status && { status: params.status }),
        ...(params.search && { search: params.search }),
      });
      const data = await apiCall(`/tasks/search?${query}`);
      setTasks(data.content.map(mapTask));
      setTotalItems(data.totalElements);
      setTotalPages(data.totalPages);
      setCurrentPage(pg + 1);
    } catch (err) {
      setError("Failed to load tasks: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage]);

  // Debounced auto-search when filters change
  useEffect(() => {
    const handler = setTimeout(() => {
      loadTasks(0, {
        projectId: filterProject,
        clientId: filterClient,
        workflowId: filterWorkflow,
        processId: filterProcess,
        employeeId: filterEmployee,
        status: filterStatus,
        search,
      });
    }, 300);
    return () => clearTimeout(handler);
  }, [
    filterProject,
    filterClient,
    filterWorkflow,
    filterProcess,
    filterEmployee,
    filterStatus,
    search,
    loadTasks
  ]);

  useEffect(() => {
    loadDropdowns();
  }, [loadDropdowns]);

  useEffect(() => {
    if (location.state?.openAddTask) {
      setModal({ type: "add" });
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // ── Current page display ────────────────────────────────────
  const paginated = tasks; // server already paginated

  // ── Scroll sync ─────────────────────────────────────────────
  const topScrollRef = React.useRef(null);
  const bottomScrollRef = React.useRef(null);

  useEffect(() => {
    const topEl = topScrollRef.current;
    const bottomEl = bottomScrollRef.current;
    if (!topEl || !bottomEl) return;
    const ro = new ResizeObserver(() => {
      const fc = bottomEl.firstElementChild;
      if (fc) {
        const id = topEl.firstElementChild;
        if (id) id.style.width = `${fc.offsetWidth}px`;
      }
    });
    ro.observe(bottomEl);
    let sT = false, sB = false;
    const onT = () => { if (!sB) { sT = true; bottomEl.scrollLeft = topEl.scrollLeft; sT = false; } };
    const onB = () => { if (!sT) { sB = true; topEl.scrollLeft = bottomEl.scrollLeft; sB = false; } };
    topEl.addEventListener("scroll", onT);
    bottomEl.addEventListener("scroll", onB);
    return () => { ro.disconnect(); topEl.removeEventListener("scroll", onT); bottomEl.removeEventListener("scroll", onB); };
  }, [tasks]);

  // ── Search / Clear ──────────────────────────────────────────
  const applySearch = () => {
    loadTasks(0, {
      projectId: filterProject,
      clientId: filterClient,
      workflowId: filterWorkflow,
      processId: filterProcess,
      employeeId: filterEmployee,
      status: filterStatus,
      search,
    });
  };

  const clearFilters = () => {
    setSearch("");
    setFilterProject("");
    setFilterClient("");
    setFilterWorkflow("");
    setFilterProcess("");
    setFilterEmployee("");
    setFilterStatus("");
    loadTasks(0);
  };

  // ── CRUD ────────────────────────────────────────────────────
  const handleSave = async (payload, existingId) => {
    if (existingId) {
      await apiCall(`/tasks/${existingId}`, "PUT", payload);
    } else {
      await apiCall("/tasks", "POST", payload);
    }
    await loadTasks(currentPage - 1);
  };

  const handleDelete = async () => {
    try {
      await apiCall(`/tasks/${modal.task.id}`, "DELETE");
      await loadTasks(currentPage - 1);
      setModal(null);
    } catch (err) {
      alert("Error deleting task: " + err.message);
    }
  };

  const handleRemoveDuplicates = async () => {
    try {
      const result = await apiCall(
        "/tasks/remove-duplicates", "POST");
      alert(`Removed ${result.removedCount} duplicate tasks.`);
      await loadTasks(0);
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // ── Exports ─────────────────────────────────────────────────
  const handleExportCSV = () => {
    const header = ["Assigned Date", "Client", "Project", "Task Name", "Process", "Job", "Pages", "A.Page", "Employee",
      "Chapter", "Due Date", "Status", "Task Creator", "Path"];
    const rows = tasks.map(t => [
      fmtDue(t.date) || "-",
      `"${t.client || "-"}"`,
      `"${t.project}"`,
      `"${t.workflow || "-"}"`,
      `"${t.processes.join("; ")}"`,
      `"${t.jobs.map(j => j.label).join("; ")}"`,
      t.totalPages || "-",
      t.pages || "-",
      `"${t.employees.map(e => e.name).join("; ")}"`,
      `"${t.chapter || "-"}"`,
      fmtDue(t.dueDate) || "-",
      t.status,
      `"${t.assignedBy || "-"}"`,
      `"${t.serverPath || "-"}"`
    ]);
    const csv = [header, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "tasks.csv";
    a.click();
  };

  const handleExportPDF = () => {
    const pw = window.open("", "_blank");
    pw.document.write(`
      <html><head><title>Task Report</title>
      <style>
        body{font-family:sans-serif;padding:30px}
        h2{color:#7c3aed}
        table{width:100%;border-collapse:collapse;font-size:10px}
        th,td{border:1px solid #e2e8f0;padding:6px;text-align:left}
        th{background:#7c3aed;color:#fff}
        tr:nth-child(even){background:#f8fafc}
      </style></head><body>
      <h2>Task Management Report</h2>
      <p>${new Date().toLocaleDateString()}</p>
      <table><thead><tr>
        <th>Date</th><th>Client</th><th>Project</th><th>Task Name</th><th>Process</th><th>Job</th>
        <th>Pages</th><th>A.Page</th><th>Employee</th><th>Chapter</th>
        <th>Due Date</th><th>Status</th><th>Creator</th><th>Path</th>
      </tr></thead><tbody>
      ${tasks.map(t => `<tr>
        <td>${fmtDue(t.date) || "-"}</td>
        <td>${t.client || "-"}</td>
        <td>${t.project || "-"}</td>
        <td>${t.workflow || "-"}</td>
        <td>${t.processes.join(", ") || "-"}</td>
        <td>${t.jobs.map(j => j.label).join("; ") || "-"}</td>
        <td>${t.totalPages || "-"}</td>
        <td>${t.pages || "-"}</td>
        <td>${t.employees.map(e => e.name).join(", ") || "-"}</td>
        <td>${t.chapter || "-"}</td>
        <td>${fmtDue(t.dueDate) || "-"}</td>
        <td>${t.status}</td>
        <td>${t.assignedBy || "-"}</td>
        <td>${t.serverPath || "-"}</td>
      </tr>`).join("")}
      </tbody></table>
      <script>window.onload=()=>{window.print();window.close()}</script>
      </body></html>
    `);
    pw.document.close();
  };

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="tm-wrapper">

      {/* ── Header ── */}
      <div className="tm-page-header">
        <div className="tm-page-title">
          <span style={{ fontSize: 22 }}>✅</span>
          <h1>Task Management</h1>
        </div>
        <div className="tm-header-actions">
          <button className="btn-remove-dup"
            onClick={handleRemoveDuplicates}>
            🔁 Remove Duplicates
          </button>
          <div className="tm-export-dropdown-container">
            <button className="btn-export-csv"
              onClick={() => setShowExportDropdown(v => !v)}>
              📥 Export Report
            </button>
            {showExportDropdown && (
              <div className="tm-export-dropdown-menu">
                <button className="tm-export-item"
                  onClick={() => { handleExportPDF(); setShowExportDropdown(false); }}>
                  📄 Export PDF
                </button>
                <button className="tm-export-item"
                  onClick={() => { handleExportCSV(); setShowExportDropdown(false); }}>
                  📋 Export CSV
                </button>
              </div>
            )}
          </div>
          <button className="btn-add-task"
            onClick={() => setModal({ type: "add" })}>
            + Add Task
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="tm-filter-box">
        <div className="tm-filter-top">
          <span className="tm-filter-title">⚙️ Filters</span>
          <button className="btn-clear-all" onClick={clearFilters}>
            Clear All
          </button>
        </div>
        <div className="tm-filter-row">
          <div className="tm-filter-group">
            <span className="tm-filter-label">🔍 Search</span>
            <input className="tm-filter-input"
              placeholder="Search in title..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && applySearch()} />
          </div>

          <div className="tm-filter-group">
            <span className="tm-filter-label">💼 Client</span>
            <select className="tm-filter-select" value={filterClient}
              onChange={e => {
                setFilterClient(e.target.value);
                setFilterProject("");
              }}>
              <option value="">All Clients</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.companyName}</option>
              ))}
            </select>
          </div>

          <div className="tm-filter-group">
            <span className="tm-filter-label">📁 Project</span>
            <select className="tm-filter-select" value={filterProject}
              onChange={e => setFilterProject(e.target.value)}>
              <option value="">All Projects</option>
              {(filterClient
                ? projects.filter(p => p.clientId === filterClient)
                : projects
              ).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="tm-filter-group">
            <span className="tm-filter-label">⚙️ Task Name</span>
            <select className="tm-filter-select" value={filterWorkflow}
              onChange={e => setFilterWorkflow(e.target.value)}>
              <option value="">All Task Names</option>
              {workflows.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          <div className="tm-filter-group">
            <span className="tm-filter-label">⚙️ Process</span>
            <select className="tm-filter-select" value={filterProcess}
              onChange={e => setFilterProcess(e.target.value)}>
              <option value="">All Processes</option>
              {processes.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="tm-filter-group">
            <span className="tm-filter-label">👥 Employee</span>
            <select className="tm-filter-select" value={filterEmployee}
              onChange={e => setFilterEmployee(e.target.value)}>
              <option value="">All Employees</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.fullName}</option>
              ))}
            </select>
          </div>

          <div className="tm-filter-group">
            <span className="tm-filter-label">🏷️ Status</span>
            <select className="tm-filter-select" value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Status</option>
              {ALL_STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="tm-filter-group"
            style={{ justifyContent: "flex-end" }}>
            <span className="tm-filter-label">&nbsp;</span>
            <button className="btn-search" onClick={applySearch}>
              🔍 Search
            </button>
          </div>
        </div>
      </div>

      {/* ── Loading / Error ── */}
      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#888" }}>
          Loading tasks...
        </div>
      ) : error ? (
        <div style={{ padding: "40px", textAlign: "center", color: "red" }}>
          {error}
        </div>
      ) : (
        <>
          <div className="double-scroll-top" ref={topScrollRef}>
            <div className="double-scroll-top-inner" />
          </div>

          <div className="tm-table-wrapper" ref={bottomScrollRef}>
            <table className="tm-table">
              <thead>
                <tr>
                  <th className="col-date">Assigned Date</th>
                  <th className="col-client">Client</th>
                  <th className="col-project">Project</th>
                  <th className="col-workflow">Task Name</th>
                  <th className="col-process">Process</th>
                  <th className="col-job">Title / ISBN</th>
                  <th className="col-totalpages">Pages</th>
                  <th className="col-pages">A.Page</th>
                  <th className="col-employee">Employee Name</th>
                  <th className="col-chapter">Chap / Art / Bat</th>
                  <th className="col-duedate">Due Date</th>
                  <th className="col-status">Status</th>
                  <th className="col-creator">Task Creator</th>
                  <th className="col-path">Server Path</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={15} style={{
                      textAlign: "center", padding: "48px", color: "#a0aec0"
                    }}>
                      No tasks found.
                    </td>
                  </tr>
                ) : paginated.map(task => (
                  <tr key={task.id}>
                    <td className="col-date">
                      {fmtDue(task.date) || "-"}
                    </td>
                    <td className="col-client">
                      <span className="cell-client">{task.client || "-"}</span>
                    </td>
                    <td className="col-project">
                      <span className="cell-project">{task.project}</span>
                    </td>
                    <td className="col-workflow">
                      <span className="cell-workflow">{task.workflow || "-"}</span>
                    </td>
                    <td className="col-process">
                      <span className="cell-process">
                        {task.processes.join(", ") || "-"}
                      </span>
                    </td>
                    <td className="col-job">
                      <span className="cell-job">
                        {task.jobs.length
                          ? task.jobs.map(j => j.label).join("; ")
                          : "-"}
                      </span>
                    </td>
                    <td className="col-totalpages">
                      {task.totalPages || "-"}
                    </td>
                    <td className="col-pages">
                      {task.pages || "-"}
                    </td>
                    <td className="col-employee col-left">
                      {task.employees.map(e => e.name).join(", ") || "-"}
                    </td>
                    <td className="col-chapter">
                      <span className="cell-chapter">
                        {task.chapter || "-"}
                      </span>
                    </td>
                    <td className="col-duedate">
                      {fmtDue(task.dueDate) || "-"}
                    </td>
                    <td className="col-status">
                      <span className={`status-badge ${badgeClass(task.status)}`}>
                        {task.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="col-creator">
                      {task.assignedBy || "-"}
                    </td>
                    <td className="col-path"
                      style={{
                        fontFamily: "monospace",
                        fontSize: "11px", wordBreak: "break-all"
                      }}>
                      {task.serverPath || "-"}
                    </td>
                    <td className="col-actions">
                      <div className="tm-actions">
                        <button className="tm-action-btn" title="Edit"
                          onClick={() => setModal({ type: "edit", task })}>
                          ✏️
                        </button>
                        <button className="tm-action-btn" title="Delete"
                          onClick={() => setModal({ type: "delete", task })}>
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="tm-pagination">
            <div className="tm-pagination-left">
              <label>Items per page:</label>
              <select value={itemsPerPage}
                onChange={e => {
                  setItemsPerPage(Number(e.target.value));
                  loadTasks(0);
                }}>
                {[10, 25, 50, 100].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="tm-pagination-right">
              {totalPages > 1 && <>
                <button className="page-btn"
                  disabled={currentPage === 1}
                  onClick={() => loadTasks(currentPage - 2)}>‹</button>
                <span className="page-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button className="page-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => loadTasks(currentPage)}>›</button>
              </>}
              <span className="page-count">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}{" "}
                to {Math.min(currentPage * itemsPerPage, totalItems)}{" "}
                of {totalItems} items
              </span>
            </div>
          </div>
        </>
      )}

      {/* ── Add / Edit Modal ── */}
      {(modal?.type === "add" || modal?.type === "edit") && (
        <TaskModal
          mode={modal.type}
          task={modal.task || null}
          onClose={() => setModal(null)}
          onSave={handleSave}
          projects={projects}
          clients={clients}
          workflows={workflows}
          processes={processes}
          employees={employees}
        />
      )}

      {/* ── Delete Confirm ── */}
      {modal?.type === "delete" && (
        <Overlay onClose={() => setModal(null)}>
          <div className="tm-modal tm-modal--confirm">
            <div className="tm-modal-header">
              <div className="tm-modal-header-left">
                <h2 className="tm-modal-title">Delete Task</h2>
              </div>
              <button className="tm-modal-close"
                onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="tm-confirm-body">
              <div className="tm-confirm-icon">🗑️</div>
              <p className="tm-confirm-text">
                Are you sure you want to delete<br />
                <strong>{modal.task.title}</strong>?<br />
                This action cannot be undone.
              </p>
            </div>
            <div className="tm-modal-footer" style={{ justifyContent: "center" }}>
              <button className="btn-cancel"
                onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-danger-modal"
                onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}