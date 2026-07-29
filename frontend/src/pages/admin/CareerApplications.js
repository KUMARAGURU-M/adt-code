import React, { useCallback, useEffect, useRef, useState } from 'react';
import { apiCall, API_BASE } from '../../utils/api';
import './CareerApplications.css';

const APP_STATUS_LABELS = { NEW: 'New', REVIEWING: 'Reviewing', SHORTLISTED: 'Shortlisted', REJECTED: 'Rejected' };
const APP_STATUS_COLORS = { NEW: 'amber', REVIEWING: 'blue', SHORTLISTED: 'green', REJECTED: 'red' };

/* ─── Job Opening Form Modal ───────────────────────────────────────────── */
function JobModal({ job, onSave, onClose }) {
  const [form, setForm] = useState({
    title: job?.title || '',
    department: job?.department || '',
    location: job?.location || '',
    jobType: job?.jobType || 'Full-Time',
    experience: job?.experience || '',
    description: job?.description || '',
    tags: Array.isArray(job?.tags) ? job.tags.join(', ') : (job?.tags || ''),
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.department || !form.location) { setErr('Title, department and location are required.'); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      const saved = job?.id
        ? await apiCall(`/admin/careers/openings/${job.id}`, 'PUT', payload)
        : await apiCall('/admin/careers/openings', 'POST', payload);
      onSave(saved);
    } catch { setErr('Failed to save. Please try again.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="ca-modal-backdrop" onClick={onClose}>
      <div className="ca-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="ca-modal-header">
          <h3>{job?.id ? 'Edit Job Opening' : 'Add Job Opening'}</h3>
          <button className="ca-modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="ca-modal-form">
          <div className="ca-form-row">
            <div className="ca-form-group">
              <label>Job Title *</label>
              <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Senior Developer" />
            </div>
            <div className="ca-form-group">
              <label>Department *</label>
              <input name="department" value={form.department} onChange={handleChange} placeholder="e.g. Engineering" />
            </div>
          </div>
          <div className="ca-form-row">
            <div className="ca-form-group">
              <label>Location *</label>
              <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Villupuram / Remote" />
            </div>
            <div className="ca-form-group">
              <label>Job Type</label>
              <select name="jobType" value={form.jobType} onChange={handleChange}>
                {['Full-Time', 'Part-Time', 'Contract', 'Internship'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="ca-form-row">
            <div className="ca-form-group">
              <label>Experience</label>
              <input name="experience" value={form.experience} onChange={handleChange} placeholder="e.g. 2+ Years" />
            </div>
            <div className="ca-form-group">
              <label>Tags (comma-separated)</label>
              <input name="tags" value={form.tags} onChange={handleChange} placeholder="React, Node.js, REST API" />
            </div>
          </div>
          <div className="ca-form-group ca-form-group--full">
            <label>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={4}
              placeholder="Job responsibilities and requirements..." />
          </div>
          {err && <div className="ca-form-error">{err}</div>}
          <div className="ca-modal-footer">
            <button type="button" className="ca-btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="ca-btn-save" disabled={saving}>
              {saving ? 'Saving...' : (job?.id ? 'Update Job' : 'Create Job')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Component ───────────────────────────────────────────────────── */
export default function CareerApplications() {
  const [tab, setTab] = useState('openings');   // 'openings' | 'applications'

  /* Job openings state */
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJL] = useState(true);
  const [jobModal, setJobModal] = useState(null); // null | {} | {job}
  const [togglePending, setTP] = useState(null);

  /* Applications state */
  const [apps, setApps] = useState([]);
  const [appsLoading, setAL] = useState(true);
  const [appFilter, setAppFilter] = useState('');
  const [selectedApp, setSelApp] = useState(null);

  const loadJobs = useCallback(async () => {
    setJL(true);
    try {
      const data = await apiCall('/admin/careers/openings');
      setJobs(Array.isArray(data) ? data : []);
    } finally { setJL(false); }
  }, []);

  const loadApps = useCallback(async () => {
    setAL(true);
    try {
      const url = appFilter ? `/admin/careers/applications?status=${appFilter}` : '/admin/careers/applications';
      const data = await apiCall(url);
      setApps(Array.isArray(data) ? data : []);
    } finally { setAL(false); }
  }, [appFilter]);

  useEffect(() => { loadJobs(); }, [loadJobs]);
  useEffect(() => { loadApps(); }, [loadApps]);

  const toggleJob = async (id) => {
    setTP(id);
    try {
      const updated = await apiCall(`/admin/careers/openings/${id}/toggle`, 'PUT');
      setJobs(prev => prev.map(j => j.id === id ? updated : j));
    } finally { setTP(null); }
  };

  const deleteJob = async (id) => {
    if (!window.confirm('Delete this job opening permanently?')) return;
    await apiCall(`/admin/careers/openings/${id}`, 'DELETE');
    setJobs(prev => prev.filter(j => j.id !== id));
  };

  const handleJobSave = (saved) => {
    setJobs(prev => {
      const idx = prev.findIndex(j => j.id === saved.id);
      if (idx >= 0) { const copy = [...prev]; copy[idx] = saved; return copy; }
      return [saved, ...prev];
    });
    setJobModal(null);
  };

  const updateAppStatus = async (id, status) => {
    await apiCall(`/admin/careers/applications/${id}/status`, 'PUT', { status });
    setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    if (selectedApp?.id === id) setSelApp(s => ({ ...s, status }));
  };

  const deleteApp = async (id) => {
    if (!window.confirm('Delete this application permanently?')) return;
    await apiCall(`/admin/careers/applications/${id}`, 'DELETE');
    setApps(prev => prev.filter(a => a.id !== id));
    if (selectedApp?.id === id) setSelApp(null);
  };

  const fmt = iso => iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  return (
    <div className="ca-page">
      <div className="ca-header">
        <div>
          <h1 className="ca-title">💼 Career Application</h1>
          <p className="ca-subtitle">Manage job openings and review candidate applications</p>
        </div>
        {tab === 'openings' && (
          <button className="ca-btn-add" onClick={() => setJobModal({})}>+ Add Job Opening</button>
        )}
      </div>

      {/* Tabs */}
      <div className="ca-tabs">
        <button className={`ca-tab ${tab === 'openings' ? 'active' : ''}`} onClick={() => setTab('openings')}>
          Job Openings ({jobs.length})
        </button>
        <button className={`ca-tab ${tab === 'applications' ? 'active' : ''}`} onClick={() => setTab('applications')}>
          Applications ({apps.length})
        </button>
      </div>

      {/* ── Job Openings Tab ── */}
      {tab === 'openings' && (
        <div className="ca-card">
          {jobsLoading ? <div className="ca-empty">Loading...</div> : jobs.length === 0 ? (
            <div className="ca-empty">No job openings yet. Click "+ Add Job Opening" to create one.</div>
          ) : (
            <div className="ca-table-responsive">
              <table className="ca-table">
                <thead><tr>
                  <th>Title</th><th>Department</th><th>Location</th><th className="ca-txt-center">Type</th><th className="ca-txt-center">Experience</th><th className="ca-txt-center">Active</th><th className="ca-txt-center">Actions</th>
                </tr></thead>
                <tbody>
                  {jobs.map(job => (
                    <tr key={job.id} className="ca-row">
                      <td className="ca-td-bold">{job.title}</td>
                      <td>{job.department}</td>
                      <td>{job.location}</td>
                      <td className="ca-txt-center">{job.jobType}</td>
                      <td className="ca-txt-center">{job.experience || '—'}</td>
                      <td className="ca-txt-center">
                        <button
                          className={`ca-toggle ${job.active ? 'on' : 'off'}`}
                          onClick={() => toggleJob(job.id)}
                          disabled={togglePending === job.id}
                          title={job.active ? 'Click to deactivate' : 'Click to activate'}>
                          {togglePending === job.id ? '...' : (job.active ? '● Active' : '○ Inactive')}
                        </button>
                      </td>
                      <td className="ca-actions ca-txt-center">
                        <button className="ca-btn-edit" onClick={() => setJobModal(job)}>Edit</button>
                        <button className="ca-btn-del" onClick={() => deleteJob(job.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Applications Tab ── */}
      {tab === 'applications' && (
        <>
          <div className="ca-filters">
            {['', 'NEW', 'REVIEWING', 'SHORTLISTED', 'REJECTED'].map(s => (
              <button key={s} className={`ca-filter-btn ${appFilter === s ? 'active' : ''}`}
                onClick={() => setAppFilter(s)}>
                {s || 'All'}
              </button>
            ))}
          </div>
          <div className="ca-workspace">
            <div className="ca-card ca-app-list">
              {appsLoading ? <div className="ca-empty">Loading...</div> : apps.length === 0 ? (
                <div className="ca-empty">No applications found.</div>
              ) : (
                <div className="ca-table-responsive">
                  <table className="ca-table">
                    <thead><tr>
                      <th>Applicant</th><th>Email</th><th>Job Applied</th><th>Department</th><th className="ca-txt-center">Status</th><th className="ca-txt-center">Date</th><th className="ca-txt-center"></th>
                    </tr></thead>
                    <tbody>
                      {apps.map(app => (
                        <tr key={app.id} className={`ca-row ${selectedApp?.id === app.id ? 'selected' : ''}`}
                          onClick={() => setSelApp(app)}>
                          <td className="ca-td-bold">{app.name}</td>
                          <td>{app.email}</td>
                          <td>{app.jobTitle}</td>
                          <td>{app.department || '—'}</td>
                          <td className="ca-txt-center">
                            <span className={`ca-badge ca-badge--${APP_STATUS_COLORS[app.status] || 'grey'}`}>
                              {APP_STATUS_LABELS[app.status] || app.status}
                            </span>
                          </td>
                          <td className="ca-td-date ca-txt-center">{fmt(app.createdAt)}</td>
                          <td className="ca-txt-center">
                            <button className="ca-del-btn" onClick={e => { e.stopPropagation(); deleteApp(app.id); }} title="Delete">🗑️</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Detail panel */}
            {selectedApp && (
              <div className="ca-detail">
                <div className="ca-detail-header">
                  <div>
                    <h3 className="ca-detail-name">{selectedApp.name}</h3>
                    <a href={`mailto:${selectedApp.email}`} className="ca-detail-email">{selectedApp.email}</a>
                    {selectedApp.phone && <div className="ca-detail-meta">{selectedApp.phone}</div>}
                    {selectedApp.portfolio && (
                      <a href={selectedApp.portfolio} target="_blank" rel="noreferrer" className="ca-detail-link">
                        🔗 Portfolio / LinkedIn
                      </a>
                    )}
                  </div>
                  <button className="ca-close-btn" onClick={() => setSelApp(null)}>✕</button>
                </div>

                <div className="ca-detail-chips">
                  <span className="ca-chip">💼 {selectedApp.jobTitle}</span>
                  {selectedApp.department && <span className="ca-chip">🏢 {selectedApp.department}</span>}
                  <span className="ca-chip">🕒 {fmt(selectedApp.createdAt)}</span>
                </div>

                {selectedApp.coverNote && (
                  <div className="ca-detail-section">
                    <div className="ca-detail-label">Cover Note</div>
                    <p className="ca-detail-body">{selectedApp.coverNote}</p>
                  </div>
                )}

                {selectedApp.resumeUrl && (
                  <a
                    href={`${API_BASE}${selectedApp.resumeUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="ca-resume-btn">
                    📄 Download Resume ({selectedApp.resumeFileName || 'resume'})
                  </a>
                )}

                <div className="ca-detail-actions">
                  <div className="ca-detail-status-label">Update status:</div>
                  <div className="ca-status-btns">
                    {['NEW', 'REVIEWING', 'SHORTLISTED', 'REJECTED'].map(s => (
                      <button key={s}
                        className={`ca-status-btn ca-status-btn--${APP_STATUS_COLORS[s]} ${selectedApp.status === s ? 'active' : ''}`}
                        onClick={() => updateAppStatus(selectedApp.id, s)}>
                        {APP_STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                  <button className="ca-del-detail-btn" onClick={() => deleteApp(selectedApp.id)}>Delete Application</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Job Modal */}
      {jobModal !== null && (
        <JobModal
          job={jobModal?.id ? jobModal : null}
          onSave={handleJobSave}
          onClose={() => setJobModal(null)}
        />
      )}
    </div>
  );
}
