// src/App.js

import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import './company/company.css';

/* ── Company Public Site ── */
import CompanyErrorBoundary from './company/components/system/ErrorBoundary';

/* ── Layouts ── */
import Sidebar from './components/layouts/Sidebar';
import Header from './components/layouts/Header';

/* ── Auth ── */
import Login from './pages/auth/Login/Login';

/* ── Employee Portal ── */
import EmpDashboard from './pages/user/EmpDashboard';
import WorkPortal from './pages/user/WorkPortal';
import EmpWorkwise from './pages/user/EmpWorkwise';
import EmpCalendar from './pages/user/EmpCalendar';
import EmpTask from './pages/user/EmpTask';
import EmpLeave from './pages/user/EmpLeave';

/* ── Developer Persona ── */
import DeveloperDashboard from './pages/developer/DeveloperDashboard';

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
import ContactInquiries from './pages/admin/ContactInquiries';
import CareerApplications from './pages/admin/CareerApplications';

import EmpCheckInGuard from './components/layouts/EmpCheckInGuard';

import { getCurrentUser, getRolePrefix, refreshCurrentUser } from './utils/api';

/* ── Lazy Loaded Company Public Site ── */
const CompanyNavbar = lazy(() => import('./company/components/common/Navbar'));
const CompanyFooter = lazy(() => import('./company/components/common/Footer'));
const CompanyRouteEffects = lazy(() => import('./company/components/system/RouteEffects'));
const CompanyPageLoader = lazy(() => import('./company/components/system/PageLoader'));

const CompanyHome = lazy(() => import('./company/pages/Home'));
const CompanyServicesOverview = lazy(() => import('./company/pages/ServicesOverview'));
const CompanyServiceDetail = lazy(() => import('./company/pages/ServiceDetail'));
const CompanyAbout = lazy(() => import('./company/pages/About'));
const CompanyContact = lazy(() => import('./company/pages/Contact'));
const CompanyCareers = lazy(() => import('./company/pages/Careers'));
const CompanySitemap = lazy(() => import('./company/pages/Sitemap'));

/* ── Company Website Layout Wrapper ── */
const CompanyLayout = ({ children }) => {
  return (
    <div className="company-root-wrapper">
      <CompanyErrorBoundary>
        <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
          <CompanyRouteEffects />
          <CompanyNavbar />
          <Suspense fallback={<CompanyPageLoader />}>
            {children}
          </Suspense>
          <CompanyFooter />
        </Suspense>
      </CompanyErrorBoundary>
    </div>
  );
};

/* ── Role Component Wrappers ── */
const RoleDashboardWrapper = () => {
  const user = getCurrentUser();
  const roles = user?.roles || [];
  const hasDevRole = roles.some(r => r.startsWith('Dev-') || r.toLowerCase().startsWith('dev-'));
  const isAdmin = roles.includes('Admin');

  if (hasDevRole) {
    if (!isAdmin) {
      return <DeveloperDashboard />;
    }
    const personaMode = localStorage.getItem('active_persona_mode') || 'developer';
    if (personaMode === 'developer') {
      return <DeveloperDashboard />;
    }
  }
  return <AdminDashboard />;
};

const RoleWorkwiseWrapper = () => {
  const user = getCurrentUser();
  const roles = user?.roles || [];
  const hasDevRole = roles.some(r => r.startsWith('Dev-') || r.toLowerCase().startsWith('dev-'));
  const isEmp = hasDevRole || getRolePrefix(roles) === 'executive' || ((roles.includes('Employee') || roles.includes('Executive')) && !roles.includes('Admin') && !roles.includes('Manager') && !roles.includes('Team Leader'));
  return isEmp ? <EmpWorkwise /> : <RoleWorkwiseDashboard />;
};

