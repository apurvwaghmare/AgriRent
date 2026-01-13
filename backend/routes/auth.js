const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { auth, allowRoles, requireAdmin, requireVendor, requireCustomer, requireAnyUser } = require('../middleware/auth');

const router = express.Router();

// Helper function to generate JWT token
const generateToken = (user, userType) => {
    return jwt.sign(
        { 
            userId: user.id, 
            email: user.email, 
            userType: userType,
            ...(userType === 'vendor' && { status: user.status })
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// =====================================================
// VENDOR ROUTES
// =====================================================

// Vendor Registration (status: pending)
router.post('/vendor/register', async (req, res) => {
    try {
        const { 
            shop_name, 
            owner_name, 
            email, 
            phone, 
            address, 
            city, 
            password 
        } = req.body;

        // Validate required fields
        if (!shop_name || !owner_name || !email || !phone || !address || !city || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required: shop_name, owner_name, email, phone, address, city, password'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        // Check if vendor already exists
        const existingVendor = await query(
            'SELECT id FROM vendors WHERE email = ?',
            [email]
        );

        if (existingVendor.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Vendor with this email already exists'
            });
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert new vendor with 'pending' status
        const result = await query(`
            INSERT INTO vendors (shop_name, owner_name, email, phone, address, city, password, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
        `, [shop_name, owner_name, email, phone, address, city, hashedPassword]);

        res.status(201).json({
            success: true,
            message: 'Vendor registration successful. Your account is pending approval by admin.',
            data: {
                id: result.insertId,
                shop_name,
                owner_name,
                email,
                phone,
                city,
                status: 'pending'
            }
        });

    } catch (error) {
        console.error('Vendor registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Vendor Login
router.post('/vendor/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find vendor by email
        const vendors = await query(
            'SELECT * FROM vendors WHERE email = ?',
            [email]
        );

        if (vendors.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const vendor = vendors[0];

        // Check if vendor account is suspended (allow pending and approved)
        if (vendor.status === 'suspended') {
            return res.status(403).json({
                success: false,
                message: 'Your vendor account has been suspended'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, vendor.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = generateToken(vendor, 'vendor');

        res.status(200).json({
            success: true,
            message: 'Vendor login successful',
            data: {
                id: vendor.id,
                shop_name: vendor.shop_name,
                owner_name: vendor.owner_name,
                email: vendor.email,
                phone: vendor.phone,
                address: vendor.address,
                city: vendor.city,
                status: vendor.status,
                userType: 'vendor',
                token
            }
        });

    } catch (error) {
        console.error('Vendor login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// =====================================================
// CUSTOMER ROUTES
// =====================================================

// Customer Registration
router.post('/customer/register', async (req, res) => {
    try {
        const { name, email, phone, address, password } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !address || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required: name, email, phone, address, password'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        // Check if customer already exists
        const existingCustomer = await query(
            'SELECT id FROM customers WHERE email = ?',
            [email]
        );

        if (existingCustomer.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Customer with this email already exists'
            });
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert new customer with 'pending' status
        const result = await query(`
            INSERT INTO customers (name, email, phone, address, password, status) 
            VALUES (?, ?, ?, ?, ?, 'pending')
        `, [name, email, phone, address, hashedPassword]);

        res.status(201).json({
            success: true,
            message: 'Customer registration successful. Your account is pending approval by admin.',
            data: {
                id: result.insertId,
                name,
                email,
                phone,
                address,
                status: 'pending'
            }
        });

    } catch (error) {
        console.error('Customer registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Customer Login
router.post('/customer/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find customer by email
        const customers = await query(
            'SELECT * FROM customers WHERE email = ?',
            [email]
        );

        if (customers.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const customer = customers[0];

        // Check if customer is approved
        if (customer.status !== 'approved') {
            return res.status(403).json({
                success: false,
                message: `Account ${customer.status}. Please wait for admin approval.`
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, customer.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = generateToken(customer, 'customer');

        res.status(200).json({
            success: true,
            message: 'Customer login successful',
            data: {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                address: customer.address,
                status: customer.status,
                userType: 'customer',
                token
            }
        });

    } catch (error) {
        console.error('Customer login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// =====================================================
// ADMIN ROUTES
// =====================================================

// Admin Login (No registration - admins are pre-created)
router.post('/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find admin by email
        const admins = await query(
            'SELECT * FROM admins WHERE email = ?',
            [email]
        );

        if (admins.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const admin = admins[0];

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = generateToken(admin, 'admin');

        res.status(200).json({
            success: true,
            message: 'Admin login successful',
            data: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                userType: 'admin',
                token
            }
        });

    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// =====================================================
// PROFILE ROUTES
// =====================================================

// Get current user profile (works for all user types)
router.get('/profile', auth, requireAnyUser, async (req, res) => {
    try {
        // User data is already loaded by auth middleware
        const userData = { ...req.user };
        
        // Remove sensitive internal fields from response
        delete userData.userId; // Keep only 'id'
        
        res.status(200).json({
            success: true,
            data: userData
        });

    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Logout (client-side token removal)
router.post('/logout', auth, (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
});

module.exports = router;