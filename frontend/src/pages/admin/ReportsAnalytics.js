// src/pages/admin/ReportsAnalytics.js

import React, { useState, useMemo, useEffect } from 'react';
import './ReportsAnalytics.css';
import { apiCall } from '../../utils/api';

/* ─── Format helpers ─────────────────────────────────────────────── */
const fmtDateTime = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  const dd   = String(d.getDate()).padStart(2,'0');
  const mm   = String(d.getMonth()+1).padStart(2,'0');
  const yyyy = d.getFullYear();
  const hh   = String(d.getHours()).padStart(2,'0');
  const min  = String(d.getMinutes()).padStart(2,'0');
  const ss   = String(d.getSeconds()).padStart(2,'0');
  return `${dd}/${mm}/${yyyy}, ${hh}:${min}:${ss}`;
};

const fmtHrs = (h) => {
  if (h === 0) return '0 hrs';
  return `${h % 1 === 0 ? h : h.toFixed(2)} hrs`;
};

const roundHrs = (h) => parseFloat(h.toFixed(1));

const mapStatus = (status) => {
  if (!status) return { label: '-', className: '' };
  const s = status.toUpperCase();
  if (s === 'FINISH' || s === 'COMPLETED') {
    return { label: 'Completed', className: 'completed' };
  }
  if (s === 'HOLD' || s === 'ON-HOLD') {
    return { label: 'On-Hold', className: 'on-hold' };
  }
  if (s === 'WIP') {
    return { label: 'In Progress', className: 'wip' };
  }
  if (s === 'RUNNING') {
    return { label: 'Running', className: 'running' };
  }
  if (s === 'ON BREAK' || s === 'ON_BREAK') {
    return { label: 'On Break', className: 'on-break' };
  }
  return { label: status, className: status.toLowerCase() };
};

