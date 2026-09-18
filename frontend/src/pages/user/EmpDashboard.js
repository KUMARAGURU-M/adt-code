// src/pages/employee/EmpDashboard.js
import React, { useState, useEffect } from 'react';
import { apiCall, API_BASE } from '../../utils/api';
import EmpWorkwise from './EmpWorkwise';
import './EmpDashboard.css';

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
  const [now, setNow] = useState(new Date());
  const [attendanceToday, setAttendanceToday] = useState(null);
  const [checkingInOut, setCheckingInOut] = useState(false);
  const [attendanceError, setAttendanceError] = useState('');
  const [loadingAttendance, setLoadingAttendance] = useState(true);

  const [announcement, setAnnouncement] = useState('');
  const [celebration, setCelebration] = useState({ isCelebration: false, text: '', photoUrl: '' });
  const [topPerformer, setTopPerformer] = useState({
    enableTopPerformerBanner: true,
    name: '',
    criteria: 'Monthly',
    purpose: '',
    photoUrl: '',
    gifUrl: ''
  });

  const fetchPublicSettings = async () => {
    try {
      const data = await apiCall('/settings/public');
      if (data) {
        if (data.announcement) setAnnouncement(data.announcement);
        setCelebration({
          isCelebration: data.isCelebration || false,
          text: data.celebrationText || '',
          photoUrl: data.celebrationPhotoUrl || '',
        });
        setTopPerformer({
          enableTopPerformerBanner: data.enableTopPerformerBanner ?? true,
          name: data.topPerformerName || '',
          criteria: data.topPerformerCriteria || 'Monthly',
          purpose: data.topPerformerPurpose || '',
          photoUrl: data.topPerformerPhotoUrl || '',
          gifUrl: data.topPerformerGifUrl || ''
        });
      }
    } catch (e) {
      console.warn('Failed to load public settings:', e);
    }
  };

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
    const confirmCheckOut = window.confirm("Are you sure you want to Check-Out?");
    if (!confirmCheckOut) return;
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
    fetchPublicSettings();
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

  const isCheckedIn = !!attendanceToday?.checkInTime;

  return (
    <div className="emp-dashboard-page">
      <div className="emp-dashboard-body">

        {/* Top bar */}
        <div className="emp-topbar">
          <span className="emp-ts-date">{fmtDate(now)}</span>
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

        {/* CELEBRATION, TOP PERFORMER & ANNOUNCEMENTS ROW */}
        <div className="dashboard-flex-row" style={{ marginBottom: '24px' }}>
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
                  {announcement || "Welcome to the production portal! No new announcements today. Have a productive shift! 😊"}
                </div>
              </div>
            </div>
          </div>
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

        {/* Main Work Area */}
        <div className="emp-tab-panel">
          {loadingAttendance ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666', fontFamily: "'Poppins', sans-serif" }}>
              Loading attendance...
            </div>
          ) : !isCheckedIn ? (
            <div className="emp-locked-container">
              <div className="emp-locked-card">
                <div className="emp-locked-icon">🔒</div>
                <h3>WorkWise Locked</h3>
                <p>You must Check-In to your shift to access WorkWise and start tracking your work.</p>
                <button className="emp-locked-btn" onClick={handleCheckIn} disabled={checkingInOut}>
                  {checkingInOut ? 'Checking In...' : '▶ Check In Now'}
                </button>
              </div>
            </div>
          ) : (
            <EmpWorkwise />
          )}
        </div>

      </div>
    </div>
  );
}
