import { getConnection } from '../lib/db.js';
import bcrypt from 'bcrypt';

export const getProfile = async (req, res) => {
    const db = await getConnection();
    if (!db) return res.status(500).json({ message: "Database connection failed" });

    try {
        const { user_id } = req.body;
        if (!user_id) return res.status(400).json({ message: "User ID is required" });

        const [rows] = await db.execute(
            'SELECT id, username, email FROM users WHERE id = ?',
            [user_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ message: "Server error" });
    } finally {
        db.release();
    }
};

export const updateUsername = async (req, res) => {
    const db = await getConnection();
    if (!db) return res.status(500).json({ message: "Database connection failed" });

    try {
        const { user_id, newUsername } = req.body;
        if (!user_id || !newUsername) {
            return res.status(400).json({ message: "User ID and new username are required" });
        }

        const [existing] = await db.execute(
            'SELECT id FROM users WHERE username = ? AND id != ?',
            [newUsername, user_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Username already taken' });
        }

        await db.execute(
            'UPDATE users SET username = ? WHERE id = ?',
            [newUsername, user_id]
        );

        res.status(200).json({ message: 'Username updated successfully', username: newUsername });
    } catch (error) {
        console.error("Error updating username:", error);
        res.status(500).json({ message: "Server error" });
    } finally {
        db.release();
    }
};

export const updatePassword = async (req, res) => {
    const db = await getConnection();
    if (!db) return res.status(500).json({ message: "Database connection failed" });

    try {
        const { user_id, currentPassword, newPassword } = req.body;
        if (!user_id || !currentPassword || !newPassword) {
            return res.status(400).json({ message: "All password fields are required" });
        }

        const [rows] = await db.execute(
            'SELECT password FROM users WHERE id = ?',
            [user_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.execute(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, user_id]
        );

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error("Error updating password:", error);
        res.status(500).json({ message: "Server error" });
    } finally {
        db.release();
    }
};

export const deleteAccount = async (req, res) => {
    const db = await getConnection();
    if (!db) return res.status(500).json({ message: "Database connection failed" });

    try {
        const { user_id } = req.body;
        if (!user_id) return res.status(400).json({ message: "User ID is required" });

        await db.beginTransaction();

        await db.execute('DELETE FROM user_portfolio WHERE user_id = ?', [user_id]);
        await db.execute('DELETE FROM transaction_history WHERE user_id = ?', [user_id]);
        const [result] = await db.execute('DELETE FROM users WHERE id = ?', [user_id]);

        if (result.affectedRows === 0) {
            await db.rollback();
            return res.status(404).json({ message: 'User not found' });
        }

        await db.commit();
        res.status(200).json({ message: 'Account deleted successfully' });
    } catch (error) {
        if (db) await db.rollback();
        console.error("Error deleting account:", error);
        res.status(500).json({ message: error.message || "Failed to delete account" });
    } finally {
        db.release();
    }
};