/* ─── Stat Card ─────────────────────────────────────────────────── */
const StatCard = ({ label, value, sub, color }) => (
  <div className="ra-stat-card">
    <p className="ra-stat-label">{label}</p>
    <h2 className="ra-stat-value" style={{ color }}>{value}</h2>
    <p className="ra-stat-sub">{sub}</p>
  </div>
);

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════ */
const ReportsAnalytics = () => {
  const [startDate,  setStartDate]  = useState('');
  const [endDate,    setEndDate]    = useState('');
  const [fEmployee,  setFEmployee]  = useState('');
  const [fProject,   setFProject]   = useState('');

  const [logs, setLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Load dropdown options on mount ──
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [usersData, projectsData] = await Promise.all([
          apiCall('/users'),
          apiCall('/projects')
        ]);
        setEmployees(usersData || []);
        setProjects(projectsData || []);
      } catch (err) {
        console.warn('Failed to load filter options:', err.message);
      }
    };
    loadFilters();
  }, []);

  const applyFilters = async () => {
    setLoading(true);
    setError('');
    try {
      let query = '/reports/logs?';
      const params = [];
      if (fEmployee) params.push(`userId=${fEmployee}`);
      if (fProject) params.push(`projectId=${fProject}`);
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);
      query += params.join('&');

      const data = await apiCall(query);
      setLogs(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch report logs');
    } finally {
      setLoading(false);
    }
  };

  // ── Load all logs on initial page load ──
  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredLogs = logs;

  const topScrollRef = React.useRef(null);
  const bottomScrollRef = React.useRef(null);

  React.useEffect(() => {
    const topEl = topScrollRef.current;
    const bottomEl = bottomScrollRef.current;
    if (!topEl || !bottomEl) return;

    const resizeObserver = new ResizeObserver(() => {
      const firstChild = bottomEl.firstElementChild;
      if (firstChild) {
        const tableWidth = firstChild.offsetWidth;
        const innerDummy = topEl.firstElementChild;
        if (innerDummy) {
          innerDummy.style.width = `${tableWidth}px`;
        }
      }
    });

    resizeObserver.observe(bottomEl);

    let isSyncingTop = false;
    let isSyncingBottom = false;

    const handleTopScroll = () => {
      if (!isSyncingBottom) {
        isSyncingTop = true;
        bottomEl.scrollLeft = topEl.scrollLeft;
        isSyncingTop = false;
      }
    };

    const handleBottomScroll = () => {
      if (!isSyncingTop) {
        isSyncingBottom = true;
        topEl.scrollLeft = bottomEl.scrollLeft;
        isSyncingBottom = false;
      }
    };

    topEl.addEventListener('scroll', handleTopScroll);
    bottomEl.addEventListener('scroll', handleBottomScroll);

    return () => {
      resizeObserver.disconnect();
      topEl.removeEventListener('scroll', handleTopScroll);
      bottomEl.removeEventListener('scroll', handleBottomScroll);
    };
  }, [filteredLogs]);

  /* ── Summary stats ── */
  const totalHours = useMemo(() =>
    roundHrs(filteredLogs.reduce((s, l) => s + (l.workingSeconds || 0) / 3600.0, 0)),
  [filteredLogs]);

  const totalPages = useMemo(() =>
    filteredLogs.reduce((s, l) => s + (l.pagesCompleted || 0), 0),
  [filteredLogs]);

  const totalLogs = filteredLogs.length;

  /* ── Hours & Pages by Employee ── */
  const byEmployee = useMemo(() => {
    const map = {};
    filteredLogs.forEach(l => {
      const empName = l.employeeName || 'Unknown';
      if (!map[empName]) map[empName] = { hrs: 0, pages: 0 };
      map[empName].hrs   += (l.workingSeconds || 0) / 3600.0;
      map[empName].pages += (l.pagesCompleted || 0);
    });
    return Object.entries(map)
      .map(([name, d]) => ({ name, hrs: roundHrs(d.hrs), pages: d.pages }))
      .sort((a, b) => b.hrs - a.hrs);
  }, [filteredLogs]);

  /* ── Hours & Pages by Project ── */
  const byProject = useMemo(() => {
    const map = {};
    filteredLogs.forEach(l => {
      const projName = l.projectName || 'Unknown';
      if (!map[projName]) map[projName] = { hrs: 0, pages: 0 };
      map[projName].hrs   += (l.workingSeconds || 0) / 3600.0;
      map[projName].pages += (l.pagesCompleted || 0);
    });
    return Object.entries(map)
      .map(([name, d]) => ({ name, hrs: roundHrs(d.hrs), pages: d.pages }))
      .sort((a, b) => b.hrs - a.hrs);
  }, [filteredLogs]);

  /* ── Export CSV ── */
  const exportCSV = () => {
    const headers = ['ID', 'Employee', 'Project', 'Task', 'Start Time', 'End Time', 'Duration (hrs)', 'Pages', 'Status'];
    const rows = filteredLogs.map(l => [
      l.id,
      `"${l.employeeName || '-'}"`,
      `"${l.projectName || '-'}"`,
      `"${l.taskTitle || l.isbnTitle || '-'}"`,
      fmtDateTime(l.startTime),
      fmtDateTime(l.endTime),
      ((l.workingSeconds || 0) / 3600.0).toFixed(2),
      l.pagesCompleted ?? 0,
      `"${l.status || '-'}"`
    ].join(','));
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' });
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob), download: 'reports.csv',
    });
    a.click(); URL.revokeObjectURL(a.href);
  };

  return (
    <div className="ra-container">

      {/* ── Page Header ── */}
      <div className="ra-page-header">
        <div className="ra-page-title">
          <span className="ra-page-icon">📋</span>
          <h2>Reports &amp; Analytics</h2>
        </div>
        <button className="ra-export-btn" onClick={exportCSV} disabled={loading || filteredLogs.length === 0}>
          📤 Export CSV
        </button>
      </div>

      {/* ── Filter Card ── */}
      <div className="ra-filter-card">
        <p className="ra-filter-title">Filters</p>

        <div className="ra-filter-grid">
          {/* Start Date */}
          <div className="ra-filter-group">
            <label>Start Date</label>
            <input
              type="date"
              className="ra-filter-input"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>

          {/* End Date */}
          <div className="ra-filter-group">
            <label>End Date</label>
            <input
              type="date"
              className="ra-filter-input"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>

          {/* Employee */}
          <div className="ra-filter-group">
            <label>Employee</label>
            <select
              className="ra-filter-select"
              value={fEmployee}
              onChange={e => setFEmployee(e.target.value)}
            >
              <option value="">All Employees</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
            </select>
          </div>

          {/* Project */}
          <div className="ra-filter-group">
            <label>Project</label>
            <select
              className="ra-filter-select"
              value={fProject}
              onChange={e => setFProject(e.target.value)}
            >
              <option value="">All Projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        <button className="ra-apply-btn" onClick={applyFilters} disabled={loading}>
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
          fontWeight: '600'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="ra-stats-grid">
        <StatCard
          label="Total Hours"
          value={totalHours}
          sub="Logged time"
          color="#13c6df"
        />
        <StatCard
          label="Total Pages"
          value={totalPages}
          sub="Completed pages"
          color="#f59e0b"
        />
        <StatCard
          label="Total Logs"
          value={totalLogs}
          sub="Time entries"
          color="#10b981"
        />
      </div>

      {/* ── Hours & Pages by Employee ── */}
      <div className="ra-section-card">
        <h3 className="ra-section-title">Hours &amp; Pages by Employee</h3>
        <div className="ra-breakdown-list">
          {byEmployee.length === 0 ? (
            <p className="ra-empty">No data for selected filters.</p>
          ) : byEmployee.map(row => (
            <div key={row.name} className="ra-breakdown-row">
              <span className="ra-breakdown-name">{row.name}</span>
              <div className="ra-breakdown-right">
                <span className="ra-hrs-val">{fmtHrs(row.hrs)}</span>
                <span className="ra-sep">·</span>
                <span className="ra-pages-icon">📄</span>
                <span className="ra-pages-val">{row.pages} pages</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Hours & Pages by Project ── */}
      <div className="ra-section-card">
        <h3 className="ra-section-title">Hours &amp; Pages by Project</h3>
        <div className="ra-breakdown-list">
          {byProject.length === 0 ? (
            <p className="ra-empty">No data for selected filters.</p>
          ) : byProject.map(row => (
            <div key={row.name} className="ra-breakdown-row">
              <span className="ra-breakdown-name">{row.name}</span>
              <div className="ra-breakdown-right">
                {row.hrs > 0 && (
                  <>
                    <span className="ra-hrs-val">{fmtHrs(row.hrs)}</span>
                    <span className="ra-sep">·</span>
                  </>
                )}
                {row.pages > 0 && (
                  <>
                    <span className="ra-pages-icon">📄</span>
                    <span className="ra-pages-val">{row.pages} pages</span>
                  </>
                )}
                {row.hrs === 0 && row.pages === 0 && (
                  <span className="ra-hrs-val">0.0 hrs</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Detailed Time Logs Table ── */}
      <div className="ra-section-card">
        <h3 className="ra-section-title">Detailed Time Logs</h3>

      {/* ── Table Top Scrollbar ── */}
      <div className="double-scroll-top" ref={topScrollRef}>
        <div className="double-scroll-top-inner"></div>
      </div>

      {/* ── Detailed Time Logs Table ── */}
      <div className="ra-table-wrapper" ref={bottomScrollRef}>
          <table className="ra-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Employee</th>
                <th>Project</th>
                <th>Task</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Duration</th>
                <th>Pages</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="9" className="ra-table-empty">
                    {loading ? 'Loading...' : 'No time logs found for selected filters.'}
                  </td>
                </tr>
              ) : filteredLogs.map(log => {
                const statusInfo = mapStatus(log.status);
                return (
                  <tr key={log.id}>
                    <td className="td-id" title={log.id}>
                      {log.id ? log.id.substring(0, 8) : '-'}
                    </td>
                    <td className="td-employee col-left">{log.employeeName}</td>
                    <td className="td-project">
                      <span className="ra-project-tag">{log.projectName}</span>
                    </td>
                    <td className="td-task" title={log.taskTitle || log.isbnTitle}>
                      {log.taskTitle || log.isbnTitle || <span className="ra-dash">-</span>}
                    </td>
                    <td className="td-time">{fmtDateTime(log.startTime)}</td>
                    <td className="td-time">{fmtDateTime(log.endTime)}</td>
                    <td className="td-duration">
                      <span className={`ra-dur ${(log.workingSeconds || 0) >= 3600 ? 'high' : ''}`}>
                        {fmtHrs((log.workingSeconds || 0) / 3600.0)}
                      </span>
                    </td>
                    <td className="td-pages">
                      {log.pagesCompleted != null
                        ? <span className="ra-pages-cell" style={{ justifyContent: 'center' }}>
                            <span className="ra-pages-icon-sm">📄</span>
                            {log.pagesCompleted}
                          </span>
                        : <span className="ra-dash">-</span>}
                    </td>
                    <td className="td-status">
                      <span className={`ra-status-badge ${statusInfo.className}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div className="ra-table-footer">
          Showing <strong>{filteredLogs.length}</strong> entries
        </div>
      </div>

    </div>
  );
};

export default ReportsAnalytics;