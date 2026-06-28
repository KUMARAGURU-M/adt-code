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

    console.log(`\nCalling POST /api/attendance/check-in...`);
    const checkinRes = await fetch(`http://localhost:8080/api/attendance/check-in`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const checkinData = await checkinRes.json();
    console.log('Check-in response:', JSON.stringify(checkinData, null, 2));

    console.log(`\nFetching /api/attendance/today...`);
    const todayRes = await fetch(`http://localhost:8080/api/attendance/today`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const todayData = await todayRes.json();
    console.log('Today record:', JSON.stringify(todayData, null, 2));

  } catch (err) {
    console.error('Error occurred:', err);
  }
}

run().catch(console.error);
