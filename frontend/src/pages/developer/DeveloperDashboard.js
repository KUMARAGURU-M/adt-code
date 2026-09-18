import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser, getRolePrefix, apiCall, API_BASE } from '../../utils/api';
import './DeveloperDashboard.css';
import '../user/EmpDashboard.css';
import ProjectsPage from './ProjectsPage';
import MyWorkPage from './MyWorkPage';
import MeetingsPage from './MeetingsPage';
import LeadCorrectionsPage from './LeadCorrectionsPage';
import AdminReportsPage from './AdminReportsPage';
import DevWorkwise from './DevWorkwise';
import EmpLeave from '../user/EmpLeave';

const augmentProjects = (projectsList, tasksList) => {
  if (!projectsList) return [];
  return projectsList.map(p => {
    const techStack = p.technologies
      ? p.technologies.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const projectTasks = (tasksList || []).filter(t => t.project === p.name);
    const completedTasks = projectTasks.filter(t => t.status === 'Completed' || t.completed);
    const progress = projectTasks.length > 0
      ? Math.round((completedTasks.length / projectTasks.length) * 100)
      : 0;

    // Dynamically calculate assigned members who worked on tasks in this project
    const membersMap = {};
    projectTasks.forEach(t => {
      const name = t.assignedTo || 'Unassigned';
      if (name === 'Unassigned') return;

      if (!membersMap[name]) {
        membersMap[name] = {
          name: name,
          role: t.assignedToRole || 'Employee',
          taskCount: 0,
          completedCount: 0
        };
      }

      membersMap[name].taskCount += 1;
      if (t.completed || t.status === 'Completed') {
        membersMap[name].completedCount += 1;
      }
    });

    let team = Object.values(membersMap).map(m => ({
      name: m.name,
      role: m.role,
      hours: `${m.completedCount}/${m.taskCount} tasks completed`
    }));

    // Fallback if no tasks yet to keep display alive
    if (team.length === 0) {
      team = [
        { name: 'Kumar', role: 'Full Stack Dev', hours: '0/0 tasks completed' },
        { name: 'Alex Rivers', role: 'Team Lead', hours: '0/0 tasks completed' }
      ];
    }

    return {
      ...p,
      client: p.client || 'Internal Product',
      lead: p.lead || 'David Vance (Tech Lead)',
      progress: progress,
      repo: p.repositoryUrl || '',
      techStack: techStack,
      team: team,
      updates: p.updates || [],
      documents: p.documents || []
    };
  });
};

