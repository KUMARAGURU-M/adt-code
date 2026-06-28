const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres:1234@localhost:5432/adt_production'
  });
  await client.connect();

  console.log('Adding updated_at column to permissions table...');
  await client.query(`
    ALTER TABLE permissions 
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  `);
  console.log('Column updated_at added successfully.');

  await client.end();
}

run().catch(console.error);
