-- Agriculture Equipment Rental System Database Schema 

-- Created: October 2025
-- Database: agriculture

-- Drop database if exists and create new one
DROP DATABASE IF EXISTS agriculture;
CREATE DATABASE agriculture;
USE agriculture;

-- Set charset and collation
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- Table: admins
-- Description: System administrators
-- =====================================================
CREATE TABLE admins (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_admin_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: vendors
-- Description: Equipment vendors/suppliers
-- =====================================================
CREATE TABLE vendors (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    shop_name VARCHAR(150) NOT NULL,
    owner_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    status ENUM('pending', 'approved', 'suspended') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_vendor_email (email),
    INDEX idx_vendor_status (status),
    INDEX idx_vendor_city (city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: customers
-- Description: Equipment renters/customers
-- =====================================================
CREATE TABLE customers (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    id_proof VARCHAR(255) NULL COMMENT 'Path to ID proof document',
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_customer_email (email),
    INDEX idx_customer_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: equipment_categories
-- Description: Categories for equipment classification
-- =====================================================
CREATE TABLE equipment_categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_category_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: equipment
-- Description: Agricultural equipment listings
-- =====================================================
CREATE TABLE equipment (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT UNSIGNED NOT NULL,
    category_id INT UNSIGNED NULL,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    specifications JSON NULL COMMENT 'Technical specifications in JSON format',
    price_per_day DECIMAL(10, 2) NOT NULL,
    image VARCHAR(255) NULL COMMENT 'Path to equipment image',
    availability ENUM('available', 'rented', 'maintenance', 'unavailable') NOT NULL DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (category_id) REFERENCES equipment_categories(id) ON DELETE SET NULL ON UPDATE CASCADE,
    
    INDEX idx_equipment_vendor (vendor_id),
    INDEX idx_equipment_category (category_id),
    INDEX idx_equipment_type (type),
    INDEX idx_equipment_availability (availability),
    INDEX idx_equipment_price (price_per_day)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: bookings
-- Description: Equipment rental bookings
-- =====================================================
CREATE TABLE bookings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    equipment_id INT UNSIGNED NOT NULL,
    customer_id INT UNSIGNED NOT NULL,
    vendor_id INT UNSIGNED NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_cost DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'approved', 'completed', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
    notes TEXT NULL COMMENT 'Customer notes/requirements',
    admin_notes TEXT NULL COMMENT 'Admin/vendor notes',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_booking_equipment (equipment_id),
    INDEX idx_booking_customer (customer_id),
    INDEX idx_booking_vendor (vendor_id),
    INDEX idx_booking_status (status),
    INDEX idx_booking_dates (start_date, end_date),
    
    CONSTRAINT chk_booking_dates CHECK (end_date > start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: feedback
-- Description: Customer feedback and ratings
-- =====================================================
CREATE TABLE feedback (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_id INT UNSIGNED NOT NULL,
    customer_id INT UNSIGNED NOT NULL,
    vendor_id INT UNSIGNED NOT NULL,
    rating TINYINT UNSIGNED NOT NULL COMMENT 'Rating from 1-5',
    comment TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    UNIQUE KEY unique_booking_feedback (booking_id),
    INDEX idx_feedback_customer (customer_id),
    INDEX idx_feedback_vendor (vendor_id),
    INDEX idx_feedback_rating (rating),
    
    CONSTRAINT chk_rating_range CHECK (rating >= 1 AND rating <= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: payments
-- Description: Payment transactions
-- =====================================================
CREATE TABLE payments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_id INT UNSIGNED NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    method ENUM('cash', 'card', 'upi', 'bank_transfer', 'online') NOT NULL,
    transaction_id VARCHAR(100) NULL COMMENT 'External payment gateway transaction ID',
    invoice_url VARCHAR(255) NULL COMMENT 'Path to generated invoice PDF',
    status ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_payment_booking (booking_id),
    INDEX idx_payment_method (method),
    INDEX idx_payment_status (status),
    INDEX idx_payment_date (payment_date),
    INDEX idx_payment_transaction (transaction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: notifications
-- Description: System notifications for users
-- =====================================================
CREATE TABLE notifications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_type ENUM('admin', 'vendor', 'customer') NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error') NOT NULL DEFAULT 'info',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_notification_user (user_type, user_id),
    INDEX idx_notification_read (is_read),
    INDEX idx_notification_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: audit_logs
-- Description: System activity audit trail
-- =====================================================
CREATE TABLE audit_logs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_type ENUM('admin', 'vendor', 'customer') NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id INT UNSIGNED NOT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_audit_user (user_type, user_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_table (table_name),
    INDEX idx_audit_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Insert default data
-- =====================================================

-- Insert default admin
INSERT INTO admins (name, email, password) VALUES 
('System Admin', 'admin@agriculture-rental.com', '$2b$10$rQl2WzKz1e/JQqKTQGgMaO1qJ5M6zYv4a3sK8eB9xC7h2Lk5mN3oP'); -- password: admin123

-- Insert equipment categories
INSERT INTO equipment_categories (name, description) VALUES 
('Tractors', 'Various types of tractors for farming operations'),
('Harvesters', 'Harvesting equipment for different crops'),
('Plowing Equipment', 'Equipment for soil preparation and plowing'),
('Seeding Equipment', 'Planting and seeding machinery'),
('Irrigation Systems', 'Water management and irrigation equipment'),
('Cultivation Tools', 'Tools for crop cultivation and maintenance'),
('Post-Harvest Equipment', 'Equipment for post-harvest processing'),
('Other Equipment', 'Miscellaneous agricultural equipment');

-- Insert sample vendor (status pending)
INSERT INTO vendors (shop_name, owner_name, email, phone, address, city, password, status) VALUES 
('Green Farm Equipment', 'John Farmer', 'vendor@greenfarm.com', '+1234567890', '123 Farm Street', 'Agricultural City', '$2b$10$rQl2WzKz1e/JQqKTQGgMaO1qJ5M6zYv4a3sK8eB9xC7h2Lk5mN3oP', 'approved'); -- password: vendor123

-- Insert sample customer
INSERT INTO customers (name, email, phone, address, password) VALUES 
('Farm Customer', 'customer@farm.com', '+0987654321', '456 Rural Road', '$2b$10$rQl2WzKz1e/JQqKTQGgMaO1qJ5M6zYv4a3sK8eB9xC7h2Lk5mN3oP'); -- password: customer123

-- Insert sample equipment
INSERT INTO equipment (vendor_id, category_id, name, type, description, specifications, price_per_day, availability) VALUES 
(1, 1, 'John Deere 5075E', 'Utility Tractor', 'Versatile utility tractor perfect for various farming operations', '{"horsepower": 75, "fuel_type": "diesel", "transmission": "manual"}', 150.00, 'available'),
(1, 2, 'Case IH Axial-Flow 250', 'Combine Harvester', 'High-performance combine harvester for efficient crop harvesting', '{"cutting_width": "25ft", "grain_tank": "300bu", "engine": "FPT Industrial"}', 500.00, 'available');

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- Views for easier data access
-- =====================================================

-- View: Equipment with vendor details
CREATE VIEW equipment_with_vendor AS
SELECT 
    e.*,
    v.shop_name,
    v.owner_name,
    v.city as vendor_city,
    v.phone as vendor_phone,
    c.name as category_name
FROM equipment e
JOIN vendors v ON e.vendor_id = v.id
LEFT JOIN equipment_categories c ON e.category_id = c.id
WHERE v.status = 'approved';

-- View: Booking details with all related information
CREATE VIEW booking_details AS
SELECT 
    b.*,
    e.name as equipment_name,
    e.type as equipment_type,
    e.image as equipment_image,
    c.name as customer_name,
    c.email as customer_email,
    c.phone as customer_phone,
    v.shop_name,
    v.owner_name as vendor_name,
    v.phone as vendor_phone,
    DATEDIFF(b.end_date, b.start_date) as rental_days
FROM bookings b
JOIN equipment e ON b.equipment_id = e.id
JOIN customers c ON b.customer_id = c.id
JOIN vendors v ON b.vendor_id = v.id;

-- View: Vendor statistics
CREATE VIEW vendor_stats AS
SELECT 
    v.id,
    v.shop_name,
    v.owner_name,
    COUNT(DISTINCT e.id) as total_equipment,
    COUNT(DISTINCT b.id) as total_bookings,
    COALESCE(AVG(f.rating), 0) as average_rating,
    COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.total_cost ELSE 0 END), 0) as total_revenue
FROM vendors v
LEFT JOIN equipment e ON v.id = e.vendor_id
LEFT JOIN bookings b ON v.id = b.vendor_id
LEFT JOIN feedback f ON v.id = f.vendor_id
WHERE v.status = 'approved'
GROUP BY v.id, v.shop_name, v.owner_name;

-- =====================================================
-- Stored procedures
-- =====================================================

DELIMITER //

-- Procedure to check equipment availability
CREATE PROCEDURE CheckEquipmentAvailability(
    IN p_equipment_id INT,
    IN p_start_date DATE,
    IN p_end_date DATE,
    OUT p_is_available BOOLEAN
)
BEGIN
    DECLARE conflict_count INT DEFAULT 0;
    
    SELECT COUNT(*) INTO conflict_count
    FROM bookings
    WHERE equipment_id = p_equipment_id
    AND status IN ('pending', 'approved')
    AND (
        (start_date <= p_start_date AND end_date >= p_start_date) OR
        (start_date <= p_end_date AND end_date >= p_end_date) OR
        (start_date >= p_start_date AND end_date <= p_end_date)
    );
    
    SET p_is_available = (conflict_count = 0);
END //

-- Procedure to calculate booking cost
CREATE PROCEDURE CalculateBookingCost(
    IN p_equipment_id INT,
    IN p_start_date DATE,
    IN p_end_date DATE,
    OUT p_total_cost DECIMAL(10,2)
)
BEGIN
    DECLARE daily_rate DECIMAL(10,2);
    DECLARE rental_days INT;
    
    SELECT price_per_day INTO daily_rate
    FROM equipment
    WHERE id = p_equipment_id;
    
    SET rental_days = DATEDIFF(p_end_date, p_start_date);
    SET p_total_cost = daily_rate * rental_days;
END //

DELIMITER ;

-- =====================================================
-- Triggers
-- =====================================================

DELIMITER //

-- Trigger to update equipment availability when booking is approved
CREATE TRIGGER update_equipment_availability_on_booking
AFTER UPDATE ON bookings
FOR EACH ROW
BEGIN
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        UPDATE equipment 
        SET availability = 'rented' 
        WHERE id = NEW.equipment_id;
    ELSEIF NEW.status IN ('completed', 'cancelled', 'rejected') AND OLD.status = 'approved' THEN
        UPDATE equipment 
        SET availability = 'available' 
        WHERE id = NEW.equipment_id;
    END IF;
END //

-- Trigger to create notification when booking status changes
CREATE TRIGGER notify_on_booking_status_change
AFTER UPDATE ON bookings
FOR EACH ROW
BEGIN
    IF NEW.status != OLD.status THEN
        INSERT INTO notifications (user_type, user_id, title, message, type)
        VALUES (
            'customer',
            NEW.customer_id,
            CONCAT('Booking Status Updated: ', NEW.status),
            CONCAT('Your booking for equipment ID ', NEW.equipment_id, ' has been ', NEW.status),
            CASE 
                WHEN NEW.status = 'approved' THEN 'success'
                WHEN NEW.status = 'rejected' THEN 'error'
                ELSE 'info'
            END
        );
    END IF;
END //

DELIMITER ;

-- =====================================================
-- Indexes for performance optimization
-- =====================================================

-- Composite indexes for common queries
CREATE INDEX idx_bookings_vendor_status ON bookings(vendor_id, status);
CREATE INDEX idx_bookings_customer_status ON bookings(customer_id, status);
CREATE INDEX idx_equipment_vendor_availability ON equipment(vendor_id, availability);
CREATE INDEX idx_feedback_vendor_rating ON feedback(vendor_id, rating);

-- Full-text search indexes
ALTER TABLE equipment ADD FULLTEXT(name, description);
ALTER TABLE vendors ADD FULLTEXT(shop_name, owner_name);

COMMIT;