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
import ActivityLogs from './pages/admin/ActivityLogs';
import RolesPermission from './pages/admin/RolesPermission';
import Setting from './pages/admin/Setting';
import Tools from './pages/admin/Tools';
import RoleWorkwiseDashboard from './pages/user/RoleWorkwiseDashboard';
import TimeLog from './pages/admin/TimeLog';
import Invoice from './pages/admin/Invoice';
import ChatMonitor from './pages/admin/ChatMonitor';
import ChatWidget from './components/layouts/ChatWidget';

import { getCurrentUser } from './utils/api';

/* ── Route Authorization ── */
const getAllowedRoutes = (roles) => {
  if (!roles) return [];
  if (roles.includes('Admin')) {
    return [
      '/admin/dashboard',
      '/admin/users',
      '/admin/workwise',
      '/admin/attendance',
      '/admin/projects',
      '/admin/books',
      '/admin/production',
      '/admin/tasks',
      '/admin/processes',
      '/admin/shifts',
      '/admin/tool',
      '/admin/leaves',
      '/admin/roles',
      '/admin/reports',
      '/admin/activity-logs',
      '/admin/timelog',
      '/admin/invoices',
      '/admin/chat-monitor',
      '/admin/settings'
    ];
  }

  if (roles.includes('Manager')) {
    return [
      '/manager/dashboard',
      '/manager/workwise',
      '/manager/books',
      '/manager/production',
      '/manager/tasks',
      '/manager/processes',
      '/manager/shifts',
      '/manager/leaves',
      '/manager/reports',
      '/manager/timelog'
    ];
  }

  if (roles.includes('Team Leader')) {
    return [
      '/team-leader/dashboard',
      '/team-leader/workwise',
      '/team-leader/books',
      '/team-leader/production',
      '/team-leader/tasks',
      '/team-leader/reports',
      '/team-leader/timelog'
    ];
  }

  if (roles.includes('Employee')) {
    return [
      '/employee/workwise',
      '/employee/production'
    ];
  }

  return [];
};

/* ── Admin Layout ── */
const AdminLayout = ({ children }) => {
  const user = getCurrentUser();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const roles = user.roles || [];
  const allowedRoutes = getAllowedRoutes(roles);
  const path = location.pathname;

  if (!allowedRoutes.includes(path)) {
    if (allowedRoutes.length > 0) {
      return <Navigate to={allowedRoutes[0]} replace />;
    } else {
      return <Navigate to="/employee/dashboard" replace />;
    }
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-wrapper">
        <Header />
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
        <Route path="/employee/dashboard" element={<EmpDashboard />} />
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

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
      <ChatWidget />
    </Router>
  );
}

export default App;