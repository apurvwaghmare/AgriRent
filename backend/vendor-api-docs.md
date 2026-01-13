# Vendor Routes API Documentation

## 🚜 Overview

The vendor routes provide comprehensive functionality for equipment suppliers to manage their business operations on the Agriculture Equipment Rental System. These routes are protected and require vendor authentication.

## 🔐 Authentication Required

All vendor routes require:
1. **JWT Authentication**: Valid token in Authorization header
2. **Vendor Role**: User must be authenticated as a vendor
3. **Approved Status**: Vendor account must be approved by admin

```javascript
headers: {
    'Authorization': 'Bearer <vendor_jwt_token>'
}
```

## 📊 Vendor Dashboard

### GET /api/vendor/dashboard

Retrieve comprehensive dashboard statistics for the vendor.

**Request:**
```http
GET /api/vendor/dashboard
Authorization: Bearer <vendor_token>
```

**Response:**
```json
{
    "success": true,
    "message": "Vendor dashboard data retrieved successfully",
    "data": {
        "vendor": {
            "id": 1,
            "shopName": "Green Farm Equipment",
            "ownerName": "John Farmer",
            "email": "vendor@example.com",
            "city": "Agricultural City",
            "status": "approved"
        },
        "stats": {
            "equipment": {
                "total": 15,
                "categories": [
                    { "category_name": "Tractors", "count": 8 },
                    { "category_name": "Harvesters", "count": 4 }
                ],
                "status": [
                    { "availability_status": "available", "count": 12 },
                    { "availability_status": "rented", "count": 3 }
                ]
            },
            "bookings": {
                "total": 45,
                "active": 8,
                "completed": 35,
                "pending": 2
            },
            "revenue": {
                "total": 15750.00,
                "monthly": 3200.00
            }
        },
        "recentBookings": [
            {
                "id": 123,
                "equipment_name": "John Deere 5055E",
                "customer_name": "Farm Corp Ltd",
                "start_date": "2025-10-15",
                "end_date": "2025-10-20",
                "total_amount": 750.00,
                "status": "confirmed"
            }
        ],
        "lastUpdated": "2025-10-09T18:30:00.000Z"
    }
}
```

## 🚜 Equipment Management

### POST /api/vendor/equipment

Add new equipment to the vendor's inventory with optional image upload.

**Request:**
```http
POST /api/vendor/equipment
Authorization: Bearer <vendor_token>
Content-Type: multipart/form-data

# Form Data:
name: "John Deere 5055E Tractor"
model: "5055E"
description: "Reliable mid-size tractor perfect for farming operations"
category_id: 1
daily_rate: 150.00
weekly_rate: 900.00
monthly_rate: 3500.00
availability_status: "available"
condition_status: "excellent"
specifications: "Engine: 55HP, 4WD, PTO"
location: "Warehouse A"
images: [file1.jpg, file2.jpg]  # Optional, max 5 images
```

**Response:**
```json
{
    "success": true,
    "message": "Equipment added successfully",
    "data": {
        "id": 25,
        "vendor_id": 1,
        "name": "John Deere 5055E Tractor",
        "model": "5055E",
        "description": "Reliable mid-size tractor perfect for farming operations",
        "category_id": 1,
        "category_name": "Tractors",
        "daily_rate": 150.00,
        "weekly_rate": 900.00,
        "monthly_rate": 3500.00,
        "availability_status": "available",
        "condition_status": "excellent",
        "specifications": "Engine: 55HP, 4WD, PTO",
        "location": "Warehouse A",
        "images": [
            "/uploads/equipment/vendor_1_1696874400000_tractor1.jpg",
            "/uploads/equipment/vendor_1_1696874400001_tractor2.jpg"
        ],
        "created_at": "2025-10-09T18:30:00.000Z",
        "updated_at": "2025-10-09T18:30:00.000Z"
    }
}
```

### GET /api/vendor/equipment

Retrieve vendor's equipment with pagination and filtering.

**Request:**
```http
GET /api/vendor/equipment?page=1&limit=10&category_id=1&availability_status=available&search=tractor
Authorization: Bearer <vendor_token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `category_id` (optional): Filter by category
- `availability_status` (optional): Filter by status
- `search` (optional): Search in name, model, description

**Response:**
```json
{
    "success": true,
    "message": "Vendor equipment retrieved successfully",
    "data": {
        "equipment": [
            {
                "id": 25,
                "name": "John Deere 5055E Tractor",
                "model": "5055E",
                "category_name": "Tractors",
                "daily_rate": 150.00,
                "availability_status": "available",
                "condition_status": "excellent",
                "images": ["/uploads/equipment/vendor_1_1696874400000_tractor1.jpg"],
                "total_bookings": 5,
                "active_bookings": 1,
                "created_at": "2025-10-09T18:30:00.000Z"
            }
        ],
        "pagination": {
            "currentPage": 1,
            "totalPages": 3,
            "totalRecords": 25,
            "hasNextPage": true,
            "hasPrevPage": false
        }
    }
}
```

### PUT /api/vendor/equipment/:id

Update existing equipment. Can include new images and specify images to remove.

**Request:**
```http
PUT /api/vendor/equipment/25
Authorization: Bearer <vendor_token>
Content-Type: multipart/form-data

