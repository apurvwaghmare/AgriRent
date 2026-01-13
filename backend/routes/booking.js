const express = require('express');
const { query } = require('../config/db');
const { auth, requireVendor, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// =====================================================
// CUSTOMER BOOKING ROUTES (Public)
// =====================================================

// POST /api/booking - Customer creates a new booking
router.post('/', async (req, res) => {
    try {
        const {
            equipment_id,
            customer_name,
            customer_email, 
            customer_phone,
            rental_type,
            start_date,
            end_date,
            delivery_address
        } = req.body;

        // Validation
        if (!equipment_id || !customer_name || !customer_email || !customer_phone || 
            !rental_type || !start_date || !end_date || !delivery_address) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customer_email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
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

        // Check if equipment exists and is available
        const equipment = await query(`
            SELECT e.*, v.status as vendor_status, v.shop_name as vendor_name, v.id as vendor_id
            FROM equipment e
            JOIN vendors v ON e.vendor_id = v.id
            WHERE e.id = ? AND e.availability = 'available' AND v.status = 'approved'
        `, [equipment_id]);

        if (equipment.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Equipment not found or not available'
            });
        }

        const equipmentData = equipment[0];

        // Check if customer exists or create new one
        let customer = await query(`
            SELECT id FROM customers WHERE email = ?
        `, [customer_email]);

        let customerId;
        if (customer.length === 0) {
            const customerResult = await query(`
                INSERT INTO customers (name, email, phone, created_at)
                VALUES (?, ?, ?, NOW())
            `, [customer_name, customer_email, customer_phone]);
            customerId = customerResult.insertId;
        } else {
            customerId = customer[0].id;
        }

        // Calculate rental cost
        let totalCost = 0;
        const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        
        if (rental_type === 'hourly') {
            const hours = Math.ceil((endDate - startDate) / (1000 * 60 * 60));
            // Calculate hourly rate as daily rate / 8
            totalCost = hours * ((equipmentData.price_per_day || 0) / 8);
        } else if (rental_type === 'daily') {
            totalCost = days * (equipmentData.price_per_day || 0);
        } else if (rental_type === 'weekly') {
            const weeks = Math.ceil(days / 7);
            totalCost = weeks * (equipmentData.price_per_week || 0);
        } else if (rental_type === 'monthly') {
            const months = Math.ceil(days / 30);
            totalCost = months * (equipmentData.price_per_month || 0);
        }

        // Create booking
        const result = await query(`
            INSERT INTO bookings (
                equipment_id, vendor_id, customer_id, rental_type,
                start_date, end_date, total_cost, delivery_address, 
                status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
        `, [equipment_id, equipmentData.vendor_id, customerId, rental_type, start_date, end_date, totalCost, delivery_address]);

        // Get complete booking details
        const newBooking = await query(`
            SELECT 
                b.id, b.equipment_id, b.vendor_id, b.customer_id,
                b.rental_type, b.start_date, b.end_date, b.total_cost,
                b.delivery_address, b.status, b.created_at,
                e.name as equipment_name,
                v.shop_name as vendor_name,
                c.name as customer_name,
                c.email as customer_email
            FROM bookings b
            JOIN equipment e ON b.equipment_id = e.id
            JOIN vendors v ON b.vendor_id = v.id
            JOIN customers c ON b.customer_id = c.id
            WHERE b.id = ?
        `, [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            booking: newBooking[0]
        });

    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create booking'
        });
    }
});

// GET /api/booking/customer - Get customer's bookings by email
router.get('/customer', async (req, res) => {
    try {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email parameter is required'
            });
        }

        const bookings = await query(`
            SELECT 
                b.id, b.equipment_id, b.rental_type, b.start_date, b.end_date,
                b.total_cost, b.delivery_address, b.status, b.notes, b.created_at,
                e.name as equipment_name, e.category as equipment_category,
                v.shop_name as vendor_name, v.phone as vendor_phone,
                c.name as customer_name
            FROM bookings b
            JOIN equipment e ON b.equipment_id = e.id
            JOIN vendors v ON b.vendor_id = v.id
            JOIN customers c ON b.customer_id = c.id
            WHERE c.email = ?
            ORDER BY b.created_at DESC
        `, [email]);

        res.json({
            success: true,
            bookings: bookings
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
// VENDOR BOOKING ROUTES
// =====================================================

// GET /api/booking/vendor - Get vendor's equipment bookings
router.get('/vendor', auth, requireVendor, async (req, res) => {
    try {
        const vendorId = req.user.id;
        const { status, page = 1, limit = 10 } = req.query;

        const offset = (page - 1) * limit;

        let sql = `
            SELECT 
                b.id, b.equipment_id, b.rental_type, b.start_date, b.end_date,
                b.total_cost, b.delivery_address, b.status, b.notes, b.created_at,
                e.name as equipment_name,
                c.name as customer_name, c.email as customer_email, c.phone as customer_phone
            FROM bookings b
            JOIN equipment e ON b.equipment_id = e.id
            JOIN customers c ON b.customer_id = c.id
            WHERE b.vendor_id = ?
        `;
        
        let queryParams = [vendorId];
        
        if (status) {
            sql += ' AND b.status = ?';
            queryParams.push(status);
        }
        
        sql += ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?';
        queryParams.push(parseInt(limit), offset);

        const bookings = await query(sql, queryParams);

        // Get total count
        let countSql = 'SELECT COUNT(*) as total FROM bookings b WHERE b.vendor_id = ?';
        let countParams = [vendorId];
        
        if (status) {
            countSql += ' AND b.status = ?';
            countParams.push(status);
        }
        
        const countResult = await query(countSql, countParams);
        const totalPages = Math.ceil(countResult[0].total / limit);

        res.json({
            success: true,
            bookings: bookings,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total,
                totalPages: totalPages
            }
        });

    } catch (error) {
        console.error('Get vendor bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve vendor bookings'
        });
    }
});

