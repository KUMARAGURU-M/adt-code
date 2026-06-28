const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres:1234@localhost:5432/adt_production'
  });
  await client.connect();

  console.log('--- TRIGGERS ---');
  const res = await client.query(`
    SELECT  event_object_table AS table_name, trigger_name,         event_manipulation AS event, 
            action_statement AS statement, action_timing AS timing
    FROM information_schema.triggers
    ORDER BY event_object_table
  `);
  console.table(res.rows);

  await client.end();
}

run().catch(console.error);
