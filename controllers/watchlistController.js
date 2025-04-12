import { getConnection } from '../lib/db.js';

export const addAsset = async (req, res) => {
    const db = await getConnection();
    if (!db) {
        return res.status(500).json({ message: "Database connection failed" });
    }

    try {
        const { user_id, asset_symbol, asset_name } = req.body;
        if (!user_id || !asset_symbol || !asset_name) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const query = `
            INSERT INTO user_watchlist (user_id, asset_symbol, asset_name)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                asset_name = VALUES(asset_name);
        `;

        await db.execute(query, [user_id, asset_symbol, asset_name]);
        res.status(200).json({ message: "Added to Watchlist" });

    } catch (error) {
        console.error("Error in addAsset:", error);
        res.status(500).json({ message: "Server error" });
    } finally {
        db.release();
    }
};

export const getAsset = async (req, res) => {
    const db = await getConnection();
    if (!db) {
        return res.status(500).json({ message: "Database connection failed" });
    }

    try {
        const { user_id } = req.body;
        if (!user_id) {
            return res.status(400).json({ message: "User ID is required" });
        }

        const query = `SELECT asset_symbol, asset_name FROM user_watchlist WHERE user_id = ?`;
        const [rows] = await db.execute(query, [user_id]);

        res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching watchlist:", error);
        res.status(500).json({ message: "Server error" });
    } finally {
        db.release();
    }
};

export const deleteAsset = async (req, res) => {
    const db = await getConnection();
    if (!db) {
        return res.status(500).json({ message: "Database connection failed" });
    }

    try {
        const { user_id, asset_symbol } = req.body;
        if (!user_id || !asset_symbol) {
            return res.status(400).json({ message: "User ID and Asset Symbol are required" });
        }

        const query = `DELETE FROM user_watchlist WHERE user_id = ? AND asset_symbol = ?`;
        const [result] = await db.execute(query, [user_id, asset_symbol]);

        if (result.affectedRows > 0) {
            res.status(200).json({ message: "Asset deleted from watchlist" });
        } else {
            res.status(404).json({ message: "Asset not found in watchlist" });
        }
    } catch (error) {
        console.error("Error deleting asset:", error);
        res.status(500).json({ message: "Server error" });
    } finally {
        db.release();
    }
};
