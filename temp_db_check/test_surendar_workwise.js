async function run() {
  console.log('Logging in as surendar@arrowdatatech.com...');
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
  const userId = loginData.data.userId;
  console.log('Login success. userId:', userId);

  console.log(`\nFetching /api/workwise/my-tasks...`);
  const tasksRes = await fetch(`http://localhost:8080/api/workwise/my-tasks`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const tasksData = await tasksRes.json();
  console.log('Tasks for surendar:');
  console.log(JSON.stringify(tasksData.data.map(t => ({ taskId: t.taskId, taskTitle: t.taskTitle, completed: t.completed })), null, 2));
}

run().catch(console.error);
