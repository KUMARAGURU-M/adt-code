-- ================================================
-- R01: SEED DATA - Repeatable migration
-- Runs every time if checksum changes
-- ================================================

-- ROLES
INSERT INTO roles (name, description, is_active) VALUES
    ('Admin', 'Full system access - manages users, projects, tasks, salary, invoices, settings', TRUE),
    ('Manager', 'Can manage employees, assign tasks, view reports. Cannot access payroll/invoices', TRUE),
    ('Employee', 'Work tracking, own leave, own calendar, own task list only', TRUE),
    ('Viewer', 'Read-only access across dashboards and reports', TRUE),
    ('Team Leader', 'Can assign roles to subordinates and manage shift of their team', TRUE)
ON CONFLICT (name) DO NOTHING;

-- SHIFTS
INSERT INTO shifts (name, start_time, end_time, description, is_active) VALUES
    ('1st Shift', '09:00:00', '18:00:00', 'Morning shift 9 AM to 6 PM', TRUE),
    ('2nd Shift', '14:00:00', '23:00:00', 'Afternoon shift 2 PM to 11 PM', TRUE),
    ('Night Shift', '22:00:00', '07:00:00', 'Night shift 10 PM to 7 AM', TRUE),
    ('General Shift', '09:30:00', '18:30:00', 'General shift with flexible timings', TRUE)
ON CONFLICT (name) DO NOTHING;

-- LEAVE TYPES
INSERT INTO leave_types (code, name, description, max_days_per_year, carry_forward, requires_approval, is_active) VALUES
    ('AL', 'Annual Leave', 'Paid annual vacation leave', 12, FALSE, TRUE, TRUE),
    ('SL', 'Sick Leave', 'Medical and health related leave', 6, FALSE, TRUE, TRUE),
    ('CL', 'Casual Leave', 'Short casual leave for personal work', 6, FALSE, FALSE, TRUE),
    ('ML', 'Maternity Leave', 'Maternity leave for female employees', 180, FALSE, TRUE, TRUE),
    ('PL', 'Paternity Leave', 'Paternity leave for male employees', 15, FALSE, TRUE, TRUE)
ON CONFLICT (code) DO NOTHING;

-- LEAVE POLICY
INSERT INTO leave_policies (name, description, default_annual_days, probation_days, year_start_month, year_start_day, is_active) VALUES
    ('ADT Leave Policy 2026', 'Default leave policy for Arrow Data Tech employees', 12, 90, 'January', 1, TRUE)
ON CONFLICT (name) DO NOTHING;

-- PROCESSES
INSERT INTO processes (name, description, is_active) VALUES
    ('EPUB - QC Process', 'Quality check for EPUB conversion', TRUE),
    ('EPUB - Tagging', 'Semantic tagging for EPUB files', TRUE),
    ('FIG - Croping', 'Figure cropping and image processing', TRUE),
    ('INDEX - Process', 'Index creation and formatting', TRUE),
    ('MATH - Keying', 'Mathematical equation keying', TRUE),
    ('OCR - Process', 'Optical character recognition processing', TRUE),
    ('VALID - Process', 'Validation and quality assurance process', TRUE),
    ('REWORK - Process', 'Rework and corrections process', TRUE),
    ('XML - Tagging', 'XML semantic tagging and structuring', TRUE),
    ('WORD - Styling', 'Microsoft Word document styling', TRUE),
    ('Proof Reading - Process', 'Proof reading and copy editing', TRUE)
ON CONFLICT (name) DO NOTHING;

-- TOOLS
INSERT INTO tools (name, description, is_active) VALUES
    ('Digital Converter', 'Convert digital files between formats - PDF, EPUB, XML, HTML', TRUE),
    ('OCR', 'Optical Character Recognition tool for scanned documents', TRUE)
ON CONFLICT (name) DO NOTHING;

