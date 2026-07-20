// src/pages/admin/AdminDashboard.js

import React, { useState, useEffect } from 'react';
import { apiCall, getCurrentUser, API_BASE } from '../../utils/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
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
  const [announcement, setAnnouncement] = useState('');
  const [celebration, setCelebration] = useState({ isCelebration: false, text: '', photoUrl: '' });

  // Lightbox States
  const [lightboxImg, setLightboxImg] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  const openLightbox = (url) => {
    setLightboxImg(url);
    setZoomLevel(1);
    setRotation(0);
  };

  const closeLightbox = () => {
    setLightboxImg(null);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeLightbox();
      }
    };
    if (lightboxImg) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightboxImg]);

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
    const confirmCheckOut = window.confirm("Are you sure you want to Check-Out?");
    if (!confirmCheckOut) return;
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

  const handleAdminRecheckIn = async (employeeUserId, employeeName) => {
    if (!employeeUserId) return;
    const confirmAction = window.confirm(`Are you sure you want to Re-Check In ${employeeName}? This will reset their check-out time so they can check out again later.`);
    if (!confirmAction) return;

    try {
      await apiCall(`/attendance/admin/recheck-in/${employeeUserId}`, 'POST');
      refreshCheckIns();
      if (employeeUserId === user?.userId) {
        fetchTodayAttendance();
      }
      alert(`Success: ${employeeName} has been re-checked in.`);
    } catch (err) {
      alert(`Failed to re-check in employee: ${err.message}`);
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

  const fetchAnnouncement = async () => {
    try {
      const data = await apiCall('/settings/public');
      if (data) {
        if (data.announcement) {
          setAnnouncement(data.announcement);
        }
        setCelebration({
          isCelebration: data.isCelebration || false,
          text: data.celebrationText || '',
          photoUrl: data.celebrationPhotoUrl || '',
        });
      }
    } catch (err) {
      console.warn('Failed to fetch public settings/announcement:', err.message);
    }
  };

  useEffect(() => {
    refreshCheckIns();
    fetchTodayAttendance();
    fetchDashboardStats();
    fetchAnnouncement();
  }, []);


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
                          transition: 'transform 0.2s ease'
                        }}
                        onClick={() => openLightbox(`${API_BASE}${cleanUrl}`)}
                      />
                      <div className="celebration-photo-overlay" onClick={() => openLightbox(`${API_BASE}${cleanUrl}`)}>
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
              minHeight: '100px',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {announcement || "Welcome to the production portal! No new announcements today. Have a productive shift! 😊"}
              </div>
            </div>
          </div>
        </div>

        {isAdmin && (
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
                      <th>Actions</th>
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
                          <td className="actions-col">
                            {ci.checkInTime && ci.checkOutTime ? (
                              <button
                                className="recheckin-btn"
                                onClick={() => handleAdminRecheckIn(ci.userId, ci.employeeName)}
                                title="Re-Check In (Reset Check-out)"
                              >
                                🔄 Re-Check In
                              </button>
                            ) : (
                              <span className="no-actions">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="welcome-card">
        <h4 className="card-label">Welcome to the Admin Panel</h4>
        <p className="welcome-desc">
          Use the navigation menu to manage users, projects, tasks, view reports,
          and monitor activity logs.
        </p>
        <p className="footer-credit">Powered by Arrow Data-Tech, Puducherry</p>
      </div>

      {/* Lightbox Modal Overlay */}
      {lightboxImg && (
        <div className="celebration-lightbox" onClick={closeLightbox}>
          <button className="lightbox-close-btn" onClick={closeLightbox} title="Close (Esc)">
            ✕
          </button>

          <div className="lightbox-content-box" onClick={(e) => e.stopPropagation()}>
            <div
              className="lightbox-img-wrapper"
              style={{
                transform: `scale(${zoomLevel}) rotate(${rotation}deg)`
              }}
            >
              <img
                src={lightboxImg}
                alt="Celebration Enlarged"
                className="lightbox-img-element"
              />
            </div>
          </div>
          {/* Controls Panel */}
          <div className="lightbox-controls-panel" onClick={(e) => e.stopPropagation()}>
            <button
              className="lightbox-ctrl-btn"
              onClick={() => setZoomLevel(prev => Math.max(1, prev - 0.25))}
              disabled={zoomLevel <= 1}
              title="Zoom Out"
            >
              ➖
            </button>
            <span className="lightbox-info-tag">{Math.round(zoomLevel * 100)}%</span>
            <button
              className="lightbox-ctrl-btn"
              onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
              disabled={zoomLevel >= 3}
              title="Zoom In"
            >
              ➕
            </button>
            <div className="lightbox-ctrl-divider" />
            <button
              className="lightbox-ctrl-btn"
              onClick={() => setRotation(prev => (prev + 90) % 360)}
              title="Rotate 90° Clockwise"
            >
              🔄
            </button>
            <div className="lightbox-ctrl-divider" />
            <button
              className="lightbox-ctrl-btn"
              onClick={() => {
                setZoomLevel(1);
                setRotation(0);
              }}
              title="Reset Adjustments"
            >
              ↩️
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
export default AdminDashboard;