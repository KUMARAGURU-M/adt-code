// src/pages/admin/Production.js
import React, { useState, useEffect, useCallback } from 'react';
import './Production.css';
import { apiCall } from '../../utils/api';

const STATUS_OPTIONS = [
  'FINISH', 'WIP', 'YTS', 'RTU', 'UPLOADED', 'PENDING', 'HOLD', 'QUERY'
];

const ComplexityBadge = ({ value }) => {
  if (!value) return <span className="cell-dash">-</span>;
  const complexityKey = value.toLowerCase().replace(/\s+/g, '');
  return (
    <span className={`complexity-badge complexity-${complexityKey}`}>
      {value}
    </span>
  );
};

const Production = () => {
  // Lists
  const [projects, setProjects] = useState([]);
  const [jobs, setJobs] = useState([]);

  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters State
  const [filters, setFilters] = useState({
    projectId: '',
    startDate: '',
    endDate: '',
  });
  const [appliedFilters, setAppliedFilters] = useState({
    projectId: '',
    startDate: '',
    endDate: '',
  });

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(50);

  // Unsaved Edits State: { [jobId]: { processStatus, qcStatus, endDate } }
  const [edits, setEdits] = useState({});
  const [savingRows, setSavingRows] = useState({}); // { [jobId]: boolean }
  const [successRows, setSuccessRows] = useState({}); // { [jobId]: boolean }

  const topScrollRef = React.useRef(null);
  const bottomScrollRef = React.useRef(null);

  // ── Load projects for dropdown ─────────────────────────────────────
  const loadProjects = useCallback(async () => {
    try {
      const data = await apiCall('/projects');
      setProjects(data.map(p => ({ id: p.id, name: p.name })) || []);
    } catch (err) {
      console.warn('Could not load projects:', err.message);
    }
  }, []);

  // ── Load production jobs ──────────────────────────────────────────
  const loadProductionJobs = useCallback(async (pageNum = 0, filterOverride, size = pageSize) => {
    const activeFilters = filterOverride !== undefined ? filterOverride : appliedFilters;
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: pageNum,
        size: size,
        ...(activeFilters.projectId && { projectId: activeFilters.projectId }),
        ...(activeFilters.startDate && { startDate: activeFilters.startDate }),
        ...(activeFilters.endDate && { endDate: activeFilters.endDate }),
      });

      const data = await apiCall(`/jobs/production/search?${params}`);
      setJobs(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalItems(data.totalElements || 0);
      setPage(pageNum);
      // Clear edits and success markers when reload happens
      setEdits({});
      setSuccessRows({});
    } catch (err) {
      setError('Failed to load production details: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, pageSize]);

  useEffect(() => {
    loadProjects();
    loadProductionJobs(0);
  }, [loadProjects, loadProductionJobs]);

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
    let syncT = false, syncB = false;
    const onTop = () => { if (!syncB) { syncT = true; bottomEl.scrollLeft = topEl.scrollLeft; syncT = false; } };
    const onBottom = () => { if (!syncT) { syncB = true; topEl.scrollLeft = bottomEl.scrollLeft; syncB = false; } };
    topEl.addEventListener('scroll', onTop);
    bottomEl.addEventListener('scroll', onBottom);
    return () => {
      ro.disconnect();
      topEl.removeEventListener('scroll', onTop);
      bottomEl.removeEventListener('scroll', onBottom);
    };
  }, [jobs]);

  // ── Search & Reset Handlers ───────────────────────────────────────
  const handleSearch = (e) => {
    e.preventDefault();
    setAppliedFilters({ ...filters });
    loadProductionJobs(0, filters);
  };

  const handleReset = () => {
    const cleared = { projectId: '', startDate: '', endDate: '' };
    setFilters(cleared);
    setAppliedFilters(cleared);
    loadProductionJobs(0, cleared);
  };

  // ── Edit Handlers ──────────────────────────────────────────────────
  const handleCellChange = (jobId, field, value) => {
    setEdits(prev => {
      const rowEdits = prev[jobId] || {};
      const job = jobs.find(j => j.id === jobId);

      const newEdits = {
        ...rowEdits,
        [field]: value
      };

      // If the edited values match the original values, remove the edit key
      const currentProcessStatus = newEdits.hasOwnProperty('processStatus') ? newEdits.processStatus : (job.processStatus || 'PENDING');
      const currentQcStatus = newEdits.hasOwnProperty('qcStatus') ? newEdits.qcStatus : (job.qcStatus || 'PENDING');
      const currentEndDate = newEdits.hasOwnProperty('endDate') ? newEdits.endDate : (job.endDate || '');
      const currentEmployees = newEdits.hasOwnProperty('employees') ? newEdits.employees : (job.employees ? job.employees.join(', ') : '');

      const matchesOriginal =
        currentProcessStatus === (job.processStatus || 'PENDING') &&
        currentQcStatus === (job.qcStatus || 'PENDING') &&
        currentEndDate === (job.endDate || '') &&
        currentEmployees === (job.employees ? job.employees.join(', ') : '');

      if (matchesOriginal) {
        const updated = { ...prev };
        delete updated[jobId];
        return updated;
      }

      return {
        ...prev,
        [jobId]: newEdits
      };
    });

    // Clear success checkmark on further change
    if (successRows[jobId]) {
      setSuccessRows(prev => ({ ...prev, [jobId]: false }));
    }
  };

  // ── Save Handler ───────────────────────────────────────────────────
  const handleSaveRow = async (jobId) => {
    const rowEdits = edits[jobId];
    if (!rowEdits) return;

    const job = jobs.find(j => j.id === jobId);
    const payload = {
      processStatus: rowEdits.hasOwnProperty('processStatus') ? rowEdits.processStatus : job.processStatus,
      qcStatus: rowEdits.hasOwnProperty('qcStatus') ? rowEdits.qcStatus : job.qcStatus,
      endDate: rowEdits.hasOwnProperty('endDate') ? rowEdits.endDate : job.endDate,
      employees: rowEdits.hasOwnProperty('employees')
        ? rowEdits.employees.split(',').map(s => s.trim()).filter(Boolean)
        : (job.employees || [])
    };

    setSavingRows(prev => ({ ...prev, [jobId]: true }));
    try {
      const updatedJob = await apiCall(`/jobs/${jobId}/production`, 'PUT', payload);

      // Update local jobs list with saved response
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, ...updatedJob } : j));

      // Remove edits for this row
      setEdits(prev => {
        const copy = { ...prev };
        delete copy[jobId];
        return copy;
      });

      // Show success checkmark
      setSuccessRows(prev => ({ ...prev, [jobId]: true }));
      // Fade out success checkmark after 3 seconds
      setTimeout(() => {
        setSuccessRows(prev => ({ ...prev, [jobId]: false }));
      }, 3000);

    } catch (err) {
      alert(`Failed to save production details: ${err.message}`);
    } finally {
      setSavingRows(prev => ({ ...prev, [jobId]: false }));
    }
  };

  const getProcessStatusClass = (status) => {
    if (!status) return 'prod-status-pill prod-sp-pending';
    return `prod-status-pill prod-sp-${status.toLowerCase()}`;
  };

  const getQcStatusClass = (status) => {
    if (!status) return 'qc-status-pill qc-sp-pending';
    return `qc-status-pill qc-sp-${status.toLowerCase()}`;
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

  return (
    <div className="production-container">
      <div className="bj-page-title">
        <span className="bj-page-icon"></span>
        <h2>Production Details</h2>
      </div>

      {/* Filter panel */}
      <form onSubmit={handleSearch} className="production-filter-card">
        <div className="filter-grid">
          {/* Project Select */}
          <div className="filter-group">
            <label htmlFor="projectId">Publisher / Project</label>
            <select
              id="projectId"
              value={filters.projectId}
              onChange={e => setFilters(prev => ({ ...prev, projectId: e.target.value }))}
            >
              <option value="">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="filter-group">
            <label htmlFor="startDate">Production Start Date (From)</label>
            <input
              type="date"
              id="startDate"
              value={filters.startDate}
              onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
            />
          </div>

          {/* End Date */}
          <div className="filter-group">
            <label htmlFor="endDate">Production End Date (To)</label>
            <input
              type="date"
              id="endDate"
              value={filters.endDate}
              onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
        </div>

        <div className="filter-actions">
          <button type="button" onClick={handleReset} className="btn-reset">
            🔄 Reset
          </button>
          <button type="submit" className="btn-search">
            🔍 Search
          </button>
        </div>
      </form>

      {/* Grid view */}
      <div className="production-table-card">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading production records...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p className="error-text">⚠️ {error}</p>
            <button onClick={() => loadProductionJobs(page)} className="btn-retry">
              Try Again
            </button>
          </div>
        ) : jobs.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: '3rem' }}>📂</span>
            <h3>No Production Records Found</h3>
            <p>Modify search filters or assign tasks to jobs to start tracking.</p>
          </div>
        ) : (
          <>
            <div className="double-scroll-top" ref={topScrollRef}>
              <div className="double-scroll-top-inner" />
            </div>
            <div className="table-wrapper" ref={bottomScrollRef}>
              <table className="production-table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Receive Date</th>
                    <th>Job ID</th>
                    <th>XML ISBN</th>
                    <th style={{ minWidth: '150px' }}>Title Name</th>
                    <th>Page Count</th>
                    <th>PDF Type</th>
                    <th>Complexity</th>
                    <th style={{ minWidth: '180px' }}>Employees Assigned</th>
                    <th>Start Date</th>
                    <th style={{ minWidth: '130px' }}>Process Status</th>
                    <th style={{ minWidth: '130px' }}>QC Status</th>
                    <th>End Date</th>
                    <th className="actions-col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => {
                    const rowEdits = edits[job.id] || {};
                    const isSaving = savingRows[job.id] || false;
                    const isSuccess = successRows[job.id] || false;
                    const isModified = edits.hasOwnProperty(job.id);

                    const currentProcessStatus = rowEdits.hasOwnProperty('processStatus')
                      ? rowEdits.processStatus
                      : (job.processStatus || 'PENDING');
                    const currentQcStatus = rowEdits.hasOwnProperty('qcStatus')
                      ? rowEdits.qcStatus
                      : (job.qcStatus || 'PENDING');
                    const currentEndDate = rowEdits.hasOwnProperty('endDate')
                      ? rowEdits.endDate
                      : (job.endDate || '');
                    const currentEmployees = rowEdits.hasOwnProperty('employees')
                      ? rowEdits.employees
                      : (job.employees ? job.employees.join(', ') : '');

                    return (
                      <tr key={job.id} className={isModified ? 'modified-row' : ''}>
                        <td className="proj-name-col" title={job.projectName}>
                          {job.projectName ? (
                            <span className={getProjectBadgeClass(job.projectName)}>
                              {job.projectName}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="date-col">
                          {job.receiveDate || '—'}
                        </td>
                        <td className="job-code-col">
                          <strong>{job.jobIdCode}</strong>
                        </td>
                        <td className="isbn-col">
                          {job.xmlIsbn || '—'}
                        </td>
                        <td className="title-col" title={job.titleName}>
                          <div className="title-text-trunc">
                            {job.titleName}
                          </div>
                        </td>
                        <td className="page-count-col">
                          {job.pageCount !== undefined && job.pageCount !== null ? job.pageCount : '—'}
                        </td>
                        <td className="pdf-type-col">
                          {job.pdfInputType || '—'}
                        </td>
                        <td className="complexity-col">
                          <ComplexityBadge value={job.complexity} />
                        </td>
                        <td className="employees-col">
                          <input
                            type="text"
                            className="inline-employee-input"
                            value={currentEmployees}
                            onChange={e => handleCellChange(job.id, 'employees', e.target.value)}
                            disabled={isSaving}
                            placeholder="Add / edit employee names..."
                          />
                        </td>
                        <td className="date-col">
                          {job.productionStartDate ? (
                            <span className="computed-start-date">
                              📅 {job.productionStartDate}
                            </span>
                          ) : (
                            <span className="not-started">Not Started</span>
                          )}
                        </td>
                        <td>
                          <select
                            className={`inline-select ${getProcessStatusClass(currentProcessStatus)}`}
                            value={currentProcessStatus}
                            onChange={e => handleCellChange(job.id, 'processStatus', e.target.value)}
                            disabled={isSaving}
                          >
                            {STATUS_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            className={`inline-select ${getQcStatusClass(currentQcStatus)}`}
                            value={currentQcStatus}
                            onChange={e => handleCellChange(job.id, 'qcStatus', e.target.value)}
                            disabled={isSaving}
                          >
                            {STATUS_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="date"
                            className="inline-date-input"
                            value={currentEndDate}
                            onChange={e => handleCellChange(job.id, 'endDate', e.target.value)}
                            disabled={isSaving}
                          />
                        </td>
                        <td className="actions-col">
                          {isSaving ? (
                            <span className="row-spinner" />
                          ) : isSuccess ? (
                            <span className="save-success-icon" title="Saved Successfully">✅</span>
                          ) : (
                            <button
                              className="btn-save-row"
                              disabled={!isModified}
                              onClick={() => handleSaveRow(job.id)}
                              title="Save Changes"
                            >
                              💾 Save
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="table-pagination-footer">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Items per page:</label>
                <select
                  value={pageSize}
                  onChange={e => {
                    const newSize = Number(e.target.value);
                    setPageSize(newSize);
                    loadProductionJobs(0, appliedFilters, newSize);
                  }}
                  style={{
                    padding: '4px 8px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    outline: 'none',
                    fontSize: '0.8rem',
                    backgroundColor: '#ffffff',
                    color: '#334155'
                  }}
                >
                  {[10, 25, 50, 100].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <span className="pagination-info">
                Showing page <strong>{page + 1}</strong> of <strong>{totalPages || 1}</strong> ({totalItems} items)
              </span>
              <div className="pagination-controls">
                <button
                  disabled={page === 0 || loading}
                  onClick={() => loadProductionJobs(page - 1)}
                  className="btn-page"
                >
                  ◀ Previous
                </button>
                <button
                  disabled={page >= totalPages - 1 || loading}
                  onClick={() => loadProductionJobs(page + 1)}
                  className="btn-page"
                >
                  Next ▶
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Production;
