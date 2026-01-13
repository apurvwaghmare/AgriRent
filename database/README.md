# Database Setup Instructions

## Prerequisites

1. **MySQL Server**: Make sure you have MySQL Server installed and running
   - Download from: https://dev.mysql.com/downloads/mysql/
   - Or use XAMPP, WAMP, or similar local development environment

2. **MySQL Client**: You can use any of the following:
   - MySQL Workbench (recommended)
   - phpMyAdmin (if using XAMPP/WAMP)
   - Command line MySQL client
   - Any other MySQL administration tool

## Database Setup Steps

### Option 1: Using MySQL Workbench (Recommended)

1. **Open MySQL Workbench**
2. **Connect to your MySQL server** using your root credentials
3. **Open the SQL script**:
   - Go to File → Open SQL Script
   - Navigate to `/database/agriculture.sql`
   - Select and open the file
4. **Execute the script**:
   - Click the lightning bolt icon (Execute) or press Ctrl+Shift+Enter
   - This will create the database, tables, and insert sample data

### Option 2: Using Command Line

1. **Open Command Prompt/Terminal**
2. **Navigate to the project directory**:
   ```bash
   cd /path/to/agriculture-equipment-rental-system
   ```
3. **Execute the SQL script**:
   ```bash
   mysql -u root -p < database/agriculture.sql
   ```
4. **Enter your MySQL root password when prompted**

### Option 3: Using phpMyAdmin (XAMPP/WAMP users)

1. **Start XAMPP/WAMP** and ensure MySQL is running
2. **Open phpMyAdmin** (usually at http://localhost/phpmyadmin)
3. **Go to Import tab**
4. **Choose file**: Select `/database/agriculture.sql`
5. **Click Go** to execute the script

## Database Schema Overview

The database includes the following tables:

### Core Tables
- **admins** - System administrators
- **vendors** - Equipment suppliers/vendors
- **customers** - Equipment renters
- **equipment_categories** - Equipment categorization
- **equipment** - Agricultural equipment listings
- **bookings** - Rental bookings
- **feedback** - Customer reviews and ratings
- **payments** - Payment transactions

### Supporting Tables
- **notifications** - System notifications
- **audit_logs** - Activity audit trail

### Database Features
- **Foreign Key Constraints** - Ensures data integrity
- **Indexes** - Optimized for performance
- **Views** - Pre-built queries for common operations
- **Stored Procedures** - Business logic functions
- **Triggers** - Automatic actions on data changes

## Default Data

The script creates sample data including:

### Admin Account
- **Email**: admin@agriculture-rental.com
- **Password**: admin123

### Sample Vendor
- **Email**: vendor@greenfarm.com
- **Password**: vendor123
- **Status**: approved

### Sample Customer
- **Email**: customer@farm.com
- **Password**: customer123

### Equipment Categories
- Tractors
- Harvesters
- Plowing Equipment
- Seeding Equipment
- Irrigation Systems
- Cultivation Tools
- Post-Harvest Equipment
- Other Equipment

### Sample Equipment
- John Deere 5075E (Utility Tractor)
- Case IH Axial-Flow 250 (Combine Harvester)

## Environment Configuration

After setting up the database, make sure your `.env` file in the backend directory has the correct database configuration:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=agriculture
DB_PORT=3306
```

## Verification

To verify the setup was successful:

1. **Check database creation**:
   ```sql
   SHOW DATABASES;
   USE agriculture;
   SHOW TABLES;
   ```

2. **Test data insertion**:
   ```sql
   SELECT COUNT(*) FROM admins;
   SELECT COUNT(*) FROM equipment_categories;
   SELECT COUNT(*) FROM vendors;
   ```

3. **Start the backend server**:
   ```bash
   cd backend
   npm run dev
   ```

4. **Test the health endpoint**:
   - Open browser and go to: http://localhost:5000/api/health
   - You should see a JSON response indicating the API is running

## Troubleshooting

### Common Issues

1. **Access Denied Error**:
   - Check your MySQL username and password
   - Ensure MySQL server is running
   - Update `.env` file with correct credentials

2. **Database Already Exists**:
   - The script will drop and recreate the database
   - Make sure you don't have important data in an existing 'agriculture' database

3. **Foreign Key Constraint Errors**:
   - The script temporarily disables foreign key checks
   - If you encounter issues, ensure MySQL supports InnoDB engine

4. **Permission Issues**:
   - Make sure your MySQL user has CREATE, DROP, and INSERT privileges
   - You may need to run as MySQL root user

### Reset Database

If you need to reset the database completely:

```sql
DROP DATABASE IF EXISTS agriculture;
```

Then re-run the setup script.

## Next Steps

After successful database setup:

1. **Start the backend server**: `npm run dev`
2. **Test API endpoints** using tools like Postman or Thunder Client
3. **Set up the frontend** to connect to the backend
4. **Create your first admin, vendor, and customer accounts** through the API

## Security Notes

- Change default passwords in production
- Use environment variables for sensitive data
- Enable SSL/TLS for production databases
- Regularly backup your database
- Monitor audit logs for security events