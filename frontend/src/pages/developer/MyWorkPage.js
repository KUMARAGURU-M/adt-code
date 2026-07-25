import React, { useState, useEffect } from 'react';
import './MyWorkPage.css';
import { apiCall, getCurrentUser } from '../../utils/api';

const MyWorkPage = ({ tasks, setTasks, projects }) => {
  const user = getCurrentUser();
  const isAdmin = user?.roles?.includes('Admin');
  const hasAccess = (perm) => isAdmin || (user?.permissions || []).includes(perm);

  // Developer dropdown options
  const [developers, setDevelopers] = useState([]);

  useEffect(() => {
    apiCall('/users')
      .then(data => {
        if (data && Array.isArray(data)) {
          const devUsers = data.filter(u => {
            const roleName = (u.role || '').toLowerCase();
            const rolesArr = (u.roles || []).map(r => r.toLowerCase());
            return roleName.startsWith('dev-') || roleName === 'admin' || rolesArr.some(r => r.startsWith('dev-') || r === 'admin');
          });
          if (devUsers.length > 0) {
            setDevelopers(devUsers.map(u => u.fullName || u.name || 'Unknown'));
          }
        }
      })
      .catch(err => console.warn('Failed to load dev users:', err.message));
  }, []);

  // Form States & Modal
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskModalMode, setTaskModalMode] = useState('add'); // 'add' or 'edit'
  const [editingTask, setEditingTask] = useState(null);

  // Filter States
  const [filterProject, setFilterProject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDeveloper, setFilterDeveloper] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

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

  const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    try {
      const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      const parts = cleanDate.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = String(parseInt(parts[1], 10)).padStart(2, '0');
        const day = String(parseInt(parts[2], 10)).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      const d = new Date(dateStr);
      if (isNaN(d)) return '';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch { return ''; }
  };

  const [taskForm, setTaskForm] = useState({
    title: '',
    project: projects.length > 0 ? projects[0].name : '',
    assignedTo: '',
    assignedBy: '',
    assignedDate: formatDateForInput(new Date().toISOString()),
    dueDate: formatDateForInput(new Date().toISOString()),
    status: 'Pending',
    priority: 'Medium',
    description: ''
  });

  // Set default assignedBy when developers load
  useEffect(() => {
    const currentUser = getCurrentUser();
    const curName = currentUser?.fullName || currentUser?.userCode || '';
    setTaskForm(prev => ({
      ...prev,
      assignedBy: developers.includes(curName) ? curName : (developers[0] || ''),
      assignedTo: prev.assignedTo || developers[0] || ''
    }));
  }, [developers]);

  // Filter logic
  const filteredTasks = tasks.filter(t => {
    if (filterProject && t.project !== filterProject) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterDeveloper && t.assignedTo !== filterDeveloper) return false;
    if (filterDate && t.assignedDate !== filterDate) return false;
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      const matchTitle = t.title?.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    return true;
  });

  const handleOpenAddTask = () => {
    const currentUser = getCurrentUser();
    const curName = currentUser?.fullName || currentUser?.userCode || '';
    setTaskModalMode('add');
    setEditingTask(null);
    setTaskForm({
      title: '',
      project: projects.length > 0 ? projects[0].name : '',
      assignedTo: developers[0] || '',
      assignedBy: developers.includes(curName) ? curName : (developers[0] || ''),
      assignedDate: formatDateForInput(new Date().toISOString()),
      dueDate: formatDateForInput(new Date().toISOString()),
      status: 'Pending',
      priority: 'Medium',
      description: ''
    });
    setShowTaskModal(true);
  };

  const handleOpenEditTask = (t) => {
    const currentUser = getCurrentUser();
    const curName = currentUser?.fullName || currentUser?.userCode || '';
    setTaskModalMode('edit');
    setEditingTask(t);
    setTaskForm({
      title: t.title,
      project: t.project,
      assignedTo: t.assignedTo || '',
      assignedBy: t.assignedBy || (developers.includes(curName) ? curName : (developers[0] || '')),
      assignedDate: formatDateForInput(t.assignedDate) || formatDateForInput(new Date().toISOString()),
      dueDate: formatDateForInput(t.dueDate) || formatDateForInput(new Date().toISOString()),
      status: t.status || 'Pending',
      priority: t.priority || 'Medium',
      description: t.description || ''
    });
    setShowTaskModal(true);
  };

  const handleSaveTask = (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;

    const matchedProj = projects.find(p => p.name === taskForm.project);
    const projectId = matchedProj ? matchedProj.id : null;

    const payload = {
      projectId: projectId,
      title: taskForm.title,
      description: taskForm.description,
      assignedToName: taskForm.assignedTo,
      assignedByName: taskForm.assignedBy,
      assignedDate: taskForm.assignedDate,
      dueDate: taskForm.dueDate,
      priority: taskForm.priority,
      status: taskForm.status
    };

    if (taskModalMode === 'add') {
      apiCall('/developer/tasks', 'POST', payload)
        .then(() => apiCall('/developer/tasks'))
        .then(res => {
          if (res) setTasks(res.map(t => ({ ...t, completed: t.status === 'Completed' })));
        })
        .catch(err => alert('Error saving task: ' + err.message));
    } else {
      apiCall(`/developer/tasks/${editingTask.id}`, 'PUT', payload)
        .then(() => apiCall('/developer/tasks'))
        .then(res => {
          if (res) setTasks(res.map(t => ({ ...t, completed: t.status === 'Completed' })));
        })
        .catch(err => alert('Error updating task: ' + err.message));
    }
    setShowTaskModal(false);
    setEditingTask(null);
  };

  const handleDeleteTask = (id) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      apiCall(`/developer/tasks/${id}`, 'DELETE')
        .then(() => apiCall('/developer/tasks'))
        .then(res => {
          if (res) setTasks(res.map(t => ({ ...t, completed: t.status === 'Completed' })));
        })
        .catch(err => alert('Error deleting task: ' + err.message));
    }
  };

  return (
    <div className="dev-full-width-panel" style={{ marginTop: '0' }}>
      
      {/* HEADER BAR */}
      <div className="dev-panel-header" style={{ marginBottom: '16px' }}>
        <div className="dev-panel-title">
          <span>💻 Developer Task Board & Assignment</span>
        </div>
        {hasAccess('developer_tasks.create') && (
          <button className="dev-btn dev-btn-primary" onClick={handleOpenAddTask}>
            + Assign Task
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        {/* FILTER BAR */}
        <div style={{
          background: '#ffffff',
          padding: '14px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <div style={{ flex: 1, minWidth: '160px' }}>
            <input
              type="text"
              className="dev-input"
              placeholder="Search task name or details..."
              value={filterSearch}
              onChange={e => setFilterSearch(e.target.value)}
              style={{ width: '100%', padding: '6px 10px' }}
            />
          </div>
          <div style={{ minWidth: '140px' }}>
            <select
              className="dev-select"
              value={filterProject}
              onChange={e => setFilterProject(e.target.value)}
              style={{ width: '100%', padding: '6px' }}
            >
              <option value="">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
          <div style={{ minWidth: '130px' }}>
            <select
              className="dev-select"
              value={filterDeveloper}
              onChange={e => setFilterDeveloper(e.target.value)}
              style={{ width: '100%', padding: '6px' }}
            >
              <option value="">All Developers</option>
              {developers.map((dev, idx) => (
                <option key={idx} value={dev}>{dev}</option>
              ))}
            </select>
          </div>
          <div style={{ minWidth: '130px' }}>
            <select
              className="dev-select"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              style={{ width: '100%', padding: '6px' }}
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Review">Review</option>
            </select>
          </div>
          <div style={{ minWidth: '120px' }}>
            <input
              type="date"
              className="dev-input"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              style={{ width: '100%', padding: '5px' }}
            />
          </div>
          <div>
            <button
              className="dev-btn dev-btn-secondary"
              onClick={() => {
                setFilterSearch('');
                setFilterProject('');
                setFilterDeveloper('');
                setFilterStatus('');
                setFilterDate('');
              }}
              style={{ padding: '6px 12px', margin: 0 }}
            >
              Clear
            </button>
          </div>
        </div>

        {/* TASKS TABLE */}
        <div className="dev-table-wrapper">
          <table className="dev-table" style={{ tableLayout: 'fixed', width: '100%' }}>
            <colgroup>
              <col style={{ width: '110px' }} />
              <col style={{ width: '160px' }} />
              <col style={{ width: '220px' }} />
              <col style={{ width: '260px' }} />
              <col style={{ width: '130px' }} />
              <col style={{ width: '120px' }} />
              <col style={{ width: '80px' }} />
              <col style={{ width: '110px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '80px' }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{ textAlign: 'center' }}>Assigned Date</th>
                <th style={{ textAlign: 'center' }}>Project</th>
                <th style={{ textAlign: 'left' }}>Task Name</th>
                <th style={{ textAlign: 'left' }}>Detail</th>
                <th style={{ textAlign: 'center' }}>Developer Assigned</th>
                <th style={{ textAlign: 'center' }}>Assigned By</th>
                <th style={{ textAlign: 'center' }}>Priority</th>
                <th style={{ textAlign: 'center' }}>Due Date</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map(t => (
                <tr key={t.id}>
                  <td style={{ textAlign: 'center' }}>{formatDevDate(t.assignedDate)}</td>
                  <td style={{ textAlign: 'center' }}><strong style={{ color: '#00a3ff' }}>{t.project}</strong></td>
                  <td style={{ textAlign: 'left', fontWeight: '700', color: '#1a202c', wordBreak: 'break-word' }}>{t.title}</td>
                  <td style={{ textAlign: 'left', fontSize: '0.82rem', color: '#718096', wordBreak: 'break-word' }}>
                    {t.description || '—'}
                    {t.correction && (
                      <div style={{ marginTop: '4px', padding: '4px 6px', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '4px', color: '#c53030' }}>
                        <strong>Correction:</strong> {t.correction}
                      </div>
                    )}
                    {t.feedback && (
                      <div style={{ marginTop: '2px', color: '#9b2c2c', fontStyle: 'italic' }}>
                        Feedback: "{t.feedback}"
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}><strong>👤 {t.assignedTo || 'Unassigned'}</strong></td>
                  <td style={{ textAlign: 'center', fontSize: '0.85rem' }}>{t.assignedBy || ''}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`dev-badge ${t.priority === 'High' ? 'dev-badge-rose' : t.priority === 'Medium' ? 'dev-badge-amber' : 'dev-badge-blue'}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>{formatDevDate(t.dueDate)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`dev-badge ${t.status === 'Completed' ? 'dev-badge-success' : t.status === 'Review' ? 'dev-badge-purple' : t.status === 'In Progress' ? 'dev-badge-blue' : t.status === 'Correction' ? 'dev-badge-rose' : 'dev-badge-amber'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      {hasAccess('developer_tasks.update') && (
                        <button className="dev-btn dev-btn-secondary" style={{ padding: '3px 6px', fontSize: '0.75rem', margin: 0 }} onClick={() => handleOpenEditTask(t)} title="Edit">
                          ✏️
                        </button>
                      )}
                      {hasAccess('developer_tasks.delete') && (
                        <button className="dev-btn dev-btn-secondary" style={{ padding: '3px 6px', fontSize: '0.75rem', margin: 0, color: '#e53e3e' }} onClick={() => handleDeleteTask(t.id)} title="Delete">
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', color: '#a0aec0', padding: '20px' }}>
                    📌 No tasks found matching the filter options.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DEV TASK CREATION/EDIT MODAL */}
      {showTaskModal && (
        <div className="dev-modal-overlay">
          <div className="dev-modal" style={{ maxWidth: '550px' }}>
            <div className="dev-modal-header">
              <h3 className="dev-modal-title">
                {taskModalMode === 'add' ? '➕ Create Developer Task' : '✏️ Edit Developer Task'}
              </h3>
              <button className="dev-modal-close" onClick={() => setShowTaskModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveTask}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="dev-form-group" style={{ margin: 0 }}>
                  <label>Choose Project <span style={{ color: '#e53e3e' }}>*</span></label>
                  <select
                    className="dev-select"
                    value={taskForm.project}
                    onChange={e => setTaskForm({ ...taskForm, project: e.target.value })}
                    required
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="dev-form-group" style={{ margin: 0 }}>
                  <label>Task Name <span style={{ color: '#e53e3e' }}>*</span></label>
                  <input
                    type="text"
                    className="dev-input"
                    placeholder="e.g. Implement PDF OCR Exception handler"
                    value={taskForm.title}
                    onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="dev-form-group" style={{ margin: 0 }}>
                  <label>Assigned Developer <span style={{ color: '#e53e3e' }}>*</span></label>
                  <select
                    className="dev-select"
                    value={taskForm.assignedTo}
                    onChange={e => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                    required
                  >
                    {developers.map((dev, idx) => (
                      <option key={idx} value={dev}>{dev}</option>
                    ))}
                  </select>
                </div>

                <div className="dev-form-group" style={{ margin: 0 }}>
                  <label>Task Status <span style={{ color: '#e53e3e' }}>*</span></label>
                  <select
                    className="dev-select"
                    value={taskForm.status}
                    onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}
                    required
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Review">Review</option>
                    <option value="Correction">Correction</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="dev-form-group" style={{ margin: 0 }}>
                  <label>Assigned Date <span style={{ color: '#e53e3e' }}>*</span></label>
                  <input
                    type="date"
                    className="dev-input"
                    value={taskForm.assignedDate}
                    onChange={e => setTaskForm({ ...taskForm, assignedDate: e.target.value })}
                    required
                  />
                </div>

                <div className="dev-form-group" style={{ margin: 0 }}>
                  <label>Due Date <span style={{ color: '#e53e3e' }}>*</span></label>
                  <input
                    type="date"
                    className="dev-input"
                    value={taskForm.dueDate}
                    onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="dev-form-group" style={{ margin: 0 }}>
                  <label>Assigned By <span style={{ color: '#e53e3e' }}>*</span></label>
                  <select
                    className="dev-select"
                    value={taskForm.assignedBy}
                    onChange={e => setTaskForm({ ...taskForm, assignedBy: e.target.value })}
                    required
                  >
                    {developers.map((dev, idx) => (
                      <option key={idx} value={dev}>{dev}</option>
                    ))}
                  </select>
                </div>

                <div className="dev-form-group" style={{ margin: 0 }}>
                  <label>Task Priority <span style={{ color: '#e53e3e' }}>*</span></label>
                  <select
                    className="dev-select"
                    value={taskForm.priority}
                    onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                    required
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="dev-form-group">
                <label>Task Description</label>
                <textarea
                  className="dev-textarea"
                  placeholder="Provide technical instructions, expected outcomes, or commit rules..."
                  value={taskForm.description}
                  onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                  style={{ minHeight: '80px' }}
                />
              </div>

              <div className="dev-modal-actions">
                <button type="button" className="dev-btn dev-btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="dev-btn dev-btn-primary">
                  {taskModalMode === 'add' ? 'Create Task' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyWorkPage;
