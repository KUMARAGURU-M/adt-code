const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres:1234@localhost:5432/adt_production'
  });
  await client.connect();

  console.log('--- Flyway Version 46 schema history row ---');
  const res = await client.query("SELECT * FROM flyway_schema_history WHERE version = '46'");
  console.table(res.rows);

  console.log('--- Jobs table columns info ---');
  const columnsRes = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'jobs'
  `);
  console.table(columnsRes.rows);

  await client.end();
}

run().catch(console.error);
