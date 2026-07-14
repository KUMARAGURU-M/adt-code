// src/pages/employee/EmpDashboard.js
import React, { useState, useEffect } from 'react';
import { getCurrentUser, apiCall } from '../../utils/api';
// import { useNavigate } from 'react-router-dom';

import EmpHeader from './EmpHeader';
import EmpWorkwise from './EmpWorkwise';
import EmpCalendar from './EmpCalendar';
import EmpTask from './EmpTask';
import EmpLeave from './EmpLeave';

import DigiConvertor from '../admin/DigiConvertor';
import HourlyGraph from '../admin/HourlyGraph';
import './EmpDashboard.css';
const TABS = [
  { id: 'workwise', label: 'WorkWise', icon: '➤' },
  { id: 'digiconvertor', label: 'DigiConvertor', icon: '🔄' },
  { id: 'hourly-graph', label: 'Hourly Graph', icon: '📊' },
  { id: 'calendar', label: 'Calendar', icon: '📅' },
  { id: 'tasks', label: 'Tasks', icon: '✅' },
  { id: 'leaves', label: 'Leaves', icon: '🍃' },
];

const STATS = [
  { key: 'totalHours', label: 'Total Hours' },
  { key: 'pages', label: 'Pages' },
  { key: 'sessions', label: 'Sessions' },
  { key: 'projects', label: 'Projects' },
  { key: 'status', label: 'Status', isStatus: true },
];

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function EmpDashboard() {

  // const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('workwise');
  const [now, setNow] = useState(new Date());
  const [userName, setUserName] = useState('Executive');
  const [attendanceToday, setAttendanceToday] = useState(null);
  const [checkingInOut, setCheckingInOut] = useState(false);
  const [attendanceError, setAttendanceError] = useState('');
  const [loadingAttendance, setLoadingAttendance] = useState(true);

  const fetchTodayAttendance = async () => {
    try {
      const data = await apiCall('/attendance/today');
      setAttendanceToday(data);
    } catch (err) {
      console.warn('Failed to load today attendance:', err.message);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleCheckIn = async () => {
    setCheckingInOut(true);
    setAttendanceError('');
    try {
      const data = await apiCall('/attendance/check-in', 'POST');
      setAttendanceToday(data);
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
    fetchTodayAttendance();
  }, []);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      if (user.fullName) {
        setUserName(user.fullName);
      }
    }
  }, []);

  const [summary] = useState({
    totalHours: '0.00',
    pages: 0,
    sessions: 0,
    projects: 0,
    status: 'No Data',
  });

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const fmtDate = (d) =>
    `${DAYS_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}, ${d.getFullYear()}`;

  const fmtTime = (d) => {
    let h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    const ap = h >= 12 ? 'pm' : 'am';

    h = h % 12 || 12;

    return `${String(h).padStart(2, '0')}:${m}:${s} ${ap} IST`;
  };

  const renderTab = () => {
    if (loadingAttendance) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', color: '#666', fontFamily: "'Poppins', sans-serif" }}>
          Loading attendance...
        </div>
      );
    }

    const isCheckedIn = !!attendanceToday?.checkInTime;

    if (!isCheckedIn && (activeTab === 'workwise' || activeTab === 'tasks' || activeTab === 'digiconvertor' || activeTab === 'hourly-graph')) {
      return (
        <div className="emp-locked-container">
          <div className="emp-locked-card">
            <div className="emp-locked-icon">🔒</div>
            <h3>{activeTab === 'workwise' ? 'WorkWise Locked' : activeTab === 'tasks' ? 'Task Locked' : activeTab === 'digiconvertor' ? 'DigiConvertor Locked' : 'Hourly Graph Locked'}</h3>
            <p>
              {activeTab === 'workwise'
                ? 'You must Check-In to your shift to access WorkWise and start tracking your work.'
                : activeTab === 'tasks'
                  ? 'You must Check-In to your shift to access tasks.'
                  : activeTab === 'hourly-graph'
                    ? 'You must Check-In to access Hourly Graph.'
                    : 'You must Check-In to access DigiConvertor'}
            </p>
            <button className="emp-locked-btn" onClick={handleCheckIn} disabled={checkingInOut}>
              {checkingInOut ? 'Checking In...' : '▶ Check In Now'}
            </button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'workwise': return <EmpWorkwise />;
      case 'digiconvertor': return <DigiConvertor />;
      case 'hourly-graph': return <HourlyGraph />;
      case 'calendar': return <EmpCalendar />;
      case 'tasks': return <EmpTask />;
      case 'leaves': return <EmpLeave />;
      default: return <EmpWorkwise />;
    }
  };

  return (
    <div className="emp-dashboard-page">

      {/* Glassmorphism Header */}
      <EmpHeader userName={userName} />

      <div className="emp-dashboard-body">

        {/* Top bar */}
        <div className="emp-topbar">

          {/* Timestamp - Date on left */}
          <span className="emp-ts-date">{fmtDate(now)}</span>

          {/* Tagging Work Portal button */}
          {/* <button
            className="emp-portal-btn"
            onClick={() => navigate('/workportal')}
          >
            🏷️ Tagging Work Portal
          </button> */}

          {/* Timestamp - Time on right */}
          <span className="emp-ts-time">{fmtTime(now)}</span>

        </div>

        {/* Check In / Check Out Widget */}
        <div className="emp-checkin-widget">
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

        {/* Today's Work Summary */}
        <div className="emp-summary-panel">

          <div className="emp-summary-header">
            <span style={{ fontSize: '1.1rem' }}>📊</span>
            <h2 className="emp-summary-title">Today's Work Summary</h2>
          </div>

          <div className="emp-summary-cards">
            {STATS.map(s => (
              <div className="emp-stat-card" key={s.key}>

                <div className="emp-stat-label">
                  {s.label}
                </div>

                {s.isStatus ? (
                  <div className="emp-stat-status">
                    <span
                      className={`emp-status-dot ${summary.status === 'Running'
                        ? 'active'
                        : summary.status === 'Stopped'
                          ? 'stopped'
                          : ''
                        }`}
                    />
                    {summary.status}
                  </div>
                ) : (
                  <div className="emp-stat-value">
                    {summary[s.key]}
                  </div>
                )}

              </div>
            ))}
          </div>

        </div>

        {/* Tab Nav */}
        <nav className="emp-tab-nav">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`emp-tab-btn${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Tab content */}
        <div className="emp-tab-panel">
          {renderTab()}
        </div>

      </div>
    </div>
  );
}

