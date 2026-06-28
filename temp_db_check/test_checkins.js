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

    const todayStr = '2026-06-10';
    console.log(`\nFetching /api/attendance/check-ins?date=${todayStr}...`);
    const res = await fetch(`http://localhost:8080/api/attendance/check-ins?date=${todayStr}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();
    console.log('Check-ins response:', JSON.stringify(data, null, 2));

  } catch (err) {
    console.error('Error occurred:', err);
  }
}

run().catch(console.error);
