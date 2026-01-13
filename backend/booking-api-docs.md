# 📋 Booking System API Documentation

## Overview
The booking system provides comprehensive functionality for managing equipment rentals between customers and vendors in the Agriculture Equipment Rental System. It handles the complete booking lifecycle from creation through completion, including payment processing and invoice generation.

## 🔗 API Endpoints

### 1. Customer Booking Creation
**POST** `/api/booking`

Creates a new booking request from a customer.

**Request Body:**
```json
{
  "equipment_id": 1,
  "customer_name": "John Doe",
  "customer_email": "john.doe@example.com",
  "customer_phone": "9876543210",
  "rental_type": "daily",
  "start_date": "2024-02-01",
  "end_date": "2024-02-03",
  "delivery_address": "123 Farm Road, Test City"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "booking": {
    "id": 1,
    "equipment_name": "John Deere Tractor",
    "vendor_name": "Farm Equipment Co",
    "customer_id": 1,
    "total_cost": 800.00,
    "status": "pending"
  }
}
```

**Features:**
- Automatic customer creation if new email
- Cost calculation based on rental type and duration
- Date validation (end date after start date, not in past)
- Equipment availability checking

---

### 2. Customer Booking Retrieval
**GET** `/api/booking/customer?email={customer_email}`

Retrieves all bookings for a specific customer.

**Query Parameters:**
- `email` (required): Customer's email address

**Response:**
```json
{
  "success": true,
  "bookings": [
    {
      "id": 1,
      "equipment_name": "John Deere Tractor",
      "vendor_name": "Farm Equipment Co",
      "start_date": "2024-02-01",
      "end_date": "2024-02-03",
      "status": "confirmed",
      "total_cost": 800.00,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### 3. Vendor Booking Management
**GET** `/api/booking/vendor`

Retrieves all bookings for the authenticated vendor's equipment.

**Headers:**
```
Authorization: Bearer {vendor_token}
```

**Query Parameters:**
- `status` (optional): Filter by booking status
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "bookings": [
    {
      "id": 1,
      "customer_name": "John Doe",
      "customer_email": "john.doe@example.com",
      "customer_phone": "9876543210",
      "equipment_name": "John Deere Tractor",
      "start_date": "2024-02-01",
      "end_date": "2024-02-03",
      "status": "pending",
      "total_cost": 800.00,
      "delivery_address": "123 Farm Road, Test City",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### 4. Booking Status Management
**PUT** `/api/booking/{id}/status`

Updates the status of a booking (vendor only).

**Headers:**
```
Authorization: Bearer {vendor_token}
```

**Request Body:**
```json
{
  "status": "confirmed",
  "notes": "Booking confirmed, equipment prepared"
}
```

**Valid Status Transitions:**
- `pending` → `confirmed` | `cancelled`
- `confirmed` → `ongoing` | `cancelled`
- `ongoing` → `completed` | `cancelled`

**Response:**
```json
{
  "success": true,
  "message": "Booking status updated successfully",
  "booking": {
    "id": 1,
    "status": "confirmed",
    "notes": "Booking confirmed, equipment prepared"
  },
  "payment_generated": false
}
```

**Special Features:**
- When status changes to `completed`, automatically generates payment record
- Creates invoice for customer
- Validates status transition rules
- Records vendor notes for each status change

---

### 5. Admin Booking Oversight
**GET** `/api/booking/admin`

Provides comprehensive booking overview for administrators.

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Query Parameters:**
- `status` (optional): Filter by booking status
- `vendor_id` (optional): Filter by vendor
- `start_date` (optional): Filter bookings from date
- `end_date` (optional): Filter bookings to date
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "bookings": [
    {
      "id": 1,
      "customer_name": "John Doe",
      "customer_email": "john.doe@example.com",
      "vendor_name": "Farm Equipment Co",
      "equipment_name": "John Deere Tractor",
      "status": "completed",
      "total_cost": 800.00,
      "start_date": "2024-02-01",
      "end_date": "2024-02-03",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "summary": {
    "total_bookings": 1,
    "total_revenue": 800.00,
    "status_breakdown": {
      "pending": 0,
      "confirmed": 0,
      "ongoing": 0,
      "completed": 1,
      "cancelled": 0
    }
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

## 🔄 Booking Status Lifecycle

### Status Flow
```
pending → confirmed → ongoing → completed
   ↓         ↓         ↓
