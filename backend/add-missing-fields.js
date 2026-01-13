const { query } = require('./config/db');

async function addMissingColumns() {
    try {
        console.log('🔧 Adding missing columns to bookings table...');

        // Add rental_type column
        try {
            await query(`
                ALTER TABLE bookings 
                ADD COLUMN rental_type ENUM('daily', 'weekly', 'monthly') DEFAULT 'daily' 
                AFTER end_date
            `);
            console.log('✅ Added rental_type column');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️ rental_type column already exists');
            } else {
                throw error;
            }
        }

        // Add delivery_address column
        try {
            await query(`
                ALTER TABLE bookings 
                ADD COLUMN delivery_address TEXT 
                AFTER rental_type
            `);
            console.log('✅ Added delivery_address column');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️ delivery_address column already exists');
            } else {
                throw error;
            }
        }

        // Add booking_notes column if it doesn't exist
        try {
            await query(`
                ALTER TABLE bookings 
                ADD COLUMN booking_notes TEXT 
                AFTER delivery_address
            `);
            console.log('✅ Added booking_notes column');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️ booking_notes column already exists');
            } else {
                throw error;
            }
        }

        console.log('🎉 Missing columns added successfully!');

        // Show the updated table structure
        const tableInfo = await query('DESCRIBE bookings');
        console.log('\n📋 Updated bookings table structure:');
        tableInfo.forEach((column, index) => {
            console.log(`${index + 1}. ${column.Field} (${column.Type})`);
        });

    } catch (error) {
        console.error('❌ Error adding missing columns:', error);
    } finally {
        process.exit(0);
    }
}

addMissingColumns();