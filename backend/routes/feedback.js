const express = require('express');
const { query } = require('../config/db');
const { auth, requireVendor } = require('../middleware/auth');

const router = express.Router();

// =====================================================
// CUSTOMER FEEDBACK ROUTES (Public)
// =====================================================

// POST /api/feedback - Customer submits feedback after completed booking
router.post('/', async (req, res) => {
    try {
        const {
            booking_id,
            customer_email,
            rating,
            comment,
            customer_name
        } = req.body;

        // Validation
        if (!booking_id || !customer_email || !rating) {
            return res.status(400).json({
                success: false,
                message: 'Booking ID, customer email, and rating are required'
            });
        }

        // Validate rating (1-5 stars)
        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
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

        // Verify booking exists and is completed
        const booking = await query(`
            SELECT 
                b.id, b.status, b.customer_id, b.vendor_id, b.equipment_id,
                c.email as customer_email, c.name as customer_name,
                e.name as equipment_name,
                v.shop_name as vendor_name
            FROM bookings b
            JOIN customers c ON b.customer_id = c.id
            JOIN equipment e ON b.equipment_id = e.id
            JOIN vendors v ON b.vendor_id = v.id
            WHERE b.id = ? AND c.email = ?
        `, [booking_id, customer_email]);

        if (booking.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found or email does not match'
            });
        }

        const bookingData = booking[0];

        // Check if booking is completed
        if (bookingData.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Feedback can only be submitted for completed bookings'
            });
        }

        // Check if feedback already exists for this booking
        const existingFeedback = await query(`
            SELECT id FROM feedback WHERE booking_id = ?
        `, [booking_id]);

        if (existingFeedback.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Feedback has already been submitted for this booking'
            });
        }

        // Create feedback record
        const result = await query(`
            INSERT INTO feedback (
                booking_id, vendor_id, equipment_id, customer_id,
                rating, comment, customer_name, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
            booking_id, 
            bookingData.vendor_id, 
            bookingData.equipment_id, 
            bookingData.customer_id,
            rating, 
            comment || null, 
            customer_name || bookingData.customer_name
        ]);

        // Get the created feedback with booking details
        const newFeedback = await query(`
            SELECT 
                f.id, f.booking_id, f.rating, f.comment, f.customer_name, f.created_at,
                e.name as equipment_name,
                v.shop_name as vendor_name
            FROM feedback f
            JOIN equipment e ON f.equipment_id = e.id
            JOIN vendors v ON f.vendor_id = v.id
            WHERE f.id = ?
        `, [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            feedback: newFeedback[0]
        });

    } catch (error) {
        console.error('Submit feedback error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit feedback'
        });
    }
});

// GET /api/feedback/booking/:bookingId - Get feedback for a specific booking (public)
router.get('/booking/:bookingId', async (req, res) => {
    try {
        const { bookingId } = req.params;

        const feedback = await query(`
            SELECT 
                f.id, f.booking_id, f.rating, f.comment, f.customer_name, f.created_at,
                e.name as equipment_name,
                v.shop_name as vendor_name
            FROM feedback f
            JOIN equipment e ON f.equipment_id = e.id
            JOIN vendors v ON f.vendor_id = v.id
            WHERE f.booking_id = ?
        `, [bookingId]);

        if (feedback.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No feedback found for this booking'
            });
        }

        res.json({
            success: true,
            feedback: feedback[0]
        });

    } catch (error) {
        console.error('Get booking feedback error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve feedback'
        });
    }
});

// =====================================================
// VENDOR FEEDBACK ROUTES
// =====================================================

// GET /api/feedback/vendor/:vendorId - Get all feedback for a vendor's equipment
router.get('/vendor/:vendorId', async (req, res) => {
    try {
        const { vendorId } = req.params;
        const { 
            page = 1, 
            limit = 10, 
            rating_filter,
            equipment_id,
            sort_by = 'created_at',
            sort_order = 'DESC'
        } = req.query;

        const offset = (page - 1) * limit;

        // Build query conditions
        let sql = `
            SELECT 
                f.id, f.booking_id, f.rating, f.comment, f.customer_name, f.created_at,
                e.name as equipment_name, e.id as equipment_id,
                b.start_date, b.end_date, b.rental_type
            FROM feedback f
            JOIN equipment e ON f.equipment_id = e.id
            JOIN bookings b ON f.booking_id = b.id
            WHERE f.vendor_id = ?
        `;
        
        let queryParams = [vendorId];
        
        // Add filters
        if (rating_filter) {
            sql += ' AND f.rating = ?';
            queryParams.push(rating_filter);
        }
        
        if (equipment_id) {
            sql += ' AND f.equipment_id = ?';
            queryParams.push(equipment_id);
        }
        
        // Add sorting
        const validSortColumns = ['created_at', 'rating', 'equipment_name'];
        const validSortOrders = ['ASC', 'DESC'];
        
        if (validSortColumns.includes(sort_by) && validSortOrders.includes(sort_order.toUpperCase())) {
            if (sort_by === 'equipment_name') {
                sql += ` ORDER BY e.name ${sort_order}`;
            } else {
                sql += ` ORDER BY f.${sort_by} ${sort_order}`;
            }
        } else {
            sql += ' ORDER BY f.created_at DESC';
        }
        
        sql += ' LIMIT ? OFFSET ?';
        queryParams.push(parseInt(limit), offset);

        const feedback = await query(sql, queryParams);

        // Get total count for pagination
        let countSql = 'SELECT COUNT(*) as total FROM feedback f WHERE f.vendor_id = ?';
        let countParams = [vendorId];
        
        if (rating_filter) {
            countSql += ' AND f.rating = ?';
            countParams.push(rating_filter);
        }
        
        if (equipment_id) {
            countSql += ' AND f.equipment_id = ?';
            countParams.push(equipment_id);
        }
        
        const countResult = await query(countSql, countParams);
        const totalPages = Math.ceil(countResult[0].total / limit);

        // Get rating statistics
        const stats = await query(`
            SELECT 
                COUNT(*) as total_feedback,
                AVG(rating) as average_rating,
                COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
                COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
                COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
                COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
                COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
            FROM feedback 
            WHERE vendor_id = ?
        `, [vendorId]);

        res.json({
            success: true,
            feedback: feedback,
            statistics: {
                total_feedback: stats[0].total_feedback,
                average_rating: Math.round(stats[0].average_rating * 10) / 10, // Round to 1 decimal
                rating_breakdown: {
                    five_star: stats[0].five_star,
                    four_star: stats[0].four_star,
                    three_star: stats[0].three_star,
                    two_star: stats[0].two_star,
                    one_star: stats[0].one_star
                }
            },
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total,
                totalPages: totalPages
            }
        });

    } catch (error) {
        console.error('Get vendor feedback error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve vendor feedback'
        });
    }
});

// GET /api/feedback/vendor - Get feedback for authenticated vendor's equipment
router.get('/vendor', auth, requireVendor, async (req, res) => {
    try {
        const vendorId = req.user.id;
        
        // Redirect to the vendor-specific endpoint with the authenticated vendor's ID
        req.params.vendorId = vendorId;
        
        // Call the same handler as the vendor/:vendorId route
        return router.handle(req, res);

    } catch (error) {
        console.error('Get authenticated vendor feedback error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve feedback'
        });
    }
});

// =====================================================
// EQUIPMENT FEEDBACK ROUTES
// =====================================================

// GET /api/feedback/equipment/:equipmentId - Get all feedback for specific equipment
router.get('/equipment/:equipmentId', async (req, res) => {
    try {
        const { equipmentId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const offset = (page - 1) * limit;

        const feedback = await query(`
            SELECT 
                f.id, f.booking_id, f.rating, f.comment, f.customer_name, f.created_at,
                e.name as equipment_name,
                v.shop_name as vendor_name,
                b.start_date, b.end_date, b.rental_type
            FROM feedback f
            JOIN equipment e ON f.equipment_id = e.id
            JOIN vendors v ON f.vendor_id = v.id
            JOIN bookings b ON f.booking_id = b.id
            WHERE f.equipment_id = ?
            ORDER BY f.created_at DESC
            LIMIT ? OFFSET ?
        `, [equipmentId, parseInt(limit), offset]);

        // Get total count
        const countResult = await query(
            'SELECT COUNT(*) as total FROM feedback WHERE equipment_id = ?', 
            [equipmentId]
        );
        
        // Get equipment rating statistics
        const stats = await query(`
            SELECT 
                COUNT(*) as total_feedback,
                AVG(rating) as average_rating,
                COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
                COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
                COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
                COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
                COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
            FROM feedback 
            WHERE equipment_id = ?
        `, [equipmentId]);

        res.json({
            success: true,
            feedback: feedback,
            statistics: {
                total_feedback: stats[0].total_feedback,
                average_rating: Math.round(stats[0].average_rating * 10) / 10,
                rating_breakdown: {
                    five_star: stats[0].five_star,
                    four_star: stats[0].four_star,
                    three_star: stats[0].three_star,
                    two_star: stats[0].two_star,
                    one_star: stats[0].one_star
                }
            },
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total,
                totalPages: Math.ceil(countResult[0].total / limit)
            }
        });

    } catch (error) {
        console.error('Get equipment feedback error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve equipment feedback'
        });
    }
});

module.exports = router;