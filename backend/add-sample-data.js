const { query } = require('./config/db');

async function addSampleData() {
    try {
        console.log('🔧 Adding sample booking data...');

        // Get the test customer and equipment
        const customers = await query('SELECT id FROM customers WHERE email = "customer@test.com"');
        const equipment = await query('SELECT id FROM equipment LIMIT 2');
        
        if (customers.length === 0 || equipment.length === 0) {
            console.log('❌ Test customer or equipment not found');
            return;
        }

        const customerId = customers[0].id;
        
        // Add some sample bookings
        if (equipment.length >= 1) {
            await query(`
                INSERT IGNORE INTO bookings (
                    customer_id, equipment_id, start_date, end_date, 
                    status, total_cost
                ) VALUES 
                (?, ?, '2025-10-01', '2025-10-05', 'completed', 600.00),
                (?, ?, '2025-10-10', '2025-10-15', 'pending', 750.00),
                (?, ?, '2025-09-20', '2025-09-25', 'completed', 400.00)
            `, [
                customerId, equipment[0].id,
                customerId, equipment[0].id, 
                customerId, equipment.length > 1 ? equipment[1].id : equipment[0].id
            ]);
            
            console.log('✅ Sample bookings added');
            
            // Add sample feedback for completed bookings
            const completedBookings = await query(`
                SELECT b.id, b.equipment_id, e.vendor_id 
                FROM bookings b 
                JOIN equipment e ON b.equipment_id = e.id 
                WHERE b.customer_id = ? AND b.status = 'completed'
            `, [customerId]);
            
            if (completedBookings.length > 0) {
                const booking = completedBookings[0];
                await query(`
                    INSERT IGNORE INTO feedback (
                        booking_id, customer_id, vendor_id, equipment_id, 
                        rating, comment
                    ) VALUES (?, ?, ?, ?, 5, 'Excellent equipment, very reliable!')
                `, [booking.id, customerId, booking.vendor_id, booking.equipment_id]);
                
                console.log('✅ Sample feedback added');
            }
        }

        console.log('🎉 Sample data added successfully!');

    } catch (error) {
        console.error('❌ Error adding sample data:', error);
    } finally {
        process.exit(0);
    }
}

addSampleData();