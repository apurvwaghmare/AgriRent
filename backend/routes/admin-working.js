const express = require('express');
const { query } = require('../config/db');

const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  console.log('✅ Admin test route hit');
  res.json({
    success: true,
    message: 'Admin routes are working!',
    timestamp: new Date().toISOString()
  });
});

// Test vendors
router.get('/test-vendors', async (req, res) => {
  try {
    const vendors = await query('SELECT * FROM vendors');
    res.json({
      success: true,
      message: 'Vendors retrieved successfully',
      data: vendors,
      count: vendors.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving vendors',
      error: error.message
    });
  }
});

// Test customers
router.get('/test-customers', async (req, res) => {
  try {
    const customers = await query('SELECT * FROM customers');
    res.json({
      success: true,
      message: 'Customers retrieved successfully',
      data: customers,
      count: customers.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving customers',
      error: error.message
    });
  }
});

// Get vendors
router.get('/vendors', async (req, res) => {
  try {
    const vendors = await query('SELECT * FROM vendors');
    res.json({
      success: true,
      data: vendors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving vendors'
    });
  }
});

// Get users (customers)
router.get('/users', async (req, res) => {
  try {
    const users = await query('SELECT * FROM customers');
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving users'
    });
  }
});

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

// Get all feedback
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

// Get analytics
router.get('/analytics', async (req, res) => {
  try {
    const vendorCount = await query('SELECT COUNT(*) as count FROM vendors');
    const customerCount = await query('SELECT COUNT(*) as count FROM customers');
    const pendingVendorCount = await query('SELECT COUNT(*) as count FROM vendors WHERE status = "pending"');
    const approvedVendorCount = await query('SELECT COUNT(*) as count FROM vendors WHERE status = "approved"');
    
    res.json({
      success: true,
      data: {
        totals: {
          vendors: vendorCount[0].count,
          customers: customerCount[0].count,
          equipment: 0, // No equipment table yet
          bookings: 0,  // No bookings table yet
          revenue: 0    // No revenue calculation yet
        },
        status: {
          pendingVendors: pendingVendorCount[0].count,
          approvedVendors: approvedVendorCount[0].count,
          pendingBookings: 0,
          completedBookings: 0
        }
      }
    });
  } catch (error) {
    console.error('❌ Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving analytics'
    });
  }
});

// Approve vendor
router.put('/vendors/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`✅ Approving vendor ID: ${id}`);
    
    await query('UPDATE vendors SET status = ? WHERE id = ?', ['approved', id]);
    
    res.json({
      success: true,
      message: 'Vendor approved successfully'
    });
  } catch (error) {
    console.error('❌ Error approving vendor:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving vendor',
      error: error.message
    });
  }
});

// Reject vendor
router.put('/vendors/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`❌ Rejecting vendor ID: ${id}`);
    
    // Use 'suspended' instead of 'rejected' since that's what the ENUM allows
    await query('UPDATE vendors SET status = ? WHERE id = ?', ['suspended', id]);
    
    res.json({
      success: true,
      message: 'Vendor rejected successfully'
    });
  } catch (error) {
    console.error('❌ Error rejecting vendor:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting vendor',
      error: error.message
    });
  }
});

// Approve customer
router.put('/customers/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`✅ Approving customer ID: ${id}`);
    
    await query('UPDATE customers SET status = ? WHERE id = ?', ['approved', id]);
    
    res.json({
      success: true,
      message: 'Customer approved successfully'
    });
  } catch (error) {
    console.error('❌ Error approving customer:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving customer',
      error: error.message
    });
  }
});

// Reject customer
router.put('/customers/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`❌ Rejecting customer ID: ${id}`);
    
    // Use 'suspended' instead of 'rejected' since that's what the ENUM allows
    await query('UPDATE customers SET status = ? WHERE id = ?', ['suspended', id]);
    
    res.json({
      success: true,
      message: 'Customer rejected successfully'
    });
  } catch (error) {
    console.error('❌ Error rejecting customer:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting customer',
      error: error.message
    });
  }
});

