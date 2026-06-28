const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres:1234@localhost:5432/adt_production'
  });
  await client.connect();

  const res = await client.query(`
    SELECT t.id as task_id, t.task_title, t.assigned_by, ep_by.full_name as assigned_by_name,
           tea.user_id as assigned_employee_id, ep_emp.full_name as assigned_employee_name
    FROM tasks t
    JOIN task_employee_assignments tea ON tea.task_id = t.id
    LEFT JOIN employee_profiles ep_by ON ep_by.user_id = t.assigned_by
    LEFT JOIN employee_profiles ep_emp ON ep_emp.user_id = tea.user_id
  `);
  
  console.log('--- ALL TASK ASSIGNMENTS VS CREATOR ---');
  console.table(res.rows);

  await client.end();
}

run().catch(console.error);