// PUT /api/booking/:id/status - Vendor updates booking status
router.put('/:id/status', auth, requireVendor, async (req, res) => {
    try {
        const vendorId = req.user.id;
        const bookingId = req.params.id;
        const { status, notes } = req.body;

        // Validate status
        const validStatuses = ['pending', 'confirmed', 'ongoing', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        // Verify booking exists and belongs to vendor
        const booking = await query(`
            SELECT b.*, e.name as equipment_name, c.name as customer_name, c.email as customer_email
            FROM bookings b
            JOIN equipment e ON b.equipment_id = e.id
            JOIN customers c ON b.customer_id = c.id
            WHERE b.id = ? AND b.vendor_id = ?
        `, [bookingId, vendorId]);

        if (booking.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found or access denied'
            });
        }

        // Update booking status
        await query(`
            UPDATE bookings 
            SET status = ?, notes = ?, updated_at = NOW()
            WHERE id = ?
        `, [status, notes, bookingId]);

        // If completed, create payment record
        let paymentGenerated = false;
        if (status === 'completed') {
            const bookingData = booking[0];
            
            // Create payment record
            await query(`
                INSERT INTO payments (
                    booking_id, amount, payment_status, payment_method, 
                    transaction_id, created_at
                ) VALUES (?, ?, 'pending', 'pending', ?, NOW())
            `, [bookingId, bookingData.total_cost, `TXN_${bookingId}_${Date.now()}`]);
            
            paymentGenerated = true;
        }

        res.json({
            success: true,
            message: 'Booking status updated successfully',
            booking: {
                id: bookingId,
                status: status,
                notes: notes
            },
            payment_generated: paymentGenerated
        });

    } catch (error) {
        console.error('Update booking status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update booking status'
        });
    }
});

// =====================================================
// ADMIN BOOKING ROUTES
// =====================================================

// GET /api/booking/admin - Admin overview of all bookings
router.get('/admin', auth, requireAdmin, async (req, res) => {
    try {
        const { status, vendor_id, start_date, end_date, page = 1, limit = 20 } = req.query;

        const offset = (page - 1) * limit;

        let sql = `
            SELECT 
                b.id, b.equipment_id, b.vendor_id, b.customer_id,
                b.rental_type, b.start_date, b.end_date, b.total_cost,
                b.status, b.created_at,
                e.name as equipment_name,
                v.shop_name as vendor_name,
                c.name as customer_name, c.email as customer_email
            FROM bookings b
            JOIN equipment e ON b.equipment_id = e.id
            JOIN vendors v ON b.vendor_id = v.id
            JOIN customers c ON b.customer_id = c.id
            WHERE 1=1
        `;
        
        let queryParams = [];
        
        if (status) {
            sql += ' AND b.status = ?';
            queryParams.push(status);
        }
        
        if (vendor_id) {
            sql += ' AND b.vendor_id = ?';
            queryParams.push(vendor_id);
        }
        
        if (start_date) {
            sql += ' AND b.start_date >= ?';
            queryParams.push(start_date);
        }
        
        if (end_date) {
            sql += ' AND b.end_date <= ?';
            queryParams.push(end_date);
        }
        
        sql += ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?';
        queryParams.push(parseInt(limit), offset);

        const bookings = await query(sql, queryParams);

        // Get summary statistics
        const summary = await query(`
            SELECT 
                COUNT(*) as total_bookings,
                SUM(total_cost) as total_revenue,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
                COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_count,
                COUNT(CASE WHEN status = 'ongoing' THEN 1 END) as ongoing_count,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
                COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count
            FROM bookings
        `);

        res.json({
            success: true,
            bookings: bookings,
            summary: {
                total_bookings: summary[0].total_bookings,
                total_revenue: summary[0].total_revenue || 0,
                status_breakdown: {
                    pending: summary[0].pending_count,
                    confirmed: summary[0].confirmed_count,
                    ongoing: summary[0].ongoing_count,
                    completed: summary[0].completed_count,
                    cancelled: summary[0].cancelled_count
                }
            },
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: bookings.length
            }
        });

    } catch (error) {
        console.error('Get admin bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve admin booking overview'
        });
    }
});

module.exports = router;