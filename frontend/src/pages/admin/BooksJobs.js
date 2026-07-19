import React, { useState, useEffect, useCallback } from 'react';
import './BooksJobs.css';
import { apiCall, getCurrentUser } from '../../utils/api';


// ── Constants ─────────────────────────────────────────────────────
const PDF_TYPES = [
  '-', 'PRINT-PDF', 'SCANNED-PDF', 'WORD', 'XML', 'HTML', 'EPUB', 'INDISGN',
];

const COMPLEXITY_OPTIONS = [
  { label: 'Simple', color: '#22c55e' },
  { label: 'Medium', color: '#f59e0b' },
  { label: 'Complex', color: '#ef4444' },
  { label: 'Heavy Complex', color: '#7c3aed' },
];

const STATUS_OPTIONS = [
  'FINISH', 'WIP', 'YTS', 'RTU', 'UPLOADED', 'PENDING', 'HOLD', 'QUERY',
];
const FILE_STATUS_OPTIONS = ['-', 'UPLOADED', 'RTU', 'QUERY', 'HOLD'];
const BILLING_STATUS_OPTIONS = ['CREDITED', 'PENDING', 'INVOICED'];
const REF_TYPES = ['-', 'BK-REF', 'CH-REF', 'BK/CH-REF', 'FN-REF', 'BK/FN-REF', 'CH/FN-REF', 'PG/FN-REF'];

const ALL_BULK_FIELDS = [
  { key: 'receiveDate', label: 'RECEIVED DATE', mandatory: true },
  { key: 'jobId', label: 'JOB ID', mandatory: true },
  { key: 'title', label: 'TITLE NAME', mandatory: true },
  { key: 'pageCount', label: 'PAGE COUNT', mandatory: false },
  { key: 'startMonth', label: 'START MONTH', mandatory: false },
  { key: 'endMonth', label: 'END MONTH', mandatory: false },
  { key: 'isbn', label: 'XML ISBN', mandatory: false },
  { key: 'batch', label: 'BATCH', mandatory: false },
  { key: 'chapters', label: 'NUMBER OF CHAPTERS', mandatory: false },
  { key: 'pdfType', label: 'PDF INPUT TYPE', mandatory: false },
  { key: 'complexity', label: 'COMPLEXITY', mandatory: false },
  { key: 'refType', label: 'REFERENCE TYPE', mandatory: false },
  { key: 'status', label: 'STATUS', mandatory: false },
  { key: 'fileStatus', label: 'FILE STATUS', mandatory: false },
  { key: 'uploadDate', label: 'UPLOADED DATE', mandatory: false },
  { key: 'billing', label: 'BILLING STATUS', mandatory: false },
  { key: 'language', label: 'LANGUAGE', mandatory: false },
];

const EMPTY_FORM = {
  project: '', projectId: null,
  clientId: '', clientName: '',
  workflowId: '', workflowName: '',
  startMonth: '', endMonth: '', receiveDate: '', jobId: '', isbn: '', batch: '',
  title: '', pageCount: '', chapters: '', pdfType: '', complexity: '',
  refType: '', status: '', fileStatus: '', uploadDate: '', billing: '', language: '',
};

// ── Helpers ───────────────────────────────────────────────────────
const getComplexityClass = (value) => {
  if (!value) return '';
  const val = value.toLowerCase().replace(/\s+/g, '');
  if (val.includes('simple')) return 'complexity-simple';
  if (val.includes('medium')) return 'complexity-medium';
  if (val.includes('heavycomplex')) return 'complexity-heavycomplex';
  if (val.includes('complex')) return 'complexity-complex';
  return '';
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

const mapJob = (j) => ({
  id: j.id,
  project: j.projectName || '',
  projectId: j.projectId || null,
  processes: j.processes || [],
  startMonth: j.startMonth || '',
  endMonth: j.endMonth || '',
  receiveDate: j.receiveDate || '',
  jobId: j.jobIdCode || '',
  isbn: j.xmlIsbn || '',
  batch: j.batch || '',
  title: j.titleName || '',
  pageCount: j.pageCount?.toString() || '',
  chapters: j.numberOfChapters?.toString() || '',
  pdfType: j.pdfInputType || '',
  complexity: j.complexity || '',
  refType: j.referenceType || '',
  status: j.status || '',
  fileStatus: j.fileStatus || '',
  uploadDate: j.uploadDate || '',
  billing: j.billingStatus || '',
  language: j.language || '',
  clientId: j.clientId || '',
  clientName: j.clientName || '',
  workflowId: j.workflowId || '',
  workflowName: j.workflowName || '',
});

// ── Sub-components ────────────────────────────────────────────────
const ComplexityBadge = ({ value }) => {
  if (!value) return <span className="cell-dash">-</span>;
  const complexityKey = value.toLowerCase().replace(/\s+/g, '');
  return (
    <span className={`complexity-badge complexity-${complexityKey}`}>
      {value}
    </span>
  );
};

const StatusPill = ({ value, type }) => {
  if (!value) return <span className="cell-dash">-</span>;
  const statusKey = value.toLowerCase().replace(/\s+/g, '-');
  const cls = type === 'status'
    ? `bj-status-pill bj-sp-${statusKey}`
    : `filestatus-pill file-sp-${statusKey}`;
  return <span className={cls}>{value}</span>;
};

const Modal = ({ onClose, children, wide, xl }) => (
  <div className="bj-modal-overlay">
    <div
      className={`bj-modal-box${wide ? ' bj-modal-wide' : ''}${xl ? ' bj-modal-xl' : ''}`}
      style={{ position: 'relative' }}
    >
      <button 
        type="button" 
        className="bj-modal-close-x" 
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '16px',
          right: '20px',
          background: 'none',
          border: 'none',
          fontSize: '1.25rem',
          cursor: 'pointer',
          color: '#a0aec0',
          transition: 'color 0.2s',
          fontWeight: 'bold',
          lineHeight: '1',
          padding: '4px',
          zIndex: 10
        }}
        onMouseEnter={e => e.target.style.color = '#4a5568'}
        onMouseLeave={e => e.target.style.color = '#a0aec0'}
      >
        ✕
      </button>
      {children}
    </div>
  </div>
);

