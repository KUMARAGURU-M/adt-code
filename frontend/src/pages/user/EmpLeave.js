import React, { useState, useEffect, useCallback } from "react";
import "./EmpLeave.css";
import { apiCall } from "../../utils/api";

// ── Helpers ───────────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return d; }
};

const calcDays = (start, end) => {
  if (!start || !end) return null;
  const diff = (new Date(end) - new Date(start)) / 86400000;
  return diff >= 0 ? diff + 1 : null;
};

const statusClass = (s) => ({
  Pending:   "el-badge--pending",
  Approved:  "el-badge--approved",
  Rejected:  "el-badge--rejected",
  Cancelled: "el-badge--cancelled",
}[s] || "");

// ═════════════════════════════════════════════════════════════════
const EmpLeave = () => {
  const [activeTab,    setActiveTab]    = useState("apply");
  const [isModalOpen,  setIsModalOpen]  = useState(false);

  // Data
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [approvers,  setApprovers]  = useState([]);
  const [requests,   setRequests]   = useState([]);
  const [balances,   setBalances]   = useState([]);
  const [loading,    setLoading]    = useState(true);

  // Apply form
  const [form,   setForm]   = useState({
    leaveTypeId:"", approverId:"", startDate:"", endDate:"", reason:""
  });
  const [errors,  setErrors]  = useState({});
  const [saving,  setSaving]  = useState(false);

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: "" }));
  };

  // ── Load data ─────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const [types, users, reqs, bals] = await Promise.all([
        apiCall("/leave/types"),
        apiCall("/users/approvers"),
        apiCall("/leave/my-requests"),
        apiCall(`/leave/my-balance?year=${new Date().getFullYear()}`),
      ]);
      setLeaveTypes(types || []);
      setApprovers((users || []).map(u => ({
        id: u.id, fullName: u.fullName || u.email
      })));
      setRequests(reqs || []);
      setBalances(bals || []);
    } catch (e) {
      console.error("Failed to load leave data:", e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Apply for leave ───────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.leaveTypeId) e.leaveTypeId = "Leave type is required.";
    if (!form.startDate)   e.startDate   = "Start date is required.";
    if (!form.endDate)     e.endDate     = "End date is required.";
    if (form.startDate && form.endDate &&
        new Date(form.endDate) < new Date(form.startDate)) {
      e.endDate = "End date must be after start date.";
    }
    return e;
  };

  const handleApply = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      await apiCall("/leave/apply", "POST", {
        leaveTypeId: form.leaveTypeId,
        approverId:  form.approverId || null,
        startDate:   form.startDate,
        endDate:     form.endDate,
        reason:      form.reason || null,
      });
      setIsModalOpen(false);
      setForm({ leaveTypeId:"", approverId:"",
                startDate:"", endDate:"", reason:"" });
      setErrors({});
      await loadAll();
    } catch (err) { alert("Error: " + err.message); }
    finally { setSaving(false); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this leave request?")) return;
    try {
      await apiCall(`/leave/my-requests/${id}/cancel`, "PATCH", {});
      await loadAll();
    } catch (err) { alert("Error: " + err.message); }
  };

  const daysPreview = calcDays(form.startDate, form.endDate);

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="el-page">
      <div className="el-header">
        <h1 className="el-title">Leave Management</h1>
        <p className="el-subtitle">
          Apply for leave, view your leave balance,
          and check leave history
        </p>
      </div>

      <div className="el-tabs-container">
        <div className="el-tabs">
          {[
            ["apply",   "📝 Apply for Leave"],
            ["balance", "💰 Leave Balance"],
            ["history", "📋 Leave History"],
          ].map(([key, label]) => (
            <button key={key}
              className={`el-tab-btn ${activeTab===key ? "active" : ""}`}
              onClick={() => setActiveTab(key)}>
              {label}
            </button>
          ))}
        </div>
        <div className="el-actions">
          <button className="el-apply-btn"
            onClick={() => setIsModalOpen(true)}>
            + Apply for Leave
          </button>
        </div>
      </div>

      <div className="el-content">

        {/* ── Apply Tab ── */}
        {activeTab === "apply" && (
          <div className="el-card el-empty-card">
            <p className="el-empty-text">
              Click "Apply for Leave" to submit a new leave request.
            </p>

            {/* Quick summary of pending requests */}
            {requests.filter(r => r.status === "Pending").length > 0 && (
              <div className="el-pending-summary">
                <strong>
                  {requests.filter(r => r.status === "Pending").length}
                </strong>{" "}
                request(s) pending approval.
              </div>
            )}
          </div>
        )}

        {/* ── Balance Tab ── */}
        {activeTab === "balance" && (
          <div className="el-card">
            {loading ? (
              <p style={{ textAlign:"center", color:"#888",
                          padding:"32px" }}>
                Loading...
              </p>
            ) : (
              <div className="el-table-container">
                <table className="el-table">
                  <thead>
                    <tr>
                      <th>Leave Type</th>
                      <th>Year</th>
                      <th>Total Allocated</th>
                      <th>Used</th>
                      <th>Pending</th>
                      <th>Carried Forward</th>
                      <th>Available</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balances.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="el-empty-row">
                          No leave balance information available.
                        </td>
                      </tr>
                    ) : balances.map((b, i) => (
                      <tr key={i}>
                        <td>{b.leaveTypeName}</td>
                        <td>{b.year}</td>
                        <td>{b.totalAllocated}</td>
                        <td>{b.used}</td>
                        <td>{b.pending}</td>
                        <td>{b.carriedForward}</td>
                        <td>
                          <strong style={{ color:"#16a34a" }}>
                            {b.available}
                          </strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── History Tab ── */}
        {activeTab === "history" && (
          <div className="el-card">
            {loading ? (
              <p style={{ textAlign:"center", color:"#888",
                          padding:"32px" }}>
                Loading...
              </p>
            ) : (
              <div className="el-table-container">
                <table className="el-table">
                  <thead>
                    <tr>
                      <th>Leave Type</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Days</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Applied On</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="el-empty-row">
                          No leave requests found.
                        </td>
                      </tr>
                    ) : requests.map(r => (
                      <tr key={r.id}>
                        <td>{r.leaveTypeName}</td>
                        <td>{fmtDate(r.startDate)}</td>
                        <td>{fmtDate(r.endDate)}</td>
                        <td>{r.days?.toString()}</td>
                        <td>{r.reason || "-"}</td>
                        <td>
                          <span className={`el-badge ${statusClass(r.status)}`}>
                            {r.status}
                          </span>
                        </td>
                        <td>{fmtDate(r.appliedAt)}</td>
                        <td>
                          {r.status === "Pending" && (
                            <button className="el-cancel-btn"
                              onClick={() => handleCancel(r.id)}>
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Apply Modal ── */}
      {isModalOpen && (
        <div className="el-modal-overlay">
          <div className="el-modal">
            <h2 className="el-modal-title">Apply for Leave</h2>

            <div className="el-form-group">
              <label>Leave Type <span style={{ color:"red" }}>*</span></label>
              <div className="el-select-wrapper">
                <select
                  className={`el-select${
                    errors.leaveTypeId ? " el-input--error" : ""
                  }`}
                  value={form.leaveTypeId}
                  onChange={e => set("leaveTypeId", e.target.value)}>
                  <option value="">Select Leave Type</option>
                  {leaveTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <span className="el-select-arrow">▾</span>
              </div>
              {errors.leaveTypeId && (
                <span style={{ color:"red", fontSize:"0.8rem" }}>
                  {errors.leaveTypeId}
                </span>
              )}
            </div>

            <div className="el-form-group">
              <label>Request To</label>
              <div className="el-select-wrapper">
                <select className="el-select"
                  value={form.approverId}
                  onChange={e => set("approverId", e.target.value)}>
                  <option value="">Select Approver</option>
                  {approvers.map(a => (
                    <option key={a.id} value={a.id}>{a.fullName}</option>
                  ))}
                </select>
                <span className="el-select-arrow">▾</span>
              </div>
            </div>

            <div className="el-form-group">
              <label>Start Date <span style={{ color:"red" }}>*</span></label>
              <input type="date" className={`el-input${
                errors.startDate ? " el-input--error" : ""
              }`}
                value={form.startDate}
                onChange={e => set("startDate", e.target.value)} />
              {errors.startDate && (
                <span style={{ color:"red", fontSize:"0.8rem" }}>
                  {errors.startDate}
                </span>
              )}
            </div>

            <div className="el-form-group">
              <label>End Date <span style={{ color:"red" }}>*</span></label>
              <input type="date" className={`el-input${
                errors.endDate ? " el-input--error" : ""
              }`}
                value={form.endDate}
                onChange={e => set("endDate", e.target.value)} />
              {errors.endDate && (
                <span style={{ color:"red", fontSize:"0.8rem" }}>
                  {errors.endDate}
                </span>
              )}
            </div>

            {daysPreview && (
              <p style={{ color:"#6366f1", fontSize:"0.85rem",
                          margin:"0 0 12px" }}>
                📅 {daysPreview} day(s) requested
              </p>
            )}

            <div className="el-form-group">
              <label>Reason</label>
              <textarea className="el-textarea"
                placeholder="Optional: Enter reason for leave"
                rows={3}
                value={form.reason}
                onChange={e => set("reason", e.target.value)} />
            </div>

            <div className="el-modal-actions">
              <button className="el-btn-cancel"
                onClick={() => {
                  setIsModalOpen(false);
                  setErrors({});
                  setForm({
                    leaveTypeId:"", approverId:"",
                    startDate:"", endDate:"", reason:""
                  });
                }}>
                Cancel
              </button>
              <button className="el-btn-submit"
                onClick={handleApply} disabled={saving}>
                {saving ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmpLeave;