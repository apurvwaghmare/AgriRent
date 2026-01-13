const express = require('express');
const multer = require('multer');
const path = require('path');
const { query } = require('../config/db');
const { auth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/equipment/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'equipment-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
    }
});

// =====================================================
// PUBLIC EQUIPMENT ROUTES
// =====================================================

// GET /api/equipment - Public equipment listing with filters
router.get('/', async (req, res) => {
    try {
        const { 
            type,           // category_id filter
            city,           // vendor city filter
            vendor_id,      // specific vendor filter
            category_id,    // alternative to type
            availability_status = 'available',
            search,
            min_price,
            max_price,
            sort_by = 'created_at',
            sort_order = 'DESC',
            page = 1, 
            limit = 12 
        } = req.query;

        const offset = (page - 1) * limit;

        // Build WHERE conditions
        let whereConditions = ['e.availability_status = ?'];
        let queryParams = [availability_status];

        // Category filter (type or category_id)
        const categoryFilter = type || category_id;
        if (categoryFilter) {
            whereConditions.push('e.category_id = ?');
            queryParams.push(categoryFilter);
        }

        // City filter (based on vendor location)
        if (city) {
            whereConditions.push('v.city LIKE ?');
            queryParams.push(`%${city}%`);
        }

        // Vendor filter
        if (vendor_id) {
            whereConditions.push('e.vendor_id = ?');
            queryParams.push(vendor_id);
        }

        // Search filter
        if (search) {
            whereConditions.push('(e.name LIKE ? OR e.model LIKE ? OR e.description LIKE ? OR e.specifications LIKE ?)');
            const searchPattern = `%${search}%`;
            queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }

        // Price range filter
        if (min_price) {
            whereConditions.push('e.daily_rate >= ?');
            queryParams.push(parseFloat(min_price));
        }
        if (max_price) {
            whereConditions.push('e.daily_rate <= ?');
            queryParams.push(parseFloat(max_price));
        }

        const whereClause = whereConditions.join(' AND ');

        // Validate sort field
        const allowedSortFields = ['created_at', 'daily_rate', 'name', 'model'];
        const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
        const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        // Main query with all details
        const equipmentQuery = `
            SELECT 
                e.*,
                c.name as category_name,
                c.description as category_description,
                v.shop_name as vendor_shop_name,
                v.owner_name as vendor_owner_name,
                v.city as vendor_city,
                v.phone as vendor_phone,
                v.email as vendor_email,
                v.address as vendor_address,
                (SELECT COUNT(*) FROM bookings b WHERE b.equipment_id = e.id AND b.status IN ('confirmed', 'ongoing')) as active_bookings,
                (SELECT AVG(rating) FROM feedback f JOIN bookings b ON f.booking_id = b.id WHERE b.equipment_id = e.id) as average_rating,
                (SELECT COUNT(*) FROM feedback f JOIN bookings b ON f.booking_id = b.id WHERE b.equipment_id = e.id) as review_count
            FROM equipment e
            LEFT JOIN categories c ON e.category_id = c.id
            LEFT JOIN vendors v ON e.vendor_id = v.id
            WHERE ${whereClause} AND v.status = 'approved'
            ORDER BY e.${sortField} ${sortDirection}
            LIMIT ? OFFSET ?
        `;

        const equipment = await query(equipmentQuery, [...queryParams, parseInt(limit), offset]);

        // Count query for pagination
        const countQuery = `
            SELECT COUNT(*) as total
            FROM equipment e
            LEFT JOIN vendors v ON e.vendor_id = v.id
            WHERE ${whereClause} AND v.status = 'approved'
        `;

        const countResult = await query(countQuery, queryParams);
        const total = countResult[0].total;

        // Parse images for each equipment
        const equipmentWithImages = equipment.map(item => ({
            ...item,
            images: item.images ? JSON.parse(item.images) : [],
            average_rating: item.average_rating ? parseFloat(item.average_rating) : null,
            review_count: parseInt(item.review_count) || 0,
            active_bookings: parseInt(item.active_bookings) || 0
        }));

        // Get filter options for frontend
        const categories = await query('SELECT id, name FROM categories ORDER BY name');
        const cities = await query(`
            SELECT DISTINCT v.city 
            FROM vendors v 
            WHERE v.status = 'approved' AND v.city IS NOT NULL 
            ORDER BY v.city
        `);

        const totalPages = Math.ceil(total / limit);

        res.status(200).json({
            success: true,
            message: 'Equipment retrieved successfully',
            data: {
                equipment: equipmentWithImages,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: totalPages,
                    totalRecords: total,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1,
                    itemsPerPage: parseInt(limit)
                },
                filters: {
                    categories: categories,
                    cities: cities.map(c => c.city),
                    appliedFilters: {
                        type: categoryFilter || null,
                        city: city || null,
                        vendor_id: vendor_id || null,
                        search: search || null,
                        min_price: min_price || null,
                        max_price: max_price || null,
                        availability_status: availability_status
                    }
                }
            }
        });

    } catch (error) {
        console.error('Get equipment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve equipment'
        });
    }
});

