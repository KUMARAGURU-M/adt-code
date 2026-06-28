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
  const userId = loginData.data.userId;
  console.log('Login success. userId:', userId);

  console.log(`\nFetching /api/workwise/my-tasks...`);
  const tasksRes = await fetch(`http://localhost:8080/api/workwise/my-tasks`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const tasksData = await tasksRes.json();
  console.log('API response:');
  console.log(JSON.stringify(tasksData, null, 2));
}

run().catch(console.error);
