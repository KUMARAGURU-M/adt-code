const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres:1234@localhost:5432/adt_production'
  });
  await client.connect();

  console.log('Dropping columns from jobs table if they exist...');
  await client.query('ALTER TABLE jobs DROP COLUMN IF EXISTS process_status CASCADE');
  await client.query('ALTER TABLE jobs DROP COLUMN IF EXISTS qc_status CASCADE');
  await client.query('ALTER TABLE jobs DROP COLUMN IF EXISTS production_end_date CASCADE');
  await client.query('ALTER TABLE jobs DROP COLUMN IF EXISTS end_date CASCADE');

  console.log('Deleting version 46 from flyway_schema_history...');
  await client.query("DELETE FROM flyway_schema_history WHERE version = '46'");

  console.log('Database repair completed successfully.');
  await client.end();
}

run().catch(console.error);
