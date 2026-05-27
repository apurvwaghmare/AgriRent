const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const { query } = require('../config/db');
const { auth, requireCustomer } = require('../middleware/auth');

const router = express.Router();
const isDevelopment = process.env.NODE_ENV === 'development';

// =====================================================
// MULTER CONFIGURATION FOR ID PROOF UPLOADS
// =====================================================

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/customers');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for ID proof uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const customerId = req.user?.id || 'temp';
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `customer_${customerId}_id_proof_${timestamp}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF files are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    }
});

// =====================================================
// CUSTOMER DASHBOARD
// =====================================================

// GET /api/customer/dashboard - Customer dashboard data
router.get('/dashboard', auth, requireCustomer, async (req, res) => {
    try {
        if (isDevelopment) {
            console.log('🏠 Customer dashboard request received for user:', req.user.id);
        }
        const customerId = req.user.id;

        // Initialize default values in case tables don't exist or are empty
        let totalBookings = 0;
        let pendingBookings = 0;
        let completedBookings = 0;
        let feedbackPending = 0;
        let recentBookings = [];

        try {
            // Check if bookings table exists first
            await query('SHOW TABLES LIKE "bookings"');
            
            // Get total bookings
            const totalBookingsResult = await query(
                'SELECT COUNT(*) as total FROM bookings WHERE customer_id = ?',
                [customerId]
            );
            totalBookings = totalBookingsResult[0]?.total || 0;

            // Get pending bookings
            const pendingBookingsResult = await query(
                'SELECT COUNT(*) as total FROM bookings WHERE customer_id = ? AND status = "pending"',
                [customerId]
            );
            pendingBookings = pendingBookingsResult[0]?.total || 0;

            // Get completed bookings
            const completedBookingsResult = await query(
                'SELECT COUNT(*) as total FROM bookings WHERE customer_id = ? AND status = "completed"',
                [customerId]
            );
            completedBookings = completedBookingsResult[0]?.total || 0;

            // Only try to get feedback data if we have completed bookings
            if (completedBookings > 0) {
                const feedbackPendingResult = await query(`
                    SELECT COUNT(*) as total 
                    FROM bookings b 
                    WHERE b.customer_id = ? 
                    AND b.status = 'completed' 
                    AND NOT EXISTS (
                        SELECT 1 FROM feedback f 
                        WHERE f.booking_id = b.id
                    )
                `, [customerId]);
                feedbackPending = feedbackPendingResult[0]?.total || 0;
            }

            // Get recent bookings if any exist
            if (totalBookings > 0) {
                recentBookings = await query(`
                    SELECT 
                        b.id,
                        b.start_date,
                        b.end_date,
                        b.status,
                        b.total_cost,
                        e.name as equipment_name,
                        e.type as equipment_type,
                        v.shop_name as vendor_name
                    FROM bookings b
                    JOIN equipment e ON b.equipment_id = e.id
                    JOIN vendors v ON e.vendor_id = v.id
                    WHERE b.customer_id = ?
                    ORDER BY b.created_at DESC
                    LIMIT 5
                `, [customerId]);
            }

        } catch (tableError) {
            console.log('📊 Bookings table may not exist yet, returning default values');
        }

        console.log('✅ Customer dashboard data retrieved successfully');
        
        res.status(200).json({
            success: true,
            message: 'Customer dashboard data retrieved successfully',
            data: {
                totalBookings,
                pendingBookings,
                completedBookings,
                feedbackPending,
                recentBookings
            }
        });

    } catch (error) {
        console.error('Customer dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve dashboard data'
        });
    }
});

// =====================================================
// BROWSE EQUIPMENT
// =====================================================

// GET /api/customer/equipment - Browse available equipment
router.get('/equipment', async (req, res) => {
    try {
        console.log('🛒 Customer equipment request received');
        
        // Get query parameters for filtering
        const { search, type, location, minPrice, maxPrice, sortBy, sortOrder, page, limit } = req.query;

        // Start with base query
        let sql = `
            SELECT 
                e.id,
                e.name,
                e.type,
                e.description,
                e.price_per_day,
                e.price_per_week,
                e.price_per_month,
                e.location,
                e.availability,
                e.image,
                e.created_at,
                v.shop_name as vendor_name,
                v.city as vendor_city,
                v.id as vendor_id
            FROM equipment e
            JOIN vendors v ON e.vendor_id = v.id
            WHERE e.availability = 'available'
            AND v.status = 'approved'
        `;
        const params = [];

        // Apply filters if provided
        if (search && search.trim()) {
            sql += ' AND (e.name LIKE ? OR e.description LIKE ? OR e.type LIKE ?)';
            const searchTerm = `%${search.trim()}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        if (type && type.trim()) {
            sql += ' AND e.type = ?';
            params.push(type.trim());
        }

        if (location && location.trim()) {
            sql += ' AND e.location LIKE ?';
            params.push(`%${location.trim()}%`);
        }

        if (minPrice && !isNaN(parseFloat(minPrice))) {
            sql += ' AND e.price_per_day >= ?';
            params.push(parseFloat(minPrice));
        }

        if (maxPrice && !isNaN(parseFloat(maxPrice))) {
            sql += ' AND e.price_per_day <= ?';
            params.push(parseFloat(maxPrice));
        }

        // Add sorting
        const validSortFields = ['name', 'price_per_day', 'created_at', 'type'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
        const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
        sql += ` ORDER BY e.${sortField} ${order}`;

        // Add pagination with proper integer values
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
        const offset = (pageNum - 1) * limitNum;
        
        sql += ` LIMIT ${limitNum} OFFSET ${offset}`;

        console.log('🔍 Equipment SQL:', sql);
        console.log('🔍 Equipment Params:', params);

        const equipment = await query(sql, params);

        console.log('✅ Equipment found:', equipment.length, 'items');

        res.status(200).json({
            success: true,
            message: 'Equipment retrieved successfully',
            data: {
                equipment: equipment,
                total: equipment.length,
                page: pageNum,
                limit: limitNum
            }
        });

    } catch (error) {
        console.error('Browse equipment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve equipment'
        });
    }
});

