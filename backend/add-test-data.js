const { query } = require('./config/db');
const bcrypt = require('bcrypt');

async function addTestData() {
  try {
    console.log('Adding test data...');

    // Add test vendors
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Add vendors (ignore if already exist)
    await query(`
      INSERT IGNORE INTO vendors (shop_name, owner_name, email, phone, address, city, password, status) 
      VALUES 
      ('Green Farm Equipment', 'John Smith', 'john@greenfarm.com', '1234567890', '123 Farm St', 'Delhi', ?, 'approved'),
      ('AgriTools Plus', 'Sarah Johnson', 'sarah@agritools.com', '0987654321', '456 Equipment Ave', 'Mumbai', ?, 'approved'),
      ('Farm Masters', 'Mike Wilson', 'mike@farmmasters.com', '5555555555', '789 Rural Rd', 'Bangalore', ?, 'pending')
    `, [hashedPassword, hashedPassword, hashedPassword]);

    // Add customers (ignore if already exist)
    await query(`
      INSERT IGNORE INTO customers (name, email, phone, address, password) 
      VALUES 
      ('Raj Patel', 'raj@email.com', '1111111111', '321 Customer St, Delhi', ?),
      ('Priya Sharma', 'priya@email.com', '2222222222', '654 Buyer Ave, Mumbai', ?),
      ('Amit Kumar', 'amit@email.com', '3333333333', '987 Client Rd, Bangalore', ?)
    `, [hashedPassword, hashedPassword, hashedPassword]);

    // Add admin if not exists (admins table has: id, name, email, password)
    await query(`
      INSERT IGNORE INTO admins (name, email, password) 
      VALUES ('System Admin', 'admin@agriculture-rental.com', ?)
    `, [hashedPassword]);

    console.log('✅ Test data added successfully!');
    console.log('Vendors: 3 added');
    console.log('Customers: 3 added');
    console.log('Admin: admin/password123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding test data:', error);
    process.exit(1);
  }
}

addTestData();