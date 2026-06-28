const BASE_URL = 'http://localhost:8080/api';

async function login(email, password, type) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: email,
      password: password,
      loginType: type
    })
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(data)}`);
  }
  return {
    token: data.data.accessToken,
    roles: data.data.roles,
    permissions: data.data.permissions
  };
}

async function testEndpoint(token, method, path, expectedStatus) {
  const url = `${BASE_URL}${path}`;
  try {
    const res = await fetch(url, {
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const isMatch = res.status === expectedStatus;
    let message = `[${isMatch ? 'SUCCESS' : 'FAILURE'}] ${method} ${path} -> Got HTTP ${res.status}, Expected HTTP ${expectedStatus}`;
    
    if (res.status === 403) {
      const text = await res.text();
      let errorMsg = text;
      try {
        const parsed = JSON.parse(text);
        errorMsg = parsed.error || parsed.message || text;
      } catch (e) {
        // Not a JSON body, keep it as text
        errorMsg = text.substring(0, 120);
      }
      message += ` | Msg: "${errorMsg.trim()}"`;
    }

    console.log(message);
    return isMatch;
  } catch (error) {
    console.error(`[ERROR] ${method} ${path} failed:`, error.message);
    return false;
  }
}

async function run() {
  console.log('========================================================================');
  console.log('                     RBAC ACCESS CONTROL TEST SUITE                     ');
  console.log('========================================================================\n');

  let overallPassed = true;

  // 1. TEST ADMIN
  console.log('--- TEST 1: Admin User (admin@arrowdatatech.com) ---');
  try {
    // Admin uses 'Admin' loginType
    const adminAuth = await login('admin@arrowdatatech.com', 'Admin@123', 'Admin');
    console.log(`Successfully logged in as Admin.`);
    console.log(`Roles:`, adminAuth.roles);
    console.log(`Total Permissions Count:`, adminAuth.permissions.length);
    console.log('----------------------------------------------------');

    const adminTests = [
      await testEndpoint(adminAuth.token, 'GET', '/roles', 200),
      await testEndpoint(adminAuth.token, 'GET', '/roles/permissions/all', 200),
      await testEndpoint(adminAuth.token, 'GET', '/users', 200),
      await testEndpoint(adminAuth.token, 'GET', '/attendance/employees', 200),
      await testEndpoint(adminAuth.token, 'GET', '/projects', 200)
    ];
    if (adminTests.includes(false)) overallPassed = false;
  } catch (e) {
    console.error('Admin suite failed to run:', e.message);
    overallPassed = false;
  }
  console.log();

  // 2. TEST MANAGER
  console.log('--- TEST 2: Manager User (surendar@arrowdatatech.com) ---');
  try {
    // Manager uses 'Admin' loginType per validation rules
    const managerAuth = await login('surendar@arrowdatatech.com', 'Admin@123', 'Admin');
    console.log(`Successfully logged in as Manager.`);
    console.log(`Roles:`, managerAuth.roles);
    console.log(`Total Permissions Count:`, managerAuth.permissions.length);
    console.log('----------------------------------------------------');

    const managerTests = [
      // Allowed Endpoints for Manager
      await testEndpoint(managerAuth.token, 'GET', '/users', 200),
      await testEndpoint(managerAuth.token, 'GET', '/projects', 200),
      await testEndpoint(managerAuth.token, 'GET', '/shifts', 200),
      await testEndpoint(managerAuth.token, 'GET', '/attendance/employees', 200),
      // Forbidden Endpoints for Manager
      await testEndpoint(managerAuth.token, 'GET', '/roles', 403),
      await testEndpoint(managerAuth.token, 'GET', '/roles/permissions/all', 403)
    ];
    if (managerTests.includes(false)) overallPassed = false;
  } catch (e) {
    console.error('Manager suite failed to run:', e.message);
    overallPassed = false;
  }
  console.log();

  // 3. TEST EMPLOYEE
  console.log('--- TEST 3: Employee User (sooriya@arrowdatatech.com) ---');
  try {
    // Employee uses 'Employee' loginType
    const employeeAuth = await login('sooriya@arrowdatatech.com', 'Admin@123', 'Employee');
    console.log(`Successfully logged in as Employee.`);
    console.log(`Roles:`, employeeAuth.roles);
    console.log(`Total Permissions Count:`, employeeAuth.permissions.length);
    console.log('----------------------------------------------------');

    const employeeTests = [
      // Allowed Endpoints for Employee
      await testEndpoint(employeeAuth.token, 'GET', '/leave/my-balance', 200),
      await testEndpoint(employeeAuth.token, 'GET', '/leave/my-requests', 200),
      // Forbidden Endpoints for Employee
      await testEndpoint(employeeAuth.token, 'GET', '/users', 403),
      await testEndpoint(employeeAuth.token, 'GET', '/projects', 403),
      await testEndpoint(employeeAuth.token, 'GET', '/roles', 403),
      await testEndpoint(employeeAuth.token, 'GET', '/shifts', 403),
      await testEndpoint(employeeAuth.token, 'GET', '/attendance/employees', 403)
    ];
    if (employeeTests.includes(false)) overallPassed = false;
  } catch (e) {
    console.error('Employee suite failed to run:', e.message);
    overallPassed = false;
  }
  console.log();

  console.log('========================================================================');
  if (overallPassed) {
    console.log('          ALL RBAC ACCESS CONTROL TESTS PASSED SUCCESSFULLY!            ');
  } else {
    console.log('           SOME RBAC ACCESS CONTROL TESTS FAILED. PLEASE REVIEW.        ');
  }
  console.log('========================================================================');
}

run().catch(console.error);
