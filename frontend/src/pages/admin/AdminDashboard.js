// src/pages/admin/AdminDashboard.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall, getCurrentUser, getRolePrefix } from '../../utils/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const roles = user?.roles || [];
  const isAdmin = roles.includes('Admin');
  const [checkIns, setCheckIns] = useState([]);
  const [loadingCheckIns, setLoadingCheckIns] = useState(true);
  const [attendanceToday, setAttendanceToday] = useState(null);
  const [checkingInOut, setCheckingInOut] = useState(false);
  const [attendanceError, setAttendanceError] = useState('');
  
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const fetchDashboardStats = async () => {
    try {
      setLoadingStats(true);
      const data = await apiCall('/admin/dashboard/stats');
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err.message);
    } finally {
      setLoadingStats(false);
    }
  };

  const refreshCheckIns = async () => {
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const data = await apiCall(`/attendance/check-ins?date=${todayStr}`);
      setCheckIns(data || []);
    } catch (err) {
      console.error('Failed to fetch check-ins:', err.message);
    } finally {
      setLoadingCheckIns(false);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const data = await apiCall('/attendance/today');
      setAttendanceToday(data);
    } catch (err) {
      console.warn('Failed to load today attendance:', err.message);
    }
  };

  const handleCheckIn = async () => {
    setCheckingInOut(true);
    setAttendanceError('');
    try {
      const data = await apiCall('/attendance/check-in', 'POST');
      setAttendanceToday(data);
      refreshCheckIns();
    } catch (err) {
      setAttendanceError(err.message || 'Check-in failed');
    } finally {
      setCheckingInOut(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckingInOut(true);
    setAttendanceError('');
    try {
      const data = await apiCall('/attendance/check-out', 'POST');
      setAttendanceToday(data);
      refreshCheckIns();
    } catch (err) {
      setAttendanceError(err.message || 'Check-out failed');
    } finally {
      setCheckingInOut(false);
    }
  };

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

  useEffect(() => {
    refreshCheckIns();
    fetchTodayAttendance();
    fetchDashboardStats();
  }, []);

  const handleQuickAction = (action) => {
    const prefix = getRolePrefix(roles);
    if (action === 'addUser') {
      navigate(`/${prefix}/users`, { state: { openAddUser: true } });
    } else if (action === 'addProject') {
      navigate(`/${prefix}/projects`, { state: { openAddProject: true } });
    } else if (action === 'addTask') {
      navigate(`/${prefix}/tasks`, { state: { openAddTask: true } });
    } else if (action === 'viewReports') {
      navigate(`/${prefix}/reports`);
    }
  };

  const statsList = [
    isAdmin && {
      title: 'Total Users',
      value: loadingStats ? '...' : (dashboardData?.totalUsers?.toString() || '—'),
      sub: `${dashboardData?.activeUsers || 0} active`,
      color: '#3182ce'
    },
    isAdmin && {
      title: 'Total Projects',
      value: loadingStats ? '...' : (dashboardData?.totalProjects?.toString() || '—'),
      sub: `${dashboardData?.activeProjects || 0} active`,
      color: '#38a169'
    },
    {
      title: 'Total Tasks',
      value: loadingStats ? '...' : (dashboardData?.totalTasks?.toString() || '—'),
      sub: `${dashboardData?.tasksCompletedToday || 0} completed today`,
      color: '#d69e2e'
    },
    {
      title: 'Total Hours',
      value: loadingStats ? '...' : (dashboardData?.totalHoursLogged?.toString() || '—'),
      sub: `${dashboardData?.activeEmployeesToday || 0} active today`,
      color: '#805ad5'
    },
  ].filter(Boolean);

  return (
    <div className="dashboard-container">

      <div className="dashboard-title-section">
        <span className="dashboard-icon">📊</span>
        <h2 className="dashboard-text">Dashboard</h2>
      </div>

      {/* Check In / Check Out Widget */}
      <div className="emp-checkin-widget" style={{ marginBottom: '24px' }}>
        <div className="emp-checkin-header">
          <span className="emp-checkin-icon">⏱️</span>
          <div className="emp-checkin-title-block">
            <h3>Shift Attendance Tracking</h3>
            <p>Manual Check-In and Check-Out time logs</p>
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
          <div className="emp-checkin-actions">
            {!attendanceToday?.checkInTime ? (
              <button 
                className="checkin-btn btn-checkin" 
                onClick={handleCheckIn}
                disabled={checkingInOut}
              >
                {checkingInOut ? 'Processing...' : '▶ Check In'}
              </button>
            ) : !attendanceToday?.checkOutTime ? (
              <button 
                className="checkin-btn btn-checkout" 
                onClick={handleCheckOut}
                disabled={checkingInOut}
              >
                {checkingInOut ? 'Processing...' : '⏹ Check Out'}
              </button>
            ) : (
              <button className="checkin-btn btn-disabled" disabled>
                ✓ Shift Completed
              </button>
            )}
          </div>
        </div>
        {attendanceError && <p className="checkin-error-msg">⚠️ {attendanceError}</p>}
      </div>

      <div className="stats-grid">
        {statsList.map((stat, idx) => (
          <div
            key={idx}
            className="stat-card"
            style={{ borderTop: `4px solid ${stat.color}` }}
          >
            <p className="stat-title">{stat.title}</p>
            <h3 className="stat-value">{stat.value}</h3>
            <p className="stat-sub">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="dashboard-flex-row">
        <div className="action-card">
          <h4 className="card-label">Quick Actions</h4>
          <div className="action-buttons">
            {isAdmin && (
              <>
                <button className="btn btn-primary" onClick={() => handleQuickAction('addUser')}>+ Add User</button>
                <button className="btn btn-primary" onClick={() => handleQuickAction('addProject')}>+ Add Project</button>
              </>
            )}
            <button className="btn btn-primary" onClick={() => handleQuickAction('addTask')}>+ Add Task</button>
            {isAdmin && (
              <button className="btn btn-outline" onClick={() => handleQuickAction('viewReports')}>View Reports</button>
            )}
          </div>
        </div>

        <div className="checkins-card">
          <h4 className="card-label">Today's Employee Check-ins</h4>
          {loadingCheckIns ? (
            <p className="loading-text">Loading check-in status...</p>
          ) : checkIns.length === 0 ? (
            <p className="no-data-text">No check-in records for today.</p>
          ) : (
            <div className="checkins-table-wrapper">
              <table className="checkins-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Check-In</th>
                    <th>Check-Out</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {checkIns.map((ci) => {
                    const formatTime = (isoStr) => {
                      if (!isoStr) return '—';
                      try {
                        return new Date(isoStr).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                      } catch {
                        return '—';
                      }
                    };
                    
                    let statusLabel = 'Not Present';
                    let statusCls = 'status-absent';
                    if (ci.checkInTime) {
                      if (ci.checkOutTime) {
                        statusLabel = 'Completed';
                        statusCls = 'status-completed';
                      } else {
                        statusLabel = 'Checked In';
                        statusCls = 'status-checkedin';
                      }
                    } else if (ci.status === 'P') {
                      statusLabel = 'Present';
                      statusCls = 'status-present';
                    }

                    return (
                      <tr key={ci.employeeId}>
                        <td className="emp-name">{ci.employeeName}</td>
                        <td className="time-col">{formatTime(ci.checkInTime)}</td>
                        <td className="time-col">{formatTime(ci.checkOutTime)}</td>
                        <td>
                          <span className={`status-badge ${statusCls}`}>{statusLabel}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="welcome-card">
        <h4 className="card-label">Welcome to the Admin Panel</h4>
        <p className="welcome-desc">
          Use the navigation menu to manage users, projects, tasks, view reports,
          and monitor activity logs.
        </p>
        <p className="footer-credit">Powered by Arrow Data-Tech, Puducherry</p>
      </div>

    </div>
  );
};

export default AdminDashboard;