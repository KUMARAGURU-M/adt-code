// src/pages/employee/EmpHeader.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './EmpHeader.css';

const EmpHeader = ({ userName = 'Employee' }) => {
  const navigate = useNavigate();

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
          </div>
          <button className="emp-logout-btn" onClick={() => navigate('/login')}>
            <span>⏻</span> Logout
          </button>
        </div>

      </div>
    </header>
  );
};

export default EmpHeader;