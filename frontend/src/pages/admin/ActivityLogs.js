// src/pages/admin/ActivityLogs.js

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './ActivityLogs.css';
import { apiCall } from '../../utils/api';

/* ─── Constants ─────────────────────────────────────────────────── */
const ENTITY_TYPES = [
  { label: 'Employee', value: 'employee' },
  { label: 'Project', value: 'project' },
  { label: 'Task', value: 'task' },
  { label: 'Shift', value: 'shift' },
  { label: 'Process', value: 'process' },
  { label: 'Job', value: 'job' },
];

const ACTION_TYPES = [
  { label: 'Create', value: 'CREATE' },
  { label: 'Update', value: 'UPDATE' },
  { label: 'Delete', value: 'DELETE' },
  { label: 'Login', value: 'LOGIN' },
  { label: 'Logout', value: 'LOGOUT' },
  { label: 'Password Reset', value: 'PASSWORD_RESET' },
  { label: 'Bulk Import', value: 'BULK_IMPORT' },
];

const ITEMS_OPTIONS = [10, 25, 50, 100];

/* ─── Format timestamp: DD/MM/YYYY, HH:MM:SS ────────────────────── */
const fmtTimestamp = (iso) => {
  if (!iso) return '-';
  const d   = new Date(iso);
  const dd  = String(d.getDate()).padStart(2,'0');
  const mm  = String(d.getMonth()+1).padStart(2,'0');
  const yr  = d.getFullYear();
  const hh  = String(d.getHours()).padStart(2,'0');
  const min = String(d.getMinutes()).padStart(2,'0');
  const ss  = String(d.getSeconds()).padStart(2,'0');
  return `${dd}/${mm}/${yr}, ${hh}:${min}:${ss}`;
};

/* ─── Action Badge ───────────────────────────────────────────────── */
const ActionBadge = ({ action }) => {
  if (!action) return <span className="al-action-badge">-</span>;
  const label = action.replace('_', ' ').toUpperCase();
  const cssClass = action.toLowerCase().replace('_', '-');
  return (
    <span className={`al-action-badge al-action-${cssClass}`}>
      {label}
    </span>
  );
};

