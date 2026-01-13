const mysql = require('mysql2/promise');

async function addSampleFeedback() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'apurv',
        database: 'agriculture'
    });

    try {
        console.log('Adding sample feedback data...');

        // Get some booking IDs to add feedback for
        const [bookings] = await connection.execute(`
            SELECT b.id, b.customer_id, b.vendor_id 
            FROM bookings b 
            WHERE b.status = 'completed' 
            LIMIT 5
        `);

        if (bookings.length === 0) {
            console.log('No completed bookings found. Adding feedback for existing bookings...');
            // Get any bookings to add feedback
            const [anyBookings] = await connection.execute(`
                SELECT b.id, b.customer_id, b.vendor_id 
                FROM bookings b 
                LIMIT 5
            `);
            
            if (anyBookings.length > 0) {
                const feedbackData = [
                    {
                        booking_id: anyBookings[0].id,
                        customer_id: anyBookings[0].customer_id,
                        vendor_id: anyBookings[0].vendor_id,
                        rating: 5,
                        comment: 'Excellent service! The tractor was in perfect condition and helped us complete our farming work efficiently.'
                    },
                    {
                        booking_id: anyBookings[0].id,
                        customer_id: anyBookings[0].customer_id,
                        vendor_id: anyBookings[0].vendor_id,
                        rating: 4,
                        comment: 'Good equipment and timely delivery. Would recommend to other farmers.'
                    },
                    {
                        booking_id: anyBookings[0].id,
                        customer_id: anyBookings[0].customer_id,
                        vendor_id: anyBookings[0].vendor_id,
                        rating: 3,
                        comment: 'Equipment was okay but could be better maintained. Service was average.'
                    }
                ];

                for (const feedback of feedbackData) {
                    await connection.execute(
                        `INSERT INTO feedback (booking_id, customer_id, vendor_id, rating, comment) 
                         VALUES (?, ?, ?, ?, ?)`,
                        [feedback.booking_id, feedback.customer_id, feedback.vendor_id, feedback.rating, feedback.comment]
                    );
                }

                console.log('✅ Sample feedback added successfully!');
            } else {
                console.log('No bookings found to add feedback for.');
            }
        } else {
            const feedbackData = [
                {
                    booking_id: bookings[0].id,
                    customer_id: bookings[0].customer_id,
                    vendor_id: bookings[0].vendor_id,
                    rating: 5,
                    comment: 'Excellent service! The tractor was in perfect condition and helped us complete our farming work efficiently.'
                },
                {
                    booking_id: bookings[0].id,
                    customer_id: bookings[0].customer_id,
                    vendor_id: bookings[0].vendor_id,
                    rating: 4,
                    comment: 'Good equipment and timely delivery. Would recommend to other farmers.'
                },
                {
                    booking_id: bookings[0].id,
                    customer_id: bookings[0].customer_id,
                    vendor_id: bookings[0].vendor_id,
                    rating: 3,
                    comment: 'Equipment was okay but could be better maintained. Service was average.'
                }
            ];

            for (const feedback of feedbackData) {
                await connection.execute(
                    `INSERT INTO feedback (booking_id, customer_id, vendor_id, rating, comment) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [feedback.booking_id, feedback.customer_id, feedback.vendor_id, feedback.rating, feedback.comment]
                );
            }

            console.log('✅ Sample feedback added successfully!');
        }

    } catch (error) {
        console.error('Error adding sample feedback:', error);
    } finally {
        await connection.end();
    }
}

addSampleFeedback();