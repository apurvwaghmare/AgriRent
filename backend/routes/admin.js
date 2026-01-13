const express = require('express');
const { query } = require('../config/db');
// const { requireAdmin } = require('../middleware/auth'); // Temporarily disabled

const router = express.Router();

// Test route (no auth required) - for debugging
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Admin routes are working!',
    timestamp: new Date().toISOString()
  });
});

// Test vendors route without auth - for debugging
router.get('/test-vendors', async (req, res) => {
  try {
    const vendors = await query(`
      SELECT 
        id, 
        shop_name, 
        owner_name, 
        email, 
        phone, 
        address, 
        city, 
        status,
        created_at, 
        updated_at 
      FROM vendors 
      ORDER BY created_at DESC
    `);

    res.status(200).json({
      success: true,
      message: 'Vendors retrieved successfully (test route)',
      data: vendors,
      count: vendors.length
    });
  } catch (error) {
    console.error('Test vendors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve vendors',
      error: error.message
    });
  }
});

// Test customers route without auth - for debugging
router.get('/test-customers', async (req, res) => {
  try {
    const customers = await query(`
      SELECT 
        id, 
        name, 
        email, 
        phone, 
        address, 
        city, 
        created_at, 
        updated_at 
      FROM customers 
      ORDER BY created_at DESC
    `);

    res.status(200).json({
      success: true,
      message: 'Customers retrieved successfully (test route)',
      data: customers,
      count: customers.length
    });
  } catch (error) {
    console.error('Test customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve customers',
      error: error.message
    });
  }
});

// =====================================================
// ADMIN USER MANAGEMENT (Protected Routes)
// =====================================================

// Apply admin authentication middleware to protected routes
// TEMPORARILY DISABLED FOR DEBUGGING
// router.use(requireAdmin);

// Get all users (customers)
router.get('/users', async (req, res) => {
    try {
        const users = await query(`
            SELECT 
                id, 
                name, 
                email, 
                phone, 
                address, 
                city, 
                created_at, 
                updated_at 
            FROM customers 
            ORDER BY created_at DESC
        `);

        res.status(200).json({
            success: true,
            message: 'Users retrieved successfully',
            data: users
        });

    } catch (error) {
        console.error('Admin get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve users'
        });
    }
});

