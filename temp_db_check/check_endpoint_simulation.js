const { Client } = require('pg');

async function checkUser(client, email, userId) {
  console.log(`\n=== Checking tasks for ${email} (${userId}) ===`);
  
  // 1. simulate findAllByAssignedUserId
  const q1 = `
    SELECT t.id, t.task_title, t.assigned_by
    FROM tasks t
    WHERE t.id IN (
        SELECT tea.task_id
        FROM task_employee_assignments tea
        WHERE tea.user_id = $1
    )
    AND t.deleted_at IS NULL
  `;
  const res1 = await client.query(q1, [userId]);
  console.log('findAllByAssignedUserId returned:', res1.rows.map(r => r.task_title));

  // 2. simulate findByAssignedUserId
  const q2 = `
    SELECT t.id, t.task_title, t.assigned_by
    FROM tasks t
    WHERE t.id IN (
        SELECT tea.task_id
        FROM task_employee_assignments tea
        WHERE tea.user_id = $1
        AND tea.status NOT IN ('FINISH', 'Completed')
    )
    AND t.status NOT IN ('FINISH', 'Completed')
    AND t.deleted_at IS NULL
  `;
  const res2 = await client.query(q2, [userId]);
  console.log('findByAssignedUserId returned:', res2.rows.map(r => r.task_title));
}

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres:1234@localhost:5432/adt_production'
  });
  await client.connect();

  await checkUser(client, 'admin@arrowdatatech.com', '5d0a5a8d-e972-444e-8078-32a539bc6b93');
  await checkUser(client, 'surendar@arrowdatatech.com', '38736016-2086-42b1-9b51-493fd4bf7af9');
  await checkUser(client, 'sooriya@arrowdatatech.com', 'a2e1d00c-4c0d-493b-b40a-530a9ffe122d');

  await client.end();
}

run().catch(console.error);
