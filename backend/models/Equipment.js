const { query } = require('../config/db');

class Equipment {
    constructor(equipmentData) {
        this.id = equipmentData.id;
        this.name = equipmentData.name;
        this.description = equipmentData.description;
        this.category_id = equipmentData.category_id;
        this.daily_rate = equipmentData.daily_rate;
        this.specifications = equipmentData.specifications;
        this.image_url = equipmentData.image_url;
        this.availability_status = equipmentData.availability_status;
        this.created_at = equipmentData.created_at;
        this.updated_at = equipmentData.updated_at;
        this.category_name = equipmentData.category_name;
    }

    // Create equipment
    static async create(equipmentData) {
        try {
            const result = await query(`
                INSERT INTO equipment 
                (name, description, category_id, daily_rate, specifications, image_url, availability_status) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                equipmentData.name,
                equipmentData.description,
                equipmentData.category_id,
                equipmentData.daily_rate,
                equipmentData.specifications,
                equipmentData.image_url,
                equipmentData.availability_status || 'available'
            ]);
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    // Find equipment by ID
    static async findById(id) {
        try {
            const equipment = await query(`
                SELECT e.*, c.name as category_name 
                FROM equipment e 
                LEFT JOIN categories c ON e.category_id = c.id 
                WHERE e.id = ?
            `, [id]);
            
            return equipment.length > 0 ? new Equipment(equipment[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    // Update equipment
    static async update(id, equipmentData) {
        try {
            const result = await query(`
                UPDATE equipment 
                SET name = ?, description = ?, category_id = ?, daily_rate = ?, 
                    specifications = ?, image_url = ?, availability_status = ?, updated_at = NOW()
                WHERE id = ?
            `, [
                equipmentData.name,
                equipmentData.description,
                equipmentData.category_id,
                equipmentData.daily_rate,
                equipmentData.specifications,
                equipmentData.image_url,
                equipmentData.availability_status,
                id
            ]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Delete equipment
    static async delete(id) {
        try {
            const result = await query(
                'DELETE FROM equipment WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Get all equipment with pagination and filters
    static async getAll(options = {}) {
        try {
            const { page = 1, limit = 10, category, availability, search } = options;
            const offset = (page - 1) * limit;

            let sql = `
                SELECT e.*, c.name as category_name 
                FROM equipment e 
                LEFT JOIN categories c ON e.category_id = c.id 
                WHERE 1=1
            `;
            const params = [];

            if (category) {
                sql += ' AND e.category_id = ?';
                params.push(category);
            }

            if (availability) {
                sql += ' AND e.availability_status = ?';
                params.push(availability);
            }

            if (search) {
                sql += ' AND (e.name LIKE ? OR e.description LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }

            sql += ' ORDER BY e.created_at DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const equipment = await query(sql, params);
            return equipment.map(item => new Equipment(item));
        } catch (error) {
            throw error;
        }
    }

    // Get equipment count
    static async getCount(options = {}) {
        try {
            const { category, availability, search } = options;

            let sql = 'SELECT COUNT(*) as total FROM equipment WHERE 1=1';
            const params = [];

            if (category) {
                sql += ' AND category_id = ?';
                params.push(category);
            }

            if (availability) {
                sql += ' AND availability_status = ?';
                params.push(availability);
            }

            if (search) {
                sql += ' AND (name LIKE ? OR description LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }

            const result = await query(sql, params);
            return result[0].total;
        } catch (error) {
            throw error;
        }
    }

    // Update availability status
    static async updateAvailability(id, status) {
        try {
            const result = await query(
                'UPDATE equipment SET availability_status = ?, updated_at = NOW() WHERE id = ?',
                [status, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Get available equipment for date range
    static async getAvailableForDates(startDate, endDate, excludeRentalId = null) {
        try {
            let sql = `
                SELECT e.*, c.name as category_name 
                FROM equipment e 
                LEFT JOIN categories c ON e.category_id = c.id 
                WHERE e.availability_status = 'available'
                AND e.id NOT IN (
                    SELECT DISTINCT equipment_id 
                    FROM rentals 
                    WHERE status IN ('pending', 'approved') 
                    AND (
                        (start_date <= ? AND end_date >= ?) OR
                        (start_date <= ? AND end_date >= ?) OR
                        (start_date >= ? AND end_date <= ?)
                    )
            `;
            
            const params = [startDate, startDate, endDate, endDate, startDate, endDate];

            if (excludeRentalId) {
                sql += ' AND id != ?';
                params.push(excludeRentalId);
            }

            sql += ')';

            const equipment = await query(sql, params);
            return equipment.map(item => new Equipment(item));
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Equipment;