cancelled  cancelled  cancelled
```

### Status Descriptions
- **pending**: Initial status when booking is created
- **confirmed**: Vendor has confirmed the booking
- **ongoing**: Equipment is delivered and rental has started
- **completed**: Rental finished, equipment returned, payment processed
- **cancelled**: Booking cancelled at any stage

### Automated Actions
- **On Completion**: 
  - Payment record automatically created
  - Invoice generated for customer
  - Equipment marked as available
  - Vendor notified

---

## 💰 Payment Integration

### Automatic Payment Generation
When a booking status changes to "completed":

1. **Payment Record Created**:
   ```sql
   INSERT INTO payments (
     booking_id, amount, payment_status, 
     payment_method, transaction_id, created_at
   )
   ```

2. **Invoice Generated**:
   - PDF invoice created with booking details
   - Sent to customer email
   - Stored in system for vendor access

### Payment Details
- **Amount**: Calculated based on rental duration and rates
- **Status**: Initially set to "pending"
- **Transaction ID**: Generated unique identifier
- **Payment Method**: Default "pending" (to be updated when customer pays)

---

## 🔍 Search and Filtering

### Customer Booking Search
- Filter by email (exact match)
- Automatic ordering by creation date (newest first)

### Vendor Booking Management
- Filter by status: `pending`, `confirmed`, `ongoing`, `completed`, `cancelled`
- Pagination support (default 10 items per page)
- Automatic ordering by creation date (newest first)

### Admin Oversight Filters
- **Status**: All booking statuses
- **Vendor**: Filter by specific vendor ID
- **Date Range**: Filter bookings within date range
- **Search**: Text search across customer names and equipment
- **Pagination**: Configurable page size (default 20 items)

---

## 📊 Data Models

### Booking Table Structure
```sql
CREATE TABLE bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    equipment_id INT NOT NULL,
    vendor_id INT NOT NULL,
    customer_id INT NOT NULL,
    rental_type ENUM('hourly', 'daily') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'confirmed', 'ongoing', 'completed', 'cancelled') DEFAULT 'pending',
    delivery_address TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Customer Table Integration
```sql
CREATE TABLE customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔒 Security and Validation

### Input Validation
- **Email**: Valid email format required
- **Phone**: Required, minimum 10 characters
- **Dates**: End date must be after start date, no past dates
- **Equipment**: Must exist and be available
- **Costs**: Automatically calculated, no manual input

### Authorization
- **Customer Routes**: No authentication required (public booking)
- **Vendor Routes**: Requires valid vendor JWT token
- **Admin Routes**: Requires valid admin JWT token
- **Status Updates**: Only vendors can update their equipment bookings

### Rate Limiting
- Booking creation: Maximum 5 bookings per hour per IP
- Status updates: Maximum 20 updates per hour per vendor

---

## 🚀 Usage Examples

### Complete Booking Workflow

1. **Customer creates booking**:
   ```javascript
   const response = await fetch('/api/booking', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       equipment_id: 1,
       customer_name: 'John Doe',
       customer_email: 'john@example.com',
       customer_phone: '9876543210',
       rental_type: 'daily',
       start_date: '2024-02-01',
       end_date: '2024-02-03',
       delivery_address: '123 Farm Road'
     })
   });
   ```

2. **Vendor confirms booking**:
   ```javascript
   const response = await fetch('/api/booking/1/status', {
     method: 'PUT',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': 'Bearer vendor_token'
     },
     body: JSON.stringify({
       status: 'confirmed',
       notes: 'Equipment ready for delivery'
     })
   });
   ```

3. **Vendor starts rental**:
   ```javascript
   const response = await fetch('/api/booking/1/status', {
     method: 'PUT',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': 'Bearer vendor_token'
     },
     body: JSON.stringify({
       status: 'ongoing',
       notes: 'Equipment delivered successfully'
     })
   });
   ```

4. **Vendor completes rental**:
   ```javascript
   const response = await fetch('/api/booking/1/status', {
     method: 'PUT',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': 'Bearer vendor_token'
     },
     body: JSON.stringify({
       status: 'completed',
       notes: 'Equipment returned in good condition'
     })
   });
   // Payment and invoice automatically generated
   ```

---

## 🧪 Testing

Run the comprehensive test suite:

```bash
cd backend
node test-booking.js
```

The test suite covers:
- ✅ Authentication setup
- ✅ Equipment preparation
- ✅ Customer booking creation
- ✅ Vendor booking management
- ✅ Status transitions
- ✅ Payment generation
- ✅ Admin oversight
- ✅ Error handling

---

## 📝 Notes

### Important Considerations
1. **Cost Calculation**: Automatically calculated based on equipment rates and rental duration
2. **Customer Management**: Customers are automatically created if they don't exist
3. **Payment Processing**: Payment records are created but external payment gateway integration is needed
4. **Email Notifications**: Currently not implemented, but hooks are ready for integration
5. **File Uploads**: Invoice generation is placeholder - implement PDF generation as needed

### Future Enhancements
- Email notifications for status changes
- SMS notifications for customers
- Payment gateway integration (Stripe, PayPal)
- PDF invoice generation
- Equipment damage reporting
- Rating and review system
- Booking calendar integration
- Automated reminders