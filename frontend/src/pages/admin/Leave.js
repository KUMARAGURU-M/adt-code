import React, { useState, useEffect, useCallback } from "react";
import "./Leave.css";
import { apiCall, getCurrentUser } from "../../utils/api";

// ── Helpers ───────────────────────────────────────────────────────
const STATUS_OPTIONS = ["All Status", "Pending", "Approved", "Rejected", "Cancelled"];
const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

const calcDays = (start, end) => {
  if (!start || !end) return "";
  const diff = (new Date(end) - new Date(start)) / 86400000;
  return diff >= 0 ? diff + 1 : "";
};

const statusClass = (s) => ({
  Pending: "lv-badge--pending",
  Approved: "lv-badge--approved",
  Rejected: "lv-badge--rejected",
  Cancelled: "lv-badge--rejected",
}[s] || "");

const Modal = ({ onClose, children }) => (
  <div className="lv-modal-overlay" onClick={onClose}>
    <div className="lv-modal" onClick={e => e.stopPropagation()}>
      {children}
    </div>
  </div>
);

// ══ TAB 1 — LEAVE REQUESTS ═══════════════════════════════════════
const LeaveRequests = ({ leaveTypes, employees, hasPermission }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDel, setShowDel] = useState(false);
  const [selected, setSelected] = useState(null);

  const emptyReq = {
    userId: "", leaveTypeId: "", approverId: "",
    startDate: "", endDate: "", reason: "", status: "Pending", adminNote: ""
  };
  const [form, setForm] = useState(emptyReq);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: "" }));
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: 0, size: 100 });
      if (filterEmployee) params.set("userId", filterEmployee);
      if (filterStatus && filterStatus !== "All Status")
        params.set("status", filterStatus);
      if (filterType) params.set("leaveTypeId", filterType);
      const data = await apiCall(`/leave/requests?${params}`);
      setRequests(data.content || []);
    } catch (e) {
      console.error(e.message);
    } finally { setLoading(false); }
  }, [filterEmployee, filterStatus, filterType]);

  useEffect(() => { load(); }, [load]);

  const validate = (f) => {
    const e = {};
    if (!f.userId) e.userId = "Employee is required.";
    if (!f.leaveTypeId) e.leaveTypeId = "Leave type is required.";
    if (!f.startDate) e.startDate = "Start date is required.";
    if (!f.endDate) e.endDate = "End date is required.";
    return e;
  };

  const handleCreate = async () => {
    const e = validate(form);
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      await apiCall("/leave/requests", "POST", {
        userId: form.userId,
        leaveTypeId: form.leaveTypeId,
        approverId: form.approverId || null,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason || null,
        status: form.status,
        adminNote: form.adminNote || null,
      });
      setShowAdd(false);
      await load();
    } catch (err) { alert("Error: " + err.message); }
    finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    const e = validate(form);
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      await apiCall(`/leave/requests/${selected.id}`, "PUT", {
        userId: form.userId,
        leaveTypeId: form.leaveTypeId,
        approverId: form.approverId || null,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason || null,
        status: form.status,
        adminNote: form.adminNote || null,
      });
      setShowEdit(false);
      await load();
    } catch (err) { alert("Error: " + err.message); }
    finally { setSaving(false); }
  };

  const handleReview = async (id, status) => {
    try {
      await apiCall(`/leave/requests/${id}/review`, "PATCH",
        { status, adminNote: null });
      await load();
    } catch (err) { alert("Error: " + err.message); }
  };

  const handleDelete = async () => {
    try {
      await apiCall(`/leave/requests/${selected.id}`, "DELETE");
      setShowDel(false);
      await load();
    } catch (err) { alert("Error: " + err.message); }
  };

  const openEdit = (r) => {
    setSelected(r);
    setForm({
      userId: r.userId,
      leaveTypeId: r.leaveTypeId,
      approverId: r.approverId || "",
      startDate: r.startDate || "",
      endDate: r.endDate || "",
      reason: r.reason || "",
      status: r.status,
      adminNote: r.adminNote || "",
    });
    setErrors({});
    setShowEdit(true);
  };

  return (
    <div>
      <div className="lv-filter-card">
        <div className="lv-filter-group">
          <label className="lv-filter-label">Employee</label>
          <select className="lv-filter-select"
            value={filterEmployee}
            onChange={e => setFilterEmployee(e.target.value)}>
            <option value="">All Employees</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.fullName}</option>
            ))}
          </select>
        </div>
        <div className="lv-filter-group">
          <label className="lv-filter-label">Status</label>
          <select className="lv-filter-select"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}>
            {STATUS_OPTIONS.map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="lv-filter-group">
          <label className="lv-filter-label">Leave Type</label>
          <select className="lv-filter-select"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            {leaveTypes.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        {hasPermission('leaves.create') && (
          <button className="lv-btn-primary" style={{ marginTop: 22 }}
            onClick={() => {
              setForm(emptyReq); setErrors({}); setShowAdd(true);
            }}>
            + Add Request
          </button>
        )}
      </div>

      {loading ? (
        <div className="lv-table-card" style={{
          padding: "40px", textAlign: "center", color: "#888"
        }}>
          Loading...
        </div>
      ) : (
        <div className="lv-table-card">
          <table className="lv-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="lv-empty">
                    No leave requests found.
                  </td>
                </tr>
              ) : requests.map(r => {
                const isPending = r.status === "Pending";
                return (
                  <tr key={r.id} className={`lv-row${isPending ? " lv-row--pending" : ""}`}>
                    <td className="col-left">
                      {isPending && <span className="lv-pulse-dot" title="Pending Action" />}
                      {r.employeeName}
                    </td>
                    <td>{r.leaveTypeName}</td>
                    <td>{r.startDate}</td>
                    <td>{r.endDate}</td>
                    <td>{r.days?.toString()}</td>
                    <td className="lv-reason">{r.reason || "-"}</td>
                    <td>
                      <span className={`lv-badge ${statusClass(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      <div className="lv-actions">
                        {isPending && hasPermission('leaves.approve') && (
                          <>
                            <button className="lv-action-btn"
                              title="Approve"
                              onClick={() => handleReview(r.id, "Approved")}>
                              ✅
                            </button>
                            <button className="lv-action-btn"
                              title="Reject"
                              onClick={() => handleReview(r.id, "Rejected")}>
                              ❌
                            </button>
                          </>
                        )}
                        {hasPermission('leaves.update') && (
                          <button className="lv-action-btn"
                            onClick={() => openEdit(r)} title="Edit">✏️</button>
                        )}
                        {hasPermission('leaves.delete') && (
                          <button className="lv-action-btn"
                            onClick={() => { setSelected(r); setShowDel(true); }}
                            title="Delete">🗑️</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <Modal onClose={() => setShowAdd(false)}>
          <h2 className="lv-modal-title">Add Leave Request</h2>
          <LeaveRequestForm form={form} set={set} errors={errors}
            leaveTypes={leaveTypes} employees={employees} />
          <div className="lv-modal-actions">
            <button className="lv-btn-cancel"
              onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="lv-btn-primary"
              onClick={handleCreate} disabled={saving}>
              {saving ? "Creating..." : "Create"}
            </button>
          </div>
        </Modal>
      )}

      {showEdit && (
        <Modal onClose={() => setShowEdit(false)}>
          <h2 className="lv-modal-title">Edit Leave Request</h2>
          <LeaveRequestForm form={form} set={set} errors={errors}
            leaveTypes={leaveTypes} employees={employees} showStatus />
          <div className="lv-modal-actions">
            <button className="lv-btn-cancel"
              onClick={() => setShowEdit(false)}>Cancel</button>
            <button className="lv-btn-primary"
              onClick={handleUpdate} disabled={saving}>
              {saving ? "Updating..." : "Update"}
            </button>
          </div>
        </Modal>
      )}

      {showDel && (
        <Modal onClose={() => setShowDel(false)}>
          <div className="lv-confirm">
            <div className="lv-confirm-icon">🗑️</div>
            <h2 className="lv-modal-title">Delete Request</h2>
            <p className="lv-confirm-text">
              Delete leave request for{" "}
              <strong>{selected?.employeeName}</strong>?
              This cannot be undone.
            </p>
            <div className="lv-modal-actions lv-modal-actions--center">
              <button className="lv-btn-cancel"
                onClick={() => setShowDel(false)}>Cancel</button>
              <button className="lv-btn-danger"
                onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

function LeaveRequestForm({ form, set, errors, leaveTypes,
  employees, showStatus }) {
  return (
    <div className="lv-form-body">
      <div className="lv-form-row">
        <div className="lv-form-group">
          <label className="lv-form-label">
            Employee <span className="lv-req">*</span>
          </label>
          <select
            className={`lv-form-select${errors.userId ? " lv-input--error" : ""
              }`}
            value={form.userId}
            onChange={e => set("userId", e.target.value)}>
            <option value="">-- Select Employee --</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.fullName}</option>
            ))}
          </select>
          {errors.userId && (
            <span className="lv-form-error">{errors.userId}</span>
          )}
        </div>
        <div className="lv-form-group">
          <label className="lv-form-label">
            Leave Type <span className="lv-req">*</span>
          </label>
          <select
            className={`lv-form-select${errors.leaveTypeId ? " lv-input--error" : ""
              }`}
            value={form.leaveTypeId}
            onChange={e => set("leaveTypeId", e.target.value)}>
            <option value="">-- Select Type --</option>
            {leaveTypes.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {errors.leaveTypeId && (
            <span className="lv-form-error">{errors.leaveTypeId}</span>
          )}
        </div>
      </div>
      <div className="lv-form-row">
        <div className="lv-form-group">
          <label className="lv-form-label">
            Start Date <span className="lv-req">*</span>
          </label>
          <input type="date"
            className={`lv-form-input${errors.startDate ? " lv-input--error" : ""
              }`}
            value={form.startDate}
            onChange={e => set("startDate", e.target.value)} />
          {errors.startDate && (
            <span className="lv-form-error">{errors.startDate}</span>
          )}
        </div>
        <div className="lv-form-group">
          <label className="lv-form-label">
            End Date <span className="lv-req">*</span>
          </label>
          <input type="date"
            className={`lv-form-input${errors.endDate ? " lv-input--error" : ""
              }`}
            value={form.endDate}
            onChange={e => set("endDate", e.target.value)} />
          {errors.endDate && (
            <span className="lv-form-error">{errors.endDate}</span>
          )}
        </div>
      </div>
      {form.startDate && form.endDate && (
        <p style={{ fontSize: "0.82rem", color: "#6366f1", margin: "0 0 8px" }}>
          📅 {calcDays(form.startDate, form.endDate)} day(s)
        </p>
      )}
      <div className="lv-form-group">
        <label className="lv-form-label">Approver</label>
        <select className="lv-form-select"
          value={form.approverId}
          onChange={e => set("approverId", e.target.value)}>
          <option value="">-- Select Approver --</option>
          {employees.map(e => (
            <option key={e.id} value={e.id}>{e.fullName}</option>
          ))}
        </select>
      </div>
      <div className="lv-form-group">
        <label className="lv-form-label">Reason</label>
        <textarea className="lv-form-textarea" rows={3}
          value={form.reason}
          onChange={e => set("reason", e.target.value)}
          placeholder="Optional reason..." />
      </div>
      {showStatus && (
        <>
          <div className="lv-form-group">
            <label className="lv-form-label">Status</label>
            <select className="lv-form-select"
              value={form.status}
              onChange={e => set("status", e.target.value)}>
              {["Pending", "Approved", "Rejected", "Cancelled"].map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="lv-form-group">
            <label className="lv-form-label">Admin Note</label>
            <textarea className="lv-form-textarea" rows={2}
              value={form.adminNote}
              onChange={e => set("adminNote", e.target.value)}
              placeholder="Optional admin note..." />
          </div>
        </>
      )}
    </div>
  );
}

// ══ TAB 2 — LEAVE TYPES ══════════════════════════════════════════
const LeaveTypes = ({ hasPermission }) => {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDel, setShowDel] = useState(false);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  const emptyType = {
    code: "", name: "", description: "", maxDaysPerYear: "",
    carryForward: false, requiresApproval: true, status: "Active"
  };
  const [form, setForm] = useState(emptyType);
  const [errors, setErrors] = useState({});
  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: "" }));
  };

  const load = async () => {
    try {
      setLoading(true);
      setTypes(await apiCall("/leave/types"));
    } catch (e) { console.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const validate = (f) => {
    const e = {};
    if (!f.code?.trim()) e.code = "Code is required.";
    if (!f.name?.trim()) e.name = "Name is required.";
    return e;
  };

  const handleCreate = async () => {
    const e = validate(form);
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      await apiCall("/leave/types", "POST", {
        code: form.code.toUpperCase().trim(),
        name: form.name.trim(),
        description: form.description || null,
        maxDaysPerYear: form.maxDaysPerYear
          ? Number(form.maxDaysPerYear) : null,
        carryForward: form.carryForward,
        requiresApproval: form.requiresApproval,
      });
      setShowAdd(false);
      await load();
    } catch (err) { alert("Error: " + err.message); }
    finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    const e = validate(form);
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      await apiCall(`/leave/types/${selected.id}`, "PUT", {
        name: form.name.trim(),
        description: form.description || null,
        maxDaysPerYear: form.maxDaysPerYear
          ? Number(form.maxDaysPerYear) : null,
        carryForward: form.carryForward,
        requiresApproval: form.requiresApproval,
      });
      setShowEdit(false);
      await load();
    } catch (err) { alert("Error: " + err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await apiCall(`/leave/types/${selected.id}`, "DELETE");
      setShowDel(false);
      await load();
    } catch (err) { alert("Error: " + err.message); }
  };

  const openEdit = (t) => {
    setSelected(t);
    setForm({ ...t, maxDaysPerYear: t.maxDaysPerYear || "" });
    setErrors({});
    setShowEdit(true);
  };

  return (
    <div>
      {hasPermission('leaves.manage_types') && (
        <div style={{
          display: "flex", justifyContent: "flex-end",
          marginBottom: 16
        }}>
          <button className="lv-btn-primary"
            onClick={() => {
              setForm(emptyType); setErrors({}); setShowAdd(true);
            }}>
            + Add Leave Type
          </button>
        </div>
      )}

      {loading ? (
        <div className="lv-table-card" style={{
          padding: "40px", textAlign: "center", color: "#888"
        }}>Loading...</div>
      ) : (
        <div className="lv-table-card">
          <table className="lv-table">
            <thead>
              <tr>
                <th>Code</th><th>Name</th><th>Max Days/Year</th>
                <th>Carry Forward</th><th>Requires Approval</th>
                <th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {types.length === 0 ? (
                <tr>
                  <td colSpan={7} className="lv-empty">
                    No leave types. Click "Add Leave Type" to create one.
                  </td>
                </tr>
              ) : types.map(t => (
                <tr key={t.id} className="lv-row">
                  <td><span className="lv-code-badge">{t.code}</span></td>
                  <td className="lv-name-cell">{t.name}</td>
                  <td>{t.maxDaysPerYear || "-"}</td>
                  <td>
                    <span className={`lv-bool ${t.carryForward ? "lv-bool--yes" : "lv-bool--no"
                      }`}>
                      {t.carryForward ? "Yes" : "No"}
                    </span>
                  </td>
                  <td>
                    <span className={`lv-bool ${t.requiresApproval ? "lv-bool--yes" : "lv-bool--no"
                      }`}>
                      {t.requiresApproval ? "Yes" : "No"}
                    </span>
                  </td>
                  <td>
                    <span className={`lv-badge ${t.isActive ? "lv-badge--approved" : "lv-badge--rejected"
                      }`}>
                      {t.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    {hasPermission('leaves.manage_types') && (
                      <div className="lv-actions">
                        <button className="lv-action-btn"
                          onClick={() => openEdit(t)} title="Edit">✏️</button>
                        <button className="lv-action-btn"
                          onClick={() => { setSelected(t); setShowDel(true); }}
                          title="Delete">🗑️</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <Modal onClose={() => setShowAdd(false)}>
          <h2 className="lv-modal-title">Add Leave Type</h2>
          <LeaveTypeForm form={form} set={set} errors={errors} />
          <div className="lv-modal-actions">
            <button className="lv-btn-cancel"
              onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="lv-btn-primary"
              onClick={handleCreate} disabled={saving}>
              {saving ? "Creating..." : "Create"}
            </button>
          </div>
        </Modal>
      )}

      {showEdit && (
        <Modal onClose={() => setShowEdit(false)}>
          <h2 className="lv-modal-title">Edit Leave Type</h2>
          <LeaveTypeForm form={form} set={set} errors={errors} showStatus />
          <div className="lv-modal-actions">
            <button className="lv-btn-cancel"
              onClick={() => setShowEdit(false)}>Cancel</button>
            <button className="lv-btn-primary"
              onClick={handleUpdate} disabled={saving}>
              {saving ? "Updating..." : "Update"}
            </button>
          </div>
        </Modal>
      )}

      {showDel && (
        <Modal onClose={() => setShowDel(false)}>
          <div className="lv-confirm">
            <div className="lv-confirm-icon">🗑️</div>
            <h2 className="lv-modal-title">Delete Leave Type</h2>
            <p className="lv-confirm-text">
              Delete <strong>{selected?.name}</strong>?
              This cannot be undone.
            </p>
            <div className="lv-modal-actions lv-modal-actions--center">
              <button className="lv-btn-cancel"
                onClick={() => setShowDel(false)}>Cancel</button>
              <button className="lv-btn-danger"
                onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

function LeaveTypeForm({ form, set, errors, showStatus }) {
  return (
    <div className="lv-form-body">
      <div className="lv-form-group">
        <label className="lv-form-label">
          Code <span className="lv-req">*</span>
        </label>
        <p className="lv-form-hint">e.g., AL, SL, CL</p>
        <input
          className={`lv-form-input${errors.code ? " lv-input--error" : ""}`}
          placeholder="AL"
          value={form.code}
          onChange={e => set("code", e.target.value.toUpperCase())} />
        {errors.code && (
          <span className="lv-form-error">{errors.code}</span>
        )}
      </div>
      <div className="lv-form-group">
        <label className="lv-form-label">
          Name <span className="lv-req">*</span>
        </label>
        <input
          className={`lv-form-input${errors.name ? " lv-input--error" : ""}`}
          placeholder="Annual Leave"
          value={form.name}
          onChange={e => set("name", e.target.value)} />
        {errors.name && (
          <span className="lv-form-error">{errors.name}</span>
        )}
      </div>
      <div className="lv-form-group">
        <label className="lv-form-label">Description</label>
        <textarea className="lv-form-textarea" rows={3}
          placeholder="Optional description"
          value={form.description}
          onChange={e => set("description", e.target.value)} />
      </div>
      <div className="lv-form-group">
        <label className="lv-form-label">Max Days Per Year</label>
        <input type="number" min="0" className="lv-form-input"
          placeholder="e.g., 12"
          value={form.maxDaysPerYear}
          onChange={e => set("maxDaysPerYear", e.target.value)} />
      </div>
      <div className="lv-form-check">
        <label className="lv-check-label">
          <input type="checkbox"
            checked={form.carryForward}
            onChange={e => set("carryForward", e.target.checked)} />
          Allow Carry Forward
        </label>
      </div>
      <div className="lv-form-check">
        <label className="lv-check-label">
          <input type="checkbox"
            checked={form.requiresApproval}
            onChange={e => set("requiresApproval", e.target.checked)} />
          Requires Approval
        </label>
      </div>
      {showStatus && (
        <div className="lv-form-group">
          <label className="lv-form-label">Status</label>
          <select className="lv-form-select"
            value={form.isActive ? "Active" : "Inactive"}
            onChange={e => set("isActive", e.target.value === "Active")}>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>
      )}
    </div>
  );
}

// ══ TAB 3 — POLICIES ═════════════════════════════════════════════
const Policies = ({ hasPermission }) => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDel, setShowDel] = useState(false);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  const emptyPolicy = {
    name: "", description: "", defaultAnnualDays: 12, probationDays: 0,
    yearStartMonth: "January", yearStartDay: 1, status: "Active"
  };
  const [form, setForm] = useState(emptyPolicy);
  const [errors, setErrors] = useState({});
  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: "" }));
  };

  const load = async () => {
    try {
      setLoading(true);
      setPolicies(await apiCall("/leave/policies"));
    } catch (e) { console.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const validate = (f) => {
    const e = {};
    if (!f.name?.trim()) e.name = "Policy name is required.";
    if (!f.defaultAnnualDays) e.defaultAnnualDays = "Annual leave days is required.";
    return e;
  };

  const handleCreate = async () => {
    const e = validate(form);
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      await apiCall("/leave/policies", "POST", {
        name: form.name.trim(),
        description: form.description || null,
        defaultAnnualDays: Number(form.defaultAnnualDays),
        probationDays: Number(form.probationDays) || 0,
        yearStartMonth: form.yearStartMonth,
        yearStartDay: Number(form.yearStartDay),
      });
      setShowAdd(false);
      await load();
    } catch (err) { alert("Error: " + err.message); }
    finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    const e = validate(form);
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      await apiCall(`/leave/policies/${selected.id}`, "PUT", {
        name: form.name.trim(),
        description: form.description || null,
        defaultAnnualDays: Number(form.defaultAnnualDays),
        probationDays: Number(form.probationDays) || 0,
        yearStartMonth: form.yearStartMonth,
        yearStartDay: Number(form.yearStartDay),
      });
      setShowEdit(false);
      await load();
    } catch (err) { alert("Error: " + err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await apiCall(`/leave/policies/${selected.id}`, "DELETE");
      setShowDel(false);
      await load();
    } catch (err) { alert("Error: " + err.message); }
  };

  return (
    <div>
      {hasPermission('leaves.manage_types') && (
        <div style={{
          display: "flex", justifyContent: "flex-end",
          marginBottom: 16
        }}>
          <button className="lv-btn-primary"
            onClick={() => {
              setForm(emptyPolicy); setErrors({}); setShowAdd(true);
            }}>
            + Add Policy
          </button>
        </div>
      )}

      {loading ? (
        <div className="lv-table-card" style={{
          padding: "40px", textAlign: "center", color: "#888"
        }}>Loading...</div>
      ) : (
        <div className="lv-table-card">
          <table className="lv-table">
            <thead>
              <tr>
                <th>Policy Name</th>
                <th>Default Annual Leave</th>
                <th>Probation Days</th>
                <th>Leave Year Start</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {policies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="lv-empty">
                    No policies. Click "Add Policy" to create one.
                  </td>
                </tr>
              ) : policies.map(p => (
                <tr key={p.id} className="lv-row">
                  <td className="lv-name-cell">{p.name}</td>
                  <td>{p.defaultAnnualDays} days</td>
                  <td>{p.probationDays} days</td>
                  <td>{p.yearStartMonth} {p.yearStartDay}</td>
                  <td>
                    <span className={`lv-badge ${p.isActive
                        ? "lv-badge--approved"
                        : "lv-badge--rejected"
                      }`}>
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    {hasPermission('leaves.manage_types') && (
                      <div className="lv-actions">
                        <button className="lv-action-btn"
                          onClick={() => {
                            setSelected(p);
                            setForm({
                              ...p,
                              defaultAnnualDays: p.defaultAnnualDays || 12,
                              probationDays: p.probationDays || 0,
                            });
                            setErrors({});
                            setShowEdit(true);
                          }}
                          title="Edit">✏️</button>
                        <button className="lv-action-btn"
                          onClick={() => {
                            setSelected(p); setShowDel(true);
                          }}
                          title="Delete">🗑️</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <Modal onClose={() => setShowAdd(false)}>
          <h2 className="lv-modal-title">Add Leave Policy</h2>
          <PolicyForm form={form} set={set} errors={errors} />
          <div className="lv-modal-actions">
            <button className="lv-btn-cancel"
              onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="lv-btn-primary"
              onClick={handleCreate} disabled={saving}>
              {saving ? "Creating..." : "Create"}
            </button>
          </div>
        </Modal>
      )}

      {showEdit && (
        <Modal onClose={() => setShowEdit(false)}>
          <h2 className="lv-modal-title">Edit Leave Policy</h2>
          <PolicyForm form={form} set={set} errors={errors} showStatus />
          <div className="lv-modal-actions">
            <button className="lv-btn-cancel"
              onClick={() => setShowEdit(false)}>Cancel</button>
            <button className="lv-btn-primary"
              onClick={handleUpdate} disabled={saving}>
              {saving ? "Updating..." : "Update"}
            </button>
          </div>
        </Modal>
      )}

      {showDel && (
        <Modal onClose={() => setShowDel(false)}>
          <div className="lv-confirm">
            <div className="lv-confirm-icon">🗑️</div>
            <h2 className="lv-modal-title">Delete Policy</h2>
            <p className="lv-confirm-text">
              Delete <strong>{selected?.name}</strong>?
            </p>
            <div className="lv-modal-actions lv-modal-actions--center">
              <button className="lv-btn-cancel"
                onClick={() => setShowDel(false)}>Cancel</button>
              <button className="lv-btn-danger"
                onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

function PolicyForm({ form, set, errors, showStatus }) {
  return (
    <div className="lv-form-body">
      <div className="lv-form-group">
        <label className="lv-form-label">
          Policy Name <span className="lv-req">*</span>
        </label>
        <input
          className={`lv-form-input${errors.name ? " lv-input--error" : ""}`}
          placeholder="e.g., Annual Leave Policy 2026"
          value={form.name}
          onChange={e => set("name", e.target.value)} />
        {errors.name && (
          <span className="lv-form-error">{errors.name}</span>
        )}
      </div>
      <div className="lv-form-group">
        <label className="lv-form-label">Description</label>
        <textarea className="lv-form-textarea" rows={3}
          placeholder="Optional description"
          value={form.description}
          onChange={e => set("description", e.target.value)} />
      </div>
      <div className="lv-form-group">
        <label className="lv-form-label">
          Default Annual Leave Days <span className="lv-req">*</span>
        </label>
        <input type="number" min="0"
          className={`lv-form-input${errors.defaultAnnualDays ? " lv-input--error" : ""
            }`}
          value={form.defaultAnnualDays}
          onChange={e => set("defaultAnnualDays", e.target.value)} />
        {errors.defaultAnnualDays && (
          <span className="lv-form-error">{errors.defaultAnnualDays}</span>
        )}
      </div>
      <div className="lv-form-group">
        <label className="lv-form-label">Probation Period Days</label>
        <input type="number" min="0" className="lv-form-input"
          value={form.probationDays}
          onChange={e => set("probationDays", e.target.value)} />
      </div>
      <div className="lv-form-row">
        <div className="lv-form-group">
          <label className="lv-form-label">Leave Year Start Month</label>
          <select className="lv-form-select"
            value={form.yearStartMonth}
            onChange={e => set("yearStartMonth", e.target.value)}>
            {MONTHS.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div className="lv-form-group">
          <label className="lv-form-label">Day</label>
          <input type="number" min="1" max="31" className="lv-form-input"
            value={form.yearStartDay}
            onChange={e => set("yearStartDay", e.target.value)} />
        </div>
      </div>
      {showStatus && (
        <div className="lv-form-group">
          <label className="lv-form-label">Status</label>
          <select className="lv-form-select"
            value={form.isActive ? "Active" : "Inactive"}
            onChange={e => set("isActive", e.target.value === "Active")}>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>
      )}
    </div>
  );
}

// ══ TAB 4 — BALANCES ═════════════════════════════════════════════
const Balances = ({ employees }) => {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterEmployee, setFilterEmployee] = useState("");
  const [year, setYear] = useState(
    new Date().getFullYear());

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ year });
      const data = await apiCall(`/leave/balances?${params}`);
      setBalances(data || []);
    } catch (e) { console.error(e.message); }
    finally { setLoading(false); }
  }, [year]);

  useEffect(() => { load(); }, [load]);

  const filtered = balances.filter(b =>
    !filterEmployee || b.userId === filterEmployee);

  return (
    <div>
      <div className="lv-filter-card">
        <div className="lv-filter-group">
          <label className="lv-filter-label">Employee</label>
          <select className="lv-filter-select"
            value={filterEmployee}
            onChange={e => setFilterEmployee(e.target.value)}>
            <option value="">All Employees</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.fullName}</option>
            ))}
          </select>
        </div>
        <div className="lv-filter-group">
          <label className="lv-filter-label">Year</label>
          <select className="lv-filter-select"
            value={year}
            onChange={e => setYear(Number(e.target.value))}>
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="lv-table-card" style={{
          padding: "40px", textAlign: "center", color: "#888"
        }}>Loading...</div>
      ) : (
        <div className="lv-table-card">
          <table className="lv-table">
            <thead>
              <tr>
                <th>Employee</th><th>Leave Type</th><th>Year</th>
                <th>Total Allocated</th><th>Used</th>
                <th>Pending</th><th>Carried Forward</th><th>Available</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="lv-empty">
                    No leave balances found.
                  </td>
                </tr>
              ) : filtered.map((b, i) => (
                <tr key={i} className="lv-row">
                  <td className="col-left">{b.employeeName}</td>
                  <td>{b.leaveTypeName}</td>
                  <td>{b.year}</td>
                  <td>{b.totalAllocated?.toString()}</td>
                  <td>{b.used?.toString()}</td>
                  <td>{b.pending?.toString()}</td>
                  <td>{b.carriedForward?.toString()}</td>
                  <td><strong>{b.available?.toString()}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ══ MAIN COMPONENT ════════════════════════════════════════════════
const TABS = [
  { key: "requests", label: "Leave Requests", icon: "📋" },
  { key: "types", label: "Leave Types", icon: "🏷️" },
  { key: "policies", label: "Policies", icon: "📄" },
  { key: "balances", label: "Balances", icon: "💰" },
];

const Leave = () => {
  const [activeTab, setActiveTab] = useState("requests");
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [employees, setEmployees] = useState([]);

  const currentUser = getCurrentUser();
  const roles = currentUser?.roles || [];
  const hasPermission = (perm) => roles.includes('Admin') || currentUser?.permissions?.includes(perm);

  // Load shared data once
  useEffect(() => {
    const load = async () => {
      try {
        const [types, users] = await Promise.all([
          apiCall("/leave/types"),
          apiCall("/users"),
        ]);
        setLeaveTypes(types || []);
        setEmployees((users || []).map(u => ({
          id: u.id,
          fullName: u.fullName || u.email,
        })));
      } catch (e) { console.error(e.message); }
    };
    load();
  }, []);

  return (
    <div className="lv-wrapper">
      <div className="lv-header">
        <span className="lv-header-icon">🏖️</span>
        <h2 className="lv-header-title">Leave Management</h2>
      </div>

      <div className="lv-tabs">
        {TABS.map(tab => (
          <button key={tab.key}
            className={`lv-tab${activeTab === tab.key ? " lv-tab--active" : ""}`}
            onClick={() => setActiveTab(tab.key)}>
            <span className="lv-tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="lv-content">
        {activeTab === "requests" && (
          <LeaveRequests leaveTypes={leaveTypes} employees={employees} hasPermission={hasPermission} />
        )}
        {activeTab === "types" && <LeaveTypes hasPermission={hasPermission} />}
        {activeTab === "policies" && <Policies hasPermission={hasPermission} />}
        {activeTab === "balances" && (
          <Balances employees={employees} />
        )}
      </div>
    </div>
  );
};

export default Leave;