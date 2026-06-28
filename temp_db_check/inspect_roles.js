const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres:1234@localhost:5432/adt_production'
  });
  await client.connect();

  const res = await client.query(`
    SELECT u.email, r.name as role_name
    FROM users u
    JOIN user_role_assignments ura ON ura.user_id = u.id
    JOIN roles r ON ura.role_id = r.id
  `);
  console.table(res.rows);

  await client.end();
}

run().catch(console.error);
