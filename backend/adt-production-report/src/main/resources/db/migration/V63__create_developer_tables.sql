-- ================================================
-- V63: DEVELOPER PORTAL TABLES
-- Tables for Developer Persona (dev_*)
-- ================================================

-- 1. Developer Projects
CREATE TABLE dev_projects (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    technologies VARCHAR(500),
    repository_url VARCHAR(500),
    status VARCHAR(50) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Developer Tasks
CREATE TABLE dev_tasks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES dev_projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    completed_date DATE,
    priority VARCHAR(50) NOT NULL DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
    status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Review', 'Completed', 'Correction')),
    correction VARCHAR(255),
    feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Developer Code Corrections
CREATE TABLE dev_corrections (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES dev_tasks(id) ON DELETE CASCADE,
    project_id UUID REFERENCES dev_projects(id) ON DELETE SET NULL,
    correction VARCHAR(255) NOT NULL,
    lead_comment TEXT,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
    developer_reply TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending Fix' CHECK (status IN ('Pending Fix', 'In Review', 'Resolved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Developer Overtime (Exclusive to Dev- roles)
CREATE TABLE dev_overtime (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    overtime_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time VARCHAR(50),
    end_time VARCHAR(50),
    overtime_hours NUMERIC(5,2) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Developer Meetings
CREATE TABLE dev_meetings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    project_id UUID REFERENCES dev_projects(id) ON DELETE SET NULL,
    meeting_date DATE NOT NULL DEFAULT CURRENT_DATE,
    time_block VARCHAR(100) NOT NULL,
    location VARCHAR(255),
    agenda VARCHAR(500),
    discussion TEXT,
    decisions TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Meeting Attendees (Join Table)
CREATE TABLE dev_meeting_attendees (
    meeting_id UUID NOT NULL REFERENCES dev_meetings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (meeting_id, user_id)
);

-- 7. Meeting Action Items
CREATE TABLE dev_meeting_action_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    meeting_id UUID NOT NULL REFERENCES dev_meetings(id) ON DELETE CASCADE,
    text VARCHAR(500) NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Developer Technical Documentation (File Manager)
CREATE TABLE dev_tech_docs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    content TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Initial Projects for development testing
INSERT INTO dev_projects (name, description, technologies, repository_url, status)
VALUES 
('DigiConvertor Platform', 'Core PDF/Word extraction engine and pipeline.', 'React, Spring Boot, Postgres', 'https://github.com/arrowdatatech/digiconvertor', 'Active'),
('Data Ingestion Suite', 'Bulk import daemon parsing XML specifications.', 'Python, Celery, Redis', 'https://github.com/arrowdatatech/ingestion-suite', 'Active'),
('Analytics Engine', 'Production activity logs report and charts widget.', 'Node.js, Express, ChartJS', 'https://github.com/arrowdatatech/analytics-engine', 'Active');

-- ================================================
-- DEVELOPER PORTAL PERMISSIONS SEEDING
-- ================================================

-- 1. Add developer page permissions (Access Control)
INSERT INTO permissions (resource, action, code, description)
VALUES
    ('developer', 'dashboard',   'developer.dashboard',   'Access Developer Dashboard tab'),
    ('developer', 'projects',    'developer.projects',    'Access Developer Projects tab'),
    ('developer', 'tasks',       'developer.tasks',       'Access Developer Tasks tab'),
    ('developer', 'meetings',    'developer.meetings',    'Access Developer Meetings tab'),
    ('developer', 'corrections', 'developer.corrections', 'Access Developer Corrections tab'),
    ('developer', 'workwise',    'developer.workwise',    'Access Developer Workwise tab'),
    ('developer', 'leave',       'developer.leave',       'Access Developer Leaves tab'),
    ('developer', 'reports',     'developer.reports',     'Access Developer Reports tab')
ON CONFLICT (code) DO NOTHING;

-- 2. Add individual developer action permissions
INSERT INTO permissions (resource, action, code, description)
VALUES
    ('developer_dashboard', 'create',  'developer_dashboard.create',  'Create Developer Dashboard records'),
    ('developer_dashboard', 'delete',  'developer_dashboard.delete',  'Delete Developer Dashboard records'),
    ('developer_dashboard', 'approve', 'developer_dashboard.approve', 'Approve Developer Dashboard records'),
    ('developer_dashboard', 'update',  'developer_dashboard.update',  'Update Developer Dashboard records'),
    ('developer_dashboard', 'view',    'developer_dashboard.view',    'View Developer Dashboard records'),

    ('developer_projects', 'create',  'developer_projects.create',  'Create Developer Projects'),
    ('developer_projects', 'delete',  'developer_projects.delete',  'Delete Developer Projects'),
    ('developer_projects', 'approve', 'developer_projects.approve', 'Approve Developer Projects'),
    ('developer_projects', 'update',  'developer_projects.update',  'Update Developer Projects'),
    ('developer_projects', 'view',    'developer_projects.view',    'View Developer Projects'),

    ('developer_tasks', 'create',  'developer_tasks.create',  'Create Developer Tasks'),
    ('developer_tasks', 'delete',  'developer_tasks.delete',  'Delete Developer Tasks'),
    ('developer_tasks', 'approve', 'developer_tasks.approve', 'Approve Developer Tasks'),
    ('developer_tasks', 'update',  'developer_tasks.update',  'Update Developer Tasks'),
    ('developer_tasks', 'view',    'developer_tasks.view',    'View Developer Tasks'),

    ('developer_meetings', 'create',  'developer_meetings.create',  'Create Developer Meetings'),
    ('developer_meetings', 'delete',  'developer_meetings.delete',  'Delete Developer Meetings'),
    ('developer_meetings', 'approve', 'developer_meetings.approve', 'Approve Developer Meetings'),
    ('developer_meetings', 'update',  'developer_meetings.update',  'Update Developer Meetings'),
    ('developer_meetings', 'view',    'developer_meetings.view',    'View Developer Meetings'),

    ('developer_corrections', 'create',  'developer_corrections.create',  'Create Developer Corrections'),
    ('developer_corrections', 'delete',  'developer_corrections.delete',  'Delete Developer Corrections'),
    ('developer_corrections', 'approve', 'developer_corrections.approve', 'Approve Developer Corrections'),
    ('developer_corrections', 'update',  'developer_corrections.update',  'Update Developer Corrections'),
    ('developer_corrections', 'view',    'developer_corrections.view',    'View Developer Corrections'),

    ('developer_workwise', 'create',  'developer_workwise.create',  'Create Developer Workwise records'),
    ('developer_workwise', 'delete',  'developer_workwise.delete',  'Delete Developer Workwise records'),
    ('developer_workwise', 'approve', 'developer_workwise.approve', 'Approve Developer Workwise records'),
    ('developer_workwise', 'update',  'developer_workwise.update',  'Update Developer Workwise records'),
    ('developer_workwise', 'view',    'developer_workwise.view',    'View Developer Workwise records'),

    ('developer_leave', 'create',  'developer_leave.create',  'Create Developer Leave records'),
    ('developer_leave', 'delete',  'developer_leave.delete',  'Delete Developer Leave records'),
    ('developer_leave', 'approve', 'developer_leave.approve', 'Approve Developer Leave records'),
    ('developer_leave', 'update',  'developer_leave.update',  'Update Developer Leave records'),
    ('developer_leave', 'view',    'developer_leave.view',    'View Developer Leave records'),

    ('developer_reports', 'create',  'developer_reports.create',  'Create Developer Reports'),
    ('developer_reports', 'delete',  'developer_reports.delete',  'Delete Developer Reports'),
    ('developer_reports', 'approve', 'developer_reports.approve', 'Approve Developer Reports'),
    ('developer_reports', 'update',  'developer_reports.update',  'Update Developer Reports'),
    ('developer_reports', 'view',    'developer_reports.view',    'View Developer Reports')
ON CONFLICT (code) DO NOTHING;

-- 3. Grant page-level and action-level permissions to the Admin role automatically
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT gen_random_uuid(), r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Admin'
  AND p.code IN (
    'developer.dashboard',
    'developer.projects',
    'developer.tasks',
    'developer.meetings',
    'developer.corrections',
    'developer.workwise',
    'developer.leave',
    'developer.reports',
    'developer_dashboard.create', 'developer_dashboard.delete', 'developer_dashboard.approve', 'developer_dashboard.update', 'developer_dashboard.view',
    'developer_projects.create', 'developer_projects.delete', 'developer_projects.approve', 'developer_projects.update', 'developer_projects.view',
    'developer_tasks.create', 'developer_tasks.delete', 'developer_tasks.approve', 'developer_tasks.update', 'developer_tasks.view',
    'developer_meetings.create', 'developer_meetings.delete', 'developer_meetings.approve', 'developer_meetings.update', 'developer_meetings.view',
    'developer_corrections.create', 'developer_corrections.delete', 'developer_corrections.approve', 'developer_corrections.update', 'developer_corrections.view',
    'developer_workwise.create', 'developer_workwise.delete', 'developer_workwise.approve', 'developer_workwise.update', 'developer_workwise.view',
    'developer_leave.create', 'developer_leave.delete', 'developer_leave.approve', 'developer_leave.update', 'developer_leave.view',
    'developer_reports.create', 'developer_reports.delete', 'developer_reports.approve', 'developer_reports.update', 'developer_reports.view'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 4. Grant page-level and action-level permissions to Dev-role, DEV-role, dev-role if they exist in the DB
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT gen_random_uuid(), r.id, p.id
FROM roles r, permissions p
WHERE r.name IN ('Dev-role', 'DEV-role', 'dev-role')
  AND p.code IN (
    'developer.dashboard',
    'developer.projects',
    'developer.tasks',
    'developer.meetings',
    'developer.corrections',
    'developer.workwise',
    'developer.leave',
    'developer.reports',
    'developer_dashboard.create', 'developer_dashboard.delete', 'developer_dashboard.approve', 'developer_dashboard.update', 'developer_dashboard.view',
    'developer_projects.create', 'developer_projects.delete', 'developer_projects.approve', 'developer_projects.update', 'developer_projects.view',
    'developer_tasks.create', 'developer_tasks.delete', 'developer_tasks.approve', 'developer_tasks.update', 'developer_tasks.view',
    'developer_meetings.create', 'developer_meetings.delete', 'developer_meetings.approve', 'developer_meetings.update', 'developer_meetings.view',
    'developer_corrections.create', 'developer_corrections.delete', 'developer_corrections.approve', 'developer_corrections.update', 'developer_corrections.view',
    'developer_workwise.create', 'developer_workwise.delete', 'developer_workwise.approve', 'developer_workwise.update', 'developer_workwise.view',
    'developer_leave.create', 'developer_leave.delete', 'developer_leave.approve', 'developer_leave.update', 'developer_leave.view',
    'developer_reports.create', 'developer_reports.delete', 'developer_reports.approve', 'developer_reports.update', 'developer_reports.view'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 5. Grant page-level and action-level developer permissions to Dev-Developer role
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT gen_random_uuid(), r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Dev-Developer'
  AND p.code IN (
    'developer.dashboard',
    'developer.projects',
    'developer.tasks',
    'developer.meetings',
    'developer.corrections',
    'developer.workwise',
    'developer.leave',
    'developer.reports',
    'developer_dashboard.create', 'developer_dashboard.delete', 'developer_dashboard.approve', 'developer_dashboard.update', 'developer_dashboard.view',
    'developer_projects.create', 'developer_projects.delete', 'developer_projects.approve', 'developer_projects.update', 'developer_projects.view',
    'developer_tasks.create', 'developer_tasks.delete', 'developer_tasks.approve', 'developer_tasks.update', 'developer_tasks.view',
    'developer_meetings.create', 'developer_meetings.delete', 'developer_meetings.approve', 'developer_meetings.update', 'developer_meetings.view',
    'developer_corrections.create', 'developer_corrections.delete', 'developer_corrections.approve', 'developer_corrections.update', 'developer_corrections.view',
    'developer_workwise.create', 'developer_workwise.delete', 'developer_workwise.approve', 'developer_workwise.update', 'developer_workwise.view',
    'developer_leave.create', 'developer_leave.delete', 'developer_leave.approve', 'developer_leave.update', 'developer_leave.view',
    'developer_reports.create', 'developer_reports.delete', 'developer_reports.approve', 'developer_reports.update', 'developer_reports.view'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;
