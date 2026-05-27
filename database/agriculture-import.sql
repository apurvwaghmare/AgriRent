-- Agriculture Equipment Rental System Database Schema (Import-safe)
-- Use this file when importing into an existing database like freeSQLDatabase/phpMyAdmin.

CREATE DATABASE IF NOT EXISTS sql12828424;
USE sql12828424;

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
    updated_at DATETIME DEFAULT NULL,
    
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
    updated_at DATETIME DEFAULT NULL,
    
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
    status ENUM('pending', 'approved', 'suspended') NOT NULL DEFAULT 'pending',
    id_proof VARCHAR(255) NULL COMMENT 'Path to ID proof document',
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL,
    
    INDEX idx_customer_email (email),
    INDEX idx_customer_phone (phone),
    INDEX idx_customer_status (status)
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
    updated_at DATETIME DEFAULT NULL,
    
    INDEX idx_category_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: equipment
-- Description: Agricultural equipment listings
-- =====================================================
CREATE TABLE equipment (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT UNSIGNED NOT NULL,
    category_id INT UNSIGNED NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    daily_rate DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    hourly_rate DECIMAL(10,2) DEFAULT NULL,
    weekly_rate DECIMAL(10,2) DEFAULT NULL,
    monthly_rate DECIMAL(10,2) DEFAULT NULL,
    location VARCHAR(255) NOT NULL,
    condition_status ENUM('excellent', 'good', 'fair', 'poor') NOT NULL DEFAULT 'good',
    availability ENUM('available', 'rented', 'maintenance', 'unavailable') NOT NULL DEFAULT 'available',
    images TEXT NULL,
    specifications TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL,
    
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES equipment_categories(id) ON DELETE CASCADE,
    INDEX idx_equipment_vendor (vendor_id),
    INDEX idx_equipment_category (category_id),
    INDEX idx_equipment_availability (availability),
    INDEX idx_equipment_location (location)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: bookings
-- Description: Rental bookings
-- =====================================================
CREATE TABLE bookings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_id INT UNSIGNED NOT NULL,
    equipment_id INT UNSIGNED NOT NULL,
    vendor_id INT UNSIGNED NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed') NOT NULL DEFAULT 'pending',
    payment_status ENUM('pending', 'paid', 'refunded') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
    INDEX idx_booking_customer (customer_id),
    INDEX idx_booking_equipment (equipment_id),
    INDEX idx_booking_vendor (vendor_id),
    INDEX idx_booking_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: feedback
-- Description: Customer reviews and ratings
-- =====================================================
CREATE TABLE feedback (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_id INT UNSIGNED NOT NULL,
    equipment_id INT UNSIGNED NOT NULL,
    booking_id INT UNSIGNED NOT NULL,
    rating TINYINT UNSIGNED NOT NULL,
    comment TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    INDEX idx_feedback_customer (customer_id),
    INDEX idx_feedback_equipment (equipment_id),
    INDEX idx_feedback_booking (booking_id),
    INDEX idx_feedback_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: payments
-- Description: Payment transactions
-- =====================================================
CREATE TABLE payments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_id INT UNSIGNED NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('cash', 'card', 'online', 'upi') NOT NULL DEFAULT 'online',
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
    transaction_id VARCHAR(255) NULL,
    payment_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL,
    
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    INDEX idx_payment_booking (booking_id),
    INDEX idx_payment_status (payment_status),
    INDEX idx_transaction_id (transaction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: notifications
-- Description: System notifications
-- =====================================================
CREATE TABLE notifications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_type ENUM('admin', 'vendor', 'customer') NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error') NOT NULL DEFAULT 'info',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL,
    
    INDEX idx_notification_user (user_type, user_id),
    INDEX idx_notification_read (is_read),
    INDEX idx_notification_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: audit_logs
-- Description: Activity audit trail
-- =====================================================
CREATE TABLE audit_logs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_type ENUM('admin', 'vendor', 'customer') NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    action VARCHAR(255) NOT NULL,
    table_name VARCHAR(100) NULL,
    record_id INT UNSIGNED NULL,
    old_values TEXT NULL,
    new_values TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_audit_user (user_type, user_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_table (table_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Seed Data (categories only)
-- =====================================================
-- Note: Do not insert sample admins/vendors/customers in production.
-- Create a real admin manually and let users register via the app.

INSERT INTO equipment_categories (name, description) VALUES
('Tractors', 'All types of agricultural tractors'),
('Harvesters', 'Combine and crop harvesters'),
('Plowing Equipment', 'Plows and tilling tools'),
('Seeding Equipment', 'Seeders and planters'),
('Irrigation Systems', 'Sprinklers and irrigation tools'),
('Cultivation Tools', 'Tools for soil cultivation'),
('Post-Harvest Equipment', 'Dryers, cleaners, and storage tools'),
('Other Equipment', 'Miscellaneous farm equipment');

SET FOREIGN_KEY_CHECKS = 1;