const DeveloperDashboard = ({ hideToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getCurrentUser();
  const isAdmin = user?.roles?.includes('Admin');

  const hasPageAccess = (permCode) => isAdmin || (user?.permissions || []).includes(permCode);

  const formatIsoTime = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      let h = d.getHours();
      const m = String(d.getMinutes()).padStart(2, '0');
      const s = String(d.getSeconds()).padStart(2, '0');
      const ap = h >= 12 ? 'pm' : 'am';
      h = h % 12 || 12;
      return `${String(h).padStart(2, '0')}:${m}:${s} ${ap}`;
    } catch {
      return '—';
    }
  };

  const handleSwitchToAdmin = () => {
    localStorage.setItem('active_persona_mode', 'admin');
    window.dispatchEvent(new Event('persona_change'));
    const prefix = getRolePrefix(user?.roles || []);
    navigate(`/workwise/${prefix}/dashboard`);
  };

  const handleSwitchToDeveloper = () => {
    localStorage.setItem('active_persona_mode', 'developer');
    window.dispatchEvent(new Event('persona_change'));
    const prefix = getRolePrefix(user?.roles || []);
    navigate(`/workwise/${prefix}/developer-dashboard`);
  };

  // Navigation Tabs State
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabPermMap = {
    dashboard: 'developer_dashboard.view',
    projects: 'developer_projects.view',
    mywork: 'developer_tasks.view',
    meetings: 'developer_meetings.view',
    corrections: 'developer_corrections.view',
    admin: 'developer_reports.view',
    workwise: 'developer_workwise.view',
    leave: 'developer_leave.view',
  };

  const targetPerm = tabPermMap[activeTab];
  const isAuthorized = !targetPerm || hasPageAccess(targetPerm);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  // Attendance & Time Tracker State
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0); // working timer
  const [isOvertimeActive, setIsOvertimeActive] = useState(false);
  const [overtimeSeconds, setOvertimeSeconds] = useState(0);
  const [overtimeStartTime, setOvertimeStartTime] = useState(null);
  const [overtimeEndTime, setOvertimeEndTime] = useState(null);

  // Database settings/attendance states
  const [attendanceToday, setAttendanceToday] = useState(null);
  const [publicAnnouncement, setPublicAnnouncement] = useState('');
  const [celebration, setCelebration] = useState({
    isCelebration: false,
    text: '',
    photoUrl: ''
  });
  const [topPerformer, setTopPerformer] = useState({
    enableTopPerformerBanner: true,
    name: '',
    criteria: 'Monthly',
    purpose: '',
    photoUrl: '',
    gifUrl: ''
  });

  // Modals state
  const [showWorkLogModal, setShowWorkLogModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(null);

  // Form States
  const [newWorkLog, setNewWorkLog] = useState({
    project: '',
    task: '',
    hours: '',
    overtime: '',
    summary: ''
  });

  const [newTask, setNewTask] = useState({
    title: '',
    project: 'DigiConvertor Platform',
    priority: 'High',
    dueDate: '2026-07-22'
  });

  // Filter States
  const [taskFilter, setTaskFilter] = useState('All');

  // Timer Effect
  useEffect(() => {
    let interval = null;
    if (isCheckedIn || isOvertimeActive) {
      interval = setInterval(() => {
        if (isCheckedIn) {
          setElapsedSeconds(prev => prev + 1);
        }
        if (isOvertimeActive) {
          setOvertimeSeconds(prev => {
            const next = prev + 1;
            localStorage.setItem('dev_ot_seconds', next.toString());
            return next;
          });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCheckedIn, isOvertimeActive]);
  const loadDeveloperData = useCallback(async () => {
    try {
      const [projList, taskList, corrList, meetList, , attendanceRes, publicSettings, otToday] = await Promise.all([
        apiCall('/developer/projects'),
        apiCall('/developer/tasks'),
        apiCall('/developer/corrections'),
        apiCall('/developer/meetings'),
        apiCall('/developer/overtime'),
        apiCall('/attendance/today').catch(() => null),
        apiCall('/settings/public').catch(() => null),
        apiCall('/developer/overtime/today').catch(() => null)
      ]);
      const mappedTasks = taskList ? taskList.map(t => ({ ...t, completed: t.status === 'Completed' })) : [];
      if (projList) setProjects(augmentProjects(projList, mappedTasks));
      setTasks(mappedTasks);
      if (corrList) setCorrections(corrList);
      if (meetList) setMeetings(meetList);

      // Sync attendance
      if (attendanceRes) {
        setAttendanceToday(attendanceRes);
        if (attendanceRes.checkInTime) {
          setIsCheckedIn(true);
          const checkInDate = new Date(attendanceRes.checkInTime);
          setCheckInTime(checkInDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          if (!attendanceRes.checkOutTime) {
            const now = new Date();
            const diffMs = now - checkInDate;
            setElapsedSeconds(Math.max(0, Math.floor(diffMs / 1000)));
          } else {
            setIsCheckedIn(false);
            const checkOutDate = new Date(attendanceRes.checkOutTime);
            const diffMs = checkOutDate - checkInDate;
            setElapsedSeconds(Math.max(0, Math.floor(diffMs / 1000)));
          }
        } else {
          setIsCheckedIn(false);
          setCheckInTime('--:--');
          setElapsedSeconds(0);
        }
      }

      // Sync overtime
      if (otToday) {
        if (!otToday.endTime) {
          setIsOvertimeActive(true);
          setOvertimeStartTime(otToday.startTime);
          setOvertimeEndTime(null);
          if (otToday.createdAt) {
            const startCheckIn = new Date(otToday.createdAt);
            const now = new Date();
            const diffMs = now - startCheckIn;
            setOvertimeSeconds(Math.max(0, Math.floor(diffMs / 1000)));
          } else {
            setOvertimeSeconds(0);
          }
        } else {
          setIsOvertimeActive(false);
          setOvertimeStartTime(otToday.startTime);
          setOvertimeEndTime(otToday.endTime);
          setOvertimeSeconds(0);
        }
      } else {
        setIsOvertimeActive(false);
        setOvertimeStartTime(null);
        setOvertimeEndTime(null);
        setOvertimeSeconds(0);
      }

      // Sync public announcement & celebration settings
      if (publicSettings) {
        if (publicSettings.announcement) {
          setPublicAnnouncement(publicSettings.announcement);
        }
        setCelebration({
          isCelebration: publicSettings.isCelebration || false,
          text: publicSettings.celebrationText || '',
          photoUrl: publicSettings.celebrationPhotoUrl || '',
        });
        setTopPerformer({
          enableTopPerformerBanner: publicSettings.enableTopPerformerBanner ?? true,
          name: publicSettings.topPerformerName || '',
          criteria: publicSettings.topPerformerCriteria || 'Monthly',
          purpose: publicSettings.topPerformerPurpose || '',
          photoUrl: publicSettings.topPerformerPhotoUrl || '',
          gifUrl: publicSettings.topPerformerGifUrl || ''
        });
      }
    } catch (e) {
      console.warn('Failed to load developer data from backend:', e);
    }
  }, []);

  useEffect(() => {
    loadDeveloperData();
  }, [loadDeveloperData]);

  // Format Helper for Seconds -> HH:MM:SS
  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  };

  // Projects, Tasks, Meetings, Corrections and WorkLogs states initialized to empty arrays
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [workLogs, setWorkLogs] = useState([]);



  // Handlers
  const handleCheckInOutToggle = async () => {
    try {
      if (isCheckedIn) {
        const confirmCheckOut = window.confirm("Are you sure you want to Check-Out?");
        if (!confirmCheckOut) return;

        const data = await apiCall('/attendance/check-out', 'POST');
        setAttendanceToday(data);
        setIsCheckedIn(false);
        setTaskFilter('All'); // restore all tasks after check-out
      } else {
        const data = await apiCall('/attendance/check-in', 'POST');
        setAttendanceToday(data);
        setIsCheckedIn(true);
        const checkInDate = new Date(data.checkInTime);
        setCheckInTime(checkInDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setElapsedSeconds(0);
        setTaskFilter('Pending'); // auto-switch to pending on check-in
      }
    } catch (err) {
      alert('Attendance operation failed: ' + err.message);
    }
  };
  const handleOvertimeToggle = async () => {
    try {
      if (isOvertimeActive) {
        const confirmCheckOut = window.confirm("Are you sure you want to End Overtime?");
        if (!confirmCheckOut) return;

        const data = await apiCall('/developer/overtime/check-out', 'POST');
        setOvertimeEndTime(data.endTime);
        setIsOvertimeActive(false);
        setOvertimeSeconds(0);

        // Refresh overtime list
        const otList = await apiCall('/developer/overtime');
        if (otList) setWorkLogs(otList);

        alert(`Overtime logged successfully: ${data.overtimeHours} hours.`);
      } else {
        const data = await apiCall('/developer/overtime/check-in', 'POST');
        setOvertimeStartTime(data.startTime);
        setOvertimeEndTime(null);
        setIsOvertimeActive(true);
        setOvertimeSeconds(0);
      }
    } catch (err) {
      alert('Overtime operation failed: ' + err.message);
    }
  };

  const handleTaskToggle = (id) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        const nextCompleted = !t.completed;
        return {
          ...t,
          completed: nextCompleted,
          status: nextCompleted ? 'Completed' : 'In Progress',
          completedDate: nextCompleted ? new Date().toISOString().split('T')[0] : null
        };
      }
      return t;
    }));
  };

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    const item = {
      id: Date.now(),
      title: newTask.title,
      project: newTask.project,
      priority: newTask.priority,
      dueDate: newTask.dueDate,
      status: 'Assigned',
      completed: false
    };
    setTasks([item, ...tasks]);
    setNewTask({ title: '', project: 'DigiConvertor Platform', priority: 'High', dueDate: '2026-07-22' });
    setShowAddTaskModal(false);
  };

  const handleSaveWorkLog = (e) => {
    e.preventDefault();
    const item = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      project: newWorkLog.project,
      task: newWorkLog.task,
      hours: newWorkLog.hours,
      overtime: newWorkLog.overtime,
      summary: newWorkLog.summary
    };
    setWorkLogs([item, ...workLogs]);
    setShowWorkLogModal(false);
  };

  // Filtered Tasks — only assigned to current user; always show only Pending/Assigned tasks
  const currentUserName = user?.fullName || user?.userCode || '';
  const filteredTasks = tasks.filter(t => {
    // Only show tasks assigned to the current logged-in developer
    const isAssigned = !currentUserName || (t.assignedTo || '').toLowerCase() === currentUserName.toLowerCase();
    if (!isAssigned) return false;

    // Always show only Pending / Assigned tasks in dashboard
    const status = (t.status || '').toLowerCase();
    const isPending = status === 'pending' || status === 'assigned' || status === '';
    if (!isPending) return false;

    // Apply pill filter on top
    if (taskFilter === 'Due Today') {
      const today = new Date().toISOString().split('T')[0];
      return t.dueDate && (t.dueDate === today || t.dueDate.includes('Today'));
    }
    if (taskFilter === 'High Priority') return t.priority === 'High';
    if (taskFilter === 'Pending') return status === 'pending' || status === 'assigned';
    return true;
  });

  if (!isAuthorized) {
    return (
      <div style={{ padding: '60px 20px', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Poppins', sans-serif" }}>
        <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center', background: 'white', padding: '32px 24px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <h3 style={{ margin: '0 0 12px', fontSize: '1.4rem', fontWeight: '700', color: '#1a202c' }}>Access Denied</h3>
          <p style={{ margin: '0 0 24px', color: '#718096', lineHeight: '1.6', fontSize: '0.92rem' }}>
            You do not have permission to access the requested tab.
          </p>
          <button
            onClick={() => navigate(-1)}
            style={{ padding: '12px 24px', background: '#edf2f7', color: '#4a5568', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dev-dashboard-container">

      {/* ── TAB 1: MAIN DASHBOARD VIEW ── */}
      {activeTab === 'dashboard' && (
        <>
          {/* Dashboard Persona View Switcher */}
          {isAdmin && !hideToggle && (
            <div className="dashboard-persona-toggle-bar" style={{ marginBottom: '20px' }}>
              <button
                className="persona-toggle-btn"
                onClick={handleSwitchToAdmin}
              >
                📊 Admin & Operations Dashboard
              </button>
              <button
                className="persona-toggle-btn active"
                onClick={handleSwitchToDeveloper}
              >
                💻 Developer Dashboard
              </button>
            </div>
          )}

          {/* ── TODAY'S STATUS & ATTENDANCE TRACKER ── */}
          <div className="emp-checkin-widget" style={{ marginBottom: '24px' }}>
            <div className="emp-checkin-header">
              <span className="emp-checkin-icon">⏱️</span>
              <div className="emp-checkin-title-block">
                <h3>Shift Attendance & Overtime Tracker</h3>
                <p>Manual Check-In/Out and Developer Overtime logging</p>
              </div>
            </div>

            <div className="emp-checkin-status-row">
              <div className="emp-checkin-time-box">
                <span className="time-box-label">Check-In Time</span>
                <span className="time-box-val checkin">
                  {formatIsoTime(attendanceToday?.checkInTime)}
                </span>
              </div>

              <div className="emp-checkin-time-box">
                <span className="time-box-label">Check-Out Time</span>
                <span className="time-box-val checkout">
                  {formatIsoTime(attendanceToday?.checkOutTime)}
                </span>
              </div>

              <div className="emp-checkin-time-box">
                <span className="time-box-label">Working Hours</span>
                <span className="time-box-val" style={{ fontSize: '1.25rem', fontFamily: 'monospace', color: '#2d3748' }}>
                  {formatTime(elapsedSeconds)}
                </span>
              </div>

              {overtimeStartTime && (
                <div className="emp-checkin-time-box">
                  <span className="time-box-label">Overtime Start</span>
                  <span className="time-box-val checkin" style={{ fontSize: '1rem', color: '#805ad5', fontWeight: 'bold' }}>
                    {overtimeStartTime}
                  </span>
                </div>
              )}

              {overtimeEndTime && (
                <div className="emp-checkin-time-box">
                  <span className="time-box-label">Overtime End</span>
                  <span className="time-box-val checkout" style={{ fontSize: '1rem', color: '#e53e3e', fontWeight: 'bold' }}>
                    {overtimeEndTime}
                  </span>
                </div>
              )}

              {isOvertimeActive && (
                <div className="emp-checkin-time-box">
                  <span className="time-box-label">Overtime Duration</span>
                  <span className="time-box-val checkout" style={{ fontSize: '1.25rem', fontFamily: 'monospace' }}>
                    ⚡ {formatTime(overtimeSeconds)}
                  </span>
                </div>
              )}

              <div className="emp-checkin-actions" style={{ display: 'flex', gap: '0.75rem' }}>
                {!!attendanceToday?.checkOutTime && (
                  <button
                    className={`checkin-btn ${isOvertimeActive ? 'btn-checkout' : 'btn-checkin'}`}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                    onClick={handleOvertimeToggle}
                  >
                    {isOvertimeActive ? '⏹ End Overtime' : '⚡ Start Overtime'}
                  </button>
                )}
                {!attendanceToday?.checkInTime ? (
                  <button
                    className="checkin-btn btn-checkin"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                    onClick={handleCheckInOutToggle}
                  >
                    ▶ Check In
                  </button>
                ) : !attendanceToday?.checkOutTime ? (
                  <button
                    className="checkin-btn btn-checkout"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                    onClick={handleCheckInOutToggle}
                  >
                    ⏹ Check Out
                  </button>
                ) : (
                  <button className="checkin-btn btn-disabled" disabled style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                    ✓ Shift Completed
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* CELEBRATION & ANNOUNCEMENTS ROW (LIKE ADMIN DASHBOARD) */}
          <div className="dashboard-flex-row">
            {topPerformer.enableTopPerformerBanner && topPerformer.name && (
              <div className="top-performer-card">
                <div className="top-performer-header">
                  <div className="top-performer-tag">
                    <span className="trophy-icon">🏆</span>
                    <span>Top Performer — {topPerformer.criteria || 'Monthly'}</span>
                  </div>
                  {topPerformer.gifUrl && (
                    <img
                      src={topPerformer.gifUrl.startsWith('http') ? topPerformer.gifUrl : `https://media.giphy.com/media/26tOZbfHHHJB92VU4/giphy.gif`}
                      alt="Celebration GIF"
                      className="top-performer-gif"
                    />
                  )}
                </div>

                <div className="top-performer-body">
                  <div className="top-performer-avatar-wrapper">
                    <img
                      src={topPerformer.photoUrl ? (topPerformer.photoUrl.startsWith('http') ? topPerformer.photoUrl : `${API_BASE}${topPerformer.photoUrl.split('#')[0]}`) : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}
                      alt={topPerformer.name}
                      className="top-performer-avatar"
                      onClick={() => {
                        if (topPerformer.photoUrl) {
                          const cleanUrl = topPerformer.photoUrl.split('#')[0];
                          window.open(cleanUrl.startsWith('http') ? cleanUrl : `${API_BASE}${cleanUrl}`, '_blank');
                        }
                      }}
                    />
                    <span className="star-badge">⭐</span>
                  </div>

                  <div className="top-performer-info">
                    <h4 className="top-performer-name">{topPerformer.name}</h4>
                    {topPerformer.purpose && (
                      <p className="top-performer-purpose">{topPerformer.purpose}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {celebration.isCelebration && (
              <div className="celebration-card">
                <h4 className="card-label">🎉 Celebration</h4>
                <div className="celebration-content-wrapper">
                  <div className="celebration-content">
                    {celebration.photoUrl && (() => {
                      const rawUrl = celebration.photoUrl || '';
                      const hash = rawUrl.split('#')[1] || '';
                      const hashParts = hash.split(':');
                      const fitMode = hashParts[0] === 'cover' ? 'cover' : 'contain';
                      const zoom = (() => {
                        const z = parseFloat(hashParts[1]);
                        return (!isNaN(z) && z >= 100 && z <= 300) ? z / 100 : 1;
                      })();
                      const cleanUrl = rawUrl.split('#')[0];
                      return (
                        <div
                          className="celebration-photo-container"
                          title="Click to view full screen"
                          style={{ overflow: 'hidden' }}
                        >
                          <img
                            src={`${API_BASE}${cleanUrl}`}
                            alt="Celebration"
                            className="celebration-img"
                            style={{
                              objectFit: fitMode,
                              width: fitMode === 'cover' ? '100%' : 'auto',
                              height: '180px',
                              transform: `scale(${zoom})`,
                              transformOrigin: 'center center',
                              transition: 'transform 0.2s ease',
                              cursor: 'pointer'
                            }}
                            onClick={() => window.open(`${API_BASE}${cleanUrl}`, '_blank')}
                          />
                          <div className="celebration-photo-overlay" onClick={() => window.open(`${API_BASE}${cleanUrl}`, '_blank')}>
                            <span className="celebration-zoom-icon">🔍</span>
                          </div>
                        </div>
                      );
                    })()}
                    {celebration.text && (
                      <div className="celebration-text-box">
                        {celebration.text}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="announcement-card">
              <h4 className="card-label">📢 Announcement</h4>
              <div className="announcement-content-wrapper">
                <div className="announcement-content" style={{
                  fontSize: '0.9rem',
                  color: '#2d3748',
                  lineHeight: '1.6',
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)',
                  padding: '16px 20px',
                  borderRadius: '10px',
                  borderLeft: '4px solid #00a3ff',
                  whiteSpace: 'pre-wrap',
                  minHeight: '100%',
                  boxSizing: 'border-box',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {publicAnnouncement || "Welcome to the production portal! No new announcements today. Have a productive shift! 😊"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MY TASKS BOX */}
          <div className="dev-panel" style={{ marginBottom: '24px' }}>
            <div className="dev-panel-header">
              <div className="dev-panel-title">
                <span>✅ My Tasks</span>
                <span className="dev-badge dev-badge-blue">{filteredTasks.length} Items</span>
              </div>
              <div className="dev-panel-actions">
                <button className="dev-btn dev-btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }} onClick={() => setActiveTab('mywork')}>
                  + Manage Tasks
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="dev-filter-pills">
              {['All', 'Pending', 'Due Today', 'High Priority'].map(f => (
                <button
                  key={f}
                  className={`dev-pill ${taskFilter === f ? 'active' : ''}`}
                  onClick={() => setTaskFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Task List */}
            <div className="dev-task-list" style={{ maxHeight: '350px', overflowY: 'auto' }}>
              {filteredTasks.length === 0 ? (
                <div style={{ color: 'var(--dev-text-muted)', textAlign: 'center', padding: '2rem' }}>
                  {isCheckedIn
                    ? '✅ No pending tasks! All tasks are in progress or completed.'
                    : `No tasks found under filter "${taskFilter}".`}
                </div>
              ) : (
                filteredTasks.map(t => (
                  <div key={t.id} className={`dev-task-item ${t.completed ? 'completed' : ''}`}>
                    <div className="dev-task-row">
                      <div className="dev-task-left">
                        <button
                          className={`dev-checkbox ${t.completed ? 'checked' : ''}`}
                          onClick={() => handleTaskToggle(t.id)}
                          title="Toggle Completed"
                        >
                          {t.completed && '✓'}
                        </button>
                        <div>
                          <h4 className="dev-task-title">{t.title}</h4>
                          <div className="dev-task-meta" style={{ marginTop: '0.3rem' }}>
                            <span className="dev-task-project">🏷️ {t.project}</span>
                            <span>•</span>
                            <span>📅 {t.dueDate}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <span className={`dev-badge ${t.priority === 'High' ? 'dev-badge-rose' : t.priority === 'Medium' ? 'dev-badge-amber' : 'dev-badge-blue'}`}>
                          {t.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* ── TAB 2: PROJECTS VIEW ── */}
      {activeTab === 'projects' && (
        <ProjectsPage
          projects={projects}
          setProjects={setProjects}
          tasks={tasks}
          setTasks={setTasks}
        />
      )}

      {/* ── TAB 3: MY WORK VIEW ── */}
      {activeTab === 'mywork' && (
        <MyWorkPage
          tasks={tasks}
          setTasks={setTasks}
          projects={projects}
        />
      )}

      {/* ── TAB 4: MEETINGS VIEW ── */}
      {activeTab === 'meetings' && (
        <MeetingsPage
          meetings={meetings}
          setMeetings={setMeetings}
          projects={projects}
        />
      )}

      {/* ── TAB 5: LEAD CORRECTIONS VIEW ── */}
      {activeTab === 'corrections' && (
        <LeadCorrectionsPage
          corrections={corrections}
          setCorrections={setCorrections}
          tasks={tasks}
          setTasks={setTasks}
          projects={projects}
        />
      )}

      {/* ── TAB 6: ADMIN & REPORTS VIEW ── */}
      {activeTab === 'admin' && <AdminReportsPage />}

      {/* ── TAB 7: DEV WORKWISE WORKSPACE ── */}
      {activeTab === 'workwise' && (
        <DevWorkwise
          tasks={tasks}
          setTasks={setTasks}
          isCheckedIn={isCheckedIn}
          checkInTime={checkInTime}
          isOvertimeActive={isOvertimeActive}
          attendanceToday={attendanceToday}
        />
      )}

      {/* ── TAB 8: LEAVE MANAGEMENT ── */}
      {activeTab === 'leave' && <EmpLeave />}

      {/* ── MODALS ── */}

      {/* 1. WORK LOG MODAL */}
      {showWorkLogModal && (
        <div className="dev-modal-overlay">
          <div className="dev-modal">
            <div className="dev-modal-header">
              <h3 className="dev-modal-title">⏱ Log Daily Hours</h3>
              <button className="dev-modal-close" onClick={() => setShowWorkLogModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveWorkLog}>
              <div className="dev-form-group">
                <label>Project</label>
                <input
                  type="text"
                  className="dev-input"
                  value={newWorkLog.project}
                  onChange={e => setNewWorkLog({ ...newWorkLog, project: e.target.value })}
                  required
                />
              </div>
              <div className="dev-form-group">
                <label>Task Title</label>
                <input
                  type="text"
                  className="dev-input"
                  value={newWorkLog.task}
                  onChange={e => setNewWorkLog({ ...newWorkLog, task: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="dev-form-group">
                  <label>Hours Worked</label>
                  <input
                    type="number"
                    step="0.25"
                    className="dev-input"
                    value={newWorkLog.hours}
                    onChange={e => setNewWorkLog({ ...newWorkLog, hours: e.target.value })}
                    required
                  />
                </div>
                <div className="dev-form-group">
                  <label>Overtime (Hours)</label>
                  <input
                    type="number"
                    step="0.25"
                    className="dev-input"
                    value={newWorkLog.overtime}
                    onChange={e => setNewWorkLog({ ...newWorkLog, overtime: e.target.value })}
                  />
                </div>
              </div>
              <div className="dev-form-group">
                <label>Work Summary / Accomplishments</label>
                <textarea
                  className="dev-textarea"
                  value={newWorkLog.summary}
                  onChange={e => setNewWorkLog({ ...newWorkLog, summary: e.target.value })}
                  required
                />
              </div>
              <div className="dev-modal-actions">
                <button type="button" className="dev-btn dev-btn-secondary" onClick={() => setShowWorkLogModal(false)}>Cancel</button>
                <button type="submit" className="dev-btn dev-btn-primary">Save Work Log</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. ADD TASK MODAL */}
      {showAddTaskModal && (
        <div className="dev-modal-overlay">
          <div className="dev-modal">
            <div className="dev-modal-header">
              <h3 className="dev-modal-title">+ Add Developer Task</h3>
              <button className="dev-modal-close" onClick={() => setShowAddTaskModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="dev-form-group">
                <label>Task Title</label>
                <input
                  type="text"
                  className="dev-input"
                  placeholder="e.g. Implement API rate limiter"
                  value={newTask.title}
                  onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                  required
                />
              </div>
              <div className="dev-form-group">
                <label>Project</label>
                <select
                  className="dev-select"
                  value={newTask.project}
                  onChange={e => setNewTask({ ...newTask, project: e.target.value })}
                >
                  <option value="DigiConvertor Platform">DigiConvertor Platform</option>
                  <option value="Data Ingestion Suite">Data Ingestion Suite</option>
                  <option value="Analytics Engine">Analytics Engine</option>
                  <option value="Security Core">Security Core</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="dev-form-group">
                  <label>Priority</label>
                  <select
                    className="dev-select"
                    value={newTask.priority}
                    onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div className="dev-form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    className="dev-input"
                    value={newTask.dueDate}
                    onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="dev-modal-actions">
                <button type="button" className="dev-btn dev-btn-secondary" onClick={() => setShowAddTaskModal(false)}>Cancel</button>
                <button type="submit" className="dev-btn dev-btn-primary">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* 5. MEETING DETAILS MODAL */}
      {showMeetingModal && (
        <div className="dev-modal-overlay">
          <div className="dev-modal">
            <div className="dev-modal-header">
              <h3 className="dev-modal-title">📅 Meeting Details & Agenda</h3>
              <button className="dev-modal-close" onClick={() => setShowMeetingModal(null)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <h4 style={{ margin: 0, color: 'var(--dev-accent-cyan)' }}>{showMeetingModal.title}</h4>
                <span className="dev-badge dev-badge-blue" style={{ marginTop: '0.4rem' }}>🕒 {showMeetingModal.time}</span>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--dev-text-muted)' }}>Project Context:</label>
                <div style={{ fontWeight: '600' }}>{showMeetingModal.project}</div>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--dev-text-muted)' }}>Discussion Agenda:</label>
                <p style={{ margin: '0.3rem 0', color: 'var(--dev-text-secondary)' }}>{showMeetingModal.agenda}</p>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--dev-text-muted)' }}>Action Items:</label>
                <ul style={{ margin: '0.3rem 0 0 1.2rem', color: 'var(--dev-text-primary)', fontSize: '0.85rem' }}>
                  {showMeetingModal.actionItems.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="dev-modal-actions">
              <button className="dev-btn dev-btn-secondary" onClick={() => setShowMeetingModal(null)}>Close</button>
              <button className="dev-btn dev-btn-primary" onClick={() => { alert('Joining meeting video call...'); setShowMeetingModal(null); }}>
                🎥 Join Video Call
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DeveloperDashboard;
