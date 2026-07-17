-- Add Chat Monitor permissions
INSERT INTO permissions (resource, action, code, description) VALUES
    ('chat_monitor', 'view', 'chat_monitor.view', 'View chat monitor'),
    ('chat_monitor', 'delete', 'chat_monitor.delete', 'Clear conversations')
ON CONFLICT (code) DO NOTHING;

-- Assign these new permissions to the Admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Admin'
AND p.code IN ('chat_monitor.view', 'chat_monitor.delete')
ON CONFLICT (role_id, permission_id) DO NOTHING;