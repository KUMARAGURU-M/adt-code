const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres:1234@localhost:5432/adt_production'
  });
  await client.connect();

  const tables = ['roles', 'permissions', 'role_permissions', 'user_role_assignments'];
  for (const t of tables) {
    console.log(`=== COLUMNS IN ${t.toUpperCase()} TABLE ===`);
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = $1
    `, [t]);
    console.table(res.rows);
  }

  await client.end();
}

run().catch(console.error);
