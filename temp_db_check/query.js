const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres:1234@localhost:5432/adt_production'
  });
  await client.connect();

  const userId = '5d0a5a8d-e972-444e-8078-32a539bc6b93'; // T. Mohamed Usen

  console.log(`--- SIMULATING findAllByAssignedUserId for userId: ${userId} ---`);
  const query = `
    SELECT t.*
    FROM tasks t
    WHERE t.id IN (
        SELECT tea.task_id
        FROM task_employee_assignments tea
        WHERE tea.user_id = $1
    )
    AND t.deleted_at IS NULL
    ORDER BY (
        SELECT MAX(tea2.updated_at)
        FROM task_employee_assignments tea2
        WHERE tea2.task_id = t.id
        AND tea2.user_id = $1
    ) DESC
  `;
  const res = await client.query(query, [userId]);
  console.log('Result length:', res.rows.length);
  console.table(res.rows);

  await client.end();
}

run().catch(console.error);
