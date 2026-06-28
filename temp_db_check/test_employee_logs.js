async function run() {
  console.log('Logging in as sooriya@arrowdatatech.com...');
  try {
    const loginRes = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'sooriya@arrowdatatech.com',
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

    console.log(`\nFetching /api/workwise/logs...`);
    const res = await fetch(`http://localhost:8080/api/workwise/logs`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();
    console.log('Employee Logs response:', JSON.stringify(data, null, 2));

  } catch (err) {
    console.error('Error occurred:', err);
  }
}

run().catch(console.error);
