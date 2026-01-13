const express = require('express');
const fs = require('fs');
const path = require('path');
const { query } = require('../config/db');
const { auth, allowRoles, requireAdmin, requireVendor, requireCustomer, requireAnyUser } = require('../middleware/auth');

const router = express.Router();

// =====================================================
// CUSTOMER BOOKING ROUTES
// =====================================================

// POST /api/booking - Customer creates a new booking
router.post('/', auth, requireCustomer, async (req, res) => {
    try {
        const customerId = req.user.id;
        const {
            equipment_id,
            start_date,
            end_date,
            delivery_address,
            notes
        } = req.body;

        // Validation
        if (!equipment_id || !start_date || !end_date) {
            return res.status(400).json({
                success: false,
                message: 'Required fields: equipment_id, start_date, end_date'
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
            SELECT e.*, v.status as vendor_status, v.shop_name, v.owner_name
            FROM equipment e
            JOIN vendors v ON e.vendor_id = v.id
            WHERE e.id = ? AND e.availability_status = 'available' AND v.status = 'approved'
        `, [equipment_id]);

        if (equipment.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Equipment not found or not available'
            });
        }

        const equipmentData = equipment[0];

        // Check for date conflicts
        const conflictingBookings = await query(`
            SELECT id FROM bookings 
            WHERE equipment_id = ? 
            AND status IN ('pending', 'confirmed', 'ongoing')
            AND (
                (start_date <= ? AND end_date >= ?) OR
                (start_date <= ? AND end_date >= ?) OR
                (start_date >= ? AND end_date <= ?)
            )
        `, [equipment_id, start_date, start_date, end_date, end_date, start_date, end_date]);

        if (conflictingBookings.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Equipment is not available for the selected dates'
            });
        }

        // Calculate rental cost
        const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        let totalAmount = 0;

        if (days >= 30 && equipmentData.monthly_rate) {
            // Monthly rate calculation
            const months = Math.ceil(days / 30);
            totalAmount = months * equipmentData.monthly_rate;
        } else if (days >= 7 && equipmentData.weekly_rate) {
            // Weekly rate calculation
            const weeks = Math.ceil(days / 7);
            totalAmount = weeks * equipmentData.weekly_rate;
        } else {
            // Daily rate calculation
            totalAmount = days * equipmentData.daily_rate;
        }

        // Create booking
        const result = await query(`
            INSERT INTO bookings (
                customer_id, equipment_id, start_date, end_date,
                total_amount, delivery_address, notes, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())
        `, [customerId, equipment_id, start_date, end_date, totalAmount, delivery_address, notes]);

        // Get complete booking details
        const newBooking = await query(`
            SELECT 
                b.*,
                e.name as equipment_name,
                e.model as equipment_model,
                e.images as equipment_images,
                v.shop_name as vendor_shop_name,
                v.owner_name as vendor_owner_name,
                v.phone as vendor_phone,
                v.email as vendor_email,
                c.name as customer_name,
                c.email as customer_email,
                c.phone as customer_phone
            FROM bookings b
            JOIN equipment e ON b.equipment_id = e.id
            JOIN vendors v ON e.vendor_id = v.id
            JOIN customers c ON b.customer_id = c.id
            WHERE b.id = ?
        `, [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: {
                ...newBooking[0],
                equipment_images: JSON.parse(newBooking[0].equipment_images || '[]'),
                rental_days: days
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

// GET /api/booking/customer - Get customer's bookings
router.get('/customer', auth, requireCustomer, async (req, res) => {
    try {
        const customerId = req.user.id;
        const { 
            status, 
            page = 1, 
            limit = 10,
            sortBy = 'created_at',
            sortOrder = 'DESC'
        } = req.query;

        const offset = (page - 1) * limit;

        // Build where conditions
        let whereConditions = ['b.customer_id = ?'];
        let queryParams = [customerId];

        if (status) {
            whereConditions.push('b.status = ?');
            queryParams.push(status);
        }

        const whereClause = whereConditions.join(' AND ');

        // Get bookings with all related data
        const bookings = await query(`
            SELECT 
                b.*,
                e.name as equipment_name,
                e.model as equipment_model,
                e.images as equipment_images,
                e.daily_rate,
                e.specifications,
                v.shop_name as vendor_shop_name,
                v.owner_name as vendor_owner_name,
                v.phone as vendor_phone,
                v.email as vendor_email,
                v.city as vendor_city,
                v.address as vendor_address,
                cat.name as category_name
            FROM bookings b
            JOIN equipment e ON b.equipment_id = e.id
            JOIN vendors v ON e.vendor_id = v.id
            JOIN categories cat ON e.category_id = cat.id
            WHERE ${whereClause}
            ORDER BY b.${sortBy} ${sortOrder}
            LIMIT ? OFFSET ?
        `, [...queryParams, parseInt(limit), offset]);

        // Get total count
        const countResult = await query(`
            SELECT COUNT(*) as total
            FROM bookings b
            WHERE ${whereClause}
        `, queryParams);

        // Parse equipment images
        const bookingsWithImages = bookings.map(booking => ({
            ...booking,
            equipment_images: JSON.parse(booking.equipment_images || '[]'),
            rental_days: Math.ceil((new Date(booking.end_date) - new Date(booking.start_date)) / (1000 * 60 * 60 * 24))
        }));

        const totalPages = Math.ceil(countResult[0].total / limit);

        res.status(200).json({
            success: true,
            message: 'Customer bookings retrieved successfully',
            data: {
                bookings: bookingsWithImages,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: totalPages,
                    totalRecords: countResult[0].total,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            }
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
        const { 
            status, 
            equipment_id,
            page = 1, 
            limit = 10,
            sortBy = 'created_at',
            sortOrder = 'DESC'
        } = req.query;

        const offset = (page - 1) * limit;

        // Build where conditions
        let whereConditions = ['e.vendor_id = ?'];
        let queryParams = [vendorId];

        if (status) {
            whereConditions.push('b.status = ?');
            queryParams.push(status);
        }

        if (equipment_id) {
            whereConditions.push('b.equipment_id = ?');
            queryParams.push(equipment_id);
        }

        const whereClause = whereConditions.join(' AND ');

        // Get bookings with all related data
        const bookings = await query(`
            SELECT 
                b.*,
                e.name as equipment_name,
                e.model as equipment_model,
                e.images as equipment_images,
                e.daily_rate,
                e.specifications,
                c.name as customer_name,
                c.email as customer_email,
                c.phone as customer_phone,
                c.address as customer_address,
                cat.name as category_name
            FROM bookings b
            JOIN equipment e ON b.equipment_id = e.id
            JOIN customers c ON b.customer_id = c.id
            JOIN categories cat ON e.category_id = cat.id
            WHERE ${whereClause}
            ORDER BY b.${sortBy} ${sortOrder}
            LIMIT ? OFFSET ?
        `, [...queryParams, parseInt(limit), offset]);

        // Get total count
        const countResult = await query(`
            SELECT COUNT(*) as total
            FROM bookings b
            JOIN equipment e ON b.equipment_id = e.id
            WHERE ${whereClause}
        `, queryParams);

        // Parse equipment images and add rental days
        const bookingsWithImages = bookings.map(booking => ({
            ...booking,
            equipment_images: JSON.parse(booking.equipment_images || '[]'),
            rental_days: Math.ceil((new Date(booking.end_date) - new Date(booking.start_date)) / (1000 * 60 * 60 * 24))
        }));

        const totalPages = Math.ceil(countResult[0].total / limit);

        res.status(200).json({
            success: true,
            message: 'Vendor bookings retrieved successfully',
            data: {
                bookings: bookingsWithImages,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: totalPages,
                    totalRecords: countResult[0].total,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get vendor bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve bookings'
        });
    }
});

// =====================================================
// BOOKING STATUS MANAGEMENT
// =====================================================

// PUT /api/booking/:id/status - Vendor updates booking status
router.put('/:id/status', auth, requireVendor, async (req, res) => {
    try {
        const vendorId = req.user.id;
        const bookingId = req.params.id;
        const { status, rejection_reason } = req.body;

        // Validate status
        const validStatuses = ['pending', 'confirmed', 'rejected', 'ongoing', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Valid statuses: ${validStatuses.join(', ')}`
            });
        }

        // Verify booking exists and belongs to vendor's equipment
        const booking = await query(`
            SELECT b.*, e.vendor_id, e.name as equipment_name, e.daily_rate,
                   c.name as customer_name, c.email as customer_email
            FROM bookings b
            JOIN equipment e ON b.equipment_id = e.id
            JOIN customers c ON b.customer_id = c.id
            WHERE b.id = ? AND e.vendor_id = ?
        `, [bookingId, vendorId]);

        if (booking.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found or access denied'
            });
        }

        const bookingData = booking[0];
        const currentStatus = bookingData.status;

        // Validate status transitions
        const validTransitions = {
            'pending': ['confirmed', 'rejected'],
            'confirmed': ['ongoing', 'cancelled'],
            'ongoing': ['completed', 'cancelled'],
            'rejected': [],
            'completed': [],
            'cancelled': []
        };

        if (!validTransitions[currentStatus]?.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot change status from '${currentStatus}' to '${status}'`
            });
        }

        // Handle rejection reason
        if (status === 'rejected' && !rejection_reason) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required when rejecting a booking'
            });
        }

        // Update booking status
        await query(`
            UPDATE bookings 
            SET status = ?, rejection_reason = ?, updated_at = NOW()
            WHERE id = ?
        `, [status, rejection_reason || null, bookingId]);

        // Handle completion - create payment record and generate invoice
        let paymentData = null;
        let invoicePath = null;

        if (status === 'completed') {
            // Create payment record
            const paymentResult = await query(`
                INSERT INTO payments (
                    booking_id, amount, payment_method, payment_status, 
                    transaction_id, created_at, updated_at
                ) VALUES (?, ?, 'cash', 'completed', ?, NOW(), NOW())
            `, [
                bookingId, 
                bookingData.total_amount, 
                `TXN_${Date.now()}_${bookingId}`
            ]);

            // Generate invoice
            invoicePath = await generateInvoice(bookingData, paymentResult.insertId);

            // Update payment with invoice path
            await query(`
                UPDATE payments 
                SET invoice_path = ?
                WHERE id = ?
            `, [invoicePath, paymentResult.insertId]);

            paymentData = {
                id: paymentResult.insertId,
                amount: bookingData.total_amount,
                payment_method: 'cash',
                payment_status: 'completed',
                invoice_path: invoicePath
            };
        }

        // Get updated booking details
        const updatedBooking = await query(`
            SELECT 
                b.*,
                e.name as equipment_name,
                e.model as equipment_model,
                c.name as customer_name,
                c.email as customer_email,
                c.phone as customer_phone
            FROM bookings b
            JOIN equipment e ON b.equipment_id = e.id
            JOIN customers c ON b.customer_id = c.id
            WHERE b.id = ?
        `, [bookingId]);

        res.status(200).json({
            success: true,
            message: `Booking status updated to '${status}' successfully`,
            data: {
                booking: updatedBooking[0],
                ...(paymentData && { payment: paymentData })
            }
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

// GET /api/booking/admin - Admin view all bookings
router.get('/admin', auth, requireAdmin, async (req, res) => {
    try {
        const { 
            status, 
            vendor_id,
            customer_id,
            equipment_id,
            start_date,
            end_date,
            page = 1, 
            limit = 20,
            sortBy = 'created_at',
            sortOrder = 'DESC'
        } = req.query;

        const offset = (page - 1) * limit;

        // Build where conditions
        let whereConditions = ['1=1'];
        let queryParams = [];

        if (status) {
            whereConditions.push('b.status = ?');
            queryParams.push(status);
        }

        if (vendor_id) {
            whereConditions.push('e.vendor_id = ?');
            queryParams.push(vendor_id);
        }

        if (customer_id) {
            whereConditions.push('b.customer_id = ?');
            queryParams.push(customer_id);
        }

        if (equipment_id) {
            whereConditions.push('b.equipment_id = ?');
            queryParams.push(equipment_id);
        }

        if (start_date && end_date) {
            whereConditions.push('(b.start_date BETWEEN ? AND ? OR b.end_date BETWEEN ? AND ?)');
            queryParams.push(start_date, end_date, start_date, end_date);
        }

        const whereClause = whereConditions.join(' AND ');

        // Get bookings with comprehensive data
        const bookings = await query(`
            SELECT 
                b.*,
                e.name as equipment_name,
                e.model as equipment_model,
                e.daily_rate,
                v.shop_name as vendor_shop_name,
                v.owner_name as vendor_owner_name,
                c.name as customer_name,
                c.email as customer_email,
                c.phone as customer_phone,
                cat.name as category_name,
                p.amount as payment_amount,
                p.payment_status,
                p.invoice_path
            FROM bookings b
            JOIN equipment e ON b.equipment_id = e.id
            JOIN vendors v ON e.vendor_id = v.id
            JOIN customers c ON b.customer_id = c.id
            JOIN categories cat ON e.category_id = cat.id
            LEFT JOIN payments p ON b.id = p.booking_id
            WHERE ${whereClause}
            ORDER BY b.${sortBy} ${sortOrder}
            LIMIT ? OFFSET ?
        `, [...queryParams, parseInt(limit), offset]);

        // Get total count
        const countResult = await query(`
            SELECT COUNT(*) as total
            FROM bookings b
            JOIN equipment e ON b.equipment_id = e.id
            WHERE ${whereClause}
        `, queryParams);

        const totalPages = Math.ceil(countResult[0].total / limit);

        res.status(200).json({
            success: true,
            message: 'Admin bookings retrieved successfully',
            data: {
                bookings: bookings,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: totalPages,
                    totalRecords: countResult[0].total,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get admin bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve bookings'
        });
    }
});

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

// Generate invoice function
async function generateInvoice(bookingData, paymentId) {
    try {
        // Create invoices directory if it doesn't exist
        const invoicesDir = path.join(__dirname, '../invoices');
        if (!fs.existsSync(invoicesDir)) {
            fs.mkdirSync(invoicesDir, { recursive: true });
        }

        const invoiceNumber = `INV-${Date.now()}-${bookingData.id}`;
        const invoiceFileName = `${invoiceNumber}.txt`;
        const invoicePath = `/invoices/${invoiceFileName}`;
        const fullPath = path.join(invoicesDir, invoiceFileName);

        // Calculate rental period
        const startDate = new Date(bookingData.start_date);
        const endDate = new Date(bookingData.end_date);
        const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

        // Generate invoice content
        const invoiceContent = `
AGRICULTURE EQUIPMENT RENTAL SYSTEM
INVOICE
=====================================================

Invoice Number: ${invoiceNumber}
Payment ID: ${paymentId}
Date: ${new Date().toLocaleDateString()}

CUSTOMER DETAILS:
Name: ${bookingData.customer_name}
Email: ${bookingData.customer_email}

EQUIPMENT DETAILS:
Equipment: ${bookingData.equipment_name}
Daily Rate: $${bookingData.daily_rate}
Rental Period: ${startDate.toDateString()} to ${endDate.toDateString()}
Total Days: ${days}

BOOKING DETAILS:
Booking ID: ${bookingData.id}
Start Date: ${bookingData.start_date}
End Date: ${bookingData.end_date}
Delivery Address: ${bookingData.delivery_address || 'N/A'}

PAYMENT SUMMARY:
Total Amount: $${bookingData.total_amount}
Payment Status: Completed
Payment Date: ${new Date().toLocaleDateString()}

Thank you for your business!
=====================================================
        `;

        // Write invoice file
        fs.writeFileSync(fullPath, invoiceContent.trim());

        return invoicePath;

    } catch (error) {
        console.error('Generate invoice error:', error);
        return null;
    }
}

module.exports = router;