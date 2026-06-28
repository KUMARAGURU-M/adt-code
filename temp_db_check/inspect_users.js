const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres:1234@localhost:5432/adt_production'
  });
  await client.connect();

  console.log('=== USERS ===');
  const res1 = await client.query('SELECT id, email, user_code, is_active FROM users');
  console.table(res1.rows);

  console.log('=== EMPLOYEE PROFILES ===');
  const resProfile = await client.query('SELECT user_id, full_name FROM employee_profiles');
  console.table(resProfile.rows);

  console.log('=== ATTENDANCE EMPLOYEES ===');
  const res2 = await client.query('SELECT id, name, category, is_active, user_id FROM attendance_employees');
  console.table(res2.rows);

  await client.end();
}

run().catch(console.error);
