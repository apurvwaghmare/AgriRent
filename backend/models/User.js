const { query } = require('../config/db');

class User {
    constructor(userData) {
        this.id = userData.id;
        this.name = userData.name;
        this.email = userData.email;
        this.password = userData.password;
        this.phone = userData.phone;
        this.address = userData.address;
        this.role = userData.role;
        this.created_at = userData.created_at;
        this.updated_at = userData.updated_at;
    }

    // Create user
    static async create(userData) {
        try {
            const result = await query(
                'INSERT INTO users (name, email, password, phone, address, role) VALUES (?, ?, ?, ?, ?, ?)',
                [userData.name, userData.email, userData.password, userData.phone, userData.address, userData.role]
            );
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    // Find user by ID
    static async findById(id) {
        try {
            const users = await query(
                'SELECT * FROM users WHERE id = ?',
                [id]
            );
            return users.length > 0 ? new User(users[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    // Find user by email
    static async findByEmail(email) {
        try {
            const users = await query(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );
            return users.length > 0 ? new User(users[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    // Update user
    static async update(id, userData) {
        try {
            const result = await query(
                'UPDATE users SET name = ?, email = ?, phone = ?, address = ?, updated_at = NOW() WHERE id = ?',
                [userData.name, userData.email, userData.phone, userData.address, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Delete user
    static async delete(id) {
        try {
            const result = await query(
                'DELETE FROM users WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Get all users with pagination
    static async getAll(options = {}) {
        try {
            const { page = 1, limit = 10, role, search } = options;
            const offset = (page - 1) * limit;

            let sql = 'SELECT id, name, email, phone, address, role, created_at, updated_at FROM users WHERE 1=1';
            const params = [];

            if (role) {
                sql += ' AND role = ?';
                params.push(role);
            }

            if (search) {
                sql += ' AND (name LIKE ? OR email LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }

            sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const users = await query(sql, params);
            return users.map(user => new User(user));
        } catch (error) {
            throw error;
        }
    }

    // Get user count
    static async getCount(options = {}) {
        try {
            const { role, search } = options;

            let sql = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
            const params = [];

            if (role) {
                sql += ' AND role = ?';
                params.push(role);
            }

            if (search) {
                sql += ' AND (name LIKE ? OR email LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }

            const result = await query(sql, params);
            return result[0].total;
        } catch (error) {
            throw error;
        }
    }

    // Convert to JSON (without password)
    toJSON() {
        const { password, ...userWithoutPassword } = this;
        return userWithoutPassword;
    }
}

module.exports = User;