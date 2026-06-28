const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres:1234@localhost:5432/adt_production'
  });
  await client.connect();

  const res = await client.query("SELECT id, log_date::text, pg_typeof(log_date), start_time FROM time_logs");
  console.log(res.rows);

  await client.end();
}

run().catch(console.error);