// GET /api/equipment/:id - Get single equipment details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Comprehensive equipment details
        const equipmentQuery = `
            SELECT 
                e.*,
                c.name as category_name,
                c.description as category_description,
                v.shop_name as vendor_shop_name,
                v.owner_name as vendor_owner_name,
                v.city as vendor_city,
                v.phone as vendor_phone,
                v.email as vendor_email,
                v.address as vendor_address,
                v.id as vendor_id,
                (SELECT COUNT(*) FROM bookings b WHERE b.equipment_id = e.id AND b.status IN ('confirmed', 'ongoing')) as active_bookings,
                (SELECT COUNT(*) FROM bookings b WHERE b.equipment_id = e.id AND b.status = 'completed') as completed_bookings,
                (SELECT AVG(rating) FROM feedback f JOIN bookings b ON f.booking_id = b.id WHERE b.equipment_id = e.id) as average_rating,
                (SELECT COUNT(*) FROM feedback f JOIN bookings b ON f.booking_id = b.id WHERE b.equipment_id = e.id) as review_count
            FROM equipment e
            LEFT JOIN categories c ON e.category_id = c.id
            LEFT JOIN vendors v ON e.vendor_id = v.id
            WHERE e.id = ? AND v.status = 'approved'
        `;

        const equipment = await query(equipmentQuery, [id]);

        if (equipment.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Equipment not found or vendor not approved'
            });
        }

        const equipmentData = equipment[0];

        // Get recent reviews
        const reviewsQuery = `
            SELECT 
                f.*,
                c.name as customer_name,
                b.start_date,
                b.end_date
            FROM feedback f
            JOIN bookings b ON f.booking_id = b.id
            JOIN customers c ON b.customer_id = c.id
            WHERE b.equipment_id = ?
            ORDER BY f.created_at DESC
            LIMIT 5
        `;

        const reviews = await query(reviewsQuery, [id]);

        // Get similar equipment (same category, excluding current)
        const similarQuery = `
            SELECT 
                e.id,
                e.name,
                e.model,
                e.daily_rate,
                e.images,
                v.shop_name as vendor_shop_name,
                v.city as vendor_city,
                (SELECT AVG(rating) FROM feedback f JOIN bookings b ON f.booking_id = b.id WHERE b.equipment_id = e.id) as average_rating
            FROM equipment e
            LEFT JOIN vendors v ON e.vendor_id = v.id
            WHERE e.category_id = ? AND e.id != ? AND e.availability_status = 'available' AND v.status = 'approved'
            ORDER BY RAND()
            LIMIT 4
        `;

        const similarEquipment = await query(similarQuery, [equipmentData.category_id, id]);

        // Parse images and format data
        const responseData = {
            ...equipmentData,
            images: equipmentData.images ? JSON.parse(equipmentData.images) : [],
            average_rating: equipmentData.average_rating ? parseFloat(equipmentData.average_rating) : null,
            review_count: parseInt(equipmentData.review_count) || 0,
            active_bookings: parseInt(equipmentData.active_bookings) || 0,
            completed_bookings: parseInt(equipmentData.completed_bookings) || 0,
            reviews: reviews,
            similar_equipment: similarEquipment.map(item => ({
                ...item,
                images: item.images ? JSON.parse(item.images) : [],
                average_rating: item.average_rating ? parseFloat(item.average_rating) : null
            }))
        };

        res.status(200).json({
            success: true,
            message: 'Equipment details retrieved successfully',
            data: responseData
        });

    } catch (error) {
        console.error('Get equipment by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve equipment details'
        });
    }
});

// Create new equipment (admin only)
router.post('/', auth, requireAdmin, upload.single('image'), async (req, res) => {
    try {
        const {
            name,
            description,
            category_id,
            daily_rate,
            specifications,
            availability_status = 'available'
        } = req.body;

        // Validate required fields
        if (!name || !description || !category_id || !daily_rate) {
            return res.status(400).json({
                success: false,
                message: 'Name, description, category, and daily rate are required'
            });
        }

        const image_url = req.file ? `/uploads/equipment/${req.file.filename}` : null;

        const result = await query(`
            INSERT INTO equipment 
            (name, description, category_id, daily_rate, specifications, image_url, availability_status) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [name, description, category_id, daily_rate, specifications, image_url, availability_status]);

        res.status(201).json({
            success: true,
            message: 'Equipment created successfully',
            data: {
                id: result.insertId,
                name,
                description,
                category_id,
                daily_rate,
                specifications,
                image_url,
                availability_status
            }
        });

    } catch (error) {
        console.error('Create equipment error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Update equipment (admin only)
router.put('/:id', auth, requireAdmin, upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            description,
            category_id,
            daily_rate,
            specifications,
            availability_status
        } = req.body;

        // Check if equipment exists
        const existingEquipment = await query('SELECT * FROM equipment WHERE id = ?', [id]);
        if (existingEquipment.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Equipment not found'
            });
        }

        const image_url = req.file ? `/uploads/equipment/${req.file.filename}` : existingEquipment[0].image_url;

        await query(`
            UPDATE equipment 
            SET name = ?, description = ?, category_id = ?, daily_rate = ?, 
                specifications = ?, image_url = ?, availability_status = ?, updated_at = NOW()
            WHERE id = ?
        `, [name, description, category_id, daily_rate, specifications, image_url, availability_status, id]);

        res.status(200).json({
            success: true,
            message: 'Equipment updated successfully'
        });

    } catch (error) {
        console.error('Update equipment error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Delete equipment (admin only)
router.delete('/:id', auth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if equipment exists
        const equipment = await query('SELECT * FROM equipment WHERE id = ?', [id]);
        if (equipment.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Equipment not found'
            });
        }

        // Check if equipment has active rentals
        const activeRentals = await query(
            'SELECT id FROM rentals WHERE equipment_id = ? AND status IN ("pending", "approved")',
            [id]
        );

        if (activeRentals.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete equipment with active rentals'
            });
        }

        await query('DELETE FROM equipment WHERE id = ?', [id]);

        res.status(200).json({
            success: true,
            message: 'Equipment deleted successfully'
        });

    } catch (error) {
        console.error('Delete equipment error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;