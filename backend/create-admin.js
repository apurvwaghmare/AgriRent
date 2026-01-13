const bcrypt = require('bcrypt');
const { query } = require('./config/db');

async function createAdminUser() {
    try {
        console.log('🔧 Creating admin user...');
        
        // Check if admin already exists
        const existingAdmin = await query(
            'SELECT id FROM admins WHERE email = ?',
            ['admin@agriculture-rental.com']
        );

        if (existingAdmin.length > 0) {
            console.log('✅ Admin user already exists!');
            return;
        }

        // Hash the password
        const password = 'admin123';
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert admin user
        const result = await query(`
            INSERT INTO admins (name, email, password) 
            VALUES (?, ?, ?)
        `, ['System Admin', 'admin@agriculture-rental.com', hashedPassword]);

        console.log('✅ Admin user created successfully!');
        console.log('📧 Email: admin@agriculture-rental.com');
        console.log('🔑 Password: admin123');
        console.log('🆔 Admin ID:', result.insertId);

    } catch (error) {
        console.error('❌ Error creating admin user:', error);
    }
}

// Run the function
createAdminUser().then(() => {
    console.log('🏁 Setup complete!');
    process.exit(0);
}).catch(err => {
    console.error('💥 Setup failed:', err);
    process.exit(1);
});