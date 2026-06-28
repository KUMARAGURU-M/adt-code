async function run() {
  console.log('Logging in as surendar@arrowdatatech.com...');
  try {
    const loginRes = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'surendar@arrowdatatech.com',
        password: 'Admin@123',
        loginType: 'Employee'
      })
    });

    const loginData = await loginRes.json();
    if (!loginData.success) {
      console.error('Login failed:', loginData);
      return;
    }

    const token = loginData.data.accessToken;
    console.log('Login success.');

    console.log(`\nFetching /api/attendance/today...`);
    const res = await fetch(`http://localhost:8080/api/attendance/today`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();
    console.log('Today Attendance data:', JSON.stringify(data, null, 2));

    console.log(`\nFetching /api/workwise/logs (first page)...`);
    const logsRes = await fetch(`http://localhost:8080/api/workwise/logs?page=0&size=5`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const logsData = await logsRes.json();
    console.log('Workwise logs data:', JSON.stringify(logsData, null, 2));

  } catch (err) {
    console.error('Error occurred:', err);
  }
}

run().catch(console.error);
