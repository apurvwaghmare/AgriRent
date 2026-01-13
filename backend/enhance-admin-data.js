const mysql = require('mysql2/promise');

async function addMoreSampleData() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'apurv',
        database: 'agriculture'
    });

    try {
        console.log('Adding more sample data for comprehensive admin views...');

        // Add more bookings with different statuses
        const [existingBookings] = await connection.execute('SELECT COUNT(*) as count FROM bookings');
        console.log(`Current bookings: ${existingBookings[0].count}`);

        // Get customer and equipment IDs for creating diverse bookings
        const [customers] = await connection.execute('SELECT id FROM customers LIMIT 3');
        const [equipment] = await connection.execute('SELECT id, vendor_id FROM equipment LIMIT 5');

        if (customers.length > 0 && equipment.length > 0) {
            // Create bookings with different statuses and scenarios
            const bookingsToAdd = [
                {
                    customer_id: customers[0].id,
                    equipment_id: equipment[0].id,
                    vendor_id: equipment[0].vendor_id,
                    start_date: '2025-10-15',
                    end_date: '2025-10-20',
                    rental_type: 'weekly',
                    delivery_address: 'Farm Plot 123, Baramati, Pune',
                    total_cost: 8500.00,
                    status: 'approved',
                    booking_notes: 'Need equipment for wheat harvesting'
                },
                {
                    customer_id: customers[Math.min(1, customers.length-1)].id,
                    equipment_id: equipment[Math.min(1, equipment.length-1)].id,
                    vendor_id: equipment[Math.min(1, equipment.length-1)].vendor_id,
                    start_date: '2025-10-12',
                    end_date: '2025-10-25',
                    rental_type: 'monthly',
                    delivery_address: 'Agricultural College, Pune',
                    total_cost: 15000.00,
                    status: 'completed',
                    booking_notes: 'University research project'
                },
                {
                    customer_id: customers[Math.min(2, customers.length-1)].id,
                    equipment_id: equipment[Math.min(2, equipment.length-1)].id,
                    vendor_id: equipment[Math.min(2, equipment.length-1)].vendor_id,
                    start_date: '2025-10-08',
                    end_date: '2025-10-10',
                    rental_type: 'daily',
                    delivery_address: 'Village Farmland, Ahmednagar',
                    total_cost: 2500.00,
                    status: 'rejected',
                    booking_notes: 'Equipment maintenance required',
                    notes: 'Rejected due to equipment unavailability'
                }
            ];

            for (const booking of bookingsToAdd) {
                try {
                    await connection.execute(
                        `INSERT INTO bookings (customer_id, equipment_id, vendor_id, start_date, end_date, 
                         rental_type, delivery_address, total_cost, status, booking_notes, notes) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [booking.customer_id, booking.equipment_id, booking.vendor_id, booking.start_date, 
                         booking.end_date, booking.rental_type, booking.delivery_address, booking.total_cost, 
                         booking.status, booking.booking_notes, booking.notes || null]
                    );
                    console.log(`✅ Added booking: ${booking.status} - ₹${booking.total_cost}`);
                } catch (error) {
                    if (error.code !== 'ER_DUP_ENTRY') {
                        console.log(`ℹ️ Booking already exists or error: ${error.message}`);
                    }
                }
            }
        }

        // Add more diverse feedback
        const [bookingsForFeedback] = await connection.execute(`
            SELECT b.id, b.customer_id, b.vendor_id 
            FROM bookings b 
            WHERE b.status IN ('completed', 'approved')
            LIMIT 5
        `);

        if (bookingsForFeedback.length > 0) {
            const feedbackToAdd = [
                {
                    booking_id: bookingsForFeedback[0].id,
                    customer_id: bookingsForFeedback[0].customer_id,
                    vendor_id: bookingsForFeedback[0].vendor_id,
                    rating: 4,
                    comment: 'Great service and well-maintained equipment. The tractor performed excellently during our harvest season.'
                },
                {
                    booking_id: bookingsForFeedback[Math.min(1, bookingsForFeedback.length-1)].id,
                    customer_id: bookingsForFeedback[Math.min(1, bookingsForFeedback.length-1)].customer_id,
                    vendor_id: bookingsForFeedback[Math.min(1, bookingsForFeedback.length-1)].vendor_id,
                    rating: 5,
                    comment: 'Outstanding service! Equipment was delivered on time and in perfect condition. Highly recommend this vendor.'
                },
                {
                    booking_id: bookingsForFeedback[Math.min(2, bookingsForFeedback.length-1)].id,
                    customer_id: bookingsForFeedback[Math.min(2, bookingsForFeedback.length-1)].customer_id,
                    vendor_id: bookingsForFeedback[Math.min(2, bookingsForFeedback.length-1)].vendor_id,
                    rating: 3,
                    comment: 'Average service. Equipment worked fine but delivery was delayed by 2 hours.'
                },
                {
                    booking_id: bookingsForFeedback[Math.min(3, bookingsForFeedback.length-1)].id,
                    customer_id: bookingsForFeedback[Math.min(3, bookingsForFeedback.length-1)].customer_id,
                    vendor_id: bookingsForFeedback[Math.min(3, bookingsForFeedback.length-1)].vendor_id,
                    rating: 2,
                    comment: 'Equipment had some mechanical issues. Customer service could be improved.'
                }
            ];

            for (const feedback of feedbackToAdd) {
                try {
                    await connection.execute(
                        `INSERT INTO feedback (booking_id, customer_id, vendor_id, rating, comment) 
                         VALUES (?, ?, ?, ?, ?)`,
                        [feedback.booking_id, feedback.customer_id, feedback.vendor_id, feedback.rating, feedback.comment]
                    );
                    console.log(`✅ Added feedback: ${feedback.rating}★ - ${feedback.comment.substring(0, 50)}...`);
                } catch (error) {
                    if (error.code === 'ER_DUP_ENTRY') {
                        console.log(`ℹ️ Feedback already exists for booking ${feedback.booking_id}`);
                    } else {
                        console.log(`ℹ️ Error adding feedback: ${error.message}`);
                    }
                }
            }
        }

        // Display summary
        const [finalBookings] = await connection.execute('SELECT COUNT(*) as count FROM bookings');
        const [finalFeedback] = await connection.execute('SELECT COUNT(*) as count FROM feedback');
        
        console.log('\n📊 ADMIN DATA SUMMARY:');
        console.log(`📋 Total Bookings: ${finalBookings[0].count}`);
        console.log(`💬 Total Feedback: ${finalFeedback[0].count}`);
        console.log('\n✅ Sample data enhancement completed!');
        console.log('\n🎯 Admin can now view:');
        console.log('   • All customer bookings across all vendors');
        console.log('   • All feedback given by customers for any vendor');
        console.log('   • Comprehensive booking details with customer/vendor info');
        console.log('   • Detailed feedback with ratings and comments');

    } catch (error) {
        console.error('Error adding sample data:', error);
    } finally {
        await connection.end();
    }
}

addMoreSampleData();