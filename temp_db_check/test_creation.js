const { Client } = require('pg');

async function run() {
  // Step 1: Log in as admin
  console.log('Logging in as admin...');
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
  
  // User IDs from DB
  const surendarId = '38736016-2086-42b1-9b51-493fd4bf7af9';
  const sooriyaId = 'a2e1d00c-4c0d-493b-b40a-530a9ffe122d';

  // Step 2: Create a task where Assigned By is surendar, and Assigned Employee is sooriya
  console.log('Creating task...');
  const taskRes = await fetch('http://localhost:8080/api/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      projectId: 'c97a078d-3267-40c4-95b7-8fd2b335d71c', // dsaa
      processIds: ['3ba6115f-886b-4911-9465-7450914149e5'], // hgdctv
      taskTitle: 'Overlap Test Task',
      status: 'PENDING',
      assignedBy: surendarId,
      employeeAssignments: [
        { userId: sooriyaId, assignedPages: null }
      ]
    })
  });

  const taskData = await taskRes.json();
  console.log('Task creation response:', taskData);

  if (!taskData.success) {
    return;
  }

  const taskId = taskData.data.id;

  // Step 3: Query the database to see who is in task_employee_assignments for this task
  const client = new Client({
    connectionString: 'postgresql://postgres:1234@localhost:5432/adt_production'
  });
  await client.connect();

  const assignments = await client.query(
    'SELECT tea.*, ep.full_name FROM task_employee_assignments tea LEFT JOIN employee_profiles ep ON ep.user_id = tea.user_id WHERE tea.task_id = $1',
    [taskId]
  );

  console.log('\n--- Employee assignments in database for the new task: ---');
  console.table(assignments.rows);

  await client.end();
}

run().catch(console.error);
