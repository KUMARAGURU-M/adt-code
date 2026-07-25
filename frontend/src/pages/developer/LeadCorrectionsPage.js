import React, { useState, useEffect } from 'react';
import './LeadCorrectionsPage.css';
import { apiCall, getCurrentUser } from '../../utils/api';

const LeadCorrectionsPage = ({ corrections, setCorrections, tasks, setTasks, projects }) => {
  const user = getCurrentUser();
  const isAdmin = user?.roles?.includes('Admin');
  const hasAccess = (perm) => isAdmin || (user?.permissions || []).includes(perm);

  const [selectedCorr, setSelectedCorr] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Available review tasks
  const reviewTasks = tasks.filter(t => t.status === 'Review');

  const getDropdownTasks = () => {
    const list = [...reviewTasks];
    if (modalMode === 'edit' && newCorrForm.taskId) {
      const currentTask = tasks.find(t => String(t.id) === String(newCorrForm.taskId));
      if (currentTask) {
        if (!list.some(t => String(t.id) === String(currentTask.id))) {
          list.push(currentTask);
        }
      } else if (editingCorr && editingCorr.taskId) {
        list.push({
          id: editingCorr.taskId,
          title: editingCorr.task,
          project: editingCorr.project
        });
      }
    }
    return list;
  };

  const [allUsers, setAllUsers] = useState([]);
  const currentUser = getCurrentUser();
  const currentUserName = currentUser?.fullName || currentUser?.userCode || '';

  useEffect(() => {
    apiCall('/users')
      .then(data => {
        if (data && Array.isArray(data)) {
          setAllUsers(data);
        }
      })
      .catch(err => console.warn('Failed to load users:', err.message));
  }, []);

  // Form State
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [editingCorr, setEditingCorr] = useState(null);

  const [newCorrForm, setNewCorrForm] = useState({
    taskId: '',
    projectId: '',
    correction: '',
    leadComment: '',
    assignedTo: '',
    assignedBy: currentUserName,
    assignedDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    priority: 'Medium',
    status: 'Pending Fix'
  });

  const handleOpenAddModal = () => {
    setModalMode('add');
    setEditingCorr(null);
    const defaultProj = projects.length > 0 ? projects[0].id : '';
    setNewCorrForm({
      taskId: '',
      projectId: defaultProj,
      correction: '',
      leadComment: '',
      assignedTo: allUsers.length > 0 ? (allUsers[0].fullName || allUsers[0].userCode) : '',
      assignedBy: currentUserName,
      assignedDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      priority: 'Medium',
      status: 'Pending Fix'
    });
    setShowAddModal(true);
  };

  const handleOpenEditModal = (corr) => {
    setModalMode('edit');
    setEditingCorr(corr);
    setNewCorrForm({
      taskId: corr.taskId || '',
      projectId: corr.projectId || '',
      correction: corr.correction || '',
      leadComment: corr.leadComment || '',
      assignedTo: corr.assignedTo || 'Kumar',
      assignedBy: corr.assignedBy || currentUserName,
      assignedDate: corr.assignedDate || new Date().toISOString().split('T')[0],
      dueDate: corr.dueDate || new Date().toISOString().split('T')[0],
      priority: corr.priority || 'Medium',
      status: corr.status || 'Pending Fix'
    });
    setShowAddModal(true);
  };

  const handleTaskChange = (taskId) => {
    if (!taskId) {
      setNewCorrForm(prev => ({
        ...prev,
        taskId: '',
        projectId: projects.length > 0 ? projects[0].id : ''
      }));
      return;
    }
    const selectedTask = tasks.find(t => String(t.id) === String(taskId));
    setNewCorrForm(prev => ({
      ...prev,
      taskId: taskId,
      projectId: selectedTask ? selectedTask.projectId : prev.projectId,
      assignedTo: selectedTask ? selectedTask.assignedTo : prev.assignedTo
    }));
  };

  const handleOpenReply = (item) => {
    setSelectedCorr(item);
    setReplyText(item.reply || '');
  };

  const handleSendReply = () => {
    if (!selectedCorr) return;

    const payload = {
      taskId: selectedCorr.taskId,
      correction: selectedCorr.correction,
      leadComment: selectedCorr.leadComment,
      developerReply: replyText,
      status: 'In Review'
    };

    apiCall(`/developer/corrections/${selectedCorr.id}`, 'PUT', payload)
      .then(() => apiCall('/developer/corrections'))
      .then(res => {
        if (res) setCorrections(res);
      })
      .catch(err => alert('Error sending reply: ' + err.message));

    setSelectedCorr(null);
    setReplyText('');
  };

  const handleResolve = (id) => {
    if (window.confirm("Are you sure you want to mark this correction as Resolved? This will also update the corresponding developer task status.")) {
      apiCall(`/developer/corrections/${id}/resolve`, 'PATCH')
        .then(() => Promise.all([
          apiCall('/developer/corrections'),
          apiCall('/developer/tasks')
        ]))
        .then(([corrs, ts]) => {
          if (corrs) setCorrections(corrs);
          if (ts) setTasks(ts.map(t => ({ ...t, completed: t.status === 'Completed' })));
        })
        .catch(err => alert('Error resolving correction: ' + err.message));
    }
  };

  const handleSaveCorrection = (e) => {
    e.preventDefault();
    if (!newCorrForm.correction.trim()) return;

    const payload = {
      taskId: newCorrForm.taskId ? newCorrForm.taskId : null,
      projectId: newCorrForm.taskId ? null : newCorrForm.projectId,
      correction: newCorrForm.correction,
      leadComment: newCorrForm.leadComment,
      assignedToName: newCorrForm.assignedTo,
      assignedBy: newCorrForm.assignedBy,
      assignedDate: newCorrForm.assignedDate,
      dueDate: newCorrForm.dueDate,
      priority: newCorrForm.priority,
      status: newCorrForm.status || 'Pending Fix'
    };

    const endpoint = modalMode === 'add' ? '/developer/corrections' : `/developer/corrections/${editingCorr.id}`;
    const method = modalMode === 'add' ? 'POST' : 'PUT';

    apiCall(endpoint, method, payload)
      .then(() => Promise.all([
        apiCall('/developer/corrections'),
        apiCall('/developer/tasks')
      ]))
      .then(([corrs, ts]) => {
        if (corrs) setCorrections(corrs);
        if (ts) setTasks(ts.map(t => ({ ...t, completed: t.status === 'Completed' })));
      })
      .catch(err => alert('Error saving correction: ' + err.message));

    setShowAddModal(false);
  };

  const formatDevDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      const parts = cleanDate.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const monthIdx = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, monthIdx, day);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
      }
      const d = new Date(dateStr);
      if (isNaN(d)) return dateStr;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
    } catch { return dateStr; }
  };

  return (
    <div className="dev-full-width-panel" style={{ marginTop: '0' }}>
      
      {/* HEADER BAR */}
      <div className="dev-panel-header" style={{ marginBottom: '20px' }}>
        <div className="dev-panel-title">
          <span>⚠️ Quality Review & Lead Corrections</span>
          <span className="dev-badge dev-badge-rose">
            {corrections.filter(c => c.status !== 'Resolved').length} Active
          </span>
        </div>
        {hasAccess('developer_corrections.create') && (
          <button className="dev-btn dev-btn-primary" onClick={handleOpenAddModal}>
            + Submit Correction
          </button>
        )}
      </div>

      {/* CORRECTIONS TABLE */}
      <div className="dev-table-wrapper">
        <table className="dev-table" style={{ tableLayout: 'fixed', width: '100%' }}>
          <colgroup>
            <col style={{ width: '100px' }} />
            <col style={{ width: '140px' }} />
            <col style={{ width: '160px' }} />
            <col style={{ width: '180px' }} />
            <col style={{ width: '180px' }} />
            <col style={{ width: '110px' }} />
            <col style={{ width: '110px' }} />
            <col style={{ width: '75px' }} />
            <col style={{ width: '160px' }} />
            <col style={{ width: '90px' }} />
            <col style={{ width: '100px' }} />
          </colgroup>
          <thead>
            <tr>
              <th style={{ textAlign: 'center' }}>Assigned Date</th>
              <th style={{ textAlign: 'left' }}>Project</th>
              <th style={{ textAlign: 'left' }}>Task Detail</th>
              <th style={{ textAlign: 'left' }}>Correction</th>
              <th style={{ textAlign: 'left' }}>Feedback Comment</th>
              <th style={{ textAlign: 'center' }}>Assigned To</th>
              <th style={{ textAlign: 'center' }}>Assigned By</th>
              <th style={{ textAlign: 'center' }}>Priority</th>
              <th style={{ textAlign: 'center' }}>Developer Reply</th>
              <th style={{ textAlign: 'center' }}>Status</th>
              <th style={{ textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {corrections.map(c => (
              <tr key={c.id}>
                <td style={{ textAlign: 'center' }}>{formatDevDate(c.assignedDate)}</td>
                <td style={{ textAlign: 'left' }}><strong style={{ color: '#00a3ff' }}>{c.project || '—'}</strong></td>
                <td style={{ textAlign: 'left', wordBreak: 'break-word' }}><span className="dev-task-project">{c.task || '—'}</span></td>
                <td style={{ textAlign: 'left', fontWeight: '700', color: '#1a202c', wordBreak: 'break-word' }}>{c.correction}</td>
                <td style={{ textAlign: 'left', fontSize: '0.82rem', color: '#718096', wordBreak: 'break-word' }}>&#8220;{c.leadComment || '—'}&#8221;</td>
                <td style={{ textAlign: 'center' }}>👤 <strong>{c.assignedTo || 'Kumar'}</strong></td>
                <td style={{ textAlign: 'center', fontSize: '0.85rem' }}>{c.assignedBy || 'Lead'}</td>
                <td style={{ textAlign: 'center' }}>
                  <span className={`dev-badge ${c.priority === 'High' ? 'dev-badge-rose' : c.priority === 'Medium' ? 'dev-badge-amber' : 'dev-badge-blue'}`}>
                    {c.priority || 'Medium'}
                  </span>
                </td>
                <td style={{ textAlign: 'center', fontSize: '0.82rem' }}>
                  {c.reply ? (
                    <span style={{ color: '#4a5568', fontStyle: 'italic' }}>&#8220;{c.reply}&#8221;</span>
                  ) : (
                    <span style={{ color: '#a0aec0', fontStyle: 'italic' }}>No reply yet</span>
                  )}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span className={`dev-badge ${c.status === 'Resolved' ? 'dev-badge-success' : c.status === 'In Review' ? 'dev-badge-blue' : 'dev-badge-rose'}`}>
                    {c.status === 'Resolved' ? 'Resolved' : 'Not Resolved'}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {hasAccess('developer_corrections.update') && (
                      <button className="dev-btn dev-btn-secondary" style={{ padding: '3px 6px', fontSize: '0.75rem', margin: 0 }} onClick={() => handleOpenReply(c)}>
                        💬
                      </button>
                    )}
                    {hasAccess('developer_corrections.update') && (
                      <button className="dev-btn dev-btn-secondary" style={{ padding: '3px 6px', fontSize: '0.75rem', margin: 0 }} onClick={() => handleOpenEditModal(c)} title="Edit">
                        ✏️
                      </button>
                    )}
                    {c.status !== 'Resolved' && hasAccess('developer_corrections.update') && (
                      <button className="dev-btn dev-btn-success" style={{ padding: '3px 6px', fontSize: '0.75rem', margin: 0 }} onClick={() => handleResolve(c.id)}>
                        ✓
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {corrections.length === 0 && (
              <tr>
                <td colSpan="11" style={{ textAlign: 'center', color: '#a0aec0', padding: '20px' }}>
                  📌 No corrections found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* REPLY MODAL */}
      {selectedCorr && (
        <div className="dev-modal-overlay">
          <div className="dev-modal">
            <div className="dev-modal-header">
              <h3 className="dev-modal-title">💬 Reply to Code Correction</h3>
              <button className="dev-modal-close" onClick={() => setSelectedCorr(null)}>✕</button>
            </div>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
              <div style={{ fontSize: '0.8rem', color: '#718096', fontWeight: '700' }}>Lead Feedback ({selectedCorr.assignedBy}):</div>
              <div style={{ color: '#d69e2e', fontWeight: '600', marginTop: '2px', fontSize: '0.9rem' }}>"{selectedCorr.leadComment}"</div>
            </div>
            <div className="dev-form-group">
              <label>Your Fix Description / Commit Link</label>
              <textarea 
                className="dev-textarea"
                placeholder="Explain the changes made, fixed lines, or PR link..."
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                required
              />
            </div>
            <div className="dev-modal-actions">
              <button className="dev-btn dev-btn-secondary" onClick={() => setSelectedCorr(null)}>Cancel</button>
              <button className="dev-btn dev-btn-primary" onClick={handleSendReply}>Submit Reply to Lead</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD CORRECTION MODAL */}
      {showAddModal && (
        <div className="dev-modal-overlay">
          <div className="dev-modal" style={{ maxWidth: '550px' }}>
            <div className="dev-modal-header">
              <h3 className="dev-modal-title">
                {modalMode === 'add' ? '➕ Submit Code Correction Feedback' : '✏️ Edit Code Correction Feedback'}
              </h3>
              <button type="button" className="dev-modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveCorrection}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="dev-form-group" style={{ margin: 0 }}>
                  <label>Select Task (Optional)</label>
                  <select
                    className="dev-select"
                    value={newCorrForm.taskId}
                    onChange={e => handleTaskChange(e.target.value)}
                  >
                    <option value="">-- No Task (Create Correction Directly) --</option>
                    {getDropdownTasks().map(t => (
                      <option key={t.id} value={t.id}>[{t.project}] {t.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="dev-form-group" style={{ margin: 0 }}>
                  <label>Project <span style={{ color: '#e53e3e' }}>*</span></label>
                  {newCorrForm.taskId ? (
                    <input 
                      type="text"
                      className="dev-input"
                      value={tasks.find(t => String(t.id) === String(newCorrForm.taskId))?.project || editingCorr?.project || ''}
                      disabled
                      style={{ background: '#f1f5f9' }}
                    />
                  ) : (
                    <select
                      className="dev-select"
                      value={newCorrForm.projectId}
                      onChange={e => setNewCorrForm({ ...newCorrForm, projectId: e.target.value })}
                      required
                    >
                      <option value="">-- Choose Project --</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="dev-form-group" style={{ margin: 0 }}>
                  <label>Assigned User (Developer) <span style={{ color: '#e53e3e' }}>*</span></label>
                  <select
                    className="dev-select"
                    value={newCorrForm.assignedTo}
                    onChange={e => setNewCorrForm({...newCorrForm, assignedTo: e.target.value})}
                    required
                  >
                    <option value="">-- Choose Developer --</option>
                    {allUsers.filter(u => {
                      const roleName = (u.role || '').toLowerCase();
                      const rolesArr = (u.roles || []).map(r => r.toLowerCase());
                      return roleName.startsWith('dev-') || roleName === 'admin' || rolesArr.some(r => r.startsWith('dev-') || r === 'admin');
                    }).map(u => {
                      const name = u.fullName || u.userCode || 'Unknown';
                      return <option key={u.id} value={name}>{name}</option>;
                    })}
                  </select>
                </div>
                <div className="dev-form-group" style={{ margin: 0 }}>
                  <label>Assigned By (Lead) <span style={{ color: '#e53e3e' }}>*</span></label>
                  <select
                    className="dev-select"
                    value={newCorrForm.assignedBy}
                    onChange={e => setNewCorrForm({...newCorrForm, assignedBy: e.target.value})}
                    required
                  >
                    <option value="">-- Choose Lead --</option>
                    {allUsers.filter(u => {
                      const roleName = (u.role || '').toLowerCase();
                      const rolesArr = (u.roles || []).map(r => r.toLowerCase());
                      return roleName.startsWith('dev-') || roleName === 'admin' || rolesArr.some(r => r.startsWith('dev-') || r === 'admin');
                    }).map(u => {
                      const name = u.fullName || u.userCode || 'Unknown';
                      return <option key={u.id} value={name}>{name}</option>;
                    })}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="dev-form-group" style={{ margin: 0 }}>
                  <label>Assigned Date <span style={{ color: '#e53e3e' }}>*</span></label>
                  <input
                    type="date"
                    className="dev-input"
                    value={newCorrForm.assignedDate}
                    onChange={e => setNewCorrForm({...newCorrForm, assignedDate: e.target.value})}
                    required
                  />
                </div>
                <div className="dev-form-group" style={{ margin: 0 }}>
                  <label>Due Date <span style={{ color: '#e53e3e' }}>*</span></label>
                  <input
                    type="date"
                    className="dev-input"
                    value={newCorrForm.dueDate}
                    onChange={e => setNewCorrForm({...newCorrForm, dueDate: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="dev-form-group" style={{ margin: 0 }}>
                  <label>Correction/Title <span style={{ color: '#e53e3e' }}>*</span></label>
                  <input
                    type="text"
                    className="dev-input"
                    placeholder="e.g. Catch OCR null pointer exceptions"
                    value={newCorrForm.correction}
                    onChange={e => setNewCorrForm({...newCorrForm, correction: e.target.value})}
                    required
                  />
                </div>
                <div className="dev-form-group" style={{ margin: 0 }}>
                  <label>Priority</label>
                  <select
                    className="dev-select"
                    value={newCorrForm.priority}
                    onChange={e => setNewCorrForm({...newCorrForm, priority: e.target.value})}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              {modalMode === 'edit' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px', marginBottom: '14px' }}>
                  <div className="dev-form-group" style={{ margin: 0 }}>
                    <label>Status <span style={{ color: '#e53e3e' }}>*</span></label>
                    <select
                      className="dev-select"
                      value={newCorrForm.status}
                      onChange={e => setNewCorrForm({...newCorrForm, status: e.target.value})}
                      required
                    >
                      <option value="Pending Fix">Pending Fix</option>
                      <option value="In Review">In Review</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="dev-form-group">
                <label>Feedback Details / Lead Comment <span style={{ color: '#e53e3e' }}>*</span></label>
                <textarea
                  className="dev-textarea"
                  placeholder="Explain details of what to fix, including specific code lines..."
                  value={newCorrForm.leadComment}
                  onChange={e => setNewCorrForm({...newCorrForm, leadComment: e.target.value})}
                  required
                  style={{ minHeight: '80px' }}
                />
              </div>

              <div className="dev-modal-actions">
                <button type="button" className="dev-btn dev-btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="dev-btn dev-btn-primary">
                  {modalMode === 'add' ? 'Submit Correction' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default LeadCorrectionsPage;