// Get user details by ID
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const users = await query('SELECT * FROM customers WHERE id = ?', [id]);
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving user details'
    });
  }
});

// Suspend customer account
router.put('/users/:id/suspend', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🚫 Suspending customer ID: ${id}`);
    
    // Add a status column to customers table or use a different approach
    // For now, we'll add a note to the address field
    await query('UPDATE customers SET address = CONCAT(address, " [SUSPENDED]") WHERE id = ? AND address NOT LIKE "%[SUSPENDED]%"', [id]);
    
    res.json({
      success: true,
      message: 'Customer account suspended successfully'
    });
  } catch (error) {
    console.error('❌ Error suspending customer:', error);
    res.status(500).json({
      success: false,
      message: 'Error suspending customer account',
      error: error.message
    });
  }
});

// Get customer booking history
router.get('/users/:id/bookings', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📋 Getting booking history for customer ID: ${id}`);
    
    // Fetch bookings for this customer
    const bookings = await query(`
      SELECT 
        b.id,
        b.equipment_id,
        b.vendor_id,
        b.start_date,
        b.end_date,
        b.total_cost,
        b.rental_type,
        b.delivery_address,
        b.status,
        b.notes,
        b.admin_notes,
        b.created_at,
        e.name as equipment_name,
        e.type as equipment_type,
        v.shop_name as vendor_name,
        v.phone as vendor_phone,
        v.email as vendor_email
      FROM bookings b
      JOIN equipment e ON b.equipment_id = e.id
      JOIN vendors v ON b.vendor_id = v.id
      WHERE b.customer_id = ?
      ORDER BY b.created_at DESC
    `, [id]);
    
    console.log(`📋 Found ${bookings.length} booking(s) for customer ID: ${id}`);
    
    res.json({
      success: true,
      data: bookings,
      message: bookings.length > 0 ? `Found ${bookings.length} booking(s)` : 'No bookings found for this customer'
    });
  } catch (error) {
    console.error('❌ Error getting booking history:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving booking history',
      error: error.message
    });
  }
});

// Send message to customer (placeholder)
router.post('/users/:id/message', async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    console.log(`📧 Sending message to customer ID: ${id}`, message);
    
    // For now, just log the message
    // You can implement actual messaging system later
    res.json({
      success: true,
      message: 'Message sent successfully (simulated)'
    });
  } catch (error) {
    console.error('❌ Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
});

// Get vendor details by ID
router.get('/vendors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const vendors = await query('SELECT * FROM vendors WHERE id = ?', [id]);
    
    if (vendors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }
    
    res.json({
      success: true,
      data: vendors[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving vendor details'
    });
  }
});

// Get vendor equipment
router.get('/vendors/:id/equipment', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🚜 Getting equipment for vendor ID: ${id}`);
    
    // For now, return empty array since equipment table might not be properly set up
    const equipment = [];
    
    res.json({
      success: true,
      data: equipment,
      message: 'No equipment found for this vendor'
    });
  } catch (error) {
    console.error('❌ Error getting vendor equipment:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving vendor equipment',
      error: error.message
    });
  }
});

// Get vendor bookings
router.get('/vendors/:id/bookings', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📋 Getting bookings for vendor ID: ${id}`);
    
    // For now, return empty array since bookings table might not be properly set up
    const bookings = [];
    
    res.json({
      success: true,
      data: bookings,
      message: 'No bookings found for this vendor'
    });
  } catch (error) {
    console.error('❌ Error getting vendor bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving vendor bookings',
      error: error.message
    });
  }
});

// Send message to vendor
router.post('/vendors/:id/message', async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    console.log(`📧 Sending message to vendor ID: ${id}`, message);
    
    // For now, just log the message
    res.json({
      success: true,
      message: 'Message sent to vendor successfully (simulated)'
    });
  } catch (error) {
    console.error('❌ Error sending message to vendor:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message to vendor',
      error: error.message
    });
  }
});

module.exports = router;