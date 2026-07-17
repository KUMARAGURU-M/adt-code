-- V56: Add Production and Hourly Graph as separate permission resources

INSERT INTO permissions (resource, action, code, description)
VALUES
    ('production',   'view', 'production.view',   'View the Production page'),
    ('hourly_graph', 'view', 'hourly_graph.view', 'View the Hourly Graph page')
ON CONFLICT (code) DO NOTHING;

-- Grant both permissions to the Admin role automatically
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Admin'
  AND p.code IN ('production.view', 'hourly_graph.view')
ON CONFLICT DO NOTHING;
