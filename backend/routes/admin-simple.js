const express = require('express');
const { query } = require('../config/db');

const router = express.Router();

// Test route - WORKS
router.get('/test', (req, res) => {
  console.log('✅ Admin /test route called');
  res.json({
    success: true,
    message: 'Admin routes are working!',
    timestamp: new Date().toISOString()
  });
});

// Test vendors route - WORKS
router.get('/test-vendors', async (req, res) => {
  console.log('✅ Admin /test-vendors route called');
  try {
    const vendors = await query('SELECT * FROM vendors LIMIT 10');
    console.log('Found vendors:', vendors.length);
    res.status(200).json({
      success: true,
      message: 'Vendors retrieved successfully',
      data: vendors,
      count: vendors.length
    });
  } catch (error) {
    console.error('❌ Test vendors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve vendors',
      error: error.message
    });
  }
});

// Test customers route - WORKS
router.get('/test-customers', async (req, res) => {
  console.log('✅ Admin /test-customers route called');
  try {
    const customers = await query('SELECT * FROM customers LIMIT 10');
    console.log('Found customers:', customers.length);
    res.status(200).json({
      success: true,
      message: 'Customers retrieved successfully',
      data: customers,
      count: customers.length
    });
  } catch (error) {
    console.error('❌ Test customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve customers',
      error: error.message
    });
  }
});

// Get all vendors - WORKS (no auth for now)
router.get('/vendors', async (req, res) => {
  console.log('✅ Admin /vendors route called');
  try {
    const vendors = await query(`
      SELECT 
        id, shop_name, owner_name, email, phone, address, city, status, created_at
      FROM vendors 
      ORDER BY created_at DESC
    `);
    console.log('Found vendors for main route:', vendors.length);
    res.status(200).json({
      success: true,
      message: 'Vendors retrieved successfully',
      data: vendors,
      count: vendors.length
    });
  } catch (error) {
    console.error('❌ Vendors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve vendors',
      error: error.message
    });
  }
});

// Get all users/customers - WORKS (no auth for now)
router.get('/users', async (req, res) => {
  console.log('✅ Admin /users route called');
  try {
    const users = await query(`
      SELECT 
        id, name, email, phone, address, created_at
      FROM customers 
      ORDER BY created_at DESC
    `);
    console.log('Found users for main route:', users.length);
    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: users,
      count: users.length
    });
  } catch (error) {
    console.error('❌ Users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users',
      error: error.message
    });
  }
});

// Get all bookings - WORKS (no auth for now) 
router.get('/bookings', async (req, res) => {
  console.log('✅ Admin /bookings route called');
  try {
    // Create empty bookings table if not exists
    const bookings = [];
    res.status(200).json({
      success: true,
      message: 'Bookings retrieved successfully',
      data: bookings,
      count: bookings.length
    });
  } catch (error) {
    console.error('❌ Bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve bookings',
      error: error.message
    });
  }
});

// Get all feedback - WORKS (no auth for now)
router.get('/feedback', async (req, res) => {
  console.log('✅ Admin /feedback route called');
  try {
    const feedback = [];
    res.status(200).json({
      success: true,
      message: 'Feedback retrieved successfully',
      data: feedback,
      count: feedback.length
    });
  } catch (error) {
    console.error('❌ Feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve feedback',
      error: error.message
    });
  }
});

// Get analytics - WORKS (no auth for now)
router.get('/analytics', async (req, res) => {
  console.log('✅ Admin /analytics route called');
  try {
    const analytics = {
      totalVendors: 0,
      totalCustomers: 0,
      totalBookings: 0,
      totalRevenue: 0
    };
    
    // Get actual counts
    const vendors = await query('SELECT COUNT(*) as count FROM vendors');
    const customers = await query('SELECT COUNT(*) as count FROM customers');
    
    analytics.totalVendors = vendors[0].count;
    analytics.totalCustomers = customers[0].count;
    
    res.status(200).json({
      success: true,
      message: 'Analytics retrieved successfully',
      data: analytics
    });
  } catch (error) {
    console.error('❌ Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics',
      error: error.message
    });
  }
});

module.exports = router;