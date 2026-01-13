# Authentication Routes Test Guide

## Overview
The authentication system now supports three user types:
- **Vendors**: Equipment suppliers (require admin approval)
- **Customers**: Equipment renters (auto-approved)
- **Admins**: System administrators (pre-created)

## API Endpoints

### Vendor Routes

#### Register Vendor
```http
POST /api/auth/vendor/register
Content-Type: application/json

{
  "shop_name": "Green Farm Equipment",
  "owner_name": "John Farmer",
  "email": "vendor@example.com",
  "phone": "+1234567890",
  "address": "123 Farm Street",
  "city": "Agricultural City",
  "password": "securepassword123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Vendor registration successful. Your account is pending approval by admin.",
  "data": {
    "id": 1,
    "shop_name": "Green Farm Equipment",
    "owner_name": "John Farmer",
    "email": "vendor@example.com",
    "phone": "+1234567890",
    "city": "Agricultural City",
    "status": "pending"
  }
}
```

#### Login Vendor
```http
POST /api/auth/vendor/login
Content-Type: application/json

{
  "email": "vendor@example.com",
  "password": "securepassword123"
}
```

**Response (Success - if approved):**
```json
{
  "success": true,
  "message": "Vendor login successful",
  "data": {
    "id": 1,
    "shop_name": "Green Farm Equipment",
    "owner_name": "John Farmer",
    "email": "vendor@example.com",
    "phone": "+1234567890",
    "address": "123 Farm Street",
    "city": "Agricultural City",
    "status": "approved",
    "userType": "vendor",
    "token": "jwt_token_here"
  }
}
```

### Customer Routes

#### Register Customer
```http
POST /api/auth/customer/register
Content-Type: application/json

{
  "name": "Jane Customer",
  "email": "customer@example.com",
  "phone": "+0987654321",
  "address": "456 Rural Road",
  "password": "securepassword123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Customer registration successful",
  "data": {
    "id": 1,
    "name": "Jane Customer",
    "email": "customer@example.com",
    "phone": "+0987654321",
    "address": "456 Rural Road",
    "userType": "customer",
    "token": "jwt_token_here"
  }
}
```

#### Login Customer
```http
POST /api/auth/customer/login
Content-Type: application/json

{
  "email": "customer@example.com",
  "password": "securepassword123"
}
```

### Admin Routes

#### Login Admin
```http
POST /api/auth/admin/login
Content-Type: application/json

{
  "email": "admin@agriculture-rental.com",
  "password": "admin123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Admin login successful",
  "data": {
    "id": 1,
    "name": "System Admin",
    "email": "admin@agriculture-rental.com",
    "userType": "admin",
    "token": "jwt_token_here"
  }
}
```

### Profile Route (All User Types)

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <jwt_token>
```

**Response varies by user type:**

**Admin Profile:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "System Admin",
    "email": "admin@agriculture-rental.com",
    "userType": "admin",
    "created_at": "2025-10-09T17:30:00.000Z",
    "updated_at": "2025-10-09T17:30:00.000Z"
  }
}
```

**Vendor Profile:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "shop_name": "Green Farm Equipment",
    "owner_name": "John Farmer",
    "email": "vendor@example.com",
    "phone": "+1234567890",
    "address": "123 Farm Street",
    "city": "Agricultural City",
    "status": "approved",
    "userType": "vendor",
    "created_at": "2025-10-09T17:30:00.000Z",
    "updated_at": "2025-10-09T17:30:00.000Z"
  }
}
```

### Logout Route (All User Types)

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <jwt_token>
```

## Testing with curl

### Register a new customer:
```bash
curl -X POST http://localhost:5000/api/auth/customer/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "email": "test@customer.com",
    "phone": "+1111111111",
    "address": "123 Test Street",
    "password": "testpass123"
  }'
```

### Login customer:
```bash
curl -X POST http://localhost:5000/api/auth/customer/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@customer.com",
    "password": "testpass123"
  }'
```

### Login admin (with default credentials):
```bash
curl -X POST http://localhost:5000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@agriculture-rental.com",
    "password": "admin123"
  }'
```

## Token Usage

All protected routes require the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Error Responses

### Validation Error:
```json
{
  "success": false,
  "message": "All fields are required: name, email, phone, address, password"
}
```

### Authentication Error:
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### Vendor Pending Approval:
```json
{
  "success": false,
  "message": "Your vendor account is pending approval by admin"
}
```

### Invalid Token:
```json
{
  "success": false,
  "message": "Invalid token."
}
```

## Features

✅ **Password Security**: Bcrypt hashing with salt rounds 12  
✅ **JWT Tokens**: Secure authentication with configurable expiration  
✅ **Role-based Access**: Different permissions for admin, vendor, customer  
✅ **Vendor Approval**: Vendors require admin approval before access  
✅ **Email Validation**: Proper email format validation  
✅ **Secure Middleware**: Token verification and user validation  
✅ **Error Handling**: Comprehensive error responses  
✅ **Profile Management**: Get user profile for all user types