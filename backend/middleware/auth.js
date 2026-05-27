const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const isDevelopment = process.env.NODE_ENV === 'development';

const debugLog = (...args) => {
    if (isDevelopment) {
        console.log(...args);
    }
};

const auth = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.header('Authorization');
        
        debugLog('🔐 Auth middleware - checking token...');
        debugLog('📡 Authorization header:', authHeader ? 'Present' : 'Missing');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            debugLog('❌ Auth failed: No valid Authorization header');
            return res.status(401).json({
                success: false,
                message: 'Access denied. No valid token provided.'
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        debugLog('✅ Token verified successfully:', { userId: decoded.userId, userType: decoded.userType });

        // Determine table name based on user type
        let tableName;
        switch (decoded.userType) {
            case 'admin':
                tableName = 'admins';
                break;
            case 'vendor':
                tableName = 'vendors';
                break;
            case 'customer':
                tableName = 'customers';
                break;
            default:
                debugLog('❌ Auth failed: Invalid user type:', decoded.userType);
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token. Invalid user type.'
                });
        }

        debugLog('🔍 Checking user existence in table:', tableName);
        
        // Check if user still exists
        const users = await query(
            `SELECT id, email FROM ${tableName} WHERE id = ?`,
            [decoded.userId]
        );

        if (users.length === 0) {
            debugLog('❌ Auth failed: User not found in database');
            return res.status(401).json({
                success: false,
                message: 'Invalid token. User not found.'
            });
        }

        // For vendors, check account status
        if (decoded.userType === 'vendor') {
            const vendorStatus = await query(
                'SELECT status FROM vendors WHERE id = ?',
                [decoded.userId]
            );

            if (vendorStatus.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'Vendor account not found.'
                });
            }

            // Only block suspended vendors, allow pending and approved
            if (vendorStatus[0].status === 'suspended') {
                return res.status(403).json({
                    success: false,
                    message: 'Vendor account has been suspended.'
                });
            }
            
            // Store vendor status for use in routes
            req.vendorStatus = vendorStatus[0].status;
        }

        // Get full user data from the appropriate table
        const fullUserData = await query(
            `SELECT * FROM ${tableName} WHERE id = ?`,
            [decoded.userId]
        );

        const userData = fullUserData[0];

        // Add comprehensive user info to request object
        req.user = {
            id: userData.id,
            userId: userData.id, // Keep for backward compatibility
            email: userData.email,
            userType: decoded.userType,
            role: decoded.userType, // Alias for role-based checks
            
            // User type specific fields
            ...(decoded.userType === 'admin' && {
                name: userData.name,
                permissions: userData.permissions || 'full'
            }),
            
            ...(decoded.userType === 'vendor' && {
                shopName: userData.shop_name,
                ownerName: userData.owner_name,
                phone: userData.phone,
                address: userData.address,
                city: userData.city,
                status: userData.status
            }),
            
            ...(decoded.userType === 'customer' && {
                name: userData.name,
                phone: userData.phone,
                address: userData.address
            }),
            
            createdAt: userData.created_at,
            updatedAt: userData.updated_at
        };

        next();

    } catch (error) {
        debugLog('❌ Auth middleware error:', error.message);
        debugLog('🔍 Error type:', error.name);
        
        if (error.name === 'JsonWebTokenError') {
            debugLog('❌ JWT Error: Invalid token format or signature');
            return res.status(401).json({
                success: false,
                message: 'Invalid token.'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            debugLog('❌ JWT Error: Token has expired');
            return res.status(401).json({
                success: false,
                message: 'Token expired.'
            });
        }

        console.error('❌ Unexpected auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Role-based access control middleware
const allowRoles = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            // Check if user is authenticated
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required. Please login first.'
                });
            }

            // Check if user's role is in the allowed roles
            if (!allowedRoles.includes(req.user.userType)) {
                return res.status(403).json({
                    success: false,
                    message: `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.userType}`
                });
            }

            // Additional check for vendors - must be approved
            if (req.user.userType === 'vendor' && req.user.status !== 'approved') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Vendor account is not approved.'
                });
            }

            next();

        } catch (error) {
            console.error('Role authorization error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during authorization'
            });
        }
    };
};

// Convenience middleware for specific roles
const requireAdmin = allowRoles('admin');
const requireVendor = allowRoles('vendor');
const requireCustomer = allowRoles('customer');
const requireVendorOrAdmin = allowRoles('vendor', 'admin');
const requireCustomerOrAdmin = allowRoles('customer', 'admin');
const requireAnyUser = allowRoles('admin', 'vendor', 'customer');

module.exports = {
    auth,
    allowRoles,
    requireAdmin,
    requireVendor,
    requireCustomer,
    requireVendorOrAdmin,
    requireCustomerOrAdmin,
    requireAnyUser
};