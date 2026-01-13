const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
    try {
        console.log('🔧 Starting equipment table migration...');
        
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'agriculture'
        });

        console.log('✅ Connected to database');

        // Check if columns already exist
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'equipment'
        `, [process.env.DB_NAME || 'agriculture']);

        const existingColumns = columns.map(col => col.COLUMN_NAME);
        console.log('📋 Existing columns:', existingColumns);

        // Add missing columns
        const columnsToAdd = [
            {
                name: 'price_per_week',
                sql: 'ADD COLUMN price_per_week DECIMAL(10, 2) NULL AFTER price_per_day'
            },
            {
                name: 'price_per_month',
                sql: 'ADD COLUMN price_per_month DECIMAL(10, 2) NULL AFTER price_per_week'
            },
            {
                name: 'location',
                sql: 'ADD COLUMN location VARCHAR(255) NULL AFTER price_per_month'
            },
            {
                name: 'condition_status',
                sql: "ADD COLUMN condition_status ENUM('excellent', 'good', 'fair', 'needs_repair') DEFAULT 'good' AFTER location"
            }
        ];

        for (const column of columnsToAdd) {
            if (!existingColumns.includes(column.name)) {
                console.log(`➕ Adding column: ${column.name}`);
                await connection.execute(`ALTER TABLE equipment ${column.sql}`);
                console.log(`✅ Added column: ${column.name}`);
            } else {
                console.log(`⏭️ Column ${column.name} already exists`);
            }
        }

        // Add indexes if they don't exist
        try {
            await connection.execute('CREATE INDEX idx_equipment_location ON equipment(location)');
            console.log('✅ Added location index');
        } catch (error) {
            if (error.code !== 'ER_DUP_KEYNAME') {
                console.log('⚠️ Location index might already exist');
            }
        }

        try {
            await connection.execute('CREATE INDEX idx_equipment_condition ON equipment(condition_status)');
            console.log('✅ Added condition index');
        } catch (error) {
            if (error.code !== 'ER_DUP_KEYNAME') {
                console.log('⚠️ Condition index might already exist');
            }
        }

        // Show final table structure
        const [finalStructure] = await connection.execute('DESCRIBE equipment');
        console.log('📊 Final table structure:');
        finalStructure.forEach(row => {
            console.log(`  ${row.Field}: ${row.Type} ${row.Null} ${row.Key} ${row.Default || ''}`);
        });

        await connection.end();
        console.log('🎉 Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();