// src/pages/employee/EmpHeader.js
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import './EmpHeader.css';
import { apiCall, clearSession } from '../../utils/api';

const EmpHeader = ({ userName = 'Executive' }) => {
  const navigate = useNavigate();

  const [showResetModal, setShowResetModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const closeResetModal = () => {
    setShowResetModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMsg('');
    setSuccessMsg('');
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
  };

  const handleResetSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMsg('All fields are required.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await apiCall('/users/reset-password', 'POST', {
        currentPassword,
        newPassword,
        confirmPassword
      });
      setSuccessMsg('Password updated successfully! Redirecting...');
      setTimeout(() => {
        closeResetModal();
        clearSession();
        navigate('/login');
      }, 2000);
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="emp-header">
      <div className="emp-header-row">

        {/* LEFT: Production Report + Employee badge */}
        <div className="emp-header-left">
          <p className="emp-prod-label">Production<br />Report</p>
          <div className="emp-badge-row" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="emp-user-badge">
              <span className="emp-badge-dot" />
              <span className="emp-badge-text">{userName}</span>
            </div>
            {sessionStorage.getItem('isImpersonating') === 'true' && (
              <div className="emp-impersonate-badge">
                Impersonating
              </div>
            )}
          </div>
        </div>

        {/* CENTRE: Company name + location */}
        <div className="emp-header-centre">
          <h1 className="emp-company-name">
            <span className="emp-arrow">ARROW</span>
            <span className="emp-data"> DATA</span>
            <span className="emp-dash">-</span>
            <span className="emp-tech">TECH</span>
          </h1>
          <span className="emp-location">Puducherry</span>
        </div>

        {/* RIGHT: Welcome + Logout */}
        <div className="emp-header-right">
          <div className="emp-welcome-text">
            <span className="emp-welcome-label">Welcome,</span>
            <span className="emp-welcome-name">{userName}</span>
            <span className="emp-reset-link" onClick={() => setShowResetModal(true)}>Reset Password</span>
          </div>
          <button className="emp-logout-btn" onClick={() => navigate('/login')}>
            <span>⏻</span> Logout
          </button>
        </div>

      </div>

      {showResetModal && createPortal(
        <div className="reset-password-overlay">
          <div className="reset-password-modal" onClick={e => e.stopPropagation()}>
            <h3>Reset Password</h3>
            {errorMsg && <p className="modal-error">{errorMsg}</p>}
            {successMsg && <p className="modal-success">{successMsg}</p>}
            
            <div className="modal-form-group">
              <label>Current Password</label>
              <div className="pwd-input-wrap">
                <input 
                  type={showCurrent ? 'text' : 'password'} 
                  value={currentPassword} 
                  onChange={e => setCurrentPassword(e.target.value)} 
                  placeholder="Enter current password"
                />
                <button type="button" className="pwd-toggle-btn" onClick={() => setShowCurrent(v => !v)} tabIndex={-1}>
                  {showCurrent ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            
            <div className="modal-form-group">
              <label>New Password</label>
              <div className="pwd-input-wrap">
                <input 
                  type={showNew ? 'text' : 'password'} 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  placeholder="At least 6 characters"
                />
                <button type="button" className="pwd-toggle-btn" onClick={() => setShowNew(v => !v)} tabIndex={-1}>
                  {showNew ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            
            <div className="modal-form-group">
              <label>Confirm New Password</label>
              <div className="pwd-input-wrap">
                <input 
                  type={showConfirm ? 'text' : 'password'} 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  placeholder="Re-enter new password"
                />
                <button type="button" className="pwd-toggle-btn" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}>
                  {showConfirm ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="btn-cancel" onClick={closeResetModal}>Cancel</button>
              <button className="btn-submit" onClick={handleResetSubmit} disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};

export default EmpHeader;