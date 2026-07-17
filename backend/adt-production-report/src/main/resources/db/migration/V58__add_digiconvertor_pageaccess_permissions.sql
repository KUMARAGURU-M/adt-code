-- V58: Add separate permission codes for DigiConvertor and Page Access Control

INSERT INTO permissions (resource, action, code, description)
VALUES
    ('digiconvertor', 'view', 'digiconvertor.view', 'View the DigiConvertor tool page'),
    ('page_access',   'view', 'page_access.view',   'Manage role and employee page access')
ON CONFLICT (code) DO NOTHING;

-- Grant both permissions to the Admin role automatically
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Admin'
  AND p.code IN ('digiconvertor.view', 'page_access.view')
ON CONFLICT DO NOTHING;
