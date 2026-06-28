const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres:1234@localhost:5432/adt_production'
  });
  await client.connect();

  console.log('--- ATTENDANCE RECORDS (RAW STRING) ---');
  const attRes = await client.query('SELECT id, attendance_date::text, status, check_in_time, check_out_time, employee_id FROM attendance_records ORDER BY attendance_date DESC');
  
  for (const row of attRes.rows) {
    console.log(`Date: ${row.attendance_date} | Status: ${row.status} | CheckIn: ${row.check_in_time} | CheckOut: ${row.check_out_time} | EmpId: ${row.employee_id}`);
  }

  await client.end();
}

run().catch(console.error);
