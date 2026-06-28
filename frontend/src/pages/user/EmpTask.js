import React, { useState, useEffect } from 'react';
import './EmpTask.css';
import { apiCall, getCurrentUser } from '../../utils/api';


const normalizeStatus = (status) => {
  const lower = status?.toLowerCase() || '';
  if (['finish', 'completed', 'uploaded'].includes(lower)) return 'completed';
  if (['wip', 'inprogress', 'in progress', 'running', 'on break', 'hold', 'query', 'rtu'].includes(lower)) return 'in_progress';
  if (['yts', 'pending'].includes(lower)) return 'pending';
  if (lower === 'archived') return 'archived';
  return 'pending';
};

const formatJob = (jobs) => {
  if (!jobs || jobs.length === 0) return '-';
  return jobs.map(j => {
    let label = j.jobIdCode || '';
    if (j.xmlIsbn) {
      label += ` (ISBN: ${j.xmlIsbn})`;
    }
    return label || '-';
  }).join(', ');
};

const EmpTask = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dropdown list options derived from loaded tasks
  const [projectsList, setProjectsList] = useState([]);
  const [jobsList, setJobsList] = useState([]);
  const [processesList, setProcessesList] = useState([]);

  // Filters state
  const [filterProject, setFilterProject] = useState('All Projects');
  const [filterJob, setFilterJob] = useState('All Jobs');
  const [filterProcess, setFilterProcess] = useState('All Processes');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [dueDateFrom, setDueDateFrom] = useState('');
  const [dueDateTo, setDueDateTo] = useState('');

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError('');
        const user = getCurrentUser();
        if (!user) {
          throw new Error('User info not found. Please log in.');
        }
        const userId = user.userId;
        if (!userId) {
          throw new Error('User ID not found. Please log in.');
        }

        const data = await apiCall(`/tasks/my-tasks?userId=${userId}`);
        const loadedTasks = data || [];
        setTasks(loadedTasks);

        // Derive projects
        const projs = ['All Projects'];
        const jobs = ['All Jobs'];
        const procs = ['All Processes'];

        loadedTasks.forEach(t => {
          if (t.projectName && !projs.includes(t.projectName)) {
            projs.push(t.projectName);
          }
          if (t.processName && !procs.includes(t.processName)) {
            procs.push(t.processName);
          }
          if (t.jobs && t.jobs.length > 0) {
            t.jobs.forEach(j => {
              const lbl = j.xmlIsbn ? `${j.jobIdCode} (ISBN: ${j.xmlIsbn})` : j.jobIdCode;
              if (lbl && !jobs.includes(lbl)) {
                jobs.push(lbl);
              }
            });
          }
        });

        setProjectsList(projs);
        setJobsList(jobs);
        setProcessesList(procs);
      } catch (err) {
        setError(err.message || 'Failed to load tasks.');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Filter tasks in memory
  const getFilteredTasks = () => {
    return tasks.filter(task => {
      // Project filter
      if (filterProject !== 'All Projects' && task.projectName !== filterProject) {
        return false;
      }
      // Process filter
      if (filterProcess !== 'All Processes' && task.processName !== filterProcess) {
        return false;
      }
      // Job/ISBN filter
      if (filterJob !== 'All Jobs') {
        const hasJob = task.jobs && task.jobs.some(j => {
          const lbl = j.xmlIsbn ? `${j.jobIdCode} (ISBN: ${j.xmlIsbn})` : j.jobIdCode;
          return lbl === filterJob;
        });
        if (!hasJob) return false;
      }
      // Status filter
      if (filterStatus !== 'All Status') {
        const norm = normalizeStatus(task.status);
        if (filterStatus === 'Pending' && norm !== 'pending') return false;
        if (filterStatus === 'In Progress' && norm !== 'in_progress') return false;
        if (filterStatus === 'Completed' && norm !== 'completed') return false;
        if (filterStatus === 'Archived' && norm !== 'archived') return false;
      }
      // Due Date From filter
      if (dueDateFrom && task.dueDate) {
        if (new Date(task.dueDate) < new Date(dueDateFrom)) {
          return false;
        }
      }
      // Due Date To filter
      if (dueDateTo && task.dueDate) {
        if (new Date(task.dueDate) > new Date(dueDateTo)) {
          return false;
        }
      }
      return true;
    });
  };

  const filteredTasks = getFilteredTasks();

  return (
    <div className="et-page">
      
      {/* HEADER SECTION */}
      <div className="et-header">
        <h1 className="et-title">My Tasks</h1>
        <p className="et-subtitle">View all tasks assigned to you with details</p>
      </div>

      {/* FILTER CARD */}
      <div className="et-card et-filters-card">
        <div className="et-filter-group">
          <label className="et-filter-label">Project</label>
          <div className="et-select-wrapper">
            <select 
              className="et-select"
              value={filterProject}
              onChange={e => setFilterProject(e.target.value)}
            >
              {projectsList.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <span className="et-select-arrow">▾</span>
          </div>
        </div>

        <div className="et-filter-group">
          <label className="et-filter-label">Job/ISBN</label>
          <div className="et-select-wrapper">
            <select 
              className="et-select"
              value={filterJob}
              onChange={e => setFilterJob(e.target.value)}
            >
              {jobsList.map(j => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>
            <span className="et-select-arrow">▾</span>
          </div>
        </div>

        <div className="et-filter-group">
          <label className="et-filter-label">Process</label>
          <div className="et-select-wrapper">
            <select 
              className="et-select"
              value={filterProcess}
              onChange={e => setFilterProcess(e.target.value)}
            >
              {processesList.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <span className="et-select-arrow">▾</span>
          </div>
        </div>

        <div className="et-filter-group">
          <label className="et-filter-label">Status</label>
          <div className="et-select-wrapper">
            <select 
              className="et-select"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option>All Status</option>
              <option>Pending</option>
              <option>In Progress</option>
              <option>Completed</option>
              <option>Archived</option>
            </select>
            <span className="et-select-arrow">▾</span>
          </div>
        </div>

        <div className="et-filter-group">
          <label className="et-filter-label">Due Date From</label>
          <input 
            type="date" 
            className="et-input-date" 
            value={dueDateFrom}
            onChange={e => setDueDateFrom(e.target.value)}
          />
        </div>

        <div className="et-filter-group">
          <label className="et-filter-label">Due Date To</label>
          <input 
            type="date" 
            className="et-input-date" 
            value={dueDateTo}
            onChange={e => setDueDateTo(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE CARD */}
      <div className="et-card et-table-card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            Loading tasks...
          </div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
            {error}
          </div>
        ) : (
          <div className="et-table-container">
            <table className="et-table">
              <thead>
                <tr>
                  <th>Task Title</th>
                  <th>Project</th>
                  <th>Job/ISBN</th>
                  <th>Process</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Pages</th>
                  <th>Chapter</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '40px', color: '#666' }}>
                      No tasks found.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => {
                    const norm = normalizeStatus(task.status);
                    return (
                      <tr key={task.id}>
                        <td className="et-td-title">{task.taskTitle || '-'}</td>
                        <td>{task.projectName || '-'}</td>
                        <td className="et-td-job">{formatJob(task.jobs)}</td>
                        <td className="et-td-process">{task.processName || '-'}</td>
                        <td>
                          <span className={`et-status-badge status-${norm}`}>
                            {norm.replace('_', ' ')}
                          </span>
                        </td>
                        <td>{task.dueDate || '-'}</td>
                        <td>{task.assignedPages || '-'}</td>
                        <td className="et-td-chapter">{task.chapterArticleBatch || '-'}</td>
                        <td>{task.description || '-'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default EmpTask;
