# Enhanced Authentication & Role-Based Access Control (RBAC)

## 🔐 Overview

The Agriculture Equipment Rental System now features a comprehensive authentication system with role-based access control. The system provides secure JWT-based authentication with granular permission controls for different user types.

## 🎯 Key Features

- **JWT Token Authentication** with user data exposure
- **Role-based Access Control** with flexible middleware
- **Enhanced User Context** in `req.user` object
- **Convenience Middleware** for common access patterns
- **Comprehensive Error Handling** for auth failures
- **Vendor Approval System** with status checks

## 🛡️ Authentication Middleware

### Core Authentication (`auth`)

The main authentication middleware verifies JWT tokens and exposes comprehensive user data:

```javascript
const { auth } = require('../middleware/auth');

// Use on any route that requires authentication
router.get('/protected-route', auth, (req, res) => {
    // req.user contains full user data
    console.log(req.user.id);        // User ID
    console.log(req.user.userType);  // 'admin', 'vendor', or 'customer'
    console.log(req.user.email);     // User email
    // ... additional user fields based on user type
});
```

### User Data Structure

The `req.user` object contains different fields based on user type:

#### Admin User (`req.user`)
```javascript
{
    id: 1,
    userId: 1,                    // Backward compatibility
    email: "admin@example.com",
    userType: "admin",
    role: "admin",               // Alias for userType
    name: "System Admin",
    permissions: "full",
    createdAt: "2025-10-09T...",
    updatedAt: "2025-10-09T..."
}
```

#### Vendor User (`req.user`)
```javascript
{
    id: 2,
    userId: 2,
    email: "vendor@example.com",
    userType: "vendor",
    role: "vendor",
    shopName: "Green Farm Equipment",
    ownerName: "John Farmer",
    phone: "+1234567890",
    address: "123 Farm Street",
    city: "Agricultural City",
    status: "approved",          // pending, approved, suspended
    createdAt: "2025-10-09T...",
    updatedAt: "2025-10-09T..."
}
```

#### Customer User (`req.user`)
```javascript
{
    id: 3,
    userId: 3,
    email: "customer@example.com",
    userType: "customer",
    role: "customer",
    name: "Jane Customer",
    phone: "+0987654321",
    address: "456 Rural Road",
    createdAt: "2025-10-09T...",
    updatedAt: "2025-10-09T..."
}
```

## 🔒 Role-Based Access Control

### Core RBAC Function (`allowRoles`)

Create custom role combinations:

```javascript
const { auth, allowRoles } = require('../middleware/auth');

// Allow only admins and vendors
router.get('/equipment/manage', auth, allowRoles('admin', 'vendor'), (req, res) => {
    // Only admins and approved vendors can access
});

// Allow any authenticated user
router.get('/profile', auth, allowRoles('admin', 'vendor', 'customer'), (req, res) => {
    // Any authenticated user can access
});
```

### Convenience Middleware

Pre-built middleware for common access patterns:

```javascript
const { 
    auth, 
    requireAdmin, 
    requireVendor, 
    requireCustomer,
    requireVendorOrAdmin,
    requireCustomerOrAdmin,
    requireAnyUser 
} = require('../middleware/auth');

// Admin only
router.delete('/users/:id', auth, requireAdmin, (req, res) => {
    // Only admins can delete users
});

// Vendor only (must be approved)
router.post('/equipment', auth, requireVendor, (req, res) => {
    // Only approved vendors can add equipment
});

// Customer only
router.post('/bookings', auth, requireCustomer, (req, res) => {
    // Only customers can create bookings
});

// Vendors or Admins
router.get('/equipment/analytics', auth, requireVendorOrAdmin, (req, res) => {
    // Vendors see their equipment, admins see all
});

// Any authenticated user
router.get('/profile', auth, requireAnyUser, (req, res) => {
    // Any logged-in user can access
});
```

## 📋 Complete Usage Examples

### Basic Protected Route
```javascript
// Requires authentication, any user type allowed
router.get('/dashboard', auth, requireAnyUser, (req, res) => {
    res.json({
        message: `Welcome ${req.user.name || req.user.ownerName}`,
        userType: req.user.userType,
        id: req.user.id
    });
});
```

