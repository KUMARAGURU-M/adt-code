import React, { useState, useEffect } from 'react';
import './AdminReportsPage.css';
import { getCurrentUser, apiCall } from '../../utils/api';

const AdminReportsPage = () => {
  const user = getCurrentUser();
  const isAdmin = user?.roles?.includes('Admin');
  const hasAccess = (perm) => isAdmin || (user?.permissions || []).includes(perm);

  const [subTab, setSubTab] = useState('employees');

  // Employee List State
  const [employees, setEmployees] = useState([]);
  const [analytics, setAnalytics] = useState({
    overallCompletion: '0.0%',
    efficiency: '0.0%',
    totalHours: '0.0 hrs',
    correctionsResolved: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await apiCall('/reports/dev-productivity');
        if (data) {
          setEmployees(data.employees || []);
          if (data.analytics) {
            setAnalytics(data.analytics);
          }
        }
      } catch (err) {
        console.error('Failed to fetch dev productivity report:', err);
        setError(err.message || 'Failed to load report data');
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);

  const [newEmp, setNewEmp] = useState({
    name: '',
    role: 'Frontend Dev',
    project: 'DigiConvertor Platform'
  });

  const [showAddEmpModal, setShowAddEmpModal] = useState(false);

  const handleAddEmployee = (e) => {
    e.preventDefault();
    if (!newEmp.name.trim()) return;
    const item = {
      id: Date.now(),
      name: newEmp.name,
      role: newEmp.role,
      project: newEmp.project,
      status: 'Active',
      hoursThisWeek: '0.0 hrs'
    };
    setEmployees([...employees, item]);
    setShowAddEmpModal(false);
    setNewEmp({ name: '', role: 'Frontend Dev', project: 'DigiConvertor Platform' });
  };

  if (loading) {
    return (
      <div className="dev-full-width-panel" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <div style={{ color: '#64748b', fontSize: '1rem', fontWeight: 500 }}>Loading engineering reports...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dev-full-width-panel" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <div style={{ color: '#ef4444', fontSize: '1rem', fontWeight: 500 }}>⚠️ {error}</div>
      </div>
    );
  }

  return (
    <div className="dev-full-width-panel" style={{ marginTop: '0' }}>
      
      {/* HEADER BAR */}
      <div className="dev-panel-header">
        <div className="dev-panel-title">
          <span>⚙️ Admin Management & Engineering Reports</span>
        </div>
        <div className="dev-filter-pills" style={{ margin: 0 }}>
          {[
            { id: 'employees', label: `👥 Team Members (${employees.length})` },
            { id: 'analytics', label: `📊 Productivity Analytics` }
          ].map(tab => (
            <button 
              key={tab.id}
              className={`dev-pill ${subTab === tab.id ? 'active' : ''}`}
              onClick={() => setSubTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SUB-TAB 1: EMPLOYEES & ROLES */}
      {subTab === 'employees' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h4 style={{ margin: 0, color: '#1a202c' }}>Software Development Team Members</h4>
            {hasAccess('developer_dashboard.update') && (
              <button className="dev-btn dev-btn-primary" onClick={() => setShowAddEmpModal(true)}>
                + Add Developer
              </button>
            )}
          </div>

          <div className="dev-table-wrapper">
            <table className="dev-table">
              <thead>
                <tr>
                  <th>Developer Name</th>
                  <th>Assigned Role</th>
                  <th>Primary Project</th>
                  <th>Weekly Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id}>
                    <td><strong>👤 {emp.name}</strong></td>
                    <td><span className="dev-badge dev-badge-purple">{emp.role}</span></td>
                    <td><strong style={{ color: '#00a3ff' }}>{emp.project}</strong></td>
                    <td>{emp.hoursThisWeek}</td>
                    <td><span className="dev-badge dev-badge-success">{emp.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: PRODUCTIVITY ANALYTICS */}
      {subTab === 'analytics' && (
        <div>
          <div className="dev-stats-grid" style={{ marginBottom: '20px' }}>
            <div className="dev-stat-card" style={{ borderTop: '4px solid #38a169' }}>
              <div className="dev-stat-title">Overall Project Completion</div>
              <div className="dev-stat-value">{analytics.overallCompletion}</div>
              <div className="dev-stat-subtext">Release v2.4 readiness</div>
            </div>
            <div className="dev-stat-card" style={{ borderTop: '4px solid #00a3ff' }}>
              <div className="dev-stat-title">Engineering Efficiency</div>
              <div className="dev-stat-value">{analytics.efficiency}</div>
              <div className="dev-stat-subtext">Across assigned developer tasks</div>
            </div>
            <div className="dev-stat-card" style={{ borderTop: '4px solid #805ad5' }}>
              <div className="dev-stat-title">Total Hours Logged</div>
              <div className="dev-stat-value">{analytics.totalHours}</div>
              <div className="dev-stat-subtext">This week's workwise tracker</div>
            </div>
            <div className="dev-stat-card" style={{ borderTop: '4px solid #d69e2e' }}>
              <div className="dev-stat-title">Lead Corrections Resolved</div>
              <div className="dev-stat-value">{analytics.correctionsResolved}</div>
              <div className="dev-stat-subtext">All resolved code defects</div>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#1a202c' }}>Sprint Velocity Summary</h4>
            <p style={{ margin: 0, color: '#4a5568', fontSize: '0.9rem', lineHeight: '1.5' }}>
              The software engineering team is currently operating at <strong>{analytics.efficiency} sprint efficiency</strong>. All critical code corrections from Team Leads have been addressed.
            </p>
          </div>
        </div>
      )}

      {/* ADD EMPLOYEE MODAL */}
      {showAddEmpModal && (
        <div className="dev-modal-overlay">
          <div className="dev-modal">
            <div className="dev-modal-header">
              <h3 className="dev-modal-title">+ Add Developer to Team</h3>
              <button className="dev-modal-close" onClick={() => setShowAddEmpModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddEmployee}>
              <div className="dev-form-group">
                <label>Developer Name</label>
                <input 
                  type="text"
                  className="dev-input"
                  placeholder="e.g. John Doe"
                  value={newEmp.name}
                  onChange={e => setNewEmp({...newEmp, name: e.target.value})}
                  required
                />
              </div>
              <div className="dev-form-group">
                <label>Role</label>
                <select 
                  className="dev-select"
                  value={newEmp.role}
                  onChange={e => setNewEmp({...newEmp, role: e.target.value})}
                >
                  <option value="Frontend Dev">Frontend Dev</option>
                  <option value="Backend Dev">Backend Dev</option>
                  <option value="Full Stack Dev">Full Stack Dev</option>
                  <option value="Team Lead">Team Lead</option>
                  <option value="QA Engineer">QA Engineer</option>
                </select>
              </div>
              <div className="dev-form-group">
                <label>Assigned Project</label>
                <select 
                  className="dev-select"
                  value={newEmp.project}
                  onChange={e => setNewEmp({...newEmp, project: e.target.value})}
                >
                  <option value="DigiConvertor Platform">DigiConvertor Platform</option>
                  <option value="Data Ingestion Suite">Data Ingestion Suite</option>
                  <option value="Analytics Engine">Analytics Engine</option>
                  <option value="Security Core">Security Core</option>
                </select>
              </div>
              <div className="dev-modal-actions">
                <button type="button" className="dev-btn dev-btn-secondary" onClick={() => setShowAddEmpModal(false)}>Cancel</button>
                <button type="submit" className="dev-btn dev-btn-primary">Add Developer</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminReportsPage;
