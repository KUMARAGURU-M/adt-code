// src/pages/admin/Production.js
import React, { useState, useEffect, useCallback } from 'react';
import './Production.css';
import { apiCall } from '../../utils/api';
import productionIcon from '../../img/production.png';
const STATUS_OPTIONS = [
  'FINISH', 'WIP', 'YTS', 'RTU', 'UPLOADED', 'PENDING', 'HOLD', 'QUERY'
];

const fmtDate = (d) => {
  if (!d) return '—';
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return d;
  }
};

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
  const [clients, setClients] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [jobs, setJobs] = useState([]);

  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters State
  const [filters, setFilters] = useState({
    clientId: '',
    projectId: '',
    workflowId: '',
    jobId: '',
    complexity: '',
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

  // ── Load dropdown reference data ─────────────────────────────────────
  const loadDropdowns = useCallback(async () => {
    try {
      const [proj, cl, wf] = await Promise.all([
        apiCall('/projects'),
        apiCall('/clients'),
        apiCall('/projects/workflows'),
      ]);
      setProjects(proj.map(p => ({
        id: p.id,
        name: p.name,
        clientId: p.clientId,
        clientName: p.clientName,
        workflowId: p.workflowId,
        workflowName: p.workflowName,
      })) || []);
      setClients(cl || []);
      setWorkflows(wf || []);
    } catch (err) {
      console.warn('Could not load dropdowns:', err.message);
    }
  }, []);

  // ── Load production jobs ──────────────────────────────────────────
  const loadProductionJobs = useCallback(async (pageNum = 0, size = pageSize) => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: pageNum,
        size: size,
        ...(filters.clientId && { clientId: filters.clientId }),
        ...(filters.projectId && { projectId: filters.projectId }),
        ...(filters.workflowId && { workflowId: filters.workflowId }),
        ...(filters.jobId && { jobIdCode: filters.jobId }),
        ...(filters.complexity && { complexity: filters.complexity }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
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
  }, [filters, pageSize]);

  // Debounced auto-search when filters change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const handler = setTimeout(() => {
      loadProductionJobs(0);
    }, 300);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pageSize]);

  useEffect(() => {
    loadDropdowns();
  }, [loadDropdowns]);

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
    loadProductionJobs(0);
  };

  const handleReset = () => {
    setFilters({
      clientId: '',
      projectId: '',
      workflowId: '',
      jobId: '',
      complexity: '',
      startDate: '',
      endDate: '',
    });
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
        <span className="bj-page-icon">
          <img src={productionIcon} alt="Production" className="bj-page-title-img-icon" />
        </span>
        <h2>Production Details</h2>
      </div>

      {/* Filter panel */}
      <form onSubmit={handleSearch} className="production-filter-card">
        <div className="filter-grid">
          {/* Client Select */}
          <div className="filter-group">
            <label htmlFor="clientId">💼 Client</label>
            <select
              id="clientId"
              value={filters.clientId}
              onChange={e => setFilters(prev => ({
                ...prev,
                clientId: e.target.value,
                projectId: '',
                workflowId: '',
              }))}
            >
              <option value="">All Client</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.companyName}</option>
              ))}
            </select>
          </div>

          {/* Project Select */}
          <div className="filter-group">
            <label htmlFor="projectId">📦 Project</label>
            <select
              id="projectId"
              value={filters.projectId}
              onChange={e => {
                const proj = projects.find(p => p.id === e.target.value);
                setFilters(prev => ({
                  ...prev,
                  projectId: e.target.value,
                  clientId: proj && proj.clientId ? proj.clientId : prev.clientId,
                  workflowId: proj && proj.workflowId ? proj.workflowId : prev.workflowId,
                }));
              }}
            >
              <option value="">All Projects</option>
              {(filters.clientId
                ? projects.filter(p => p.clientId === filters.clientId)
                : projects
              ).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Workflow Select */}
          <div className="filter-group">
            <label htmlFor="workflowId">⚙️ Task Name</label>
            <select
              id="workflowId"
              value={filters.workflowId}
              onChange={e => setFilters(prev => ({ ...prev, workflowId: e.target.value }))}
            >
              <option value="">All Task Names</option>
              {workflows.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Job ID Input */}
          <div className="filter-group">
            <label htmlFor="jobId">🆔 Job ID</label>
            <input
              type="text"
              id="jobId"
              placeholder="e.g. BM0748"
              value={filters.jobId}
              onChange={e => setFilters(prev => ({ ...prev, jobId: e.target.value }))}
            />
          </div>

          {/* Complexity Select */}
          <div className="filter-group">
            <label htmlFor="complexity">Complexity</label>
            <select
              id="complexity"
              value={filters.complexity}
              onChange={e => setFilters(prev => ({ ...prev, complexity: e.target.value }))}
            >
              <option value="">All Complexities</option>
              <option value="Simple">Simple</option>
              <option value="Medium">Medium</option>
              <option value="Complex">Complex</option>
              <option value="Heavy Complex">Heavy Complex</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="filter-group">
            <label htmlFor="startDate">Start Date (From)</label>
            <input
              type="date"
              id="startDate"
              value={filters.startDate}
              onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
            />
          </div>

          {/* End Date */}
          <div className="filter-group">
            <label htmlFor="endDate">End Date (To)</label>
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
                    <th>Client</th>
                    <th>Project</th>
                    <th>Task Name</th>
                    <th>Receive Date</th>
                    <th>Job ID</th>
                    <th>ISBN</th>
                    <th style={{ minWidth: '120px' }}>Batch</th>
                    <th style={{ minWidth: '150px' }}>Title Name</th>
                    <th>Page</th>
                    <th>PDF Type</th>
                    <th>Complexity</th>
                    <th style={{ minWidth: '180px' }}>Employees Assigned</th>
                    <th>Start Date</th>
                    <th style={{ minWidth: '130px' }}>Process Status</th>
                    <th style={{ minWidth: '130px' }}>QC Status</th>
                    <th>End Date</th>
                    <th className="actions-col">Action</th>
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
                        <td className="client-name-col" title={job.clientName}>
                          {job.clientName ? (
                            <span className="client-badge" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '2px 6px', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 700 }}>
                              {job.clientName}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="proj-name-col" title={job.projectName}>
                          {job.projectName ? (
                            <span className={getProjectBadgeClass(job.projectName)}>
                              {job.projectName}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="workflow-name-col" title={job.workflowName}>
                          {job.workflowName ? (
                            <span className="badge badge--workflow" style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', padding: '2px 6px', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 700 }}>
                              {job.workflowName}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="date-col">
                          {fmtDate(job.receiveDate)}
                        </td>
                        <td className="job-code-col">
                          <strong>{job.jobIdCode}</strong>
                        </td>
                        <td className="isbn-col">
                          {job.xmlIsbn || '—'}
                        </td>
                        <td className="batch-col">
                          {job.batch || '—'}
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
                          <div className={`employee-input-wrapper${isSaving ? ' is-disabled' : ''}`}>
                            <input
                              type="text"
                              className="inline-employee-input"
                              value={currentEmployees}
                              onChange={e => handleCellChange(job.id, 'employees', e.target.value)}
                              disabled={isSaving}
                              placeholder="Enter employee names..."
                            />
                          </div>
                        </td>
                        <td className="date-col">
                          {job.productionStartDate ? (
                            <span className="computed-start-date">
                              📅 {fmtDate(job.productionStartDate)}
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
                    loadProductionJobs(0, newSize);
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