### Role-Specific Business Logic
```javascript
router.get('/equipment', auth, allowRoles('admin', 'vendor', 'customer'), (req, res) => {
    if (req.user.userType === 'admin') {
        // Return all equipment
        return getAdminEquipmentView();
    } else if (req.user.userType === 'vendor') {
        // Return vendor's equipment only
        return getVendorEquipment(req.user.id);
    } else if (req.user.userType === 'customer') {
        // Return available equipment for rent
        return getAvailableEquipment();
    }
});
```

### Multi-Layer Middleware
```javascript
router.put('/equipment/:id', 
    auth,                           // 1. Authenticate user
    requireVendorOrAdmin,          // 2. Check role
    validateEquipmentData,         // 3. Custom validation
    async (req, res) => {          // 4. Business logic
        const equipmentId = req.params.id;
        
        if (req.user.userType === 'vendor') {
            // Verify vendor owns this equipment
            const isOwner = await checkEquipmentOwnership(equipmentId, req.user.id);
            if (!isOwner) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only modify your own equipment'
                });
            }
        }
        
        // Update equipment
        await updateEquipment(equipmentId, req.body);
        res.json({ success: true, message: 'Equipment updated' });
    }
);
```

## 🧪 Testing the System

### Run Comprehensive Tests

```bash
# Start the server
npm start

# Run authentication tests
node test-auth.js

# Run role-based access control tests
node test-rbac.js
```

### Test Endpoints Available

#### Demo Endpoints (for testing RBAC)
- `GET /api/demo/public` - No auth required
- `GET /api/demo/protected` - Any authenticated user
- `GET /api/demo/admin/dashboard` - Admin only
- `GET /api/demo/admin/users` - Admin only
- `GET /api/demo/vendor/equipment` - Vendor only
- `GET /api/demo/customer/bookings` - Customer only
- `GET /api/demo/equipment/management` - Vendor or Admin
- `GET /api/demo/reports` - Custom roles (admin, vendor)

#### Authentication Endpoints
- `POST /api/auth/admin/login`
- `POST /api/auth/vendor/register`
- `POST /api/auth/vendor/login`
- `POST /api/auth/customer/register`
- `POST /api/auth/customer/login`
- `GET /api/auth/profile` - Enhanced with full user data

## 🔧 Configuration

### Environment Variables
```env
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
```

### Default Admin Account
```
Email: admin@agriculture-rental.com
Password: admin123
```

## ⚡ Quick Migration Guide

### From Old Middleware
```javascript
// OLD
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

router.get('/admin-route', auth, adminAuth, (req, res) => {
    // req.user has limited data
});

// NEW
const { auth, requireAdmin } = require('../middleware/auth');

router.get('/admin-route', auth, requireAdmin, (req, res) => {
    // req.user has comprehensive data
    console.log(req.user.name);        // Admin name
    console.log(req.user.permissions); // Admin permissions
});
```

### Enhanced User Data Access
```javascript
// OLD
router.get('/profile', auth, async (req, res) => {
    // Had to query database again for user details
    const user = await query('SELECT * FROM users WHERE id = ?', [req.user.userId]);
    res.json(user[0]);
});

// NEW
router.get('/profile', auth, requireAnyUser, (req, res) => {
    // All user data already available
    res.json({
        success: true,
        data: req.user  // Complete user object with all fields
    });
});
```

## 🛡️ Security Features

- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Token Security**: Configurable expiration, secure signing
- **Role Validation**: Multiple layers of role checking
- **Vendor Approval**: Additional status validation for vendors
- **Token Verification**: Comprehensive JWT validation with error handling
- **User Existence**: Database validation for each request
- **Clean Data**: Sensitive fields removed from responses

## 📊 Error Responses

The middleware provides detailed error responses:

```javascript
// Authentication required
{
    "success": false,
    "message": "Access denied. No valid token provided."
}

// Invalid token
{
    "success": false,
    "message": "Invalid token."
}

// Insufficient permissions
{
    "success": false,
    "message": "Access denied. Required role(s): admin. Your role: customer"
}

// Vendor not approved
{
    "success": false,
    "message": "Access denied. Vendor account is not approved."
}
```

This enhanced authentication system provides a robust foundation for secure, role-based access control in the Agriculture Equipment Rental System! 🚀