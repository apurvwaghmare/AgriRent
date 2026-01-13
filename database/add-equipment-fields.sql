-- Add missing fields to equipment table
-- Run this SQL in your MySQL database

USE agriculture;

-- Add missing columns to equipment table
ALTER TABLE equipment 
ADD COLUMN price_per_week DECIMAL(10, 2) NULL AFTER price_per_day,
ADD COLUMN price_per_month DECIMAL(10, 2) NULL AFTER price_per_week,
ADD COLUMN location VARCHAR(255) NULL AFTER price_per_month,
ADD COLUMN condition_status ENUM('excellent', 'good', 'fair', 'needs_repair') DEFAULT 'good' AFTER location;

-- Add indexes for the new columns
CREATE INDEX idx_equipment_location ON equipment(location);
CREATE INDEX idx_equipment_condition ON equipment(condition_status);

-- Show the updated table structure
DESCRIBE equipment;