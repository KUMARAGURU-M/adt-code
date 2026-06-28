const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres:1234@localhost:5432/adt_production'
  });
  await client.connect();

  const res = await client.query("SELECT password_hash FROM users WHERE email = 'admin@arrowdatatech.com'");
  if (res.rows.length > 0) {
    const adminHash = res.rows[0].password_hash;
    console.log('Admin Hash:', adminHash);
    
    await client.query('UPDATE users SET password_hash = $1 WHERE email IN ($2, $3)', 
      [adminHash, 'surendar@arrowdatatech.com', 'sooriya@arrowdatatech.com']);
    console.log('Updated surendar and sooriya passwords to match admin@arrowdatatech.com');
  } else {
    console.log('Admin user not found.');
  }

  await client.end();
}

run().catch(console.error);
