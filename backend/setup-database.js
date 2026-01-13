const { query } = require('./config/db');

async function setupDatabaseTables() {
    try {
        console.log('🔧 Setting up required database tables...');

        // Create bookings table if it doesn't exist
        await query(`
            CREATE TABLE IF NOT EXISTS bookings (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                customer_id INT UNSIGNED NOT NULL,
                equipment_id INT UNSIGNED NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                status ENUM('pending', 'approved', 'rejected', 'completed', 'cancelled') DEFAULT 'pending',
                total_cost DECIMAL(10,2) NOT NULL,
                booking_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_customer_id (customer_id),
                INDEX idx_equipment_id (equipment_id),
                INDEX idx_status (status),
                INDEX idx_dates (start_date, end_date),
                
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
                FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Bookings table created/verified');

        // Create feedback table if it doesn't exist
        await query(`
            CREATE TABLE IF NOT EXISTS feedback (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                booking_id INT UNSIGNED NOT NULL,
                customer_id INT UNSIGNED NOT NULL,
                vendor_id INT UNSIGNED NOT NULL,
                equipment_id INT UNSIGNED NOT NULL,
                rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
                comment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                INDEX idx_booking_id (booking_id),
                INDEX idx_customer_id (customer_id),
                INDEX idx_vendor_id (vendor_id),
                INDEX idx_equipment_id (equipment_id),
                INDEX idx_rating (rating),
                
                FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
                FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
                FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Feedback table created/verified');

        // Add some sample equipment if the table is empty
        const equipmentCount = await query('SELECT COUNT(*) as count FROM equipment');
        if (equipmentCount[0].count === 0) {
            console.log('📦 Adding sample equipment...');
            
            // Get the first vendor (should be our test vendor)
            const vendors = await query('SELECT id FROM vendors LIMIT 1');
            if (vendors.length > 0) {
                const vendorId = vendors[0].id;
                
                await query(`
                    INSERT INTO equipment (
                        vendor_id, name, type, description, 
                        daily_rate, weekly_rate, monthly_rate, 
                        availability, location, image_url
                    ) VALUES 
                    (?, 'John Deere Tractor', 'Tractor', 'Heavy-duty farming tractor for all field operations', 150.00, 900.00, 3500.00, 'available', 'Farm District A', '/uploads/equipment/tractor1.jpg'),
                    (?, 'Combine Harvester', 'Harvester', 'Modern combine harvester for grain crops', 300.00, 1800.00, 7000.00, 'available', 'Farm District B', '/uploads/equipment/harvester1.jpg'),
                    (?, 'Rotary Tiller', 'Tiller', 'Soil preparation equipment for seedbed preparation', 80.00, 450.00, 1600.00, 'available', 'Farm District A', '/uploads/equipment/tiller1.jpg')
                `, [vendorId, vendorId, vendorId]);
                
                console.log('✅ Sample equipment added');
            }
        }

        console.log('🎉 Database setup completed successfully!');

    } catch (error) {
        console.error('❌ Error setting up database tables:', error);
    } finally {
        process.exit(0);
    }
}

setupDatabaseTables();