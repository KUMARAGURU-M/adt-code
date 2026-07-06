// src/components/layouts/Header.js

import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';
import { getCurrentUser, clearSession } from '../../utils/api';

const Header = ({ onToggleMobileMenu }) => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const displayUserName = user?.fullName || 'User';

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
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="logged-label">Logged in as</span>
            <strong className="user-name">{displayUserName}</strong>
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

    </header>
  );
};

export default Header;