/* ─── Entity Type Badge ─────────────────────────────────────────── */
const EntityBadge = ({ type }) => (
  <span className="al-entity-badge">{type ? type.toLowerCase() : '-'}</span>
);

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════ */
const ActivityLogs = () => {
  /* Filter state */
  const [fEntityType, setFEntityType] = useState('');
  const [fAction,     setFAction]     = useState('');
  const [applied,     setApplied]     = useState({ entityType: '', action: '' });

  /* Pagination */
  const [perPage, setPerPage] = useState(10);
  const [page,    setPage]    = useState(1);

  /* Logs data */
  const [logs, setLogs] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* Load data from API */
  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let query = `/activity-logs?page=${page - 1}&size=${perPage}`;
      if (applied.entityType) query += `&entityType=${applied.entityType}`;
      if (applied.action) query += `&action=${applied.action}`;

      const data = await apiCall(query);
      setLogs(data.content || []);
      setTotalItems(data.totalElements || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err.message || 'Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, applied]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  /* Apply Filters click */
  const handleApply = () => {
    setApplied({ entityType: fEntityType, action: fAction });
    setPage(1);
  };

  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * perPage;

  const goTo = (p) => setPage(Math.max(1, Math.min(p, totalPages)));
  const handlePerPage = (val) => {
    setPerPage(val);
    setPage(1);
  };

  /* Page number buttons — show max 5 */
  const pageNumbers = useMemo(() => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  }, [totalPages]);

  return (
    <div className="al-container">

      {/* ── Page Header ── */}
      <div className="al-page-header">
        <div className="al-page-title">
          <span className="al-page-icon">📋</span>
          <h2>Activity Logs</h2>
        </div>
      </div>

      {/* ── Filter Card ── */}
      <div className="al-filter-card">
        <p className="al-filter-title">Filters</p>

        {/* Two-column filter grid — Entity Type | Action */}
        <div className="al-filter-grid">
          <div className="al-filter-group">
            <label>Entity Type</label>
            <select
              className="al-filter-select"
              value={fEntityType}
              onChange={e => setFEntityType(e.target.value)}
            >
              <option value="">All Types</option>
              {ENTITY_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="al-filter-group">
            <label>Action</label>
            <select
              className="al-filter-select"
              value={fAction}
              onChange={e => setFAction(e.target.value)}
            >
              <option value="">All Actions</option>
              {ACTION_TYPES.map(a => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>
        </div>

        <button className="al-apply-btn" onClick={handleApply} disabled={loading}>
          {loading ? 'Applying...' : 'Apply Filters'}
        </button>
      </div>

      {error && (
        <div style={{
          padding: '12px 18px',
          background: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '8px',
          color: '#991b1b',
          fontSize: '0.85rem',
          fontWeight: '600',
          marginBottom: '20px'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── Table Card ── */}
      <div className="al-table-card">
        <div className="al-table-wrapper">
          <table className="al-table">
            <thead>
              <tr>
                <th className="col-ts">Timestamp</th>
                <th className="col-user">User</th>
                <th className="col-action">Action</th>
                <th className="col-entity-type">Entity Type</th>
                <th className="col-entity">Entity</th>
                <th className="col-changes">Changes</th>
                <th className="col-ip">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="al-empty">
                    {loading ? 'Loading...' : 'No activity logs found for selected filters.'}
                  </td>
                </tr>
              ) : logs.map(log => (
                <tr key={log.id}>
                  <td className="td-ts">{fmtTimestamp(log.createdAt)}</td>
                  <td className="td-user col-left">{log.userName}</td>
                  <td className="td-action"><ActionBadge action={log.action} /></td>
                  <td className="td-entity-type"><EntityBadge type={log.entityType} /></td>
                  <td className="td-entity col-left">{log.entityLabel || '-'}</td>
                  <td className="td-changes">
                    {!log.changes || log.changes === '-'
                      ? <span className="al-dash">-</span>
                      : <span className="al-changes-text">{log.changes}</span>}
                  </td>
                  <td className="td-ip">{log.ipAddress || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Pagination Footer ── */}
        <div className="al-pagination">
          {/* Items per page */}
          <div className="al-per-page">
            <span>Items per page:</span>
            <select
              value={perPage}
              onChange={e => handlePerPage(Number(e.target.value))}
            >
              {ITEMS_OPTIONS.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {/* Showing X to Y of Z */}
          <div className="al-page-info">
            {totalItems === 0
              ? 'No items'
              : `Showing ${startIdx + 1} to ${Math.min(startIdx + perPage, totalItems)} of ${totalItems} items`}
          </div>

          {/* Page nav buttons — «  «  1  2  »  » */}
          <div className="al-page-nav">
            {/* First */}
            <button
              className="al-nav-btn al-nav-edge"
              title="First page"
              disabled={safePage === 1 || loading}
              onClick={() => goTo(1)}
            >
              «
            </button>
            {/* Prev */}
            <button
              className="al-nav-btn"
              title="Previous page"
              disabled={safePage === 1 || loading}
              onClick={() => goTo(safePage - 1)}
            >
              ‹
            </button>

            {/* Numbered pages */}
            {pageNumbers.map(n => (
              <button
                key={n}
                className={`al-nav-btn${safePage === n ? ' al-active-page' : ''}`}
                disabled={loading}
                onClick={() => goTo(n)}
              >
                {n}
              </button>
            ))}

            {/* Next */}
            <button
              className="al-nav-btn"
              title="Next page"
              disabled={safePage === totalPages || loading}
              onClick={() => goTo(safePage + 1)}
            >
              ›
            </button>
            {/* Last */}
            <button
              className="al-nav-btn al-nav-edge"
              title="Last page"
              disabled={safePage === totalPages || loading}
              onClick={() => goTo(totalPages)}
            >
              »
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ActivityLogs;