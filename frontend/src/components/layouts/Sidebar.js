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
  { name: 'CALENDAR', icon: '📅', path: '/admin/calendar' },
  { name: 'ROLE & PERMISSION', icon: '🔐', path: '/admin/roles' },
  { name: 'REPORT', icon: '📈', path: '/admin/reports' },
  { name: 'HOURLY GRAPH', icon: '📊', path: '/admin/hourly-graph' },
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
        : (roles.includes('Employee') || roles.includes('Executive'))
          ? 'Executive'
          : 'User';

  const isEmployeeOnly = prefix === 'executive' || ((roles.includes('Employee') || roles.includes('Executive')) && !roles.includes('Admin') && !roles.includes('Manager') && !roles.includes('Team Leader'));

  const hasPermission = (perm) => roles.includes('Admin') || (user?.permissions?.includes(perm));

  const filteredMenuItems = menuItems.filter(item => {
    if (isEmployeeOnly) {
      return ['DASHBOARD', 'WORKWISE', 'DIGICONVERTOR', 'HOURLY GRAPH', 'CALENDAR', 'TASK', 'LEAVE'].includes(item.name);
    }
    if (roles.includes('Admin')) {
      return true;
    }
    switch (item.name) {
      case 'DASHBOARD':
        return true;
      case 'USER':
        return hasPermission('employees.view');
      case 'WORKWISE':
        return hasPermission('timelogs.view') || hasPermission('tasks.view');
      case 'DIGICONVERTOR':
        return hasPermission('digiconvertor.view');
      case 'ATTENDANCE':
        return hasPermission('attendance.view');
      case 'PROJECT':
        return hasPermission('projects.view');
      case 'BOOK/JOB':
        return hasPermission('jobs.view');
      case 'PRODUCTION':
        return hasPermission('production.view');
      case 'TASK':
        return hasPermission('tasks.view');
      case 'PROCESS':
        return hasPermission('processes.view');
      case 'SHIFT':
        return hasPermission('shifts.view');
      case 'TOOL':
        return hasPermission('tools.view');
      case 'LEAVE':
        return hasPermission('leaves.view') || hasPermission('leaves.view_all');
      case 'CALENDAR':
        return true;
      case 'ROLE & PERMISSION':
        return hasPermission('roles.view');
      case 'REPORT':
        return hasPermission('reports.view');
      case 'HOURLY GRAPH':
        return hasPermission('hourly_graph.view');
      case 'ACTIVITY LOG':
        return hasPermission('activity_logs.view');
      case 'TIME LOG':
        return hasPermission('timelogs.view_all');
      case 'INVOICE':
        return hasPermission('invoices.view');
      case 'CHAT MONITOR':
        return hasPermission('chat_monitor.view');
      case 'SETTINGS':
        return hasPermission('settings.view');
      default:
        return false;
    }
  });

  const canApproveLeaves = roles.includes('Admin') || roles.includes('Manager') || user?.permissions?.includes('leaves.approve') || user?.permissions?.includes('leaves.view_all');

  useEffect(() => {
    if (!canApproveLeaves) return;

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
  }, [location.pathname, canApproveLeaves]);

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
            const icon = (isEmployeeOnly && item.name === 'LEAVE') ? '🍃' : item.icon;
            const name = item.name === 'TASK' ? 'TASKS' : item.name === 'LEAVE' ? 'LEAVES' : item.name;
            return (
              <NavLink
                key={item.path}
                to={resolvedPath}
                onClick={handleNavClick}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <span className="nav-icon">{icon}</span>
                <span className="nav-text">{name}</span>
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
