const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres:1234@localhost:5432/adt_production'
  });
  await client.connect();

  console.log('Shifting database time logs to today...');

  // Get current date and sample log date to find difference in days
  const sampleRes = await client.query('SELECT log_date FROM time_logs LIMIT 1');
  if (sampleRes.rows.length === 0) {
    console.log('No time logs found to shift.');
    await client.end();
    return;
  }

  const logDateStr = sampleRes.rows[0].log_date;
  const dbLogDate = new Date(logDateStr);
  const today = new Date();

  // Reset hours to compare dates cleanly
  dbLogDate.setHours(0,0,0,0);
  today.setHours(0,0,0,0);

  const diffTime = Math.abs(today - dbLogDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    console.log('Logs are already on today\'s date.');
  } else {
    console.log(`Shifting logs forward by ${diffDays} days...`);

    await client.query('BEGIN');
    try {
      // Update break_logs first to preserve relations and correct timestamps
      await client.query(`
        UPDATE break_logs 
        SET break_start = break_start + ($1 || ' day')::INTERVAL,
            break_end = break_end + ($1 || ' day')::INTERVAL
      `, [diffDays]);

      // Update time_logs
      await client.query(`
        UPDATE time_logs
        SET log_date = log_date + ($1 || ' day')::INTERVAL,
            start_time = start_time + ($1 || ' day')::INTERVAL,
            end_time = end_time + ($1 || ' day')::INTERVAL
      `, [diffDays]);

      await client.query('COMMIT');
      console.log('Logs shifted successfully.');
    } catch (e) {
      await client.query('ROLLBACK');
      console.error('Failed to shift logs:', e);
    }
  }

  console.log('\n--- VERIFY LOGS AFTER SHIFT ---');
  const verifyRes = await client.query('SELECT id, log_date, start_time, end_time, status FROM time_logs ORDER BY start_time DESC');
  console.table(verifyRes.rows);

  await client.end();
}

run().catch(console.error);