# Form Data:
daily_rate: 175.00
description: "Updated: Premium tractor with latest technology"
availability_status: "available"
newImages: [new_image.jpg]  # Optional new images
removeImages: ["/uploads/equipment/old_image.jpg"]  # Optional images to remove
```

**Response:**
```json
{
    "success": true,
    "message": "Equipment updated successfully",
    "data": {
        "id": 25,
        "daily_rate": 175.00,
        "description": "Updated: Premium tractor with latest technology",
        "images": [
            "/uploads/equipment/vendor_1_1696874400000_tractor1.jpg",
            "/uploads/equipment/vendor_1_1696874500000_new_image.jpg"
        ],
        "updated_at": "2025-10-09T19:00:00.000Z"
    }
}
```

### DELETE /api/vendor/equipment/:id

Delete equipment (only if no active bookings).

**Request:**
```http
DELETE /api/vendor/equipment/25
Authorization: Bearer <vendor_token>
```

**Response:**
```json
{
    "success": true,
    "message": "Equipment deleted successfully"
}
```

**Error (if active bookings exist):**
```json
{
    "success": false,
    "message": "Cannot delete equipment with active bookings"
}
```

## 📋 Bookings Management

### GET /api/vendor/bookings

Retrieve bookings for vendor's equipment with filtering and pagination.

**Request:**
```http
GET /api/vendor/bookings?status=confirmed&page=1&limit=10&sortBy=created_at&sortOrder=DESC
Authorization: Bearer <vendor_token>
```

**Query Parameters:**
- `status` (optional): Filter by booking status (pending, confirmed, ongoing, completed, cancelled)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `sortBy` (optional): Sort field (default: created_at)
- `sortOrder` (optional): ASC or DESC (default: DESC)
- `equipment_id` (optional): Filter by specific equipment
- `start_date` & `end_date` (optional): Filter by date range

**Response:**
```json
{
    "success": true,
    "message": "Vendor bookings retrieved successfully",
    "data": {
        "bookings": [
            {
                "id": 123,
                "start_date": "2025-10-15",
                "end_date": "2025-10-20",
                "total_amount": 750.00,
                "status": "confirmed",
                "created_at": "2025-10-09T10:00:00.000Z",
                "equipment_name": "John Deere 5055E Tractor",
                "equipment_model": "5055E",
                "equipment_images": ["/uploads/equipment/tractor1.jpg"],
                "customer_name": "Farm Corp Ltd",
                "customer_email": "contact@farmcorp.com",
                "customer_phone": "+1234567890",
                "customer_address": "123 Farm Road",
                "category_name": "Tractors"
            }
        ],
        "pagination": {
            "currentPage": 1,
            "totalPages": 5,
            "totalRecords": 45,
            "hasNextPage": true,
            "hasPrevPage": false
        }
    }
}
```

## 🖼️ Image Upload Features

### Supported Formats
- **JPEG** (.jpg, .jpeg)
- **PNG** (.png)
- **GIF** (.gif)
- **WebP** (.webp)

### Upload Specifications
- **Maximum File Size**: 5MB per image
- **Maximum Files**: 5 images per equipment
- **File Naming**: Auto-generated with vendor ID and timestamp
- **Storage**: Local filesystem in `/uploads/equipment/`

### Image Management
- **Add Images**: Include in POST/PUT requests as `images` or `newImages`
- **Remove Images**: Specify paths in `removeImages` array during PUT requests
- **Automatic Cleanup**: Images deleted when equipment is removed

## 🔒 Security & Access Control

### Vendor-Only Access
All routes are protected by `requireVendor` middleware:
- User must be authenticated
- User type must be 'vendor'
- Vendor status must be 'approved'

### Data Isolation
- Vendors can only access their own equipment
- Vendors can only see bookings for their equipment
- Equipment updates/deletes restricted to owner
- Dashboard shows vendor-specific statistics only

### File Security
- Unique filename generation prevents conflicts
- File type validation prevents malicious uploads
- File size limits prevent abuse
- Automatic cleanup on failed operations

## 📊 Error Handling

### Common Error Responses

**Authentication Required:**
```json
{
    "success": false,
    "message": "Access denied. Authentication required."
}
```

**Insufficient Permissions:**
```json
{
    "success": false,
    "message": "Access denied. Vendor privileges required."
}
```

**Vendor Not Approved:**
```json
{
    "success": false,
    "message": "Access denied. Vendor account is not approved."
}
```

**Invalid File Type:**
```json
{
    "success": false,
    "message": "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."
}
```

**Equipment Not Found:**
```json
{
    "success": false,
    "message": "Equipment not found or access denied"
}
```

**Validation Error:**
```json
{
    "success": false,
    "message": "Required fields: name, model, category_id, daily_rate"
}
```

## 🧪 Testing

### Run Vendor Tests
```bash
# Start server
npm start

# Run vendor-specific tests
node test-vendor.js
```

### Test Coverage
- ✅ Dashboard statistics and data aggregation
- ✅ Equipment CRUD operations with validation
- ✅ Image upload and management
- ✅ Pagination and filtering
- ✅ Booking management and reporting
- ✅ Access control and security
- ✅ Error handling and edge cases

## 💡 Usage Examples

### Complete Equipment Addition Flow
```javascript
// 1. Prepare form data with images
const formData = new FormData();
formData.append('name', 'Premium Tractor');
formData.append('model', 'PT-2025');
formData.append('category_id', '1');
formData.append('daily_rate', '200.00');
formData.append('images', fileInput.files[0]);

// 2. Submit to API
const response = await fetch('/api/vendor/equipment', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${vendorToken}`
    },
    body: formData
});

// 3. Handle response
const result = await response.json();
if (result.success) {
    console.log('Equipment added:', result.data.id);
}
```

### Dashboard Data Integration
```javascript
// Fetch dashboard data
const dashboard = await fetch('/api/vendor/dashboard', {
    headers: { 'Authorization': `Bearer ${token}` }
});

const data = await dashboard.json();

// Use in UI
document.getElementById('totalEquipment').textContent = data.data.stats.equipment.total;
document.getElementById('totalRevenue').textContent = `$${data.data.stats.revenue.total}`;
```

The vendor routes provide a complete business management solution for equipment suppliers! 🚀