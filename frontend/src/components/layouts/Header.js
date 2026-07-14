// src/components/layouts/Header.js

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import './Header.css';
import { getCurrentUser, clearSession, apiCall } from '../../utils/api';

const Header = ({ onToggleMobileMenu }) => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const displayUserName = user?.fullName || 'User';

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

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  return (
    <header className="main-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          className="mobile-menu-toggle"
          onClick={onToggleMobileMenu}
          aria-label="Toggle Navigation Menu"
        >
          ☰
        </button>
        <div className="header-brand">
          <h1 className="company-title">
            <span className="text-pink">ARROW</span>
            <span className="text-gray">DATA</span>
            <span className="text-cyan">TECH</span>
          </h1>
          <p className="company-location">Puducherry</p>
        </div>
      </div>

      <div className="header-divider" aria-hidden="true" />

      <div className="header-user">
        <div className="user-details" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span className="logged-label">Logged in as</span>
            <strong className="user-name">{displayUserName}</strong>
            <span className="reset-pass-link" onClick={() => setShowResetModal(true)}>Reset Password</span>
          </div>
          {sessionStorage.getItem('isImpersonating') === 'true' && (
            <span className="impersonate-badge" style={{
              background: '#ef4444',
              color: 'white',
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '4px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              marginLeft: '8px'
            }}>
              Impersonating
            </span>
          )}
        </div>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
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

export default Header;