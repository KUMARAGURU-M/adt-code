const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres:1234@localhost:5432/adt_production'
  });
  await client.connect();

  console.log('--- TASKS ---');
  const tasksRes = await client.query(`
    SELECT t.id, t.task_title, t.assigned_by, u.email as creator_email 
    FROM tasks t
    LEFT JOIN users u ON t.assigned_by = u.id
  `);
  console.table(tasksRes.rows);

  console.log('--- TASK EMPLOYEE ASSIGNMENTS ---');
  const assignmentsRes = await client.query(`
    SELECT tea.task_id, tea.user_id, u.email as employee_email, tea.status 
    FROM task_employee_assignments tea
    JOIN users u ON tea.user_id = u.id
  `);
  console.table(assignmentsRes.rows);

  await client.end();
}

run().catch(console.error);
