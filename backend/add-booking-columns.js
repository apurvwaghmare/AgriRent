const mysql = require('mysql2/promise');

async function addColumns() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'apurv',
    database: 'agriculture'
  });

  try {
    await conn.query('ALTER TABLE bookings ADD COLUMN rental_type VARCHAR(50) DEFAULT "daily" AFTER total_cost');
    console.log('✅ Added rental_type column');
    
    await conn.query('ALTER TABLE bookings ADD COLUMN delivery_address TEXT AFTER rental_type');
    console.log('✅ Added delivery_address column');
    
    console.log('✅ All columns added successfully!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await conn.end();
  }
}

addColumns();
