async function run() {
  console.log('Logging in as admin@arrowdatatech.com...');
  try {
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
    console.log('Login success.');

    const dateStr = '2026-06-10';
    console.log(`\nFetching /api/workwise/admin/logs?startDate=${dateStr}&endDate=${dateStr}...`);
    const logsRes = await fetch(`http://localhost:8080/api/workwise/admin/logs?startDate=${dateStr}&endDate=${dateStr}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const logsData = await logsRes.json();
    console.log('Admin task logs count:', logsData.data?.length || 0);

    console.log(`\nFetching /api/attendance/check-ins?date=${dateStr}...`);
    const checkinsRes = await fetch(`http://localhost:8080/api/attendance/check-ins?date=${dateStr}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const checkinsData = await checkinsRes.json();
    console.log('Daily check-ins data:', JSON.stringify(checkinsData, null, 2));

  } catch (err) {
    console.error('Error occurred:', err);
  }
}

run().catch(console.error);
