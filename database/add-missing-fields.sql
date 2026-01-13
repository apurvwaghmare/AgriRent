-- Add missing fields to equipment table
ALTER TABLE equipment 
ADD COLUMN weekly_rate DECIMAL(10, 2) NULL AFTER price_per_day,
ADD COLUMN monthly_rate DECIMAL(10, 2) NULL AFTER weekly_rate,
ADD COLUMN location VARCHAR(255) NULL AFTER monthly_rate;

-- Check if columns were added successfully
DESCRIBE equipment;