// =====================================================
// EQUIPMENT DETAILS
// =====================================================
// EQUIPMENT DETAILS
// =====================================================

// GET /api/customer/equipment/:id - Get equipment details
router.get('/equipment/:id', async (req, res) => {
    try {
        const equipmentId = req.params.id;

        const equipment = await query(`
            SELECT 
                e.*,
                v.shop_name as vendor_name,
                v.city as vendor_city,
                v.phone as vendor_phone,
                v.address as vendor_address
            FROM equipment e
            JOIN vendors v ON e.vendor_id = v.id
            WHERE e.id = ? AND e.availability = 'available' AND v.status = 'approved'
        `, [equipmentId]);

        if (equipment.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Equipment not found or not available'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Equipment details retrieved successfully',
            data: equipment[0]
        });

    } catch (error) {
        console.error('Get equipment details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve equipment details'
        });
    }
});

// =====================================================
// BOOKING MANAGEMENT
// =====================================================

// POST /api/customer/bookings - Create new booking
router.post('/bookings', auth, requireCustomer, async (req, res) => {
    try {
        const customerId = req.user.id;
        const {
            equipment_id,
            start_date,
            end_date,
            delivery_address,
            rental_type = 'daily'
        } = req.body;

        // Validation
        if (!equipment_id || !start_date || !end_date || !delivery_address) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Validate dates
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (startDate < today) {
            return res.status(400).json({
                success: false,
                message: 'Start date cannot be in the past'
            });
        }

        if (endDate <= startDate) {
            return res.status(400).json({
                success: false,
                message: 'End date must be after start date'
            });
        }

        // Get equipment details
        const equipment = await query(`
            SELECT e.*, v.status as vendor_status
            FROM equipment e
            JOIN vendors v ON e.vendor_id = v.id
            WHERE e.id = ? AND e.availability = 'available'
        `, [equipment_id]);

        if (equipment.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Equipment not found or not available'
            });
        }

        if (equipment[0].vendor_status !== 'approved') {
            return res.status(400).json({
                success: false,
                message: 'Vendor is not approved'
            });
        }

        // Calculate rental days and total cost
        const timeDiff = endDate.getTime() - startDate.getTime();
        const days = Math.ceil(timeDiff / (1000 * 3600 * 24));
        const totalCost = days * equipment[0].price_per_day;

        // Create booking with all available fields
        const result = await query(`
            INSERT INTO bookings 
            (customer_id, equipment_id, vendor_id, start_date, end_date, rental_type, 
             delivery_address, total_cost, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `, [customerId, equipment_id, equipment[0].vendor_id, start_date, end_date, rental_type, delivery_address, totalCost]);

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: {
                booking_id: result.insertId,
                total_cost: totalCost,
                rental_days: days,
                equipment_name: equipment[0].name,
                delivery_address: delivery_address
            }
        });

    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create booking'
        });
    }
});

// GET /api/customer/bookings - Get customer bookings
router.get('/bookings', auth, requireCustomer, async (req, res) => {
    try {
        console.log('📋 Customer bookings request received for user:', req.user.id);
        const customerId = req.user.id;

        // Simple query without complex parameters
        const bookings = await query(`
            SELECT 
                b.*,
                e.name as equipment_name,
                e.type as equipment_type,
                e.image as equipment_image,
                v.shop_name as vendor_name,
                v.phone as vendor_phone
            FROM bookings b
            JOIN equipment e ON b.equipment_id = e.id
            JOIN vendors v ON e.vendor_id = v.id
            WHERE b.customer_id = ?
            ORDER BY b.created_at DESC
            LIMIT 20
        `, [customerId]);

        console.log('✅ Customer bookings found:', bookings.length, 'items');

        res.status(200).json({
            success: true,
            message: 'Bookings retrieved successfully',
            data: bookings
        });

    } catch (error) {
        console.error('Get customer bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve bookings'
        });
    }
});

// =====================================================
// FEEDBACK MANAGEMENT
// =====================================================

