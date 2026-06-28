const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres:1234@localhost:5432/adt_production'
  });
  await client.connect();

  const adminHash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TsCkNbGjbMy6NJLP/h6mHCW7nRMS'; // Admin@123
  await client.query('UPDATE users SET password_hash = $1 WHERE email = $2', [adminHash, 'surendar@arrowdatatech.com']);
  console.log('surendar@arrowdatatech.com password hash updated.');

  await client.end();
}

run().catch(console.error);
