const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres:1234@localhost:5432/adt_production'
  });
  await client.connect();

  console.log('--- TIME_LOGS COUNT ---');
  const cntRes = await client.query('SELECT COUNT(*) FROM time_logs');
  console.log('Total time logs:', cntRes.rows[0].count);

  console.log('\n--- SAMPLE TIME_LOGS ---');
  const sampleRes = await client.query('SELECT t.*, u.email FROM time_logs t JOIN users u ON t.user_id = u.id ORDER BY t.start_time DESC LIMIT 10');
  console.table(sampleRes.rows);

  await client.end();
}

run().catch(console.error);
