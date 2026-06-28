const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres:1234@localhost:5432/adt_production'
  });
  await client.connect();

  console.log('--- ALL TASKS ---');
  const res = await client.query('SELECT * FROM tasks');
  console.log(JSON.stringify(res.rows, null, 2));

  console.log('--- ALL ASSIGNMENTS ---');
  const res2 = await client.query('SELECT * FROM task_employee_assignments');
  console.log(JSON.stringify(res2.rows, null, 2));

  await client.end();
}

run().catch(console.error);
