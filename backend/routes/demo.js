const express = require('express');
const { auth, allowRoles, requireAdmin, requireVendor, requireCustomer, requireAnyUser, requireVendorOrAdmin } = require('../middleware/auth');

const router = express.Router();

// =====================================================
// EXAMPLE ROUTES USING ROLE-BASED ACCESS CONTROL
// =====================================================

// Public route - no authentication required
router.get('/public', (req, res) => {
    res.json({
        success: true,
        message: 'This is a public endpoint accessible to everyone',
        data: {
            timestamp: new Date().toISOString(),
            server: 'Agriculture Equipment Rental System'
        }
    });
});

// Protected route - any authenticated user
router.get('/protected', auth, requireAnyUser, (req, res) => {
    res.json({
        success: true,
        message: 'This endpoint requires authentication but accepts any user type',
        data: {
            user: {
                id: req.user.id,
                email: req.user.email,
                userType: req.user.userType,
                name: req.user.name || req.user.ownerName || 'N/A'
            }
        }
    });
});

// Admin only routes
router.get('/admin/dashboard', auth, requireAdmin, (req, res) => {
    res.json({
        success: true,
        message: 'Admin dashboard - Only admins can access this',
        data: {
            admin: {
                id: req.user.id,
                name: req.user.name,
                email: req.user.email,
                permissions: req.user.permissions
            },
            stats: {
                totalUsers: 'This would contain real stats',
                totalEquipment: 'In a real app',
                totalBookings: 'Retrieved from database'
            }
        }
    });
});

router.get('/admin/users', auth, requireAdmin, (req, res) => {
    res.json({
        success: true,
        message: 'User management - Admin only',
        data: {
            message: 'Here you would get all users, approve vendors, etc.',
            adminUser: req.user.name
        }
    });
});

// Vendor only routes
router.get('/vendor/equipment', auth, requireVendor, (req, res) => {
    res.json({
        success: true,
        message: 'Vendor equipment management - Vendors only',
        data: {
            vendor: {
                id: req.user.id,
                shopName: req.user.shopName,
                ownerName: req.user.ownerName,
                status: req.user.status
            },
            equipment: 'Here would be the vendor\'s equipment list'
        }
    });
});

router.post('/vendor/equipment', auth, requireVendor, (req, res) => {
    res.json({
        success: true,
        message: 'Add new equipment - Vendors only',
        data: {
            message: 'Equipment would be added here',
            vendorId: req.user.id
        }
    });
});

// Customer only routes
router.get('/customer/bookings', auth, requireCustomer, (req, res) => {
    res.json({
        success: true,
        message: 'Customer bookings - Customers only',
        data: {
            customer: {
                id: req.user.id,
                name: req.user.name,
                email: req.user.email
            },
            bookings: 'Here would be the customer\'s booking history'
        }
    });
});

router.post('/customer/book-equipment', auth, requireCustomer, (req, res) => {
    res.json({
        success: true,
        message: 'Book equipment - Customers only',
        data: {
            message: 'Equipment booking would be processed here',
            customerId: req.user.id
        }
    });
});

// Mixed access routes - Vendors and Admins
router.get('/equipment/management', auth, requireVendorOrAdmin, (req, res) => {
    res.json({
        success: true,
        message: 'Equipment management - Vendors and Admins only',
        data: {
            user: {
                id: req.user.id,
                userType: req.user.userType,
                name: req.user.name || req.user.ownerName
            },
            message: req.user.userType === 'admin' 
                ? 'Admin can manage all equipment' 
                : 'Vendor can manage their own equipment'
        }
    });
});

// Custom role combination
router.get('/reports', auth, allowRoles('admin', 'vendor'), (req, res) => {
    res.json({
        success: true,
        message: 'Reports section - Custom role combination',
        data: {
            userType: req.user.userType,
            accessLevel: req.user.userType === 'admin' ? 'Full reports' : 'Vendor-specific reports'
        }
    });
});

// Route with multiple middleware - Authentication + Custom roles + Additional checks
router.delete('/equipment/:id', auth, allowRoles('admin', 'vendor'), async (req, res) => {
    try {
        const equipmentId = req.params.id;
        
        // Additional business logic based on user type
        if (req.user.userType === 'vendor') {
            // Vendors can only delete their own equipment
            res.json({
                success: true,
                message: 'Vendor attempting to delete equipment',
                data: {
                    equipmentId,
                    vendorId: req.user.id,
                    note: 'In real app, check if equipment belongs to this vendor'
                }
            });
        } else if (req.user.userType === 'admin') {
            // Admins can delete any equipment
            res.json({
                success: true,
                message: 'Admin deleting equipment',
                data: {
                    equipmentId,
                    adminId: req.user.id,
                    note: 'Admin can delete any equipment'
                }
            });
        }
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting equipment'
        });
    }
});

// Profile update routes with different access levels
router.put('/profile', auth, requireAnyUser, (req, res) => {
    res.json({
        success: true,
        message: 'Profile update - Any authenticated user',
        data: {
            userId: req.user.id,
            userType: req.user.userType,
            note: 'All users can update their own profile'
        }
    });
});

router.put('/user/:id/status', auth, requireAdmin, (req, res) => {
    res.json({
        success: true,
        message: 'Update user status - Admin only',
        data: {
            targetUserId: req.params.id,
            adminId: req.user.id,
            note: 'Only admins can change user status (approve/suspend vendors, etc.)'
        }
    });
});

module.exports = router;