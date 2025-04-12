import { getConnection } from '../lib/db.js';

export const buyAsset = async (req, res) => {
    const db = await getConnection();
    if (!db) {
        return res.status(500).json({ message: "Database connection failed" });
    }

    try {
        const { user_id, asset_symbol, asset_name, quantity, price } = req.body;
        if (!user_id || !asset_symbol || !asset_name || !quantity || !price) {
            db.release();
            return res.status(400).json({ message: "All fields are required" });
        }

        const query = `
            INSERT INTO user_portfolio (user_id, asset_symbol, asset_name, quantity, average_price)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                quantity = quantity + VALUES(quantity),
                average_price = ((average_price * (quantity - VALUES(quantity))) + (VALUES(average_price) * VALUES(quantity))) / quantity;
        `;
        await db.execute(query, [user_id, asset_symbol, asset_name, quantity, price]);

        const transactionQuery = `
            INSERT INTO transaction_history (user_id, asset_symbol, asset_name, quantity, price, transaction_type)
            VALUES (?, ?, ?, ?, ?, 'BUY');
        `;
        await db.execute(transactionQuery, [user_id, asset_symbol, asset_name, quantity, price]);

        res.json({ message: "Purchase successful" });
    } catch (error) {
        console.error("Error in buyAsset:", error);
        res.status(500).json({ message: "Server error" });
    } finally {
        db.release();
    }
};

export const sellAsset = async (req, res) => {
    const db = await getConnection();
    if (!db) {
        return res.status(500).json({ message: "Database connection failed" });
    }

    try {
        const { user_id, asset_symbol, quantity, price } = req.body;
        if (!user_id || !asset_symbol || !quantity || !price || quantity <= 0) {
            db.release();
            return res.status(400).json({ message: "Invalid request parameters" });
        }

        const [rows] = await db.execute(
            'SELECT quantity, average_price, asset_name FROM user_portfolio WHERE user_id = ? AND asset_symbol = ?',
            [user_id, asset_symbol]
        );

        if (rows.length === 0) {
            db.release();
            return res.status(404).json({ message: "Asset not found in portfolio" });
        }

        const currentQuantity = parseFloat(rows[0].quantity);
        if (quantity > currentQuantity) {
            db.release();
            return res.status(400).json({ message: "Sell quantity exceeds holdings" });
        }

        const newQuantity = currentQuantity - quantity;
        await db.execute(
            'UPDATE user_portfolio SET quantity = ? WHERE user_id = ? AND asset_symbol = ?',
            [newQuantity, user_id, asset_symbol]
        );

        await db.execute(
            'DELETE FROM user_portfolio WHERE user_id = ? AND asset_symbol = ? AND quantity <= 0',
            [user_id, asset_symbol]
        );

        const transactionQuery = `
            INSERT INTO transaction_history (user_id, asset_symbol, asset_name, quantity, price, transaction_type)
            VALUES (?, ?, ?, ?, ?, 'SELL');
        `;
        await db.execute(transactionQuery, [user_id, asset_symbol, rows[0].asset_name, quantity, price]);

        res.json({ message: "Asset sold successfully" });
    } catch (error) {
        console.error("Error in sellAsset:", error);
        res.status(500).json({ message: "Server error" });
    } finally {
        db.release();
    }
};

export const getStocks = async (req, res) => {
    const db = await getConnection();
    if (!db) {
        return res.status(500).json({ message: "Database connection failed" });
    }

    try {
        const { user_id } = req.body;
        if (!user_id) {
            db.release();
            return res.status(400).json({ message: "User ID is required" });
        }

        const query = "SELECT asset_symbol, asset_name, quantity, average_price, total_value FROM user_portfolio WHERE user_id = ?";
        const [rows] = await db.execute(query, [user_id]);

        res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching portfolio:", error);
        res.status(500).json({ message: "Server error" });
    } finally {
        db.release();
    }
};

export const getTransactionHistory = async (req, res) => {
    const db = await getConnection();
    if (!db) {
        return res.status(500).json({ message: "Database connection failed" });
    }

    try {
        const { user_id, sort = 'DESC', filter = 'ALL' } = req.body;
        if (!user_id) {
            db.release();
            return res.status(400).json({ message: "User ID is required" });
        }

        let query = `SELECT * FROM transaction_history WHERE user_id = ?`;
        const params = [user_id];

        if (filter !== 'ALL') {
            query += ` AND transaction_type = ?`;
            params.push(filter);
        }

        query += ` ORDER BY transaction_date ${sort === 'ASC' ? 'ASC' : 'DESC'}`;
        const [rows] = await db.execute(query, params);

        res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching transaction history:", error);
        res.status(500).json({ message: "Server error" });
    } finally {
        db.release();
    }
};
