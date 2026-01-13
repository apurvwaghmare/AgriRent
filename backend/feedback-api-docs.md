# 📝 Feedback System API Documentation

## Overview
The feedback system allows customers to rate and review their rental experience after completing a booking. Vendors can view all feedback for their equipment to improve their services and track customer satisfaction.

## 🔗 API Endpoints

### 1. Customer Feedback Submission
**POST** `/api/feedback`

Allows customers to submit feedback after a completed booking.

**Request Body:**
```json
{
  "booking_id": 1,
  "customer_email": "john.doe@example.com",
  "rating": 5,
  "comment": "Excellent equipment, very well maintained!",
  "customer_name": "John Doe"
}
```

**Validation Rules:**
- `booking_id`: Required, must exist in database
- `customer_email`: Required, valid email format, must match booking email
- `rating`: Required, integer between 1-5
- `comment`: Optional, text feedback
- `customer_name`: Optional, defaults to booking customer name

**Response:**
```json
{
  "success": true,
  "message": "Feedback submitted successfully",
  "feedback": {
    "id": 1,
    "booking_id": 1,
    "rating": 5,
    "comment": "Excellent equipment, very well maintained!",
    "customer_name": "John Doe",
    "created_at": "2025-10-10T10:30:00Z",
    "equipment_name": "John Deere Tractor",
    "vendor_name": "Farm Equipment Co"
  }
}
```

**Business Rules:**
- ✅ Only completed bookings can receive feedback
- ✅ One feedback per booking (prevents spam)
- ✅ Customer email must match booking email
- ✅ Rating must be 1-5 stars

---

### 2. Get Booking Feedback
**GET** `/api/feedback/booking/{bookingId}`

Retrieves feedback for a specific booking (public endpoint).

**Response:**
```json
{
  "success": true,
  "feedback": {
    "id": 1,
    "booking_id": 1,
    "rating": 5,
    "comment": "Excellent equipment, very well maintained!",
    "customer_name": "John Doe",
    "created_at": "2025-10-10T10:30:00Z",
    "equipment_name": "John Deere Tractor",
    "vendor_name": "Farm Equipment Co"
  }
}
```

---

### 3. Vendor Feedback Overview
**GET** `/api/feedback/vendor/{vendorId}`

Retrieves all feedback for a vendor's equipment with comprehensive statistics.

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Items per page (default: 10)
- `rating_filter` (optional): Filter by specific rating (1-5)
- `equipment_id` (optional): Filter by specific equipment
- `sort_by` (optional): Sort field - `created_at`, `rating`, `equipment_name` (default: `created_at`)
- `sort_order` (optional): `ASC` or `DESC` (default: `DESC`)

**Response:**
```json
{
  "success": true,
  "feedback": [
    {
      "id": 1,
      "booking_id": 1,
      "rating": 5,
      "comment": "Excellent equipment, very well maintained!",
      "customer_name": "John Doe",
      "created_at": "2025-10-10T10:30:00Z",
      "equipment_name": "John Deere Tractor",
      "equipment_id": 1,
      "start_date": "2024-12-01",
      "end_date": "2024-12-03",
      "rental_type": "daily"
    }
  ],
  "statistics": {
    "total_feedback": 25,
    "average_rating": 4.3,
    "rating_breakdown": {
      "five_star": 12,
      "four_star": 8,
      "three_star": 3,
      "two_star": 1,
      "one_star": 1
    }
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

### 4. Authenticated Vendor Feedback
**GET** `/api/feedback/vendor`

Same as above but for the authenticated vendor (requires vendor JWT token).

**Headers:**
```
Authorization: Bearer {vendor_token}
```

**Response:** Same format as vendor/{vendorId} endpoint

---

### 5. Equipment-Specific Feedback
**GET** `/api/feedback/equipment/{equipmentId}`

Retrieves all feedback for a specific piece of equipment.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "feedback": [
    {
      "id": 1,
      "booking_id": 1,
      "rating": 5,
      "comment": "Excellent equipment, very well maintained!",
      "customer_name": "John Doe",
      "created_at": "2025-10-10T10:30:00Z",
      "equipment_name": "John Deere Tractor",
      "vendor_name": "Farm Equipment Co",
      "start_date": "2024-12-01",
      "end_date": "2024-12-03",
      "rental_type": "daily"
    }
  ],
  "statistics": {
    "total_feedback": 15,
    "average_rating": 4.7,
    "rating_breakdown": {
      "five_star": 10,
      "four_star": 3,
      "three_star": 2,
      "two_star": 0,
      "one_star": 0
    }
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "totalPages": 2
  }
}
```

