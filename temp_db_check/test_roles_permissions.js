async function run() {
  console.log('Logging in as admin@arrowdatatech.com...');
  const loginRes = await fetch('http://localhost:8080/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'admin@arrowdatatech.com',
      password: 'Admin@123',
      loginType: 'Admin'
    })
  });

  const loginData = await loginRes.json();
  if (!loginData.success) {
    console.error('Login failed:', loginData);
    return;
  }

  const token = loginData.data.accessToken;
  console.log('Login success. Token obtained.');

  console.log('\n--- GET /api/roles ---');
  const rolesRes = await fetch('http://localhost:8080/api/roles', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const rolesData = await rolesRes.json();
  console.log('Status:', rolesRes.status);
  console.log('Found roles:', rolesData.data.map(r => r.name));

  console.log('\n--- GET /api/roles/permissions/all ---');
  const permsRes = await fetch('http://localhost:8080/api/roles/permissions/all', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const permsData = await permsRes.json();
  console.log('Status:', permsRes.status);
  console.log('Total permissions count:', permsData.data.length);
  console.log('First 5 permissions:', permsData.data.slice(0, 5).map(p => p.name));

  console.log('\n--- POST /api/roles (Creating "QA Tester" Role) ---');
  const createRoleRes = await fetch('http://localhost:8080/api/roles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'QA Tester',
      description: 'Temporary role for automated testing',
      isActive: true
    })
  });
  const createRoleData = await createRoleRes.json();
  console.log('Status:', createRoleRes.status);
  if (!createRoleData.success) {
    console.error('Failed to create role:', createRoleData);
    return;
  }
  const testRoleId = createRoleData.data.id;
  console.log('Role created with ID:', testRoleId);

  // Assign the first two permissions to this role
  const selectPermIds = permsData.data.slice(0, 2).map(p => p.id);
  console.log(`\n--- PUT /api/roles/${testRoleId}/permissions (Assigning permissions: ${permsData.data.slice(0, 2).map(p => p.name).join(', ')}) ---`);
  const assignRes = await fetch(`http://localhost:8080/api/roles/${testRoleId}/permissions`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      permissionIds: selectPermIds
    })
  });
  const assignData = await assignRes.json();
  console.log('Status:', assignRes.status);
  console.log('Assigned permission IDs:', assignData.data.permissionIds);

  console.log(`\n--- GET /api/roles/${testRoleId} (Verifying assigned permissions) ---`);
  const getRoleRes = await fetch(`http://localhost:8080/api/roles/${testRoleId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const getRoleData = await getRoleRes.json();
  console.log('Status:', getRoleRes.status);
  console.log('Verified Role permissions count:', getRoleData.data.permissionIds.length);

  console.log(`\n--- DELETE /api/roles/${testRoleId} (Deleting "QA Tester" Role) ---`);
  const deleteRes = await fetch(`http://localhost:8080/api/roles/${testRoleId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const deleteData = await deleteRes.json();
  console.log('Status:', deleteRes.status);
  console.log('Delete response:', deleteData);
  console.log('\nAll Roles & Permissions tests completed successfully!');
}

run().catch(console.error);
