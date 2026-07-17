// src/App.js

import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';

/* ── Layouts ── */
import Sidebar from './components/layouts/Sidebar';
import Header from './components/layouts/Header';

/* ── Auth ── */
import Login from './pages/auth/Login/Login';

/* ── Employee Portal ── */
import EmpDashboard from './pages/user/EmpDashboard';
import WorkPortal from './pages/user/WorkPortal';

/* ── Admin Pages ── */
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import Attendance from './pages/admin/Attendance';
import Project from './pages/admin/Project';
import BooksJobs from './pages/admin/BooksJobs';
import Production from './pages/admin/Production';
import ProcessManagement from './pages/admin/ProcessManagement';
import ShiftManagement from './pages/admin/ShiftManagement';
import Leaves from './pages/admin/Leave';
import TaskManagement from './pages/admin/TaskManagement';
import ReportsAnalytics from './pages/admin/ReportsAnalytics';
import HourlyGraph from './pages/admin/HourlyGraph';
import ActivityLogs from './pages/admin/ActivityLogs';
import RolesPermission from './pages/admin/RolesPermission';
import Setting from './pages/admin/Setting';
import Tools from './pages/admin/Tools';
import RoleWorkwiseDashboard from './pages/user/RoleWorkwiseDashboard';
import TimeLog from './pages/admin/TimeLog';
import Invoice from './pages/admin/Invoice';
import ChatMonitor from './pages/admin/ChatMonitor';
import ChatWidget from './components/layouts/ChatWidget';
import DigiConvertor from './pages/admin/DigiConvertor';
import HourlyReminder from './components/layouts/HourlyReminder';

import { getCurrentUser, getRolePrefix } from './utils/api';

/* ── Route Authorization ── */
const getAllowedRoutes = (roles, permissions) => {
  if (!roles) return [];
  const allowed = [];
  const prefix = getRolePrefix(roles);

  // Dashboard is allowed for everyone authenticated
  allowed.push(`/${prefix}/dashboard`);

  if (roles.includes('Admin') || permissions?.includes('employees.view')) {
    allowed.push(`/${prefix}/users`);
  }
  if (roles.includes('Admin') || permissions?.includes('timelogs.view') || permissions?.includes('tasks.view')) {
    allowed.push(`/${prefix}/workwise`);
  }
  if (roles.includes('Admin') || permissions?.includes('tools.view')) {
    allowed.push(`/${prefix}/tool`);
  }
  if (roles.includes('Admin') || permissions?.includes('digiconvertor.view')) {
    allowed.push(`/${prefix}/digiconvertor`);
  }
  if (roles.includes('Admin') || permissions?.includes('attendance.view')) {
    allowed.push(`/${prefix}/attendance`);
  }
  if (roles.includes('Admin') || permissions?.includes('projects.view')) {
    allowed.push(`/${prefix}/projects`);
  }
  if (roles.includes('Admin') || permissions?.includes('jobs.view')) {
    allowed.push(`/${prefix}/books`);
  }
  if (roles.includes('Admin') || permissions?.includes('production.view')) {
    allowed.push(`/${prefix}/production`);
  }
  if (roles.includes('Admin') || permissions?.includes('tasks.view')) {
    allowed.push(`/${prefix}/tasks`);
  }
  if (roles.includes('Admin') || permissions?.includes('processes.view')) {
    allowed.push(`/${prefix}/processes`);
  }
  if (roles.includes('Admin') || permissions?.includes('shifts.view')) {
    allowed.push(`/${prefix}/shifts`);
  }
  if (roles.includes('Admin') || permissions?.includes('leaves.view') || permissions?.includes('leaves.view_all')) {
    allowed.push(`/${prefix}/leaves`);
  }
  if (roles.includes('Admin') || permissions?.includes('roles.view')) {
    allowed.push(`/${prefix}/roles`);
  }
  if (roles.includes('Admin') || permissions?.includes('reports.view')) {
    allowed.push(`/${prefix}/reports`);
  }
  if (roles.includes('Admin') || permissions?.includes('hourly_graph.view')) {
    allowed.push(`/${prefix}/hourly-graph`);
  }
  if (roles.includes('Admin') || permissions?.includes('activity_logs.view')) {
    allowed.push(`/${prefix}/activity-logs`);
  }
  if (roles.includes('Admin') || permissions?.includes('timelogs.view_all')) {
    allowed.push(`/${prefix}/timelog`);
  }
  if (roles.includes('Admin') || permissions?.includes('invoices.view')) {
    allowed.push(`/${prefix}/invoices`);
  }

  if (roles.includes('Admin') || permissions?.includes('chat_monitor.view')) {
    allowed.push(`/${prefix}/chat-monitor`);
  }

  if (roles.includes('Admin') || permissions?.includes('settings.view')) {
    allowed.push(`/${prefix}/settings`);
  }
  return allowed;
};