const RoleTasksWrapper = () => {
  const user = getCurrentUser();
  const roles = user?.roles || [];
  const hasDevRole = roles.some(r => r.startsWith('Dev-') || r.toLowerCase().startsWith('dev-'));
  const isEmp = hasDevRole || getRolePrefix(roles) === 'executive' || ((roles.includes('Employee') || roles.includes('Executive')) && !roles.includes('Admin') && !roles.includes('Manager') && !roles.includes('Team Leader'));
  return isEmp ? <EmpTask /> : <TaskManagement />;
};

const RoleLeavesWrapper = () => {
  const user = getCurrentUser();
  const roles = user?.roles || [];
  const hasDevRole = roles.some(r => r.startsWith('Dev-') || r.toLowerCase().startsWith('dev-'));
  const isEmp = hasDevRole || getRolePrefix(roles) === 'executive' || ((roles.includes('Employee') || roles.includes('Executive')) && !roles.includes('Admin') && !roles.includes('Manager') && !roles.includes('Team Leader'));
  return isEmp ? <EmpLeave /> : <Leaves />;
};

/* ── Route Authorization ── */
const getAllowedRoutes = (roles, permissions) => {
  if (!roles) return [];
  const allowed = [];
  const prefix = getRolePrefix(roles);

  // Dashboard is allowed for everyone authenticated
  allowed.push(`/workwise/${prefix}/dashboard`);
  allowed.push(`/workwise/${prefix}/developer-dashboard`);

  const hasDevRole = roles.some(r => r.startsWith('Dev-') || r.toLowerCase().startsWith('dev-'));
  const isDevRole = roles.includes('Dev-role') || roles.includes('DEV-role') || roles.includes('dev-role');
  if (isDevRole) {
    allowed.push(`/workwise/${prefix}/roles`);
  }

  const isEmployeeOnly = !hasDevRole && (prefix === 'executive' || ((roles.includes('Employee') || roles.includes('Executive')) && !roles.includes('Admin') && !roles.includes('Manager') && !roles.includes('Team Leader')));
  if (isEmployeeOnly) {
    allowed.push(`/workwise/${prefix}/workwise`);
    allowed.push(`/workwise/${prefix}/digiconvertor`);
    allowed.push(`/workwise/${prefix}/hourly-graph`);
    allowed.push(`/workwise/${prefix}/calendar`);
    allowed.push(`/workwise/${prefix}/tasks`);
    allowed.push(`/workwise/${prefix}/leaves`);
    return allowed;
  }

  if (roles.includes('Admin') || permissions?.includes('employees.view')) {
    allowed.push(`/workwise/${prefix}/users`);
  }
  if (roles.includes('Admin') || permissions?.includes('timelogs.view') || permissions?.includes('tasks.view')) {
    allowed.push(`/workwise/${prefix}/workwise`);
  }
  if (roles.includes('Admin') || permissions?.includes('tools.view')) {
    allowed.push(`/workwise/${prefix}/tool`);
  }
  if (roles.includes('Admin') || permissions?.includes('digiconvertor.view')) {
    allowed.push(`/workwise/${prefix}/digiconvertor`);
  }
  if (roles.includes('Admin') || permissions?.includes('attendance.view')) {
    allowed.push(`/workwise/${prefix}/attendance`);
  }
  if (roles.includes('Admin') || permissions?.includes('projects.view')) {
    allowed.push(`/workwise/${prefix}/projects`);
  }
  if (roles.includes('Admin') || permissions?.includes('jobs.view')) {
    allowed.push(`/workwise/${prefix}/books`);
  }
  if (roles.includes('Admin') || permissions?.includes('production.view')) {
    allowed.push(`/workwise/${prefix}/production`);
  }
  if (roles.includes('Admin') || permissions?.includes('tasks.view')) {
    allowed.push(`/workwise/${prefix}/tasks`);
  }
  if (roles.includes('Admin') || permissions?.includes('processes.view')) {
    allowed.push(`/workwise/${prefix}/processes`);
  }
  if (roles.includes('Admin') || permissions?.includes('shifts.view')) {
    allowed.push(`/workwise/${prefix}/shifts`);
  }
  if (roles.includes('Admin') || permissions?.includes('leaves.view') || permissions?.includes('leaves.view_all')) {
    allowed.push(`/workwise/${prefix}/leaves`);
  }
  if (roles.includes('Admin') || permissions?.includes('roles.view')) {
    allowed.push(`/workwise/${prefix}/roles`);
  }
  if (roles.includes('Admin') || permissions?.includes('reports.view')) {
    allowed.push(`/workwise/${prefix}/reports`);
  }
  if (roles.includes('Admin') || permissions?.includes('hourly_graph.view')) {
    allowed.push(`/workwise/${prefix}/hourly-graph`);
  }
  if (roles.includes('Admin') || permissions?.includes('activity_logs.view')) {
    allowed.push(`/workwise/${prefix}/activity-logs`);
  }
  if (roles.includes('Admin') || permissions?.includes('timelogs.view_all')) {
    allowed.push(`/workwise/${prefix}/timelog`);
  }
  if (roles.includes('Admin') || permissions?.includes('invoices.view')) {
    allowed.push(`/workwise/${prefix}/invoices`);
  }

  if (roles.includes('Admin') || permissions?.includes('chat_monitor.view')) {
    allowed.push(`/workwise/${prefix}/chat-monitor`);
  }

  if (roles.includes('Admin') || permissions?.includes('contact_inquiries.view')) {
    allowed.push(`/workwise/${prefix}/contact-inquiries`);
  }
  if (roles.includes('Admin') || permissions?.includes('career_applications.view')) {
    allowed.push(`/workwise/${prefix}/career-applications`);
  }

  if (roles.includes('Admin') || permissions?.includes('settings.view')) {
    allowed.push(`/workwise/${prefix}/settings`);
  }

  allowed.push(`/workwise/${prefix}/calendar`);
  return allowed;
};

