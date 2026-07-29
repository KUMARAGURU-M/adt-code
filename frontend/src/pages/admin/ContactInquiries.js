import React, { useCallback, useEffect, useState } from 'react';
import { apiCall } from '../../utils/api';
import './ContactInquiries.css';

const STATUS_LABELS = { NEW: 'New', READ: 'Read', REPLIED: 'Replied' };
const STATUS_COLORS = { NEW: 'amber', READ: 'teal', REPLIED: 'green' };

export default function ContactInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilter] = useState('');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = filterStatus ? `/admin/contact?status=${filterStatus}` : '/admin/contact';
      const data = await apiCall(url);
      setInquiries(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('Failed to load inquiries.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    try {
      await apiCall(`/admin/contact/${id}/status`, 'PUT', { status });
      setInquiries(prev => prev.map(i => i.id === id ? { ...i, status } : i));
      if (selected?.id === id) setSelected(s => ({ ...s, status }));
    } catch { /* handled silently */ }
  };

  const deleteInquiry = async (id) => {
    if (!window.confirm('Delete this inquiry permanently?')) return;
    try {
      await apiCall(`/admin/contact/${id}`, 'DELETE');
      setInquiries(prev => prev.filter(i => i.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch { /* handled silently */ }
  };

  const fmt = (iso) => iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  return (
    <div className="ci-page">
      <div className="ci-header">
        <div>
          <h1 className="ci-title">📬 Contact Inquiry</h1>
          <p className="ci-subtitle">Review and manage messages from the public website contact form</p>
        </div>
        <div className="ci-filters">
          {['', 'NEW', 'READ', 'REPLIED'].map(s => (
            <button key={s} className={`ci-filter-btn ${filterStatus === s ? 'active' : ''}`}
              onClick={() => setFilter(s)}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="ci-error">{error}</div>}

      <div className="ci-workspace">
        {/* Left — table */}
        <div className="ci-list">
          {loading ? (
            <div className="ci-empty">Loading...</div>
          ) : inquiries.length === 0 ? (
            <div className="ci-empty">No inquiries found.</div>
          ) : (
            <div className="ci-table-responsive">
              <table className="ci-table">
                <thead>
                  <tr>
                    <th>Name</th><th>Email</th><th>Company</th><th>Service</th><th className="ci-txt-center">Status</th><th className="ci-txt-center">Date</th><th className="ci-txt-center"></th>
                  </tr>
                </thead>
                <tbody>
                  {inquiries.map(inq => (
                    <tr key={inq.id} className={`ci-row ${selected?.id === inq.id ? 'selected' : ''}`}
                      onClick={() => { setSelected(inq); updateStatus(inq.id, inq.status === 'NEW' ? 'READ' : inq.status); }}>
                      <td className="ci-td-name">{inq.name}</td>
                      <td>{inq.email}</td>
                      <td>{inq.company || '—'}</td>
                      <td>{inq.service || '—'}</td>
                      <td className="ci-txt-center">
                        <span className={`ci-badge ci-badge--${STATUS_COLORS[inq.status] || 'grey'}`}>
                          {STATUS_LABELS[inq.status] || inq.status}
                        </span>
                      </td>
                      <td className="ci-td-date ci-txt-center">{fmt(inq.createdAt)}</td>
                      <td className="ci-txt-center">
                        <button className="ci-del-btn" onClick={e => { e.stopPropagation(); deleteInquiry(inq.id); }}
                          title="Delete">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right — detail panel */}
        {selected && (
          <div className="ci-detail">
            <div className="ci-detail-header">
              <div>
                <h3 className="ci-detail-name">{selected.name}</h3>
                <a href={`mailto:${selected.email}`} className="ci-detail-email">{selected.email}</a>
                {selected.phone && <span className="ci-detail-meta"> · {selected.phone}</span>}
              </div>
              <button className="ci-close-btn" onClick={() => setSelected(null)}>✕</button>
            </div>

            <div className="ci-detail-meta-row">
              {selected.company && <span className="ci-chip">🏢 {selected.company}</span>}
              {selected.service && <span className="ci-chip">🔧 {selected.service}</span>}
              <span className="ci-chip">🕒 {fmt(selected.createdAt)}</span>
            </div>

            <div className="ci-detail-message">
              <div className="ci-detail-msg-label">Message</div>
              <p className="ci-detail-msg-body">{selected.message}</p>
            </div>

            <div className="ci-detail-actions">
              <span className="ci-detail-status-label">Update status:</span>
              {['NEW', 'READ', 'REPLIED'].map(s => (
                <button key={s}
                  className={`ci-status-btn ci-status-btn--${STATUS_COLORS[s]} ${selected.status === s ? 'active' : ''}`}
                  onClick={() => updateStatus(selected.id, s)}>
                  {STATUS_LABELS[s]}
                </button>
              ))}
              <button className="ci-del-detail-btn" onClick={() => deleteInquiry(selected.id)}>Delete</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
