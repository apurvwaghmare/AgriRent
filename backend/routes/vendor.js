const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../config/db');
const { auth, requireVendor } = require('../middleware/auth');

const router = express.Router();

// =====================================================
// MULTER CONFIGURATION FOR IMAGE UPLOADS
// =====================================================

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/equipment');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename: vendorId_timestamp_originalname
        const vendorId = req.user.id;
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const nameWithoutExt = path.basename(file.originalname, ext);
        const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
        cb(null, `vendor_${vendorId}_${timestamp}_${sanitizedName}${ext}`);
    }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 5 // Maximum 5 files per upload
    }
});

// =====================================================
// VENDOR DASHBOARD
// =====================================================

// GET /api/vendor/dashboard - Vendor dashboard with statistics
router.get('/dashboard', auth, requireVendor, async (req, res) => {
    try {
        console.log('🔍 Vendor dashboard accessed by user:', req.user);
        console.log('🔍 Vendor status:', req.vendorStatus);
        const vendorId = req.user.id;

        // If vendor is pending, return limited data
        if (req.vendorStatus === 'pending') {
            return res.status(200).json({
                success: true,
                message: 'Vendor dashboard data retrieved successfully',
                data: {
                    vendor: {
                        id: vendorId,
                        status: req.vendorStatus
                    },
                    stats: {
                        equipment: { total: 0 },
                        bookings: { total: 0, completed: 0, pending: 0, active: 0 },
                        revenue: { total: 0, monthly: 0 }
                    },
                    recentBookings: [],
                    message: 'Your account is pending approval. Limited access until approved.',
                    lastUpdated: new Date().toISOString()
                }
            });
        }

        // Get basic vendor stats with proper error handling
        let equipmentCount = 0;
        let bookingsStats = { total_bookings: 0, active_bookings: 0, completed_bookings: 0, pending_bookings: 0 };
        let revenueStats = { total_revenue: 0, monthly_revenue: 0 };

        try {
            // Get vendor's equipment count
            const equipmentResult = await query(
                'SELECT COUNT(*) as total FROM equipment WHERE vendor_id = ?',
                [vendorId]
            );
            equipmentCount = equipmentResult[0].total;
            console.log('📊 Equipment count for vendor', vendorId, ':', equipmentCount);
        } catch (err) {
            console.error('Equipment count query error:', err);
        }

        try {
            // Get vendor's bookings count (total and active)
            const bookingResult = await query(`
                SELECT 
                    COUNT(*) as total_bookings,
                    SUM(CASE WHEN b.status IN ('confirmed', 'ongoing') THEN 1 ELSE 0 END) as active_bookings,
                    SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) as completed_bookings,
                    SUM(CASE WHEN b.status = 'pending' THEN 1 ELSE 0 END) as pending_bookings
                FROM bookings b
                JOIN equipment e ON b.equipment_id = e.id
                WHERE e.vendor_id = ?
            `, [vendorId]);
            if (bookingResult.length > 0) {
                bookingsStats = bookingResult[0];
            }
        } catch (err) {
            console.error('Bookings stats query error:', err);
        }

        // Simplified response for now - basic stats without complex queries
        res.status(200).json({
            success: true,
            message: 'Vendor dashboard data retrieved successfully',
            data: {
                vendor: {
                    id: req.user.id,
                    shopName: req.user.shopName,
                    ownerName: req.user.ownerName,
                    email: req.user.email,
                    city: req.user.city,
                    status: req.user.status
                },
                stats: {
                    equipment: {
                        total: equipmentCount,
                        categories: [],
                        status: []
                    },
                    bookings: {
                        total: bookingsStats.total_bookings || 0,
                        active: bookingsStats.active_bookings || 0,
                        completed: bookingsStats.completed_bookings || 0,
                        pending: bookingsStats.pending_bookings || 0
                    },
                    revenue: {
                        total: parseFloat(revenueStats.total_revenue) || 0,
                        monthly: parseFloat(revenueStats.monthly_revenue) || 0
                    }
                },
                recentBookings: [],
                lastUpdated: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Vendor dashboard error:', error);
        console.error('❌ Error details:', {
            message: error.message,
            stack: error.stack,
            vendorId: req.user?.id
        });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve dashboard data',
            error: error.message
        });
    }
});

// =====================================================
// EQUIPMENT MANAGEMENT
// =====================================================

// POST /api/vendor/equipment - Add new equipment with image upload
router.post('/equipment', auth, requireVendor, upload.array('images', 5), async (req, res) => {
    try {
        const vendorId = req.user.id;
        const {
            name,
            type,
            description,
            category_id,
            daily_rate,
            weekly_rate,
            monthly_rate,
            availability = 'available',
            condition_status = 'good',
            specifications,
            location
        } = req.body;

        // Validation
        if (!name || !type || !category_id || !daily_rate) {
            return res.status(400).json({
                success: false,
                message: 'Required fields: name, type, category_id, daily_rate'
            });
        }

        // Validate category exists
        const categoryExists = await query(
            'SELECT id FROM equipment_categories WHERE id = ?',
            [category_id]
        );

        if (categoryExists.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category ID'
            });
        }

        // Process uploaded images
        let imagePaths = [];
        if (req.files && req.files.length > 0) {
            imagePaths = req.files.map(file => `/uploads/equipment/${file.filename}`);
        }

        // Insert equipment
        const result = await query(`
            INSERT INTO equipment (
                vendor_id, name, type, description, category_id,
                price_per_day, price_per_week, price_per_month, 
                location, condition_status, specifications, 
                image, availability, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
            vendorId, name, type, description, category_id,
            parseFloat(daily_rate), 
            weekly_rate ? parseFloat(weekly_rate) : null,
            monthly_rate ? parseFloat(monthly_rate) : null,
            location || null,
            condition_status || 'good',
            specifications ? JSON.stringify(specifications) : null, 
            imagePaths.length > 0 ? imagePaths[0] : null,
            availability || 'available'
        ]);

        // Get the created equipment with category info
        const newEquipment = await query(`
            SELECT 
                e.*,
                c.name as category_name,
                v.shop_name as vendor_shop_name
            FROM equipment e
            JOIN equipment_categories c ON e.category_id = c.id
            JOIN vendors v ON e.vendor_id = v.id
            WHERE e.id = ?
        `, [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Equipment added successfully',
            data: {
                ...newEquipment[0],
                images: JSON.parse(newEquipment[0].images || '[]')
            }
        });

    } catch (error) {
        console.error('Add equipment error:', error);
        
        // Clean up uploaded files if database operation failed
        if (req.files) {
            req.files.forEach(file => {
                fs.unlink(file.path, (err) => {
                    if (err) console.error('Failed to delete file:', file.path);
                });
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to add equipment'
        });
    }
});

// PUT /api/vendor/equipment/:id - Update equipment
router.put('/equipment/:id', auth, requireVendor, upload.array('newImages', 5), async (req, res) => {
    try {
        const vendorId = req.user.id;
        const equipmentId = req.params.id;
        const {
            name,
            model,
            description,
            category_id,
            daily_rate,
            weekly_rate,
            monthly_rate,
            availability_status,
            condition_status,
            specifications,
            location,
            removeImages // Array of image paths to remove
        } = req.body;

        // Verify equipment exists and belongs to vendor
        const equipment = await query(
            'SELECT * FROM equipment WHERE id = ? AND vendor_id = ?',
            [equipmentId, vendorId]
        );

        if (equipment.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Equipment not found or access denied'
            });
        }

        // Validate category if provided
        if (category_id) {
            const categoryExists = await query(
                'SELECT id FROM equipment_categories WHERE id = ?',
                [category_id]
            );

            if (categoryExists.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid category ID'
                });
            }
        }

        // Handle image updates
        let currentImages = JSON.parse(equipment[0].images || '[]');
        
        // Remove specified images
        if (removeImages && Array.isArray(removeImages)) {
            removeImages.forEach(imagePath => {
                const fullPath = path.join(__dirname, '..', imagePath);
                fs.unlink(fullPath, (err) => {
                    if (err) console.error('Failed to delete image:', fullPath);
                });
                currentImages = currentImages.filter(img => img !== imagePath);
            });
        }

        // Add new images
        if (req.files && req.files.length > 0) {
            const newImagePaths = req.files.map(file => `/uploads/equipment/${file.filename}`);
            currentImages = [...currentImages, ...newImagePaths];
        }

        // Build update query dynamically
        const updateFields = [];
        const updateValues = [];

        if (name !== undefined) { updateFields.push('name = ?'); updateValues.push(name); }
        if (model !== undefined) { updateFields.push('model = ?'); updateValues.push(model); }
        if (description !== undefined) { updateFields.push('description = ?'); updateValues.push(description); }
        if (category_id !== undefined) { updateFields.push('category_id = ?'); updateValues.push(category_id); }
        if (daily_rate !== undefined) { updateFields.push('price_per_day = ?'); updateValues.push(daily_rate); }
        if (weekly_rate !== undefined) { updateFields.push('price_per_week = ?'); updateValues.push(weekly_rate); }
        if (monthly_rate !== undefined) { updateFields.push('price_per_month = ?'); updateValues.push(monthly_rate); }
        if (availability_status !== undefined) { updateFields.push('availability = ?'); updateValues.push(availability_status); }
        if (condition_status !== undefined) { updateFields.push('condition_status = ?'); updateValues.push(condition_status); }
        if (specifications !== undefined) { updateFields.push('specifications = ?'); updateValues.push(specifications); }
        if (location !== undefined) { updateFields.push('location = ?'); updateValues.push(location); }
        
        updateFields.push('images = ?');
        updateValues.push(JSON.stringify(currentImages));
        updateFields.push('updated_at = NOW()');

        updateValues.push(equipmentId, vendorId);

        // Update equipment
        await query(`
            UPDATE equipment 
            SET ${updateFields.join(', ')}
            WHERE id = ? AND vendor_id = ?
        `, updateValues);

        // Get updated equipment
        const updatedEquipment = await query(`
            SELECT 
                e.*,
                c.name as category_name,
                v.shop_name as vendor_shop_name
            FROM equipment e
            JOIN equipment_categories c ON e.category_id = c.id
            JOIN vendors v ON e.vendor_id = v.id
            WHERE e.id = ? AND e.vendor_id = ?
        `, [equipmentId, vendorId]);

        res.status(200).json({
            success: true,
            message: 'Equipment updated successfully',
            data: {
                ...updatedEquipment[0],
                images: JSON.parse(updatedEquipment[0].images || '[]')
            }
        });

    } catch (error) {
        console.error('Update equipment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update equipment'
        });
    }
});

// DELETE /api/vendor/equipment/:id - Delete equipment
router.delete('/equipment/:id', auth, requireVendor, async (req, res) => {
    try {
        const vendorId = req.user.id;
        const equipmentId = req.params.id;

        // Verify equipment exists and belongs to vendor
        const equipment = await query(
            'SELECT * FROM equipment WHERE id = ? AND vendor_id = ?',
            [equipmentId, vendorId]
        );

        if (equipment.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Equipment not found or access denied'
            });
        }

        // Check for active bookings
        const activeBookings = await query(
            'SELECT COUNT(*) as count FROM bookings WHERE equipment_id = ? AND status IN (?, ?)',
            [equipmentId, 'confirmed', 'ongoing']
        );

        if (activeBookings[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete equipment with active bookings'
            });
        }

        // Delete associated images
        const images = JSON.parse(equipment[0].images || '[]');
        images.forEach(imagePath => {
            const fullPath = path.join(__dirname, '..', imagePath);
            fs.unlink(fullPath, (err) => {
                if (err) console.error('Failed to delete image:', fullPath);
            });
        });

        // Delete equipment
        await query(
            'DELETE FROM equipment WHERE id = ? AND vendor_id = ?',
            [equipmentId, vendorId]
        );

        res.status(200).json({
            success: true,
            message: 'Equipment deleted successfully'
        });

    } catch (error) {
        console.error('Delete equipment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete equipment'
        });
    }
});

// =====================================================
// VENDOR BOOKINGS
// =====================================================

// GET /api/vendor/bookings - Get vendor's equipment bookings
router.get('/bookings', auth, requireVendor, async (req, res) => {
    try {
        const vendorId = req.user.id;
        const { 
            status, 
            page = 1, 
            limit = 10,
            sortBy = 'created_at',
            sortOrder = 'DESC',
            equipment_id,
            start_date,
            end_date
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

        if (start_date && end_date) {
            whereConditions.push('(b.start_date BETWEEN ? AND ? OR b.end_date BETWEEN ? AND ?)');
            queryParams.push(start_date, end_date, start_date, end_date);
        }

        const whereClause = whereConditions.join(' AND ');

        // Get total count
        const countResult = await query(`
            SELECT COUNT(*) as total
            FROM bookings b
            JOIN equipment e ON b.equipment_id = e.id
            WHERE e.vendor_id = ?
        `, [vendorId]);

        // Get bookings with pagination - simplified query
        const bookings = await query(`
            SELECT 
                b.*,
                e.name as equipment_name,
                e.type as equipment_type,
                e.image as equipment_image
            FROM bookings b
            JOIN equipment e ON b.equipment_id = e.id
            WHERE e.vendor_id = ?
            ORDER BY b.created_at DESC
            LIMIT 10
        `, [vendorId]);

        // Remove image parsing since we simplified the response
        const totalPages = Math.ceil(countResult[0].total / 10);

        res.status(200).json({
            success: true,
            message: 'Vendor bookings retrieved successfully',
            data: {
                bookings: bookings,
                pagination: {
                    currentPage: parseInt(1),
                    totalPages: totalPages,
                    totalRecords: countResult[0].total,
                    hasNextPage: 1 < totalPages,
                    hasPrevPage: 1 > 1
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
// EQUIPMENT LISTING (GET)
// =====================================================

// GET /api/vendor/equipment - Get vendor's equipment
router.get('/equipment', auth, requireVendor, async (req, res) => {
    try {
        console.log('🔍 Equipment request received for vendor:', req.user.id);
        console.log('📋 User object:', req.user);
        
        const vendorId = req.user.id;
        
        // Simple test query first
        console.log('🧪 Testing simple equipment query...');
        const testQuery = `SELECT COUNT(*) as count FROM equipment WHERE vendor_id = ?`;
        const testResult = await query(testQuery, [vendorId]);
        console.log('� Equipment count for vendor:', testResult[0].count);
        
        // If test passes, get actual equipment
        const equipment = await query(`
            SELECT 
                e.*,
                c.name as category_name
            FROM equipment e
            LEFT JOIN equipment_categories c ON e.category_id = c.id
            WHERE e.vendor_id = ? 
            ORDER BY e.created_at DESC 
            LIMIT 10
        `, [vendorId]);
        
        console.log('✅ Equipment query successful, found:', equipment.length, 'items');
        
        res.status(200).json({
            success: true,
            message: 'Vendor equipment retrieved successfully',
            data: {
                equipment: equipment,
                total: testResult[0].count,
                pagination: {
                    currentPage: 1,
                    totalPages: 1,
                    totalRecords: testResult[0].count,
                    hasNextPage: false,
                    hasPrevPage: false
                }
            }
        });

    } catch (error) {
        console.error('❌ Get vendor equipment error:', error);
        console.error('❌ Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve equipment',
            error: error.message
        });
    }
});

// =====================================================
// BOOKING MANAGEMENT
// =====================================================

// PUT /api/vendor/bookings/:id/status - Update booking status
router.put('/bookings/:id/status', auth, requireVendor, async (req, res) => {
    try {
        const { id: bookingId } = req.params;
        const { status, notes } = req.body;
        const vendorId = req.user.id;

        // Validate status
        const allowedStatuses = ['approved', 'rejected', 'completed', 'cancelled'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Allowed values: approved, rejected, completed, cancelled'
            });
        }

        // Verify booking belongs to vendor
        const bookingCheck = await query(`
            SELECT b.id, b.status as current_status, e.vendor_id
            FROM bookings b
            JOIN equipment e ON b.equipment_id = e.id
            WHERE b.id = ? AND e.vendor_id = ?
        `, [bookingId, vendorId]);

        if (bookingCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found or not authorized'
            });
        }

        // Update booking status
        await query(`
            UPDATE bookings 
            SET status = ?, notes = ?, updated_at = NOW()
            WHERE id = ?
        `, [status, notes || null, bookingId]);

        res.status(200).json({
            success: true,
            message: `Booking ${status} successfully`,
            data: {
                bookingId: bookingId,
                newStatus: status,
                notes: notes
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
// FEEDBACK MANAGEMENT
// =====================================================

// GET /api/vendor/feedback - Get all feedback for vendor's equipment
router.get('/feedback', auth, requireVendor, async (req, res) => {
    try {
        const vendorId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Get feedback for vendor's equipment - simplified query
        const feedback = await query(`
            SELECT 
                f.id,
                f.rating,
                f.comment,
                f.created_at,
                f.booking_id,
                f.customer_id
            FROM feedback f
            WHERE f.vendor_id = ?
            ORDER BY f.created_at DESC
            LIMIT 10
        `, [vendorId]);

        // Get total count for pagination
        const countResult = await query(`
            SELECT COUNT(*) as total
            FROM feedback f
            WHERE f.vendor_id = ?
        `, [vendorId]);

        // Get feedback statistics - simplified
        const stats = await query(`
            SELECT 
                COUNT(*) as total_feedback,
                AVG(f.rating) as average_rating,
                COUNT(CASE WHEN f.rating >= 4 THEN 1 END) as positive_feedback,
                COUNT(CASE WHEN f.rating <= 2 THEN 1 END) as negative_feedback
            FROM feedback f
            WHERE f.vendor_id = ?
        `, [vendorId]);

        const totalPages = Math.ceil(countResult[0].total / 10);

        res.status(200).json({
            success: true,
            message: 'Feedback retrieved successfully',
            data: {
                feedback: feedback,
                stats: {
                    total: stats[0].total_feedback || 0,
                    averageRating: parseFloat(stats[0].average_rating || 0).toFixed(1),
                    positive: stats[0].positive_feedback || 0,
                    negative: stats[0].negative_feedback || 0
                },
                pagination: {
                    currentPage: 1,
                    totalPages: totalPages,
                    totalRecords: countResult[0].total,
                    hasNextPage: 1 < totalPages,
                    hasPrevPage: false
                }
            }
        });

    } catch (error) {
        console.error('Get vendor feedback error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve feedback'
        });
    }
});

// =====================================================
// SALES AND ANALYTICS
// =====================================================

// GET /api/vendor/sales - Get detailed sales information
router.get('/sales', auth, requireVendor, async (req, res) => {
    try {
        const vendorId = req.user.id;
        const { period = 'month' } = req.query; // month, quarter, year

        let dateCondition;
        switch (period) {
            case 'week':
                dateCondition = 'AND b.created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)';
                break;
            case 'month':
                dateCondition = 'AND b.created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
                break;
            case 'quarter':
                dateCondition = 'AND b.created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)';
                break;
            case 'year':
                dateCondition = 'AND b.created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)';
                break;
            default:
                dateCondition = 'AND b.created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
        }

        // Get sales summary
        const salesSummary = await query(`
            SELECT 
                COUNT(*) as total_sales,
                SUM(b.total_cost) as total_revenue,
                AVG(b.total_cost) as average_order_value,
                COUNT(DISTINCT b.customer_id) as unique_customers
            FROM bookings b
            JOIN equipment e ON b.equipment_id = e.id
            WHERE e.vendor_id = ? AND b.status = 'completed' ${dateCondition}
        `, [vendorId]);

        // Get top performing equipment
        const topEquipment = await query(`
            SELECT 
                e.id,
                e.name,
                e.model,
                COUNT(b.id) as bookings_count,
                SUM(b.total_cost) as revenue
            FROM equipment e
            LEFT JOIN bookings b ON e.id = b.equipment_id AND b.status = 'completed' ${dateCondition}
            WHERE e.vendor_id = ?
            GROUP BY e.id, e.name, e.model
            ORDER BY revenue DESC
            LIMIT 5
        `, [vendorId]);

        // Get recent completed sales
        const recentSales = await query(`
            SELECT 
                b.id,
                b.start_date,
                b.end_date,
                b.total_cost,
                b.created_at,
                e.name as equipment_name,
                e.model as equipment_model,
                c.name as customer_name,
                c.email as customer_email
            FROM bookings b
            JOIN equipment e ON b.equipment_id = e.id
            JOIN customers c ON b.customer_id = c.id
            WHERE e.vendor_id = ? AND b.status = 'completed' ${dateCondition}
            ORDER BY b.created_at DESC
            LIMIT 10
        `, [vendorId]);

        res.status(200).json({
            success: true,
            message: 'Sales data retrieved successfully',
            data: {
                period: period,
                summary: {
                    totalSales: salesSummary[0].total_sales || 0,
                    totalRevenue: parseFloat(salesSummary[0].total_revenue) || 0,
                    averageOrderValue: parseFloat(salesSummary[0].average_order_value) || 0,
                    uniqueCustomers: salesSummary[0].unique_customers || 0
                },
                topEquipment: topEquipment,
                recentSales: recentSales
            }
        });

    } catch (error) {
        console.error('Get vendor sales error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve sales data'
        });
    }
});

// GET /api/vendor/analytics - Get analytics data for charts
router.get('/analytics', auth, requireVendor, async (req, res) => {
    try {
        const vendorId = req.user.id;
        const { period = 'month' } = req.query; // week, month, quarter, year

        let dateFormat, dateCondition;
        switch (period) {
            case 'week':
                dateFormat = '%Y-%m-%d';
                dateCondition = 'AND b.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
                break;
            case 'month':
                dateFormat = '%Y-%m-%d';
                dateCondition = 'AND b.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
                break;
            case 'quarter':
                dateFormat = '%Y-%m';
                dateCondition = 'AND b.created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)';
                break;
            case 'year':
                dateFormat = '%Y-%m';
                dateCondition = 'AND b.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)';
                break;
            default:
                dateFormat = '%Y-%m-%d';
                dateCondition = 'AND b.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
        }

        // Get bookings trend
        const bookingsTrend = await query(`
            SELECT 
                DATE_FORMAT(b.created_at, '${dateFormat}') as period,
                COUNT(*) as bookings,
                SUM(CASE WHEN b.status = 'completed' THEN b.total_cost ELSE 0 END) as revenue
            FROM bookings b
            JOIN equipment e ON b.equipment_id = e.id
            WHERE e.vendor_id = ? ${dateCondition}
            GROUP BY DATE_FORMAT(b.created_at, '${dateFormat}')
            ORDER BY period ASC
        `, [vendorId]);

        // Get equipment category performance
        const categoryPerformance = await query(`
            SELECT 
                cat.name as category,
                COUNT(b.id) as bookings,
                SUM(CASE WHEN b.status = 'completed' THEN b.total_cost ELSE 0 END) as revenue
            FROM equipment e
            LEFT JOIN equipment_categories cat ON e.category_id = cat.id
            LEFT JOIN bookings b ON e.id = b.equipment_id ${dateCondition}
            WHERE e.vendor_id = ?
            GROUP BY cat.id, cat.name
            ORDER BY revenue DESC
        `, [vendorId]);

        // Get booking status distribution
        const statusDistribution = await query(`
            SELECT 
                b.status,
                COUNT(*) as count
            FROM bookings b
            JOIN equipment e ON b.equipment_id = e.id
            WHERE e.vendor_id = ? ${dateCondition}
            GROUP BY b.status
        `, [vendorId]);

        res.status(200).json({
            success: true,
            message: 'Analytics data retrieved successfully',
            data: {
                period: period,
                bookingsTrend: bookingsTrend,
                categoryPerformance: categoryPerformance,
                statusDistribution: statusDistribution,
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Get vendor analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve analytics data'
        });
    }
});

module.exports = router;