/* ── Admin Layout ── */
const AdminLayout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const user = getCurrentUser();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/workwise/login" replace />;
  }

  const roles = user.roles || [];
  const allowedRoutes = getAllowedRoutes(roles, user.permissions || []);
  const path = location.pathname;

  if (!allowedRoutes.includes(path)) {
    if (allowedRoutes.length > 0) {
      return <Navigate to={allowedRoutes[0]} replace />;
    } else {
      return <Navigate to="/workwise/executive/dashboard" replace />;
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
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const initSession = async () => {
      const user = getCurrentUser();
      if (user) {
        try {
          await refreshCurrentUser();
        } catch (e) {
          console.error("Failed to initialize session on start:", e);
        }
      }
      setLoading(false);
    };
    initSession();
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f8fafc',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #6366f1',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>Initializing session...</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* ========================================== */}
        {/* PUBLIC COMPANY PAGES (Served at root /)     */}
        {/* ========================================== */}
        <Route path="/" element={<CompanyLayout><CompanyHome /></CompanyLayout>} />
        <Route path="/about" element={<CompanyLayout><CompanyAbout /></CompanyLayout>} />
        <Route path="/services" element={<CompanyLayout><CompanyServicesOverview /></CompanyLayout>} />
        <Route path="/services/:slug" element={<CompanyLayout><CompanyServiceDetail /></CompanyLayout>} />
        <Route path="/contact" element={<CompanyLayout><CompanyContact /></CompanyLayout>} />
        <Route path="/careers" element={<CompanyLayout><CompanyCareers /></CompanyLayout>} />
        <Route path="/sitemap" element={<CompanyLayout><CompanySitemap /></CompanyLayout>} />

        {/* ========================================== */}
        {/* EMPLOYEE PORTAL PAGES (Prefixed with /workwise) */}
        {/* ========================================== */}
        <Route path="/workwise">
          {/* Default redirect: /workwise -> /workwise/login */}
          <Route index element={<Navigate to="login" replace />} />

          {/* Auth */}
          <Route path="login" element={<Login />} />

          {/* Employee */}
          <Route path="executive/dashboard" element={
            <AdminLayout><RoleDashboardWrapper /></AdminLayout>
          } />
          <Route path="workportal" element={<WorkPortal />} />

          {/* Role-Prefixed Routes */}
          <Route path=":role/dashboard" element={
            <AdminLayout><RoleDashboardWrapper /></AdminLayout>
          } />
          <Route path=":role/developer-dashboard" element={
            <AdminLayout><DeveloperDashboard /></AdminLayout>
          } />
          <Route path="developer/dashboard" element={
            <AdminLayout><DeveloperDashboard /></AdminLayout>
          } />

          <Route path=":role/users" element={
            <AdminLayout><UserManagement /></AdminLayout>
          } />

          <Route path=":role/workwise" element={
            <AdminLayout>
              <EmpCheckInGuard pageName="WorkWise">
                <RoleWorkwiseWrapper />
              </EmpCheckInGuard>
            </AdminLayout>
          } />

          <Route path=":role/attendance" element={
            <AdminLayout><Attendance /></AdminLayout>
          } />

          <Route path=":role/projects" element={
            <AdminLayout><Project /></AdminLayout>
          } />

          <Route path=":role/books" element={
            <AdminLayout><BooksJobs /></AdminLayout>
          } />

          <Route path=":role/production" element={
            <AdminLayout><Production /></AdminLayout>
          } />

          <Route path=":role/tasks" element={
            <AdminLayout>
              <EmpCheckInGuard pageName="Tasks">
                <RoleTasksWrapper />
              </EmpCheckInGuard>
            </AdminLayout>
          } />

          <Route path=":role/processes" element={
            <AdminLayout><ProcessManagement /></AdminLayout>
          } />

          <Route path=":role/shifts" element={
            <AdminLayout><ShiftManagement /></AdminLayout>
          } />

          <Route path=":role/tool" element={
            <AdminLayout><Tools /></AdminLayout>
          } />

          <Route path=":role/leaves" element={
            <AdminLayout>
              <EmpCheckInGuard pageName="Leaves">
                <RoleLeavesWrapper />
              </EmpCheckInGuard>
            </AdminLayout>
          } />

          <Route path=":role/calendar" element={
            <AdminLayout>
              <EmpCheckInGuard pageName="Calendar">
                <EmpCalendar />
              </EmpCheckInGuard>
            </AdminLayout>
          } />

          <Route path=":role/roles" element={
            <AdminLayout><RolesPermission /></AdminLayout>
          } />

          <Route path=":role/reports" element={
            <AdminLayout><ReportsAnalytics /></AdminLayout>
          } />

          <Route path=":role/hourly-graph" element={
            <AdminLayout>
              <EmpCheckInGuard pageName="Hourly Graph">
                <HourlyGraph />
              </EmpCheckInGuard>
            </AdminLayout>
          } />

          <Route path=":role/activity-logs" element={
            <AdminLayout><ActivityLogs /></AdminLayout>
          } />

          <Route path=':role/timelog' element={
            <AdminLayout><TimeLog /></AdminLayout>
          } />

          <Route path=":role/invoices" element={
            <AdminLayout><Invoice /></AdminLayout>
          } />

          <Route path=":role/settings" element={
            <AdminLayout><Setting /></AdminLayout>
          } />

          <Route path=":role/chat-monitor" element={
            <AdminLayout><ChatMonitor /></AdminLayout>
          } />

          <Route path=":role/digiconvertor" element={
            <AdminLayout>
              <EmpCheckInGuard pageName="DigiConvertor">
                <DigiConvertor />
              </EmpCheckInGuard>
            </AdminLayout>
          } />

          <Route path=":role/contact-inquiries" element={
            <AdminLayout><ContactInquiries /></AdminLayout>
          } />

          <Route path=":role/career-applications" element={
            <AdminLayout><CareerApplications /></AdminLayout>
          } />

          {/* Catch-all for unmatched subpaths inside /workwise/* goes to login */}
          <Route path="*" element={<Navigate to="login" replace />} />
        </Route>

        {/* Catch-all for unmatched root paths redirects to company homepage */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
      <ChatWidget />
      <HourlyReminder />
    </Router>
  );
}

export default App;
