-- V68: Add Contact and Careers permissions to roles & permissions management

INSERT INTO permissions (resource, action, code, description) VALUES
    ('contact_inquiries', 'view', 'contact_inquiries.view', 'View contact inquiries'),
    ('contact_inquiries', 'delete', 'contact_inquiries.delete', 'Delete contact inquiries'),
    ('career_applications', 'view', 'career_applications.view', 'View career applications'),
    ('career_applications', 'delete', 'career_applications.delete', 'Delete career applications')
ON CONFLICT (code) DO NOTHING;

-- Assign these new permissions to the Admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Admin'
AND p.code IN ('contact_inquiries.view', 'contact_inquiries.delete', 'career_applications.view', 'career_applications.delete')
ON CONFLICT (role_id, permission_id) DO NOTHING;





-- Add granular update and create actions for contact and careers permissions

INSERT INTO permissions (resource, action, code, description) VALUES
    ('contact_inquiries', 'update', 'contact_inquiries.update', 'Update contact inquiries status'),
    ('career_applications', 'create', 'career_applications.create', 'Create job openings'),
    ('career_applications', 'update', 'career_applications.update', 'Update job openings and applications status')
ON CONFLICT (code) DO NOTHING;

-- Assign these new permissions to the Admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Admin'
AND p.code IN ('contact_inquiries.update', 'career_applications.create', 'career_applications.update')
ON CONFLICT (role_id, permission_id) DO NOTHING;