-- PERMISSIONS (all resource.action combinations)
INSERT INTO permissions (resource, action, code, description) VALUES
    -- Employees
    ('employees', 'view', 'employees.view', 'View employee list'),
    ('employees', 'view_all', 'employees.view_all', 'View all employees including inactive'),
    ('employees', 'create', 'employees.create', 'Create new employees'),
    ('employees', 'update', 'employees.update', 'Update employee details'),
    ('employees', 'delete', 'employees.delete', 'Delete employees'),
    ('employees', 'manage_roles', 'employees.manage_roles', 'Assign roles to employees'),
    -- Projects
    ('projects', 'view', 'projects.view', 'View projects'),
    ('projects', 'create', 'projects.create', 'Create new projects'),
    ('projects', 'update', 'projects.update', 'Update projects'),
    ('projects', 'delete', 'projects.delete', 'Delete projects'),
    -- Jobs
    ('jobs', 'view', 'jobs.view', 'View jobs/books'),
    ('jobs', 'create', 'jobs.create', 'Create new jobs'),
    ('jobs', 'update', 'jobs.update', 'Update jobs'),
    ('jobs', 'delete', 'jobs.delete', 'Delete jobs'),
    ('jobs', 'bulk_import', 'jobs.bulk_import', 'Bulk import jobs from Excel'),
    -- Tasks
    ('tasks', 'view', 'tasks.view', 'View tasks'),
    ('tasks', 'create', 'tasks.create', 'Create new tasks'),
    ('tasks', 'update', 'tasks.update', 'Update tasks'),
    ('tasks', 'delete', 'tasks.delete', 'Delete tasks'),
    -- Time Logs
    ('timelogs', 'view', 'timelogs.view', 'View own time logs'),
    ('timelogs', 'view_all', 'timelogs.view_all', 'View all employees time logs'),
    -- Attendance
    ('attendance', 'view', 'attendance.view', 'View attendance'),
    ('attendance', 'update', 'attendance.update', 'Override attendance status'),
    -- Leaves
    ('leaves', 'view', 'leaves.view', 'View own leaves'),
    ('leaves', 'view_all', 'leaves.view_all', 'View all employee leaves'),
    ('leaves', 'create', 'leaves.create', 'Apply for leave'),
    ('leaves', 'approve', 'leaves.approve', 'Approve or reject leaves'),
    ('leaves', 'manage_types', 'leaves.manage_types', 'Manage leave types and policies'),
    -- Reports
    ('reports', 'view', 'reports.view', 'View reports and analytics'),
    ('reports', 'export', 'reports.export', 'Export reports to PDF/CSV'),
    -- Invoices
    ('invoices', 'view', 'invoices.view', 'View invoices'),
    ('invoices', 'create', 'invoices.create', 'Create invoices'),
    ('invoices', 'update', 'invoices.update', 'Update invoices'),
    ('invoices', 'delete', 'invoices.delete', 'Delete invoices'),
    ('invoices', 'export', 'invoices.export', 'Export invoices to PDF/CSV'),
    -- Roles
    ('roles', 'view', 'roles.view', 'View roles and permissions'),
    ('roles', 'create', 'roles.create', 'Create roles'),
    ('roles', 'update', 'roles.update', 'Update roles'),
    ('roles', 'delete', 'roles.delete', 'Delete roles'),
    -- Shifts
    ('shifts', 'view', 'shifts.view', 'View shifts'),
    ('shifts', 'manage', 'shifts.manage', 'Create and assign shifts'),
    -- Tools
    ('tools', 'view', 'tools.view', 'View tools'),
    ('tools', 'manage', 'tools.manage', 'Manage tool access for employees'),
    -- Activity Logs
    ('activity_logs', 'view', 'activity_logs.view', 'View activity logs'),
    -- Settings
    ('settings', 'view', 'settings.view', 'View company settings'),
    ('settings', 'update', 'settings.update', 'Update company settings'),
    -- Processes
    ('processes', 'view', 'processes.view', 'View processes'),
    ('processes', 'manage', 'processes.manage', 'Create and manage processes')
ON CONFLICT (code) DO NOTHING;

-- COMPANY SETTINGS (singleton)
INSERT INTO company_settings (
    company_name, street_address, city, state, country, zip_code,
    company_location, portal_name, welcome_message,
    primary_color, secondary_color, enable_top_performer_banner,
    authorized_person_name, designation
) VALUES (
    'Arrow Data-Tech',
    '407, M.G Road, Kottakuppam, (Near Roundana), Near Puducherry',
    'Kottakuppam, Villupuram District',
    'Tamil Nadu',
    'India',
    '605014',
    'Puducherry',
    'ADT - Production Login Portal',
    'Welcome Back! Please Login to Continue',
    '#c28595',
    '#f0979c',
    TRUE,
    'T. Mohamed Usen',
    'Managing Director'
);

-- HOLIDAY CALENDAR 2026 (Tamil Nadu / Puducherry)
INSERT INTO holiday_calendar (holiday_name, holiday_date, holiday_type, is_optional, applicable_year) VALUES
    ('New Year Day', '2026-01-01', 'National', FALSE, 2026),
    ('Republic Day', '2026-01-26', 'National', FALSE, 2026),
    ('Tamil New Year / Puthandu', '2026-04-14', 'Regional', FALSE, 2026),
    ('Good Friday', '2026-04-03', 'National', FALSE, 2026),
    ('Independence Day', '2026-08-15', 'National', FALSE, 2026),
    ('Gandhi Jayanti', '2026-10-02', 'National', FALSE, 2026),
    ('Diwali', '2026-10-20', 'National', FALSE, 2026),
    ('Christmas Day', '2026-12-25', 'National', FALSE, 2026)
ON CONFLICT (holiday_date) DO NOTHING;

