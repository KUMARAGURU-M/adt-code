// src/components/layouts/Sidebar.js
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './Sidebar.css';
import { apiCall, getCurrentUser, getRolePrefix } from '../../utils/api';
import toolIcon from '../../img/tools.png';
import timelogIcon from '../../img/timelog.png';
import invoiceIcon from '../../img/invoice.png';

import productionIcon from '../../img/production.png';


const menuItems = [
  { name: 'DASHBOARD', icon: '📊', path: '/admin/dashboard' },
  { name: 'USER', icon: '👥', path: '/admin/users' },
  { name: 'WORKWISE', icon: '➤', path: '/admin/workwise' },
  { name: 'DIGICONVERTOR', icon: '🔄', path: '/admin/digiconvertor' },
  { name: 'ATTENDANCE', icon: '📅', path: '/admin/attendance' },
  { name: 'PROJECT', icon: '📁', path: '/admin/projects' },
  { name: 'BOOK/JOB', icon: '📖', path: '/admin/books' },
  { name: 'PRODUCTION', icon: <img src={productionIcon} alt="Production" className="sidebar-img-icon" />, path: '/admin/production' },
  { name: 'TASK', icon: '✅', path: '/admin/tasks' },
  { name: 'PROCESS', icon: '⚙️', path: '/admin/processes' },
  { name: 'SHIFT', icon: '🕒', path: '/admin/shifts' },
  { name: 'TOOL', icon: <img src={toolIcon} alt="Tools" className="sidebar-img-icon" />, path: '/admin/tool' },
  { name: 'LEAVE', icon: '🏖️', path: '/admin/leaves' },
  { name: 'ROLE & PERMISSION', icon: '🔐', path: '/admin/roles' },
  { name: 'REPORT', icon: '📈', path: '/admin/reports' },
  { name: 'HOURLY GRAPH', icon: '📝', path: '/admin/hourly-graph' },
  { name: 'ACTIVITY LOG', icon: '💻', path: '/admin/activity-logs' },
  { name: 'TIME LOG', icon: <img src={timelogIcon} alt="Time Log" className="sidebar-img-icon" />, path: '/admin/timelog' },
  { name: 'INVOICE', icon: <img src={invoiceIcon} alt="Invoices" className="sidebar-img-icon" />, path: '/admin/invoices' },
  { name: 'CHAT MONITOR', icon: '💬', path: '/admin/chat-monitor' },
  { name: 'SETTINGS', icon: '🛠️', path: '/admin/settings' },
];

const Sidebar = ({ isMobileOpen, onCloseMobile }) => {
  const [pendingLeavesCount, setPendingLeavesCount] = useState(0);
  const location = useLocation();

  const user = getCurrentUser();
  const roles = user?.roles || [];
  const prefix = getRolePrefix(roles);

  const displayRole = roles.includes('Admin')
    ? 'Admin'
    : roles.includes('Manager')
      ? 'Manager'
      : roles.includes('Team Leader')
        ? 'Team Leader'
        : roles.includes('Employee')
          ? 'Employee'
          : 'User';

  const hasRole = (roleName) => roles.includes(roleName);

  const filteredMenuItems = menuItems.filter(item => {
    if (hasRole('Admin')) {
      return true;
    }
    if (hasRole('Manager')) {
      const allowed = [
        'DASHBOARD',
        'WORKWISE',
        'DIGICONVERTOR',
        'BOOK/JOB',
        'PRODUCTION',
        'TASK',
        'PROCESS',
        'SHIFT',
        'LEAVE',
        'REPORT',
        'HOURLY GRAPH',
        'TIME LOG'
      ];
      return allowed.includes(item.name);
    }
    if (hasRole('Team Leader')) {
      const allowed = [
        'DASHBOARD',
        'WORKWISE',
        'DIGICONVERTOR',
        'BOOK/JOB',
        'PRODUCTION',
        'TASK',
        'REPORT',
        'HOURLY GRAPH',
        'TIME LOG'
      ];
      return allowed.includes(item.name);
    }
    if (hasRole('Employee')) {
      const allowed = [
        'WORKWISE',
        'PRODUCTION',
        'HOURLY GRAPH'
      ];
      return allowed.includes(item.name);
    }
    return false;
  });

  const isAdminOrManager = roles.some(role => role === 'Admin' || role === 'Manager');
  useEffect(() => {
    if (!isAdminOrManager) return;

    const fetchPendingCount = async () => {
      try {
        const data = await apiCall('/leave/requests?status=Pending&size=1');
        if (data && typeof data.totalElements === 'number') {
          setPendingLeavesCount(data.totalElements);
        }
      } catch (err) {
        console.error('Failed to fetch pending leaves count:', err);
      }
    };

    fetchPendingCount();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, [location.pathname, isAdminOrManager]);

  const handleNavClick = () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {isMobileOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}
      <div className={`sidebar${isMobileOpen ? ' mobile-open' : ''}`}>
        <div className="sidebar-header">
          {/* ← Left-aligned, two lines via <br /> */}
          <h2 className="brand-name">
            ADT<br />Production
          </h2>
          <span className="admin-status">{displayRole}</span>
        </div>
        <nav className="sidebar-nav">
          {filteredMenuItems.map((item) => {
            const resolvedPath = item.path.replace('/admin/', `/${prefix}/`);
            return (
              <NavLink
                key={item.path}
                to={resolvedPath}
                onClick={handleNavClick}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-text">{item.name}</span>
                {item.name === 'LEAVE' && pendingLeavesCount > 0 && (
                  <span className="sidebar-badge blink">{pendingLeavesCount}</span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;