/* ── Admin Layout ── */
const AdminLayout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const user = getCurrentUser();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const roles = user.roles || [];
  const allowedRoutes = getAllowedRoutes(roles, user.permissions || []);
  const path = location.pathname;

  if (!allowedRoutes.includes(path)) {
    if (allowedRoutes.length > 0) {
      return <Navigate to={allowedRoutes[0]} replace />;
    } else {
      return <Navigate to="/executive/dashboard" replace />;
    }
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="app-container">
      <Sidebar isMobileOpen={isMobileMenuOpen} onCloseMobile={closeMobileMenu} />
      <div className="main-wrapper">
        <Header onToggleMobileMenu={toggleMobileMenu} />
        <div className="content-area">
          {children}
        </div>
      </div>
    </div>
  );
};

/* ───────────────────────────── */

function App() {
  return (
    <Router>
      <Routes>

        {/* Default */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />

        {/* Employee */}
        <Route path="/executive/dashboard" element={<EmpDashboard />} />
        <Route path="/workportal" element={<WorkPortal />} />

        {/* Role-Prefixed Routes */}
        <Route path="/:role/dashboard" element={
          <AdminLayout><AdminDashboard /></AdminLayout>
        } />

        <Route path="/:role/users" element={
          <AdminLayout><UserManagement /></AdminLayout>
        } />

        <Route path="/:role/workwise" element={
          <AdminLayout><RoleWorkwiseDashboard /></AdminLayout>
        } />

        <Route path="/:role/attendance" element={
          <AdminLayout><Attendance /></AdminLayout>
        } />

        <Route path="/:role/projects" element={
          <AdminLayout><Project /></AdminLayout>
        } />

        <Route path="/:role/books" element={
          <AdminLayout><BooksJobs /></AdminLayout>
        } />

        <Route path="/:role/production" element={
          <AdminLayout><Production /></AdminLayout>
        } />

        <Route path="/:role/tasks" element={
          <AdminLayout><TaskManagement /></AdminLayout>
        } />

        <Route path="/:role/processes" element={
          <AdminLayout><ProcessManagement /></AdminLayout>
        } />

        <Route path="/:role/shifts" element={
          <AdminLayout><ShiftManagement /></AdminLayout>
        } />

        <Route path="/:role/tool" element={
          <AdminLayout><Tools /></AdminLayout>
        } />

        <Route path="/:role/leaves" element={
          <AdminLayout><Leaves /></AdminLayout>
        } />

        <Route path="/:role/roles" element={
          <AdminLayout><RolesPermission /></AdminLayout>
        } />

        <Route path="/:role/reports" element={
          <AdminLayout><ReportsAnalytics /></AdminLayout>
        } />

        <Route path="/:role/hourly-graph" element={
          <AdminLayout><HourlyGraph /></AdminLayout>
        } />

        <Route path="/:role/activity-logs" element={
          <AdminLayout><ActivityLogs /></AdminLayout>
        } />

        <Route path='/:role/timelog' element={
          <AdminLayout><TimeLog /></AdminLayout>
        } />

        <Route path="/:role/invoices" element={
          <AdminLayout><Invoice /></AdminLayout>
        } />

        <Route path="/:role/settings" element={
          <AdminLayout><Setting /></AdminLayout>
        } />

        <Route path="/:role/chat-monitor" element={
          <AdminLayout><ChatMonitor /></AdminLayout>
        } />

        <Route path="/:role/digiconvertor" element={
          <AdminLayout><DigiConvertor /></AdminLayout>
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
      <ChatWidget />
      <HourlyReminder />
    </Router>
  );
}

export default App;