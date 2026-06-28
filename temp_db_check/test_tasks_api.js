async function run() {
  console.log('Logging in as sooriya@arrowdatatech.com...');
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
  const userId = loginData.data.userId;
  console.log('Login success. userId:', userId);

  console.log(`\nFetching /api/tasks/my-tasks?userId=${userId}...`);
  const tasksRes = await fetch(`http://localhost:8080/api/tasks/my-tasks?userId=${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  console.log('Status code:', tasksRes.status);
  const text = await tasksRes.text();
  console.log('Response text:', text);
}

run().catch(console.error);
