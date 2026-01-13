const { query } = require('../config/db');

class Rental {
    constructor(rentalData) {
        this.id = rentalData.id;
        this.user_id = rentalData.user_id;
        this.equipment_id = rentalData.equipment_id;
        this.start_date = rentalData.start_date;
        this.end_date = rentalData.end_date;
        this.total_cost = rentalData.total_cost;
        this.status = rentalData.status;
        this.notes = rentalData.notes;
        this.admin_notes = rentalData.admin_notes;
        this.created_at = rentalData.created_at;
        this.updated_at = rentalData.updated_at;
        
        // Related data
        this.equipment_name = rentalData.equipment_name;
        this.equipment_image = rentalData.equipment_image;
        this.daily_rate = rentalData.daily_rate;
        this.user_name = rentalData.user_name;
        this.user_email = rentalData.user_email;
        this.user_phone = rentalData.user_phone;
        this.user_address = rentalData.user_address;
    }

    // Create rental
    static async create(rentalData) {
        try {
            const result = await query(`
                INSERT INTO rentals 
                (user_id, equipment_id, start_date, end_date, total_cost, status, notes) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                rentalData.user_id,
                rentalData.equipment_id,
                rentalData.start_date,
                rentalData.end_date,
                rentalData.total_cost,
                rentalData.status || 'pending',
                rentalData.notes
            ]);
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    // Find rental by ID
    static async findById(id, userId = null) {
        try {
            let sql = `
                SELECT r.*, e.name as equipment_name, e.daily_rate, e.image_url as equipment_image,
                       u.name as user_name, u.email as user_email, u.phone as user_phone, u.address as user_address
                FROM rentals r
                JOIN equipment e ON r.equipment_id = e.id
                JOIN users u ON r.user_id = u.id
                WHERE r.id = ?
            `;
            const params = [id];

            if (userId) {
                sql += ' AND r.user_id = ?';
                params.push(userId);
            }

            const rentals = await query(sql, params);
            return rentals.length > 0 ? new Rental(rentals[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    // Update rental
    static async update(id, rentalData) {
        try {
            const result = await query(`
                UPDATE rentals 
                SET start_date = ?, end_date = ?, total_cost = ?, notes = ?, updated_at = NOW()
                WHERE id = ?
            `, [
                rentalData.start_date,
                rentalData.end_date,
                rentalData.total_cost,
                rentalData.notes,
                id
            ]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Update rental status
    static async updateStatus(id, status, adminNotes = null) {
        try {
            const result = await query(
                'UPDATE rentals SET status = ?, admin_notes = ?, updated_at = NOW() WHERE id = ?',
                [status, adminNotes, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Delete rental
    static async delete(id) {
        try {
            const result = await query(
                'DELETE FROM rentals WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Get all rentals with pagination and filters
    static async getAll(options = {}) {
        try {
            const { page = 1, limit = 10, status, userId, equipmentId } = options;
            const offset = (page - 1) * limit;

            let sql = `
                SELECT r.*, e.name as equipment_name, e.daily_rate, e.image_url as equipment_image,
                       u.name as user_name, u.email as user_email, u.phone as user_phone
                FROM rentals r
                JOIN equipment e ON r.equipment_id = e.id
                JOIN users u ON r.user_id = u.id
                WHERE 1=1
            `;
            const params = [];

            if (status) {
                sql += ' AND r.status = ?';
                params.push(status);
            }

            if (userId) {
                sql += ' AND r.user_id = ?';
                params.push(userId);
            }

            if (equipmentId) {
                sql += ' AND r.equipment_id = ?';
                params.push(equipmentId);
            }

            sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const rentals = await query(sql, params);
            return rentals.map(rental => new Rental(rental));
        } catch (error) {
            throw error;
        }
    }

    // Get rental count
    static async getCount(options = {}) {
        try {
            const { status, userId, equipmentId } = options;

            let sql = 'SELECT COUNT(*) as total FROM rentals WHERE 1=1';
            const params = [];

            if (status) {
                sql += ' AND status = ?';
                params.push(status);
            }

            if (userId) {
                sql += ' AND user_id = ?';
                params.push(userId);
            }

            if (equipmentId) {
                sql += ' AND equipment_id = ?';
                params.push(equipmentId);
            }

            const result = await query(sql, params);
            return result[0].total;
        } catch (error) {
            throw error;
        }
    }

    // Check for overlapping rentals
    static async checkOverlap(equipmentId, startDate, endDate, excludeRentalId = null) {
        try {
            let sql = `
                SELECT id FROM rentals 
                WHERE equipment_id = ? 
                AND status IN ('pending', 'approved') 
                AND (
                    (start_date <= ? AND end_date >= ?) OR
                    (start_date <= ? AND end_date >= ?) OR
                    (start_date >= ? AND end_date <= ?)
                )
            `;
            const params = [equipmentId, startDate, startDate, endDate, endDate, startDate, endDate];

            if (excludeRentalId) {
                sql += ' AND id != ?';
                params.push(excludeRentalId);
            }

            const overlapping = await query(sql, params);
            return overlapping.length > 0;
        } catch (error) {
            throw error;
        }
    }

    // Get user's rental history
    static async getUserHistory(userId, options = {}) {
        try {
            const { page = 1, limit = 10, status } = options;
            const offset = (page - 1) * limit;

            let sql = `
                SELECT r.*, e.name as equipment_name, e.daily_rate, e.image_url as equipment_image
                FROM rentals r
                JOIN equipment e ON r.equipment_id = e.id
                WHERE r.user_id = ?
            `;
            const params = [userId];

            if (status) {
                sql += ' AND r.status = ?';
                params.push(status);
            }

            sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const rentals = await query(sql, params);
            return rentals.map(rental => new Rental(rental));
        } catch (error) {
            throw error;
        }
    }

    // Get equipment rental history
    static async getEquipmentHistory(equipmentId, options = {}) {
        try {
            const { page = 1, limit = 10, status } = options;
            const offset = (page - 1) * limit;

            let sql = `
                SELECT r.*, u.name as user_name, u.email as user_email, u.phone as user_phone
                FROM rentals r
                JOIN users u ON r.user_id = u.id
                WHERE r.equipment_id = ?
            `;
            const params = [equipmentId];

            if (status) {
                sql += ' AND r.status = ?';
                params.push(status);
            }

            sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const rentals = await query(sql, params);
            return rentals.map(rental => new Rental(rental));
        } catch (error) {
            throw error;
        }
    }

    // Calculate total cost based on dates and daily rate
    static calculateTotalCost(startDate, endDate, dailyRate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        return days * parseFloat(dailyRate);
    }
}

module.exports = Rental;