---- ================================================
---- SEED: DEFAULT ADMIN USER
---- Password: Admin@123 (bcrypt hash below)
---- CHANGE THIS PASSWORD on first login
---- ================================================
--
---- Insert default admin user
--INSERT INTO users (id, user_code, email, password_hash, is_active, created_at, updated_at)
--VALUES (
--    gen_random_uuid(),
--    '1',
--    'admin@arrowdatatech.com',
--    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TsCkNbGjbMy6NJLP/h6mHCW7nRMS',
--    TRUE,
--    NOW(),
--    NOW()
--)
--ON CONFLICT (user_code) DO NOTHING;
--
---- Get the admin user id and create profile
--WITH admin_user AS (
--    SELECT id FROM users WHERE user_code = '1'
--),
--admin_role AS (
--    SELECT id FROM roles WHERE name = 'Admin'
--)
---- Insert employee profile
--INSERT INTO employee_profiles (id, user_id, full_name, phone, timezone, is_top_performer, show_calendar_stats, created_at, updated_at)
--SELECT gen_random_uuid(), u.id, 'T. Mohamed Usen', '+91 9884562152', 'Asia/Kolkata', FALSE, TRUE, NOW(), NOW()
--FROM admin_user u
--ON CONFLICT (user_id) DO NOTHING;
--
---- Assign Admin role
--WITH admin_user AS (SELECT id FROM users WHERE user_code = '1'),
--     admin_role AS (SELECT id FROM roles WHERE name = 'Admin')
--INSERT INTO user_role_assignments (id, user_id, role_id, created_at)
--SELECT gen_random_uuid(), u.id, r.id, NOW()
--FROM admin_user u, admin_role r
--ON CONFLICT (user_id, role_id) DO NOTHING;
--
---- Create salary details (empty initially)
--WITH admin_user AS (SELECT id FROM users WHERE user_code = '1')
--INSERT INTO employee_salary_details (id, user_id, salary_type, created_at, updated_at)
--SELECT gen_random_uuid(), u.id, 'Monthly', NOW(), NOW()
--FROM admin_user u
--ON CONFLICT (user_id) DO NOTHING;

-- ================================================
-- ROLE PERMISSIONS ASSIGNMENTS
-- ================================================

-- Admin gets ALL permissions
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT gen_random_uuid(), r.id, p.id, NOW()
FROM roles r, permissions p
WHERE r.name = 'Admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Manager permissions
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT gen_random_uuid(), r.id, p.id, NOW()
FROM roles r, permissions p
WHERE r.name = 'Manager'
AND p.code IN (
    'employees.view','employees.create','employees.update',
    'employees.manage_roles',
    'projects.view','projects.create','projects.update',
    'jobs.view','jobs.create','jobs.update','jobs.bulk_import',
    'tasks.view','tasks.create','tasks.update',
    'timelogs.view','timelogs.view_all',
    'attendance.view','attendance.update',
    'leaves.view','leaves.view_all','leaves.approve',
    'reports.view','reports.export',
    'processes.view','processes.manage',
    'shifts.view','shifts.manage',
    'tools.view','activity_logs.view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Employee permissions
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT gen_random_uuid(), r.id, p.id, NOW()
FROM roles r, permissions p
WHERE r.name = 'Employee'
AND p.code IN (
    'timelogs.view','leaves.view','leaves.create',
    'attendance.view','tasks.view','projects.view',
    'processes.view','tools.view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Viewer permissions
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT gen_random_uuid(), r.id, p.id, NOW()
FROM roles r, permissions p
WHERE r.name = 'Viewer'
AND p.code IN (
    'employees.view','projects.view','jobs.view',
    'tasks.view','timelogs.view_all',
    'attendance.view','reports.view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Team Leader permissions
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT gen_random_uuid(), r.id, p.id, NOW()
FROM roles r, permissions p
WHERE r.name = 'Team Leader'
AND p.code IN (
    'employees.view','employees.manage_roles',
    'tasks.view','tasks.create','tasks.update',
    'projects.view','timelogs.view','timelogs.view_all',
    'attendance.view','leaves.view','leaves.approve',
    'shifts.view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;


-- ================================================
-- SEED ATTENDANCE EMPLOYEES
-- Initial staff list from Attendance.js SEED_EMPLOYEES
-- ================================================

--INSERT INTO attendance_employees (name, category, base_salary, sort_order) VALUES
--    ('M. Ayeesha',    'Employee',       5000.00, 1),
--    ('A. Shakina',    'Employee',       5000.00, 2),
--    ('G. Nilai',      'Admin',            5000.00, 3),
--    ('P. Magesh',     'Employee',5000.00, 4),
--    ('S. Narkis',     'Employee',5000.00, 5),
--    ('A. Elavarasi',  'Employee',  5000.00, 6),
--    ('Mohana',        'Employee',  5000.00, 7),
--    ('Suleka',        'Employee',  5000.00, 8),
--    ('Jayanthi',      'Employee',  5000.00, 9),
--    ('Vasanthi',      'Employee',  5000.00, 10),
--    ('Gowri',         'Employee',  5000.00, 11),
--    ('Safrin',        'Team Leader',         5000.00, 12),
--    ('Rasheetha',     'Manager',         5000.00, 13),
--    ('Thaslima',      'Employee',         5000.00, 14),
--    ('Jenifer',       'Employee',         5000.00, 15),
--    ('Buela',         'Employee',         5000.00, 16),
--    ('Reeta',         'Employee',         5000.00, 17);