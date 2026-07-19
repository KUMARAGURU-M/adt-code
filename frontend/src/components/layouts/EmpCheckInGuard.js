// src/components/layouts/EmpCheckInGuard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall, getCurrentUser, getRolePrefix } from '../../utils/api';
import '../../pages/user/EmpDashboard.css';

const EmpCheckInGuard = ({ children, pageName = 'Page' }) => {
  const navigate = useNavigate();
  const [attendanceToday, setAttendanceToday] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [error, setError] = useState('');

  const user = getCurrentUser();
  const roles = user?.roles || [];
  const prefix = getRolePrefix(roles);
  const isEmp = prefix === 'executive' || ((roles.includes('Employee') || roles.includes('Executive')) && !roles.includes('Admin') && !roles.includes('Manager') && !roles.includes('Team Leader'));

  const fetchAttendance = async () => {
    try {
      const data = await apiCall('/attendance/today');
      setAttendanceToday(data);
    } catch (err) {
      console.warn('Failed to load today attendance:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEmp) {
      fetchAttendance();
    } else {
      setLoading(false);
    }
  }, [isEmp]);

  const handleCheckInNow = async () => {
    setCheckingIn(true);
    setError('');
    try {
      const data = await apiCall('/attendance/check-in', 'POST');
      setAttendanceToday(data);
    } catch (err) {
      setError(err.message || 'Check-in failed');
    } finally {
      setCheckingIn(false);
    }
  };

  // Non-employee roles skip guard
  if (!isEmp) {
    return children;
  }

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#666', fontFamily: "'Poppins', sans-serif" }}>
        Checking shift attendance status...
      </div>
    );
  }

  const isCheckedIn = !!attendanceToday?.checkInTime;

  if (!isCheckedIn) {
    return (
      <div className="emp-locked-container" style={{ padding: '40px 20px', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="emp-locked-card" style={{ maxWidth: '480px', width: '100%', textAlign: 'center', background: 'white', padding: '32px 24px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div className="emp-locked-icon" style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <h3 style={{ margin: '0 0 12px', fontSize: '1.4rem', fontWeight: '700', color: '#1a202c' }}>{pageName} Locked</h3>
          <p style={{ margin: '0 0 24px', color: '#718096', lineHeight: '1.6', fontSize: '0.92rem' }}>
            You must Check-In to your shift to access <strong>{pageName}</strong> and start working.
          </p>
          {error && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '16px' }}>⚠️ {error}</p>}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="emp-locked-btn"
              onClick={handleCheckInNow}
              disabled={checkingIn}
              style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}
            >
              {checkingIn ? 'Checking In...' : '▶ Check In Now'}
            </button>
            <button
              onClick={() => navigate(`/${prefix}/dashboard`)}
              style={{ padding: '12px 24px', background: '#edf2f7', color: '#4a5568', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default EmpCheckInGuard;