// Get user by ID
router.get('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const users = await query(`
            SELECT 
                id, 
                name, 
                email, 
                phone, 
                address, 
                city, 
                created_at, 
                updated_at 
            FROM customers 
            WHERE id = ?
        `, [id]);

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'User retrieved successfully',
            data: users[0]
        });

    } catch (error) {
        console.error('Admin get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve user'
        });
    }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if user exists
        const users = await query('SELECT id FROM customers WHERE id = ?', [id]);
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Delete user (this will cascade delete related bookings if foreign keys are set up)
        await query('DELETE FROM customers WHERE id = ?', [id]);

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        console.error('Admin delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user'
        });
    }
});

// =====================================================
// ADMIN VENDOR MANAGEMENT
// =====================================================

// Get all vendors
router.get('/vendors', async (req, res) => {
    try {
        const vendors = await query(`
            SELECT 
                id, 
                shop_name, 
                owner_name, 
                email, 
                phone, 
                address, 
                city, 
                status,
                created_at, 
                updated_at 
            FROM vendors 
            ORDER BY created_at DESC
        `);

        res.status(200).json({
            success: true,
            message: 'Vendors retrieved successfully',
            data: vendors
        });

    } catch (error) {
        console.error('Admin get vendors error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve vendors'
        });
    }
});

// Approve vendor
router.put('/vendors/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if vendor exists
        const vendors = await query('SELECT id, status FROM vendors WHERE id = ?', [id]);
        if (vendors.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        // Update vendor status to approved
        await query('UPDATE vendors SET status = ?, updated_at = NOW() WHERE id = ?', ['approved', id]);

        res.status(200).json({
            success: true,
            message: 'Vendor approved successfully'
        });

    } catch (error) {
        console.error('Admin approve vendor error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve vendor'
        });
    }
});

// Reject vendor
router.put('/vendors/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if vendor exists
        const vendors = await query('SELECT id, status FROM vendors WHERE id = ?', [id]);
        if (vendors.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        // Update vendor status to rejected
        await query('UPDATE vendors SET status = ?, updated_at = NOW() WHERE id = ?', ['rejected', id]);

        res.status(200).json({
            success: true,
            message: 'Vendor rejected successfully'
        });

    } catch (error) {
        console.error('Admin reject vendor error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject vendor'
        });
    }
});

// =====================================================
// ADMIN CUSTOMER MANAGEMENT
// =====================================================

// Approve customer
router.put('/customers/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if customer exists
        const customers = await query('SELECT id, status FROM customers WHERE id = ?', [id]);
        if (customers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Update customer status to approved
        await query('UPDATE customers SET status = ?, updated_at = NOW() WHERE id = ?', ['approved', id]);

        res.status(200).json({
            success: true,
            message: 'Customer approved successfully'
        });

    } catch (error) {
        console.error('Admin approve customer error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve customer'
        });
    }
});

// Reject customer
router.put('/customers/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if customer exists
        const customers = await query('SELECT id, status FROM customers WHERE id = ?', [id]);
        if (customers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Update customer status to suspended
        await query('UPDATE customers SET status = ?, updated_at = NOW() WHERE id = ?', ['suspended', id]);

        res.status(200).json({
            success: true,
            message: 'Customer rejected successfully'
        });

    } catch (error) {
        console.error('Admin reject customer error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject customer'
        });
    }
});

// =====================================================
// ADMIN BOOKING MANAGEMENT
// =====================================================

// Get all bookings
router.get('/bookings', async (req, res) => {
    try {
        const bookings = await query(`
            SELECT 
                b.id,
                b.start_date,
                b.end_date,
                b.total_cost,
                b.status,
                b.rental_type,
                b.delivery_address,
                b.notes,
                b.created_at,
                c.name as customer_name,
                c.email as customer_email,
                c.phone as customer_phone,
                e.name as equipment_name,
                e.type as equipment_type,
                v.shop_name as vendor_name,
                v.owner_name as vendor_owner,
                v.phone as vendor_phone
            FROM bookings b
            JOIN customers c ON b.customer_id = c.id
            JOIN equipment e ON b.equipment_id = e.id
            JOIN vendors v ON b.vendor_id = v.id
            ORDER BY b.created_at DESC
        `);

        res.status(200).json({
            success: true,
            message: 'Bookings retrieved successfully',
            data: bookings
        });

    } catch (error) {
        console.error('Admin get bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve bookings'
        });
    }
});

// =====================================================
// ADMIN STATISTICS
// =====================================================

// Get system statistics
router.get('/stats', async (req, res) => {
    try {
        // Get counts for dashboard
        const [customers, vendors, equipment, bookings] = await Promise.all([
            query('SELECT COUNT(*) as count FROM customers'),
            query('SELECT COUNT(*) as count FROM vendors'),
            query('SELECT COUNT(*) as count FROM equipment'),
            query('SELECT COUNT(*) as count FROM bookings')
        ]);

        // Get vendor status breakdown
        const vendorStats = await query(`
            SELECT status, COUNT(*) as count 
            FROM vendors 
            GROUP BY status
        `);

        // Get booking status breakdown
        const bookingStats = await query(`
            SELECT status, COUNT(*) as count 
            FROM bookings 
            GROUP BY status
        `);

        // Get revenue stats (if total_amount exists)
        const revenueStats = await query(`
            SELECT 
                SUM(total_amount) as total_revenue,
                AVG(total_amount) as avg_booking_value,
                COUNT(*) as completed_bookings
            FROM bookings 
            WHERE status = 'completed'
        `);

        res.status(200).json({
            success: true,
            message: 'Statistics retrieved successfully',
            data: {
                totals: {
                    customers: customers[0].count,
                    vendors: vendors[0].count,
                    equipment: equipment[0].count,
                    bookings: bookings[0].count
                },
                vendorStats,
                bookingStats,
                revenue: revenueStats[0] || { total_revenue: 0, avg_booking_value: 0, completed_bookings: 0 }
            }
        });

    } catch (error) {
        console.error('Admin get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve statistics'
        });
    }
});

// =====================================================
// ADMIN ANALYTICS AND CHARTS
// =====================================================

// GET /api/admin/analytics/dashboard - Dashboard analytics
router.get('/analytics/dashboard', async (req, res) => {
    try {
        // Total counts
        const totalVendors = await query('SELECT COUNT(*) as total FROM vendors');
        const totalCustomers = await query('SELECT COUNT(*) as total FROM customers');
        const totalEquipment = await query('SELECT COUNT(*) as total FROM equipment');
        const totalBookings = await query('SELECT COUNT(*) as total FROM bookings');
        
        // Revenue
        const totalRevenue = await query('SELECT SUM(total_cost) as total FROM bookings WHERE status = "completed"');
        
        // Status counts
        const pendingVendors = await query('SELECT COUNT(*) as total FROM vendors WHERE status = "pending"');
        const approvedVendors = await query('SELECT COUNT(*) as total FROM vendors WHERE status = "approved"');
        const pendingBookings = await query('SELECT COUNT(*) as total FROM bookings WHERE status = "pending"');
        const completedBookings = await query('SELECT COUNT(*) as total FROM bookings WHERE status = "completed"');

        res.status(200).json({
            success: true,
            message: 'Dashboard analytics retrieved successfully',
            data: {
                totals: {
                    vendors: totalVendors[0].total,
                    customers: totalCustomers[0].total,
                    equipment: totalEquipment[0].total,
                    bookings: totalBookings[0].total,
                    revenue: totalRevenue[0].total || 0
                },
                status: {
                    pendingVendors: pendingVendors[0].total,
                    approvedVendors: approvedVendors[0].total,
                    pendingBookings: pendingBookings[0].total,
                    completedBookings: completedBookings[0].total
                }
            }
        });

    } catch (error) {
        console.error('Admin dashboard analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve dashboard analytics'
        });
    }
});

// GET /api/admin/analytics/charts - Chart data
router.get('/analytics/charts', async (req, res) => {
    try {
        // Monthly bookings for the last 6 months
        const monthlyBookings = await query(`
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                COUNT(*) as count
            FROM bookings 
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month ASC
        `);

        // Monthly revenue for the last 6 months
        const monthlyRevenue = await query(`
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                SUM(total_cost) as revenue
            FROM bookings 
            WHERE status = 'completed' 
            AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month ASC
        `);

        // Equipment type distribution
        const equipmentTypes = await query(`
            SELECT 
                type,
                COUNT(*) as count
            FROM equipment
            GROUP BY type
            ORDER BY count DESC
        `);

        // Top vendors by bookings
        const topVendors = await query(`
            SELECT 
                v.shop_name,
                COUNT(b.id) as booking_count,
                SUM(CASE WHEN b.status = 'completed' THEN b.total_cost ELSE 0 END) as revenue
            FROM vendors v
            LEFT JOIN equipment e ON v.id = e.vendor_id
            LEFT JOIN bookings b ON e.id = b.equipment_id
            WHERE v.status = 'approved'
            GROUP BY v.id, v.shop_name
            ORDER BY booking_count DESC
            LIMIT 10
        `);

        res.status(200).json({
            success: true,
            message: 'Chart data retrieved successfully',
            data: {
                monthlyBookings: monthlyBookings,
                monthlyRevenue: monthlyRevenue,
                equipmentTypes: equipmentTypes,
                topVendors: topVendors
            }
        });

    } catch (error) {
        console.error('Admin chart analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve chart data'
        });
    }
});

// =====================================================
// FEEDBACK MANAGEMENT
// =====================================================

// GET /api/admin/feedback - Get all feedback
router.get('/feedback', async (req, res) => {
    try {
        const feedback = await query(`
            SELECT 
                f.id,
                f.rating,
                f.comment,
                f.created_at,
                c.name as customer_name,
                c.email as customer_email,
                v.shop_name as vendor_name,
                v.owner_name as vendor_owner,
                e.name as equipment_name,
                e.type as equipment_type,
                b.start_date,
                b.end_date
            FROM feedback f
            JOIN customers c ON f.customer_id = c.id
            JOIN vendors v ON f.vendor_id = v.id
            JOIN bookings b ON f.booking_id = b.id
            JOIN equipment e ON b.equipment_id = e.id
            ORDER BY f.created_at DESC
        `);

        res.status(200).json({
            success: true,
            message: 'Feedback retrieved successfully',
            data: feedback
        });

    } catch (error) {
        console.error('Admin get feedback error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve feedback'
        });
    }
});

// DELETE /api/admin/feedback/:id - Delete feedback
router.delete('/feedback/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if feedback exists
        const feedbackExists = await query('SELECT id FROM feedback WHERE id = ?', [id]);
        if (feedbackExists.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found'
            });
        }

        // Delete feedback
        await query('DELETE FROM feedback WHERE id = ?', [id]);

        res.status(200).json({
            success: true,
            message: 'Feedback deleted successfully'
        });

    } catch (error) {
        console.error('Admin delete feedback error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete feedback'
        });
    }
});

module.exports = router;