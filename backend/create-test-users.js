const bcrypt = require('bcrypt');
const { query } = require('./config/db');

async function createTestUsers() {
    try {
        console.log('🔧 Creating test users...');

        // Create test admin
        const adminPassword = await bcrypt.hash('admin123', 10);
        await query(`
            INSERT IGNORE INTO admins (name, email, password) 
            VALUES (?, ?, ?)
        `, ['Test Admin', 'admin@test.com', adminPassword]);
        console.log('✅ Test admin created: admin@test.com / admin123');

        // Create test vendor
        const vendorPassword = await bcrypt.hash('vendor123', 10);
        await query(`
            INSERT IGNORE INTO vendors (shop_name, owner_name, email, phone, address, city, password, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, ['Test Shop', 'Test Vendor', 'vendor@test.com', '1234567890', 'Test Address', 'Test City', vendorPassword, 'approved']);
        console.log('✅ Test vendor created: vendor@test.com / vendor123');

        // Create test customer
        const customerPassword = await bcrypt.hash('customer123', 10);
        await query(`
            INSERT IGNORE INTO customers (name, email, phone, address, password) 
            VALUES (?, ?, ?, ?, ?)
        `, ['Test Customer', 'customer@test.com', '1234567890', 'Test Customer Address', customerPassword]);
        console.log('✅ Test customer created: customer@test.com / customer123');

        console.log('🎉 All test users created successfully!');
        console.log('\nTest Login Credentials:');
        console.log('Admin: admin@test.com / admin123');
        console.log('Vendor: vendor@test.com / vendor123');
        console.log('Customer: customer@test.com / customer123');

    } catch (error) {
        console.error('❌ Error creating test users:', error);
    } finally {
        process.exit(0);
    }
}

createTestUsers();