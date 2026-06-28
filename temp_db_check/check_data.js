const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres:1234@localhost:5432/adt_production'
  });
  await client.connect();

  const res = await client.query(`
    SELECT id, job_id_code, process_status, qc_status, production_end_date 
    FROM jobs 
    WHERE process_status IS NOT NULL 
       OR qc_status IS NOT NULL 
       OR production_end_date IS NOT NULL
  `);
  console.log('Rows with existing production data:', res.rows.length);
  console.table(res.rows);

  await client.end();
}

run().catch(console.error);