// POST /api/customer/feedback - Submit feedback for completed booking
router.post('/feedback', auth, requireCustomer, async (req, res) => {
    try {
        const customerId = req.user.id;
        const { booking_id, rating, comment } = req.body;

        // Validation
        if (!booking_id || !rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Valid booking ID and rating (1-5) are required'
            });
        }

        // Verify booking belongs to customer and is completed
        const booking = await query(`
            SELECT b.*, e.vendor_id
            FROM bookings b
            JOIN equipment e ON b.equipment_id = e.id
            WHERE b.id = ? AND b.customer_id = ? AND b.status = 'completed'
        `, [booking_id, customerId]);

        if (booking.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Completed booking not found'
            });
        }

        // Check if feedback already exists
        const existingFeedback = await query(
            'SELECT id FROM feedback WHERE booking_id = ?',
            [booking_id]
        );

        if (existingFeedback.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Feedback already submitted for this booking'
            });
        }

        // Insert feedback
        await query(`
            INSERT INTO feedback 
            (customer_id, vendor_id, booking_id, rating, comment, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        `, [customerId, booking[0].vendor_id, booking_id, rating, comment || '']);

        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully'
        });

    } catch (error) {
        console.error('Submit feedback error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit feedback'
        });
    }
});

// GET /api/customer/feedback - Get customer's feedback history
router.get('/feedback', auth, requireCustomer, async (req, res) => {
    try {
        const customerId = req.user.id;

        const feedback = await query(`
            SELECT 
                f.*,
                b.start_date,
                b.end_date,
                e.name as equipment_name,
                v.shop_name as vendor_name
            FROM feedback f
            JOIN bookings b ON f.booking_id = b.id
            JOIN equipment e ON b.equipment_id = e.id
            JOIN vendors v ON f.vendor_id = v.id
            WHERE f.customer_id = ?
            ORDER BY f.created_at DESC
        `, [customerId]);

        res.status(200).json({
            success: true,
            message: 'Feedback history retrieved successfully',
            data: feedback
        });

    } catch (error) {
        console.error('Get customer feedback error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve feedback history'
        });
    }
});

// =====================================================
// INVOICE GENERATION
// =====================================================

// GET /api/customer/bookings/:id/invoice - Generate and download invoice
router.get('/bookings/:id/invoice', auth, requireCustomer, async (req, res) => {
    try {
        const customerId = req.user.id;
        const bookingId = req.params.id;

        // Get booking details
        const booking = await query(`
            SELECT 
                b.*,
                c.name as customer_name,
                c.email as customer_email,
                c.phone as customer_phone,
                c.address as customer_address,
                e.name as equipment_name,
                e.type as equipment_type,
                e.price_per_day,
                v.shop_name as vendor_name,
                v.address as vendor_address,
                v.phone as vendor_phone
            FROM bookings b
            JOIN customers c ON b.customer_id = c.id
            JOIN equipment e ON b.equipment_id = e.id
            JOIN vendors v ON e.vendor_id = v.id
            WHERE b.id = ? AND b.customer_id = ? AND b.status = 'completed'
        `, [bookingId, customerId]);

        if (booking.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Completed booking not found'
            });
        }

        const bookingData = booking[0];

        // Calculate rental days
        const startDate = new Date(bookingData.start_date);
        const endDate = new Date(bookingData.end_date);
        const timeDiff = endDate.getTime() - startDate.getTime();
        const days = Math.ceil(timeDiff / (1000 * 3600 * 24));

        // Create PDF
        const doc = new PDFDocument();
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="invoice-${bookingId}.pdf"`);
        
        // Pipe PDF to response
        doc.pipe(res);

        // Add content to PDF
        doc.fontSize(20).text('RENTAL INVOICE', 50, 50);
        doc.fontSize(12).text(`Invoice #: INV-${bookingId}`, 50, 100);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 50, 120);

        // Vendor details
        doc.text('FROM:', 50, 160);
        doc.text(bookingData.vendor_name, 50, 180);
        doc.text(bookingData.vendor_address, 50, 200);
        doc.text(`Phone: ${bookingData.vendor_phone}`, 50, 220);

        // Customer details
        doc.text('TO:', 300, 160);
        doc.text(bookingData.customer_name, 300, 180);
        doc.text(bookingData.customer_address, 300, 200);
        doc.text(`Phone: ${bookingData.customer_phone}`, 300, 220);

        // Rental details
        doc.text('RENTAL DETAILS:', 50, 280);
        doc.text(`Equipment: ${bookingData.equipment_name}`, 50, 300);
        doc.text(`Type: ${bookingData.equipment_type}`, 50, 320);
        doc.text(`Start Date: ${startDate.toLocaleDateString()}`, 50, 340);
        doc.text(`End Date: ${endDate.toLocaleDateString()}`, 50, 360);
        doc.text(`Rental Days: ${days}`, 50, 380);
        doc.text(`Rate per Day: $${bookingData.price_per_day}`, 50, 400);
        doc.text(`Total Amount: $${bookingData.total_cost}`, 50, 420);

        // Footer
        doc.text('Thank you for your business!', 50, 500);

        // Finalize the PDF
        doc.end();

    } catch (error) {
        console.error('Generate invoice error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate invoice'
        });
    }
});

module.exports = router;