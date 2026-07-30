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
  { name: 'DEV DASHBOARD', icon: '💻', path: '/admin/developer-dashboard?tab=dashboard' },
  { name: 'DEV PROJECT', icon: '📁', path: '/admin/developer-dashboard?tab=projects' },
  { name: 'DEV TASK', icon: '💻', path: '/admin/developer-dashboard?tab=mywork' },
  { name: 'DEV MEETING', icon: '📅', path: '/admin/developer-dashboard?tab=meetings' },
  { name: 'DEV CORRECTION', icon: '⚠️', path: '/admin/developer-dashboard?tab=corrections' },
  { name: 'DEV WORKWISE', icon: '➤', path: '/admin/developer-dashboard?tab=workwise' },
  { name: 'DEV LEAVE', icon: '🏖️', path: '/admin/developer-dashboard?tab=leave' },
  { name: 'DEV REPORT', icon: '⚙️', path: '/admin/developer-dashboard?tab=admin' },
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
  { name: 'CONTACT INQUIRIES', icon: '📞', path: '/admin/contact-inquiries' },
  { name: 'CAREER APPLICATIONS', icon: '💼', path: '/admin/career-applications' },
  { name: 'SETTINGS', icon: '🛠️', path: '/admin/settings' },
];

const Sidebar = ({ isMobileOpen, onCloseMobile }) => {
  const [pendingLeavesCount, setPendingLeavesCount] = useState(0);
  const [newContactsCount, setNewContactsCount] = useState(0);
  const [newCareersCount, setNewCareersCount] = useState(0);
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

  const hasDevRole = roles.some(r => r.startsWith('Dev-') || r.toLowerCase().startsWith('dev-'));

  const isAdmin = roles.includes('Admin');

  const [personaMode, setPersonaMode] = useState(() => {
    if (isAdmin) {
      return localStorage.getItem('active_persona_mode') || 'admin';
    }
    return hasDevRole ? 'developer' : 'admin';
  });

  useEffect(() => {
    const handlePersonaChange = () => {
      if (isAdmin) {
        setPersonaMode(localStorage.getItem('active_persona_mode') || 'admin');
      } else {
        setPersonaMode(hasDevRole ? 'developer' : 'admin');
      }
    };
    window.addEventListener('persona_change', handlePersonaChange);
    return () => window.removeEventListener('persona_change', handlePersonaChange);
  }, [isAdmin, hasDevRole]);

  const isEmployeeOnly = !hasDevRole && (prefix === 'executive' || ((roles.includes('Employee') || roles.includes('Executive')) && !roles.includes('Admin') && !roles.includes('Manager') && !roles.includes('Team Leader')));
  const hasPermission = (perm) => roles.includes('Admin') || (user?.permissions?.includes(perm));

  const isOnDeveloperRoute = location.pathname.includes('developer-dashboard') || location.search.includes('tab=');
  const isDevMode = hasDevRole
    ? (personaMode !== 'admin')
    : (personaMode === 'developer' && (location.pathname.includes('dashboard') || isOnDeveloperRoute));

  const isDevRole = roles.includes('Dev-role') || roles.includes('DEV-role') || roles.includes('dev-role');
  const devMenuNames = [
    'DEV DASHBOARD', 'DEV PROJECT', 'DEV TASK', 'DEV MEETING',
    'DEV CORRECTION', 'DEV WORKWISE', 'DEV LEAVE', 'DEV REPORT',
    ...(isDevRole ? ['ROLE & PERMISSION'] : [])
  ];
  const allDevItemNames = ['DEV DASHBOARD', 'DEV PROJECT', 'DEV TASK', 'DEV MEETING', 'DEV CORRECTION', 'DEV WORKWISE', 'DEV LEAVE', 'DEV REPORT'];

  const filteredMenuItems = menuItems.filter(item => {
    // 1. Developer Mode: Show ONLY Developer pages in sidebar
    if (isDevMode) {
      if (item.name === 'ROLE & PERMISSION') {
        return devMenuNames.includes(item.name);
      }

      // Check permission for developer sub-pages
      const devPagePerms = {
        'DEV DASHBOARD': 'developer_dashboard.view',
        'DEV PROJECT': 'developer_projects.view',
        'DEV TASK': 'developer_tasks.view',
        'DEV MEETING': 'developer_meetings.view',
        'DEV CORRECTION': 'developer_corrections.view',
        'DEV WORKWISE': 'developer_workwise.view',
        'DEV LEAVE': 'developer_leave.view',
        'DEV REPORT': 'developer_reports.view',
      };
      const permCode = devPagePerms[item.name];
      if (permCode) {
        return roles.includes('Admin') || (user?.permissions || []).includes(permCode);
      }

      return false;
    }

    // 2. Employee Only Mode: Show only employee pages
    if (isEmployeeOnly) {
      return ['DASHBOARD', 'WORKWISE', 'DIGICONVERTOR', 'HOURLY GRAPH', 'CALENDAR', 'TASK', 'LEAVE'].includes(item.name);
    }

    // 3. Admin Mode: Hide developer sub-pages from sidebar
    if (allDevItemNames.includes(item.name)) {
      return false;
    }

    if (roles.includes('Admin')) {
      return true;
    }
    switch (item.name) {
      case 'DASHBOARD':
      case 'DEV DASHBOARD':
      case 'DEV PROJECT':
      case 'DEV MY WORK':
      case 'DEV TASK':
      case 'DEV MEETING':
      case 'DEV CORRECTION':
      case 'DEV REPORT':
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
      case 'CONTACT INQUIRIES':
        return hasPermission('contact_inquiries.view');
      case 'CAREER APPLICATIONS':
        return hasPermission('career_applications.view');
      case 'SETTINGS':
        return hasPermission('settings.view');
      default:
        return false;
    }
  });

  const canApproveLeaves = roles.includes('Admin') || roles.includes('Manager') || user?.permissions?.includes('leaves.approve') || user?.permissions?.includes('leaves.view_all');
  const canViewContacts = hasPermission('contact_inquiries.view');
  const canViewCareers = hasPermission('career_applications.view');

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

  useEffect(() => {
    if (!canViewContacts) return;

    const fetchContactsCount = async () => {
      try {
        const data = await apiCall('/admin/contact?status=NEW');
        if (data && Array.isArray(data)) {
          setNewContactsCount(data.length);
        }
      } catch (err) {
        console.error('Failed to fetch new contacts count:', err);
      }
    };

    fetchContactsCount();

    const interval = setInterval(fetchContactsCount, 30000);
    return () => clearInterval(interval);
  }, [location.pathname, canViewContacts]);

  useEffect(() => {
    if (!canViewCareers) return;

    const fetchCareersCount = async () => {
      try {
        const data = await apiCall('/admin/careers/applications?status=NEW');
        if (data && Array.isArray(data)) {
          setNewCareersCount(data.length);
        }
      } catch (err) {
        console.error('Failed to fetch new careers count:', err);
      }
    };

    fetchCareersCount();

    const interval = setInterval(fetchCareersCount, 30000);
    return () => clearInterval(interval);
  }, [location.pathname, canViewCareers]);

  const handleNavClick = () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const checkIsItemActive = (itemPath, isDefaultActive) => {
    if (itemPath.includes('?tab=')) {
      const targetTab = new URLSearchParams(itemPath.split('?')[1]).get('tab');
      const currentTab = new URLSearchParams(location.search).get('tab') || 'dashboard';
      return isDefaultActive && currentTab === targetTab;
    }
    return isDefaultActive;
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
            const resolvedPath = item.path.replace('/admin/', `/workwise/${prefix}/`);
            const icon = (isEmployeeOnly && item.name === 'LEAVE') ? '🍃' : item.icon;
            const name = item.name === 'TASK' ? 'TASKS' : item.name === 'LEAVE' ? 'LEAVES' : item.name;
            return (
              <NavLink
                key={item.path}
                to={resolvedPath}
                onClick={handleNavClick}
                className={({ isActive }) => `nav-item${checkIsItemActive(item.path, isActive) ? ' active' : ''}`}
              >
                <span className="nav-icon">{icon}</span>
                <span className="nav-text">{name}</span>
                {item.name === 'LEAVE' && pendingLeavesCount > 0 && (
                  <span className="sidebar-badge blink">{pendingLeavesCount}</span>
                )}
                {item.name === 'CONTACT INQUIRIES' && newContactsCount > 0 && (
                  <span className="sidebar-badge blink">{newContactsCount}</span>
                )}
                {item.name === 'CAREER APPLICATIONS' && newCareersCount > 0 && (
                  <span className="sidebar-badge blink">{newCareersCount}</span>
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