// ── JobForm component ─────────────────────────────────────────────
const JobForm = ({ form, onChange, projects = [], clients = [], workflows = [] }) => {
  const langOptions = ['Tamil', 'English', 'Hindi', 'Malayalam'];
  const isPresetLang = !form.language || langOptions.includes(form.language);
  const [customLangActive, setCustomLangActive] = useState(!isPresetLang && form.language !== '');

  // Filter projects by selected client
  const filteredProjects = form.clientId
    ? projects.filter(p => p.clientId === form.clientId)
    : projects;

  return (
    <div className="bj-form">
      {/* Row 1: Client, Project, Task Name */}
      <div className="bj-form-row">
        <div className="bj-form-group">
          <label>Client <span className="req">*</span></label>
          <select
            value={form.clientId || ''}
            onChange={e => {
              const selectedClientId = e.target.value || null;
              const selectedClient = clients.find(c => c.id === selectedClientId);
              onChange('clientId', selectedClientId);
              onChange('clientName', selectedClient ? selectedClient.companyName : '');
              onChange('projectId', null);
              onChange('project', '');
              onChange('workflowId', null);
              onChange('workflowName', '');
            }}
          >
            <option value="">-- Select Client --</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.companyName}</option>
            ))}
          </select>
        </div>

        <div className="bj-form-group" style={{ gridColumn: 'span 2' }}>
          <label>Project <span className="req">*</span></label>
          <select
            value={form.projectId || ''}
            onChange={e => {
              const proj = projects.find(p => p.id === e.target.value);
              onChange('projectId', e.target.value || null);
              onChange('project', proj?.name || '');
              if (proj && proj.clientId && !form.clientId) {
                onChange('clientId', proj.clientId);
                onChange('clientName', proj.clientName || '');
              }
              if (proj && proj.workflowId) {
                onChange('workflowId', proj.workflowId);
                onChange('workflowName', proj.workflowName || '');
              } else {
                onChange('workflowId', null);
                onChange('workflowName', '');
              }
            }}
            disabled={!form.clientId}
          >
            <option value="">-- Select Publisher --</option>
            {filteredProjects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="bj-form-group">
          <label>Task Name</label>
          <select
            value={form.workflowId || ''}
            onChange={e => {
              const selectedWorkflowId = e.target.value || null;
              const wf = workflows.find(w => w.id === selectedWorkflowId);
              onChange('workflowId', selectedWorkflowId);
              onChange('workflowName', wf?.name || '');
            }}
          >
            <option value="">-- Select Task Name --</option>
            {workflows.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: Receive Date, Job ID, XML ISBN, Batch */}
      <div className="bj-form-row">
        <div className="bj-form-group">
          <label>Receive Date <span className="req">*</span></label>
          <input type="date" value={form.receiveDate}
            onChange={e => onChange('receiveDate', e.target.value)} />
        </div>
        <div className="bj-form-group">
          <label>Job ID <span className="req">*</span></label>
          <input placeholder="e.g., BM0748" value={form.jobId}
            onChange={e => onChange('jobId', e.target.value)} />
        </div>
        <div className="bj-form-group">
          <label>XML ISBN</label>
          <input placeholder="e.g., 9798216386377" value={form.isbn}
            onChange={e => onChange('isbn', e.target.value)} />
        </div>
        <div className="bj-form-group">
          <label>Batch</label>
          <input placeholder="e.g., Batch 1" value={form.batch}
            onChange={e => onChange('batch', e.target.value)} />
        </div>
      </div>

      {/* Row 3: Title, Page Count, Number of Chapters */}
      <div className="bj-form-row">
        <div className="bj-form-group" style={{ gridColumn: 'span 2' }}>
          <label>Title Name <span className="req">*</span></label>
          <input placeholder="Book/Project Title" value={form.title}
            onChange={e => onChange('title', e.target.value)} />
        </div>
        <div className="bj-form-group">
          <label>Page Count</label>
          <input placeholder="e.g., 540" value={form.pageCount}
            onChange={e => onChange('pageCount', e.target.value)} />
        </div>
        <div className="bj-form-group">
          <label>Number of Chapters</label>
          <input placeholder="e.g., 12" value={form.chapters}
            onChange={e => onChange('chapters', e.target.value)} />
        </div>
      </div>

      {/* Row 4: PDF/Input Type, Complexity, Reference Type, Status */}
      <div className="bj-form-row">
        <div className="bj-form-group">
          <label>PDF / Input Type</label>
          <select value={form.pdfType || ''}
            onChange={e => onChange('pdfType', e.target.value)}>
            <option value="">Select...</option>
            {PDF_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="bj-form-group">
          <label>Complexity</label>
          <select
            className={getComplexityClass(form.complexity)}
            value={form.complexity || ''}
            onChange={e => onChange('complexity', e.target.value)}
          >
            <option value="">Select...</option>
            {COMPLEXITY_OPTIONS.map(c => (
              <option key={c.label} value={c.label}
                className={getComplexityClass(c.label)}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="bj-form-group">
          <label>Reference Type</label>
          <select value={form.refType || ''}
            onChange={e => onChange('refType', e.target.value)}>
            <option value="">Select...</option>
            {REF_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="bj-form-group">
          <label>Status</label>
          <select value={form.status || ''}
            onChange={e => onChange('status', e.target.value)}>
            <option value="">Select...</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Row 5: File Status, Upload Date, Billing Status, Language */}
      <div className="bj-form-row">
        <div className="bj-form-group">
          <label>File Status</label>
          <select value={form.fileStatus || ''}
            onChange={e => onChange('fileStatus', e.target.value)}>
            <option value="">Select...</option>
            {FILE_STATUS_OPTIONS.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <div className="bj-form-group">
          <label>Upload Date</label>
          <input type="date" value={form.uploadDate}
            onChange={e => onChange('uploadDate', e.target.value)} />
        </div>
        <div className="bj-form-group">
          <label>Billing Status</label>
          <select value={form.billing || ''}
            onChange={e => onChange('billing', e.target.value)}>
            <option value="">Select...</option>
            {BILLING_STATUS_OPTIONS.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
        <div className="bj-form-group">
          <label>Language</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              value={customLangActive ? 'Custom' : (form.language || '')}
              onChange={e => {
                const val = e.target.value;
                if (val === 'Custom') {
                  setCustomLangActive(true);
                  onChange('language', '');
                } else {
                  setCustomLangActive(false);
                  onChange('language', val);
                }
              }}
              style={{ flex: 1 }}
            >
              <option value="">Select...</option>
              {langOptions.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
              <option value="Custom">Other...</option>
            </select>
            {customLangActive && (
              <input
                placeholder="Custom lang"
                value={form.language || ''}
                onChange={e => onChange('language', e.target.value)}
                style={{ flex: 1 }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Add Job Modal ─────────────────────────────────────────────────
const AddJobModal = ({ onClose, onAdd, projects, clients, workflows }) => {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const change = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleCreate = async () => {
    if (!form.receiveDate || !form.jobId || !form.title) {
      alert('Please fill required fields: Receive Date, Job ID, Title Name.');
      return;
    }
    setSaving(true);
    try {
      await onAdd(form);
      onClose();
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} wide>
      <h2 className="bj-modal-title">Add New Job</h2>
      <JobForm form={form} onChange={change} projects={projects} clients={clients} workflows={workflows} />
      <div className="bj-modal-actions">
        <button className="bj-btn-cancel" onClick={onClose}>Cancel</button>
        <button className="bj-btn-primary" onClick={handleCreate}
          disabled={saving}>
          {saving ? 'Creating...' : 'Create'}
        </button>
      </div>
    </Modal>
  );
};

// ── Edit Job Modal ────────────────────────────────────────────────
const EditJobModal = ({ job, onClose, onUpdate, projects, clients, workflows }) => {
  const [form, setForm] = useState({
    project: job.project,
    projectId: job.projectId,
    clientId: job.clientId || '',
    clientName: job.clientName || '',
    workflowId: job.workflowId || '',
    workflowName: job.workflowName || '',
    startMonth: job.startMonth || '',
    endMonth: job.endMonth || '',
    receiveDate: job.receiveDate || '',
    jobId: job.jobId || '',
    isbn: job.isbn || '',
    batch: job.batch || '',
    title: job.title || '',
    pageCount: job.pageCount || '',
    chapters: job.chapters || '',
    pdfType: job.pdfType || '',
    complexity: job.complexity || '',
    refType: job.refType || '',
    status: job.status || '',
    fileStatus: job.fileStatus || '',
    uploadDate: job.uploadDate || '',
    billing: job.billing || '',
    language: job.language || '',
  });
  const [saving, setSaving] = useState(false);
  const change = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleUpdate = async () => {
    if (!form.receiveDate || !form.jobId || !form.title) {
      alert('Please fill required fields: Receive Date, Job ID, Title Name.');
      return;
    }
    setSaving(true);
    try {
      await onUpdate(job.id, form);
      onClose();
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} wide>
      <h2 className="bj-modal-title">Edit Job</h2>
      <JobForm form={form} onChange={change} projects={projects} clients={clients} workflows={workflows} />
      <div className="bj-modal-actions">
        <button className="bj-btn-cancel" onClick={onClose}>Cancel</button>
        <button className="bj-btn-primary" onClick={handleUpdate}
          disabled={saving}>
          {saving ? 'Updating...' : 'Update'}
        </button>
      </div>
    </Modal>
  );
};

// ── Delete Modal ──────────────────────────────────────────────────
const DeleteJobModal = ({ job, onClose, onDelete }) => (
  <Modal onClose={onClose}>
    <div className="bj-delete-modal">
      <div className="bj-delete-icon">🗑️</div>
      <h2 className="bj-modal-title">Delete Job</h2>
      <p className="bj-delete-msg">
        Are you sure you want to delete job{' '}
        <strong>{job.jobId}</strong>?<br />
        This action cannot be undone.
      </p>
      <div className="bj-modal-actions centered">
        <button className="bj-btn-cancel" onClick={onClose}>Cancel</button>
        <button className="bj-btn-danger" onClick={onDelete}>Delete</button>
      </div>
    </div>
  </Modal>
);

// ── Reconfirm Delete Modal ────────────────────────────────────────
const ReconfirmDeleteModal = ({ job, onClose, onDelete }) => {
  const [inputText, setInputText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const isValid = inputText.trim().toUpperCase() === 'DELETE'
    || inputText.trim().toUpperCase() === 'YES';

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(job.id);
      onClose();
    } catch (e) {
      alert('Error deleting: ' + e.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="bj-reconfirm-modal">
        <div className="bj-warning-icon">⚠️</div>
        <h2 className="bj-modal-title">Final Confirmation</h2>
        <p className="bj-reconfirm-msg">
          You are about to delete job <strong>{job.jobId}</strong>.
        </p>
        <p className="bj-reconfirm-submsg">
          To confirm, type{' '}
          <code className="bj-code-confirm">DELETE</code>:
        </p>
        <div className="bj-form-group full" style={{ margin: '14px 0' }}>
          <input
            type="text"
            className="bj-confirm-input"
            placeholder="Type DELETE to confirm"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            autoFocus
          />
        </div>
        <div className="bj-modal-actions centered">
          <button className="bj-btn-cancel" onClick={onClose}>Cancel</button>
          <button
            className="bj-btn-danger"
            disabled={!isValid || deleting}
            onClick={handleDelete}
            style={{ opacity: isValid ? 1 : 0.5 }}
          >
            {deleting ? 'Deleting...' : 'Delete Permanently'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ── Bulk Edit Modal ───────────────────────────────────────────────
const BULK_EDIT_FIELDS = [
  { key: 'pdfType', label: 'PDF Input Type', type: 'select', options: PDF_TYPES },
  { key: 'complexity', label: 'Complexity', type: 'select', options: COMPLEXITY_OPTIONS.map(c => c.label) },
  { key: 'refType', label: 'Reference Type', type: 'select', options: REF_TYPES },
  { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
  { key: 'fileStatus', label: 'File Status', type: 'select', options: FILE_STATUS_OPTIONS },
  { key: 'uploadDate', label: 'Upload Date', type: 'date' },
  { key: 'billing', label: 'Billing Status', type: 'select', options: BILLING_STATUS_OPTIONS },
];

const BulkEditModal = ({ selectedIds, selectedCount, onClose, onDone }) => {
  // Track which fields are enabled (checked) and their values
  const [fields, setFields] = useState(() =>
    Object.fromEntries(BULK_EDIT_FIELDS.map(f => [f.key, { enabled: false, value: '' }]))
  );
  const [saving, setSaving] = useState(false);

  const toggleField = (key) =>
    setFields(prev => ({ ...prev, [key]: { ...prev[key], enabled: !prev[key].enabled, value: prev[key].enabled ? '' : prev[key].value } }));

  const setValue = (key, value) =>
    setFields(prev => ({ ...prev, [key]: { ...prev[key], value } }));

  const activeFields = BULK_EDIT_FIELDS.filter(f => fields[f.key].enabled);

  const handleApply = async () => {
    if (activeFields.length === 0) {
      alert('Please enable and set at least one field to update.');
      return;
    }
    const hasEmpty = activeFields.some(f => !fields[f.key].value);
    if (hasEmpty) {
      alert('Please provide a value for every enabled field.');
      return;
    }
    setSaving(true);
    try {
      const updates = {};
      activeFields.forEach(f => {
        const apiKey = {
          pdfType: 'pdfInputType',
          complexity: 'complexity',
          refType: 'referenceType',
          status: 'status',
          fileStatus: 'fileStatus',
          uploadDate: 'uploadDate',
          billing: 'billingStatus',
        }[f.key];
        updates[apiKey] = fields[f.key].value;
      });
      await apiCall('/jobs/bulk-update', 'PUT', {
        ids: selectedIds,
        updates,
      });
      await onDone();
      onClose();
    } catch (e) {
      alert('Bulk update failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} wide>
      <h2 className="bj-modal-title">✏️ Bulk Edit — {selectedCount} Job{selectedCount !== 1 ? 's' : ''}</h2>
      <p className="bj-bulk-edit-hint">
        Toggle the fields you want to update, then set the new value.
        Only enabled fields will be changed.
      </p>
      <div className="bj-bulk-edit-fields">
        {BULK_EDIT_FIELDS.map(f => {
          const { enabled, value } = fields[f.key];
          return (
            <div key={f.key} className={`bj-bulk-edit-row${enabled ? ' active' : ''}`}>
              <label className="bj-bulk-edit-toggle">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={() => toggleField(f.key)}
                />
                <span className="bj-bulk-toggle-dot" />
                <span className="bj-bulk-edit-label">{f.label}</span>
              </label>
              <div className="bj-bulk-edit-control">
                {f.type === 'select' ? (
                  <select
                    value={value}
                    disabled={!enabled}
                    onChange={e => setValue(f.key, e.target.value)}
                    className={f.key === 'complexity' ? getComplexityClass(value) : ''}
                  >
                    <option value="">-- Select --</option>
                    {f.options.map(o => (
                      <option key={o} value={o}
                        className={f.key === 'complexity' ? getComplexityClass(o) : ''}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="date"
                    value={value}
                    disabled={!enabled}
                    onChange={e => setValue(f.key, e.target.value)}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="bj-modal-actions">
        <button className="bj-btn-cancel" onClick={onClose}>Cancel</button>
        <button
          className="bj-btn-primary"
          onClick={handleApply}
          disabled={saving || activeFields.length === 0}
        >
          {saving ? 'Applying...' : `Apply to ${selectedCount} Job${selectedCount !== 1 ? '' : ''}`}
        </button>
      </div>
    </Modal>
  );
};

// ── Bulk Import Modal ─────────────────────────────────────────────
const BulkImportModal = ({ onClose, onBulkAdd, projects, clients = [], workflows = [] }) => {
  const [view, setView] = useState('main');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedProjId, setSelectedProjId] = useState(null);
  const [orderedFields, setOrderedFields] = useState([]);
  const [pasteText, setPasteText] = useState('');
  const [parsedJobs, setParsedJobs] = useState([]);
  const [importing, setImporting] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Filter projects by selected client
  const filteredProjects = selectedClientId
    ? projects.filter(p => p.clientId === selectedClientId)
    : projects;

  // Load saved field mapping from backend when project changes
  useEffect(() => {
    if (!selectedProjId) return;

    const loadMapping = async () => {
      try {
        const data = await apiCall(`/jobs/field-mapping/${selectedProjId}`);
        if (data && data.length > 0) {
          setOrderedFields(data);
        } else {
          setOrderedFields(
            ALL_BULK_FIELDS.filter(f => f.mandatory).map(f => f.key)
          );
        }
      } catch {
        setOrderedFields(
          ALL_BULK_FIELDS.filter(f => f.mandatory).map(f => f.key)
        );
      }
      setPasteText('');
      setParsedJobs([]);
    };

    loadMapping();
  }, [selectedProjId]);

  const toggleField = (key) => {
    setOrderedFields(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await apiCall(
        `/jobs/field-mapping/${selectedProjId}`,
        'POST',
        { fieldOrder: orderedFields }
      );
      setView('main');
    } catch (e) {
      alert('Error saving settings: ' + e.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const getEffectiveFields = () => {
    const fields = orderedFields.map(
      key => ALL_BULK_FIELDS.find(f => f.key === key)
    ).filter(Boolean);
    const missing = ALL_BULK_FIELDS.filter(
      f => f.mandatory && !orderedFields.includes(f.key)
    );
    return [...fields, ...missing];
  };

  // ── Smart paste parser: auto-detects tab or comma delimiter ──
  const handleTextPaste = (text) => {
    setPasteText(text);
    if (!text.trim()) { setParsedJobs([]); return; }

    const rows = text.split(/\r?\n/).filter(r => r.trim());
    const effectiveFields = getEffectiveFields();

    // Auto-detect delimiter: prefer tab (Excel copy), fallback to comma (CSV)
    const sampleRow = rows[0] || '';
    const delimiter = sampleRow.includes('\t') ? '\t' : ',';

    // CSV-aware row splitter — handles quoted fields containing commas
    const splitRow = (row) => {
      if (delimiter === '\t') return row.split('\t');
      const cols = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch === '"') {
          inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
          cols.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
      cols.push(current.trim());
      return cols;
    };

    const newJobs = rows.map((row, idx) => {
      const cols = splitRow(row);
      const job = {
        ...EMPTY_FORM,
        id: Date.now() + idx,
        project: selectedProject,
        projectId: selectedProjId,
        clientId: selectedClientId,
        workflowId: selectedWorkflowId || '',
      };
      effectiveFields.forEach((f, colIdx) => {
        if (cols[colIdx] !== undefined) {
          job[f.key] = cols[colIdx].trim();
        }
      });
      return job;
    });

    setParsedJobs(newJobs);
  };

  const handleJobChange = (index, key, value) => {
    setParsedJobs(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: value };
      return copy;
    });
  };

  const handleImport = async () => {
    if (parsedJobs.length === 0) {
      alert('Please paste some data first.');
      return;
    }
    for (let i = 0; i < parsedJobs.length; i++) {
      const job = parsedJobs[i];
      if (!job.receiveDate || !job.jobId || !job.title) {
        alert(`Row ${i + 1} is missing required fields (Receive Date, Job ID, Title Name).`);
        return;
      }
    }

    setImporting(true);
    try {
      const effectiveFields = getEffectiveFields();
      const rows = parsedJobs.map(job =>
        effectiveFields.map(f => job[f.key] || '')
      );

      const result = await apiCall('/jobs/bulk-import', 'POST', {
        projectId: selectedProjId,
        workflowId: selectedWorkflowId || null,
        rows,
        fieldOrder: effectiveFields.map(f => f.key),
      });

      if (result.failedRows > 0) {
        alert(`Import complete: ${result.successfulRows} success, ` +
          `${result.failedRows} skipped/failed.\n` +
          result.errors.slice(0, 5)
            .map(e => `Row ${e.rowNumber}: ${e.message}`)
            .join('\n'));
      } else {
        alert(`✅ Successfully imported ${result.successfulRows} jobs.`);
      }

      await onBulkAdd();
      onClose();
    } catch (e) {
      alert('Import failed: ' + e.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      xl={view === 'main' && !!selectedProject}
      wide={view === 'settings' || (view === 'main' && !selectedProject)}
    >
      {view === 'main' && (
        <>
          <div className="bj-bulk-header-bar">
            <h2 className="bj-modal-title" style={{ margin: 0 }}>
              Bulk Import
            </h2>
            {parsedJobs.length > 0 && (
              <button
                className="bj-btn-cancel"
                onClick={() => { setParsedJobs([]); setPasteText(''); }}
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                🔄 Clear &amp; Repaste
              </button>
            )}
          </div>

          <div className="bj-bulk-selectors-row" style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            {/* Client Select */}
            <div className="bj-form-group" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
              <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>
                Client <span className="req">*</span>
              </label>
              <select
                value={selectedClientId || ''}
                onChange={e => {
                  const cid = e.target.value;
                  setSelectedClientId(cid);
                  setSelectedProjId(null);
                  setSelectedProject('');
                  setSelectedWorkflowId('');
                }}
                style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              >
                <option value="">-- Select Client --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.companyName}</option>
                ))}
              </select>
            </div>

            {/* Project Select */}
            <div className="bj-form-group" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
              <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>
                Project (Publisher) <span className="req">*</span>
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={selectedProjId || ''}
                  onChange={e => {
                    const proj = projects.find(p => p.id === e.target.value);
                    setSelectedProjId(e.target.value || null);
                    setSelectedProject(proj?.name || '');
                    if (proj && proj.clientId && !selectedClientId) {
                      setSelectedClientId(proj.clientId);
                    }
                    if (proj && proj.workflowId) {
                      setSelectedWorkflowId(proj.workflowId);
                    } else {
                      setSelectedWorkflowId('');
                    }
                  }}
                  disabled={!selectedClientId}
                  style={{ flex: 1, padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                >
                  <option value="">-- Select Publisher --</option>
                  {filteredProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <button
                  className="bj-settings-btn"
                  disabled={!selectedProjId}
                  onClick={() => setView('settings')}
                  title="Configure Fields for this Project"
                  style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: selectedProjId ? 'pointer' : 'not-allowed' }}
                >
                  ⚙️
                </button>
              </div>
            </div>

            {/* Workflow Select */}
            <div className="bj-form-group" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
              <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>
                Task Name <span style={{ color: '#94a3b8', fontWeight: 400 }}>(Optional)</span>
              </label>
              <select
                value={selectedWorkflowId || ''}
                onChange={e => setSelectedWorkflowId(e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              >
                <option value="">-- Select Task Name --</option>
                {workflows.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedProject ? (
            <div className="bj-bulk-content">
              <div className="bj-paste-instruction">
                💡 <strong>Tip:</strong> Supports both Excel (tab-separated)
                and CSV (comma-separated) paste. Ensure columns match the
                headers below!
              </div>
              <div className="bj-table-wrapper" style={{
                maxHeight: '50vh', overflowY: 'auto',
                border: '1px solid #e2e8f0'
              }}>
                <table className="bj-table bj-bulk-table">
                  <thead>
                    <tr>
                      {getEffectiveFields().map((f, idx) => (
                        <th key={f.key}>
                          <span className="bj-field-order-badge">
                            {idx + 1}
                          </span>
                          {f.label}{' '}
                          {f.mandatory && <span className="req">*</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedJobs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={getEffectiveFields().length}
                          className="bj-paste-td"
                        >
                          <textarea
                            className="bj-paste-textarea"
                            placeholder={`Paste your data for ${selectedProject} here...\n\nSupports:\n• Excel copy-paste (tab-separated)\n• CSV (comma-separated)`}
                            value={pasteText}
                            onChange={e => handleTextPaste(e.target.value)}
                            autoFocus
                          />
                        </td>
                      </tr>
                    ) : parsedJobs.map((job, i) => (
                      <tr key={i}>
                        {getEffectiveFields().map(f => {
                          const isError = f.mandatory && !job[f.key];
                          const isComplexity = f.key === 'complexity';
                          return (
                            <td key={f.key}
                              className={`bj-grid-td${f.key === 'title' ? ' col-left' : ''}`}>
                              {isComplexity ? (
                                <select
                                  className={`bj-grid-input ${isError ? 'error-input' : ''} ${getComplexityClass(job[f.key])}`}
                                  value={job[f.key] || ''}
                                  onChange={e => handleJobChange(i, f.key, e.target.value)}
                                >
                                  <option value="">Complexity</option>
                                  {COMPLEXITY_OPTIONS.map(c => (
                                    <option key={c.label} value={c.label}
                                      className={getComplexityClass(c.label)}>
                                      {c.label}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  className={`bj-grid-input ${isError ? 'error-input' : ''}`}
                                  value={job[f.key] || ''}
                                  onChange={e => handleJobChange(i, f.key, e.target.value)}
                                  placeholder={f.mandatory ? 'Required' : ''}
                                />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bj-empty-state">
              <span style={{ fontSize: '2.5rem' }}>📂</span>
              <p>Please select a Project to begin bulk importing.</p>
            </div>
          )}

          <div className="bj-modal-actions">
            <button className="bj-btn-cancel" onClick={onClose}>Cancel</button>
            {parsedJobs.length > 0 && (
              <button className="bj-btn-cancel" onClick={() => { setParsedJobs([]); setPasteText(''); }}>
                Clear
              </button>
            )}
            <button
              className="bj-bulk-btn"
              onClick={handleImport}
              disabled={!selectedProject || parsedJobs.length === 0 || importing}
            >
              {importing
                ? 'Importing...'
                : `⬆ Import${parsedJobs.length > 0 ? ` (${parsedJobs.length})` : ''}`
              }
            </button>
          </div>
        </>
      )}

      {view === 'settings' && (
        <>
          <h2 className="bj-modal-title">
            Field Settings: {selectedProject}
          </h2>
          <div className="bj-paste-instruction">
            💡 <strong>Tip:</strong> Toggle fields ON in the exact sequence
            they appear in your spreadsheet.
          </div>
          <div className="bj-settings-list">
            {ALL_BULK_FIELDS.map(f => {
              const orderIndex = orderedFields.indexOf(f.key);
              const isSelected = orderIndex !== -1;
              return (
                <div key={f.key}
                  className={`bj-setting-item ${isSelected ? 'active' : ''}`}>
                  <div className="bj-setting-info">
                    <div className="bj-checkbox-order">
                      {isSelected ? orderIndex + 1 : ''}
                    </div>
                    <span className="bj-setting-label">
                      {f.label}{' '}
                      {f.mandatory && <span className="req">*</span>}
                    </span>
                  </div>
                  <label className="bj-toggle-switch">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleField(f.key)}
                    />
                    <span className="bj-slider" />
                  </label>
                </div>
              );
            })}
          </div>
          <div className="bj-modal-actions">
            <button className="bj-btn-cancel"
              onClick={() => setView('main')}>
              Back
            </button>
            <button className="bj-btn-primary" onClick={handleSaveSettings}
              disabled={savingSettings}>
              {savingSettings ? 'Saving...' : 'Update Settings'}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
};

// ═════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════
const BooksJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // ── Permissions ──────────────────────────────────────────────────
  const _user = getCurrentUser();
  const _roles = _user?.roles || [];
  const _perms = _user?.permissions || [];
  const isAdmin = _roles.includes('Admin');
  const canCreate = isAdmin || _perms.includes('jobs.create');
  const canUpdate = isAdmin || _perms.includes('jobs.update');
  const canDelete = isAdmin || _perms.includes('jobs.delete');
  const canBulkImport = isAdmin || _perms.includes('jobs.bulk_import');
  const canExport = isAdmin || _perms.includes('jobs.export');

  // ── Bulk selection state ────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showBulkEdit, setShowBulkEdit] = useState(false);

  // Filter state (un-applied until Search clicked)
  const [filters, setFilters] = useState({
    clientId: '',
    project: '', projectId: '',
    workflowId: '',
    isbn: '', startMonth: '', endMonth: '',
    status: '', billing: '',
    jobId: '', complexity: '', fileStatus: '',
  });
  const setF = (k, v) => setFilters(p => ({ ...p, [k]: v }));

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(50);

  // ── Load projects for dropdowns ─────────────────────────────
  const loadProjects = useCallback(async () => {
    try {
      const data = await apiCall('/projects');
      setProjects(data.map(p => ({
        id: p.id,
        name: p.name,
        clientId: p.clientId,
        clientName: p.clientName,
        workflowId: p.workflowId,
        workflowName: p.workflowName,
      })));
    } catch (err) {
      console.warn('Could not load projects:', err.message);
    }
  }, []);

  const loadClients = useCallback(async () => {
    try {
      const data = await apiCall('/clients');
      setClients(data);
    } catch (err) {
      console.warn('Could not load clients:', err.message);
    }
  }, []);

  const loadWorkflows = useCallback(async () => {
    try {
      const data = await apiCall('/projects/workflows');
      setWorkflows(data);
    } catch (err) {
      console.warn('Could not load workflows:', err.message);
    }
  }, []);

  // ── Load jobs with filters ──────────────────────────────────
  const loadJobs = useCallback(async (pageNum = 0, size = pageSize) => {
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
        ...(filters.isbn && { xmlIsbn: filters.isbn }),
        ...(filters.startMonth && { startMonthFrom: filters.startMonth }),
        ...(filters.endMonth && { startMonthTo: filters.endMonth }),
        ...(filters.status && { status: filters.status }),
        ...(filters.billing && { billingStatus: filters.billing }),
        ...(filters.complexity && { complexity: filters.complexity }),
        ...(filters.fileStatus && { fileStatus: filters.fileStatus }),
      });

      const data = await apiCall(`/jobs/search?${params}`);
      setJobs(data.content.map(mapJob));
      setTotalPages(data.totalPages);
      setTotalItems(data.totalElements);
      setPage(pageNum);
    } catch (err) {
      setError('Failed to load jobs: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, pageSize]);

  // Debounced auto-search when filters change
  useEffect(() => {
    const handler = setTimeout(() => {
      loadJobs(0);
    }, 300);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pageSize]);

  useEffect(() => {
    loadProjects();
    loadClients();
    loadWorkflows();
  }, [loadProjects, loadClients, loadWorkflows]);

  // All filtering is server-side; rows = already filtered page
  const rows = jobs;
  const hasActiveFilters = Object.values(filters).some(val => val !== '' && val !== null);

  // ── Scroll sync refs ────────────────────────────────────────
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
  }, [rows]);

  const open = (type, job = null) => setModal({ type, job });
  const close = () => setModal(null);

  // ── CRUD handlers ───────────────────────────────────────────
  const handleAdd = async (form) => {
    await apiCall('/jobs', 'POST', {
      projectId: form.projectId || null,
      workflowId: form.workflowId || null,
      jobIdCode: form.jobId,
      xmlIsbn: form.isbn || null,
      batch: form.batch || null,
      titleName: form.title,
      pageCount: parseInt(form.pageCount) || 0,
      numberOfChapters: parseInt(form.chapters) || null,
      pdfInputType: form.pdfType || null,
      complexity: form.complexity || null,
      referenceType: form.refType || null,
      status: form.status || null,
      fileStatus: form.fileStatus || null,
      uploadDate: form.uploadDate || null,
      billingStatus: form.billing || 'PENDING',
      receiveDate: form.receiveDate || null,
      startMonth: form.startMonth || null,
      endMonth: form.endMonth || null,
      language: form.language || null,
    });
    await loadJobs(0);
  };

  const handleUpdate = async (id, form) => {
    await apiCall(`/jobs/${id}`, 'PUT', {
      projectId: form.projectId || null,
      workflowId: form.workflowId || null,
      jobIdCode: form.jobId,
      xmlIsbn: form.isbn || null,
      batch: form.batch || null,
      titleName: form.title,
      pageCount: parseInt(form.pageCount) || 0,
      numberOfChapters: parseInt(form.chapters) || null,
      pdfInputType: form.pdfType || null,
      complexity: form.complexity || null,
      referenceType: form.refType || null,
      status: form.status || null,
      fileStatus: form.fileStatus || null,
      uploadDate: form.uploadDate || null,
      billingStatus: form.billing || null,
      receiveDate: form.receiveDate || null,
      startMonth: form.startMonth || null,
      endMonth: form.endMonth || null,
      language: form.language || null,
    });
    await loadJobs(page);
    close();
  };

  const handleDelete = async (id) => {
    await apiCall(`/jobs/${id}`, 'DELETE');
    await loadJobs(page);
  };

  const handleBulkAdd = async () => {
    await loadJobs(0);
  };

  // ── Bulk selection handlers ─────────────────────────────────────
  const toggleRow = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === rows.length && rows.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(rows.map(j => j.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkEditDone = async () => {
    clearSelection();
    await loadJobs(page);
  };

  // ── Search / Clear ──────────────────────────────────────────
  const handleSearch = () => {
    loadJobs(0);
  };

  const handleClear = () => {
    setFilters({
      clientId: '',
      project: '', projectId: '',
      workflowId: '',
      isbn: '',
      startMonth: '',
      endMonth: '',
      status: '',
      billing: '',
      jobId: '',
      complexity: '',
      fileStatus: '',
    });
  };

  // ── Export ──────────────────────────────────────────────────
  const fmt = (d) => {
    if (!d) return '-';
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

  const exportPDF = () => {
    const pw = window.open('', '_blank');
    pw.document.write(`
      <html><head><title>Job Management Report</title>
      <style>
        body{font-family:sans-serif;padding:30px;color:#333}
        h2{color:#7c3aed}
        table{width:100%;border-collapse:collapse;font-size:10px}
        th,td{border:1px solid #e2e8f0;padding:6px;text-align:left}
        th{background:#7c3aed;color:#fff}
        tr:nth-child(even){background:#f8fafc}
      </style></head><body>
      <h2>Job Management Report</h2>
      <p>Generated: ${new Date().toLocaleDateString('en-GB')}</p>
      <table><thead><tr>
        <th>Client</th><th>Project</th><th>Task Name</th><th>Receive Date</th><th>Job ID</th>
        <th>ISBN</th><th>Batch</th><th>Language</th><th>Title</th><th>Pages</th>
        <th>PDF Type</th><th>Complexity</th><th>Ref Type</th>
        <th>Status</th><th>File Status</th><th>Upload Date</th>
        <th>Billing</th>
      </tr></thead><tbody>
      ${rows.map(j => `<tr>
        <td>${j.clientName || '-'}</td><td>${j.project || '-'}</td><td>${j.workflowName || '-'}</td><td>${fmt(j.receiveDate)}</td>
        <td><b>${j.jobId || '-'}</b></td><td>${j.isbn || '-'}</td><td>${j.batch || '-'}</td>
        <td>${j.language || '-'}</td><td>${j.title || '-'}</td><td>${j.pageCount || '-'}</td>
        <td>${j.pdfType || '-'}</td><td>${j.complexity || '-'}</td>
        <td>${j.refType || '-'}</td><td>${j.status || '-'}</td>
        <td>${j.fileStatus || '-'}</td><td>${fmt(j.uploadDate)}</td>
        <td>${j.billing || '-'}</td>
      </tr>`).join('')}
      </tbody></table>
      <script>window.onload=()=>{window.print();window.close()}</script>
      </body></html>
    `);
    pw.document.close();
  };

  const exportExcel = () => {
    const headers = [
      'Client', 'Project', 'Workflow', 'Receive Date', 'Job ID', 'XML ISBN', 'Batch', 'Language', 'Title Name',
      'Page Count', 'PDF Type', 'Complexity', 'Ref Type', 'Status',
      'File Status', 'Upload Date', 'Billing Status'
    ];
    const csvRows = rows.map(j => [
      `"${j.clientName || ''}"`, `"${j.project || ''}"`, `"${j.workflowName || ''}"`, j.receiveDate ? fmt(j.receiveDate) : '',
      `"${j.jobId || ''}"`, `"${j.isbn || ''}"`, `"${j.batch || ''}"`, `"${j.language || ''}"`, `"${j.title || ''}"`,
      j.pageCount || '', `"${j.pdfType || ''}"`, `"${j.complexity || ''}"`,
      `"${j.refType || ''}"`, `"${j.status || ''}"`,
      `"${j.fileStatus || ''}"`, j.uploadDate ? fmt(j.uploadDate) : '',
      `"${j.billing || ''}"`
    ].join(','));
    const blob = new Blob(
      ['\ufeff' + [headers.join(','), ...csvRows].join('\n')],
      { type: 'text/csv;charset=utf-8;' }
    );
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'jobs_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="bj-container">

      {/* ── Page Header ── */}
      <div className="bj-page-header">
        <div className="bj-page-title">
          <span className="bj-page-icon">📚</span>
          <h2>Job Management</h2>
        </div>
        <div className="bj-header-btns">
          {canBulkImport && (
            <button className="bj-bulk-btn" onClick={() => open('bulk')}>
              📥 Bulk Import
            </button>
          )}
          {canCreate && (
            <button className="bj-add-btn" onClick={() => open('add')}>
              ＋ Add Job
            </button>
          )}
          {canExport && (
            <div className="bj-export-dropdown-container">
              <button className="bj-export-btn"
                onClick={() => setShowExportDropdown(v => !v)}>
                📤 Export Report
              </button>
              {showExportDropdown && (
                <div className="bj-export-dropdown-menu">
                  <button className="bj-export-item"
                    onClick={() => { exportPDF(); setShowExportDropdown(false); }}>
                    📄 Export PDF
                  </button>
                  <button className="bj-export-item"
                    onClick={() => { exportExcel(); setShowExportDropdown(false); }}>
                    📊 Export Excel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bj-filter-box">
        <div className="bj-filter-title">
          <span>🔍</span>
          <strong>Filters &amp; Search</strong>
        </div>
        <div className="bj-filter-grid">
          {/* Client filter */}
          <div className="bj-filter-group">
            <label><span className="flt-icon">💼</span> Client</label>
            <select
              value={filters.clientId}
              onChange={e => {
                setF('clientId', e.target.value);
                setF('projectId', '');
                setF('project', '');
                setF('workflowId', '');
              }}
            >
              <option value="">All Clients</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.companyName}</option>
              ))}
            </select>
          </div>

          {/* Project filter */}
          <div className="bj-filter-group">
            <label><span className="flt-icon">📦</span> Project</label>
            <select
              value={filters.projectId}
              onChange={e => {
                const proj = projects.find(p => p.id === e.target.value);
                setF('projectId', e.target.value);
                setF('project', proj?.name || '');
                if (proj && proj.clientId && !filters.clientId) {
                  setF('clientId', proj.clientId);
                }
                if (proj && proj.workflowId) {
                  setF('workflowId', proj.workflowId);
                } else {
                  setF('workflowId', '');
                }
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

          {/* Workflow filter */}
          <div className="bj-filter-group">
            <label><span className="flt-icon">⚙️</span> Task Name</label>
            <select
              value={filters.workflowId}
              onChange={e => setF('workflowId', e.target.value)}
            >
              <option value="">All Task Names</option>
              {workflows.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Job ID filter */}
          <div className="bj-filter-group">
            <label><span className="flt-icon">🆔</span> Job ID</label>
            <input placeholder="e.g., BM0748" value={filters.jobId}
              onChange={e => setF('jobId', e.target.value)} />
          </div>

          {/* ISBN filter */}
          <div className="bj-filter-group">
            <label><span className="flt-icon">📖</span> ISBN</label>
            <input placeholder="e.g., 9798216386377"
              value={filters.isbn}
              onChange={e => setF('isbn', e.target.value)} />
          </div>

          <div className="bj-filter-group">
            <label><span className="flt-icon">⚡</span> Complexity</label>
            <select
              className={getComplexityClass(filters.complexity)}
              value={filters.complexity}
              onChange={e => setF('complexity', e.target.value)}
            >
              <option value="">All Complexity</option>
              {COMPLEXITY_OPTIONS.map(c => (
                <option key={c.label} value={c.label}
                  className={getComplexityClass(c.label)}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Remain filters */}
          <div className="bj-filter-group">
            <label><span className="flt-icon">📅</span> Start Month From</label>
            <input type="date" value={filters.startMonth}
              onChange={e => setF('startMonth', e.target.value)} />
          </div>

          <div className="bj-filter-group">
            <label><span className="flt-icon">📅</span> End Month To</label>
            <input type="date" value={filters.endMonth}
              onChange={e => setF('endMonth', e.target.value)} />
          </div>

          <div className="bj-filter-group">
            <label><span className="flt-icon">🏷️</span> Status</label>
            <select value={filters.status}
              onChange={e => setF('status', e.target.value)}>
              <option value="">All Status</option>
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="bj-filter-group">
            <label><span className="flt-icon">💳</span> Billing Status</label>
            <select value={filters.billing}
              onChange={e => setF('billing', e.target.value)}>
              <option value="">All Billing Status</option>
              {BILLING_STATUS_OPTIONS.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="bj-filter-group">
            <label><span className="flt-icon">📂</span> File Status</label>
            <select value={filters.fileStatus}
              onChange={e => setF('fileStatus', e.target.value)}>
              <option value="">All File Status</option>
              {FILE_STATUS_OPTIONS.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div className="bj-filter-actions-group">
            {hasActiveFilters && (
              <span className="bj-filter-total-pages" style={{ marginRight: 'auto', alignSelf: 'center', fontWeight: '700', color: '#4a5568', fontSize: '0.85rem', background: '#f1f5f9', padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                Filtered : {jobs.reduce((sum, j) => sum + (parseInt(j.pageCount) || 0), 0)}
              </span>
            )}
            <button className="bj-search-btn" onClick={handleSearch}>
              🔍 Search
            </button>
            <button className="bj-clear-btn" onClick={handleClear}>
              ✕ Clear
            </button>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
          Loading jobs...
        </div>
      ) : error ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>
          {error}
        </div>
      ) : (
        <div className="bj-table-container">
          {/* Result count + Bulk toolbar */}
          <div className="bj-table-topbar">
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
              Showing {rows.length} of {totalItems} jobs
              {totalPages > 1 && ` (page ${page + 1} of ${totalPages})`}
            </div>
            {selectedIds.size > 0 && (
              <div className="bj-bulk-toolbar">
                <span className="bj-bulk-count">
                  ✅ {selectedIds.size} selected
                </span>
                <button
                  className="bj-bulk-edit-trigger"
                  onClick={() => setShowBulkEdit(true)}
                >
                  ✏️ Bulk Edit
                </button>
                <button
                  className="bj-bulk-clear-btn"
                  onClick={clearSelection}
                >
                  ✕ Deselect All
                </button>
              </div>
            )}
          </div>

          <div className="double-scroll-top" ref={topScrollRef}>
            <div className="double-scroll-top-inner" />
          </div>
          <div className="bj-table-wrapper" ref={bottomScrollRef}>
            <table className="bj-table">
              <thead>
                <tr>
                  <th className="bj-th-check">
                    <input
                      type="checkbox"
                      className="bj-row-checkbox"
                      checked={rows.length > 0 && selectedIds.size === rows.length}
                      onChange={toggleAll}
                      title="Select all on this page"
                    />
                  </th>
                  <th>Client</th>
                  <th>Project</th>
                  <th>Task Name</th>
                  <th>Receive Date</th>
                  <th>Job ID</th>
                  <th>ISBN</th>
                  <th>Batch</th>
                  <th>Language</th>
                  <th>Title / Article Name</th>
                  <th>Page</th>
                  <th>PDF Type</th>
                  <th>Complexity</th>
                  <th>Ref Type</th>
                  <th>Status</th>
                  <th>File Status</th>
                  <th>Upload Date</th>
                  <th>Billing Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan="20" className="bj-empty">
                      No records found. Try different filters or add a job.
                    </td>
                  </tr>
                ) : rows.map(job => (
                  <tr key={job.id} className={selectedIds.has(job.id) ? 'bj-row-selected' : ''}>
                    <td className="bj-td-check">
                      <input
                        type="checkbox"
                        className="bj-row-checkbox"
                        checked={selectedIds.has(job.id)}
                        onChange={() => toggleRow(job.id)}
                      />
                    </td>
                    <td>
                      {job.clientName ? (
                        <span className="client-badge" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '2px 6px', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 700 }}>
                          {job.clientName}
                        </span>
                      ) : <span className="cell-dash">-</span>}
                    </td>
                    <td>
                      {job.project
                        ? <span className={getProjectBadgeClass(job.project)}>{job.project}</span>
                        : <span className="cell-dash">-</span>}
                    </td>
                    <td>
                      {job.workflowName ? (
                        <span className="badge badge--workflow" style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', padding: '2px 6px', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 700 }}>
                          {job.workflowName}
                        </span>
                      ) : <span className="cell-dash">-</span>}
                    </td>
                    <td className="td-date">{fmt(job.receiveDate)}</td>
                    <td><strong>{job.jobId}</strong></td>
                    <td>
                      {job.isbn
                        ? <span className="bj-isbn-link">{job.isbn}</span>
                        : <span className="cell-dash">-</span>}
                    </td>
                    <td>
                      {job.batch || <span className="cell-dash">-</span>}
                    </td>
                    <td>
                      {job.language ? <strong>{job.language}</strong> : <span className="cell-dash">-</span>}
                    </td>
                    <td className="td-title col-left">
                      {job.title || <span className="cell-dash">-</span>}
                    </td>
                    <td className="td-center">
                      {job.pageCount || <span className="cell-dash">-</span>}
                    </td>
                    <td>
                      {job.pdfType || <span className="cell-dash">-</span>}
                    </td>
                    <td><ComplexityBadge value={job.complexity} /></td>
                    <td className="td-ref">
                      {job.refType
                        ? <span className="ref-tag">{job.refType}</span>
                        : <span className="cell-dash">-</span>}
                    </td>
                    <td>
                      <StatusPill value={job.status} type="status" />
                    </td>
                    <td>
                      <StatusPill value={job.fileStatus} type="file" />
                    </td>
                    <td className="td-date">{fmt(job.uploadDate)}</td>
                    <td>
                      {job.billing
                        ? <span className={`billing-badge bb-${job.billing.toLowerCase()}`}>
                          {job.billing}
                        </span>
                        : <span className="cell-pink">-</span>}
                    </td>
                    <td>
                      <div className="bj-action-btns">
                        {canUpdate && (
                          <button className="bj-act-edit" title="Edit"
                            onClick={() => open('edit', job)}>✏️</button>
                        )}
                        {canDelete && (
                          <button className="bj-act-del" title="Delete"
                            onClick={() => open('delete', job)}>🗑️</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalItems > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              borderTop: '1px solid #e2e8f0',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', color: '#4a5568' }}>Items per page:</label>
                <select
                  value={pageSize}
                  onChange={e => {
                    const newSize = Number(e.target.value);
                    setPageSize(newSize);
                    loadJobs(0, newSize);
                  }}
                  style={{
                    padding: '4px 8px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    outline: 'none',
                    fontSize: '0.85rem'
                  }}
                >
                  {[10, 25, 50, 100].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    className="bj-search-btn"
                    disabled={page === 0}
                    onClick={() => loadJobs(page - 1)}
                    style={{ padding: '6px 14px' }}
                  >‹ Prev</button>
                  <span style={{ padding: '6px 12px', color: '#666', fontSize: '0.85rem' }}>
                    Page {page + 1} of {totalPages}
                  </span>
                  <button
                    className="bj-search-btn"
                    disabled={page >= totalPages - 1}
                    onClick={() => loadJobs(page + 1)}
                    style={{ padding: '6px 14px' }}
                  >Next ›</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      {modal?.type === 'add' && (
        <AddJobModal onClose={close} onAdd={handleAdd}
          projects={projects} clients={clients} workflows={workflows} />
      )}
      {modal?.type === 'edit' && (
        <EditJobModal job={modal.job} onClose={close}
          onUpdate={handleUpdate} projects={projects} clients={clients} workflows={workflows} />
      )}
      {modal?.type === 'delete' && (
        <DeleteJobModal job={modal.job} onClose={close}
          onDelete={() => open('reconfirm_delete', modal.job)} />
      )}
      {modal?.type === 'reconfirm_delete' && (
        <ReconfirmDeleteModal job={modal.job} onClose={close}
          onDelete={handleDelete} />
      )}
      {modal?.type === 'bulk' && (
        <BulkImportModal onClose={close} onBulkAdd={handleBulkAdd}
          projects={projects} clients={clients} workflows={workflows} />
      )}
      {showBulkEdit && (
        <BulkEditModal
          selectedIds={Array.from(selectedIds)}
          selectedCount={selectedIds.size}
          onClose={() => setShowBulkEdit(false)}
          onDone={handleBulkEditDone}
        />
      )}
    </div>
  );
};

export default BooksJobs;