---

## 📊 Database Schema

### Feedback Table Structure
```sql
CREATE TABLE feedback (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    vendor_id INT NOT NULL,
    equipment_id INT NOT NULL,
    customer_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    customer_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_booking_feedback (booking_id),
    
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    
    INDEX idx_vendor_feedback (vendor_id, created_at),
    INDEX idx_equipment_feedback (equipment_id, created_at),
    INDEX idx_rating (rating)
);
```

---

## 🔒 Security and Validation

### Input Validation
- **Rating**: Must be integer 1-5
- **Email**: Valid email format and must match booking
- **Booking**: Must exist and be completed
- **Duplicate Prevention**: One feedback per booking

### Access Control
- **Customer Feedback**: Public endpoint (no authentication)
- **Vendor Feedback**: Requires vendor authentication for own feedback
- **Equipment Feedback**: Public (for displaying on equipment pages)

### Data Protection
- **Customer Privacy**: Only customer name is stored, not sensitive data
- **Vendor Access**: Vendors can only see feedback for their own equipment
- **Public Access**: Equipment feedback visible to help other customers

---

## 🚀 Usage Examples

### 1. Customer Submits Feedback
```javascript
const response = await fetch('/api/feedback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    booking_id: 123,
    customer_email: 'john@example.com',
    rating: 5,
    comment: 'Great equipment and excellent service!',
    customer_name: 'John Doe'
  })
});
```

### 2. Vendor Views Their Feedback
```javascript
const response = await fetch('/api/feedback/vendor', {
  headers: {
    'Authorization': 'Bearer vendor_jwt_token'
  }
});
```

### 3. Get Equipment Reviews for Public Display
```javascript
const response = await fetch('/api/feedback/equipment/123?page=1&limit=5');
```

### 4. Filter High-Rating Feedback
```javascript
const response = await fetch('/api/feedback/vendor/456?rating_filter=5&sort_by=created_at');
```

---

## 📈 Analytics Features

### Rating Statistics
- **Average Rating**: Calculated to 1 decimal place
- **Rating Breakdown**: Count for each star level (1-5)
- **Total Feedback Count**: Overall feedback volume

### Filtering Options
- **By Rating**: Show only specific star ratings
- **By Equipment**: Focus on specific equipment performance
- **By Date**: Sort by newest/oldest feedback
- **By Equipment Name**: Alphabetical sorting

### Vendor Insights
- **Equipment Performance**: See which equipment gets best reviews
- **Customer Satisfaction**: Track rating trends over time
- **Service Improvement**: Read detailed comments for insights

---

## 🔄 Integration with Booking System

### Automatic Workflow
1. **Booking Completion**: When booking status changes to "completed"
2. **Feedback Opportunity**: Customer can submit feedback
3. **Vendor Notification**: Vendor sees new feedback in dashboard
4. **Public Display**: Equipment reviews visible to future customers

### Business Logic
- **Completed Bookings Only**: Ensures customer actually used equipment
- **One Feedback Rule**: Prevents spam and duplicate reviews
- **Email Verification**: Ensures feedback comes from actual customer
- **Vendor Association**: Links feedback to correct vendor and equipment

---

## 🧪 Testing

### Test Scenarios
1. **Valid Feedback Submission**: Completed booking, valid data
2. **Invalid Rating**: Rating outside 1-5 range
3. **Incomplete Booking**: Feedback on non-completed booking
4. **Duplicate Feedback**: Second feedback attempt for same booking
5. **Wrong Email**: Email doesn't match booking customer
6. **Vendor Statistics**: Accurate calculation of averages and counts

### Error Handling
- **404**: Booking not found or email mismatch
- **400**: Invalid rating, duplicate feedback, incomplete booking
- **500**: Database errors with proper error logging

---

## 🌟 Future Enhancements

### Planned Features
- **Photo Uploads**: Allow customers to add photos with feedback
- **Vendor Responses**: Let vendors respond to customer feedback
- **Feedback Notifications**: Email/SMS alerts for new feedback
- **Moderation System**: Admin review of inappropriate feedback
- **Sentiment Analysis**: Automatic analysis of comment sentiment
- **Feedback Incentives**: Rewards for customers who leave feedback

### Integration Opportunities
- **Email Templates**: Automated feedback request emails
- **Mobile App**: Push notifications for feedback requests
- **Dashboard Widgets**: Real-time feedback monitoring
- **Analytics Dashboard**: Advanced reporting and trends