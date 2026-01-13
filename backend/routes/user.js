const express = require('express');
const bcrypt = require('bcrypt');
const { query } = require('../config/db');
const { auth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', auth, requireAdmin, async (req, res) => {
    try {
        const { role, search, page = 1, limit = 10 } = req.query;
        
        let sql = `
            SELECT id, name, email, phone, address, role, created_at, updated_at
            FROM users 
            WHERE 1=1
        `;
        const params = [];

        if (role) {
            sql += ' AND role = ?';
            params.push(role);
        }

        if (search) {
            sql += ' AND (name LIKE ? OR email LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        sql += ' ORDER BY created_at DESC';

        // Add pagination
        const offset = (page - 1) * limit;
        sql += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const users = await query(sql, params);

        // Get total count for pagination
        let countSql = `
            SELECT COUNT(*) as total 
            FROM users 
            WHERE 1=1
        `;
        const countParams = [];

        if (role) {
            countSql += ' AND role = ?';
            countParams.push(role);
        }

        if (search) {
            countSql += ' AND (name LIKE ? OR email LIKE ?)';
            countParams.push(`%${search}%`, `%${search}%`);
        }

        const countResult = await query(countSql, countParams);
        const total = countResult[0].total;

        res.status(200).json({
            success: true,
            data: users,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get single user by ID (admin only or own profile)
router.get('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;

        // Allow users to view their own profile or admin to view any profile
        if (req.user.role !== 'admin' && req.user.userId !== parseInt(id)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const users = await query(
            'SELECT id, name, email, phone, address, role, created_at, updated_at FROM users WHERE id = ?',
            [id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: users[0]
        });

    } catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Update user profile
router.put('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, address } = req.body;

        // Allow users to update their own profile or admin to update any profile
        if (req.user.role !== 'admin' && req.user.userId !== parseInt(id)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Check if user exists
        const users = await query('SELECT * FROM users WHERE id = ?', [id]);
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if email is already taken by another user
        if (email && email !== users[0].email) {
            const existingUser = await query(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [email, id]
            );

            if (existingUser.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is already taken'
                });
            }
        }

        // Update user
        await query(`
            UPDATE users 
            SET name = COALESCE(?, name), 
                email = COALESCE(?, email), 
                phone = COALESCE(?, phone), 
                address = COALESCE(?, address),
                updated_at = NOW()
            WHERE id = ?
        `, [name, email, phone, address, id]);

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully'
        });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Change password
router.put('/:id/password', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { currentPassword, newPassword } = req.body;

        // Allow users to change their own password or admin to change any password
        if (req.user.role !== 'admin' && req.user.userId !== parseInt(id)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Validate required fields
        if (!newPassword) {
            return res.status(400).json({
                success: false,
                message: 'New password is required'
            });
        }

        // For non-admin users, current password is required
        if (req.user.role !== 'admin' && !currentPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password is required'
            });
        }

        // Get user
        const users = await query('SELECT * FROM users WHERE id = ?', [id]);
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = users[0];

        // Verify current password for non-admin users
        if (req.user.role !== 'admin') {
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }
        }

        // Hash new password
        const saltRounds = 10;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await query(
            'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
            [hashedNewPassword, id]
        );

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Update user role (admin only)
router.put('/:id/role', auth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        // Validate role
        const validRoles = ['customer', 'admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role'
            });
        }

        // Check if user exists
        const users = await query('SELECT * FROM users WHERE id = ?', [id]);
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent admin from changing their own role
        if (req.user.userId === parseInt(id)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot change your own role'
            });
        }

        // Update role
        await query(
            'UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?',
            [role, id]
        );

        res.status(200).json({
            success: true,
            message: 'User role updated successfully'
        });

    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Delete user (admin only)
router.delete('/:id', auth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user exists
        const users = await query('SELECT * FROM users WHERE id = ?', [id]);
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent admin from deleting themselves
        if (req.user.userId === parseInt(id)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }

        // Check for active rentals
        const activeRentals = await query(
            'SELECT id FROM rentals WHERE user_id = ? AND status IN ("pending", "approved")',
            [id]
        );

        if (activeRentals.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete user with active rentals'
            });
        }

        // Delete user
        await query('DELETE FROM users WHERE id = ?', [id]);

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;