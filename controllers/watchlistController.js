import { connectToDatabase } from '../lib/db.js';


export const addAsset = async (req, res) => {
    const db = await connectToDatabase();
    if (!db) {
        return res.status(500).json({ message: "Database connection failed" });
    }
    try {
        const { user_id, asset_symbol, asset_name } = req.body;
        if (!user_id || !asset_symbol || !asset_name) {
            console.log(user_id,asset_symbol,asset_name,quantity,price);
            return res.status(400).json({ message: "All fields are required" });
        }

        const query = `
            INSERT INTO user_watchlist (user_id, asset_symbol, asset_name)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                asset_name = VALUES(asset_name);
        `;

        await db.execute(query, [user_id, asset_symbol, asset_name]);
        res.json({ message: "Added To WatchList" });

    } catch (error) {
        console.error("Error in addAsset:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getAsset = async (req, res) => {
    const db = await connectToDatabase();
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

        if (rows.length > 0) {
            res.status(200).json(rows);
        } else {
            res.status(404).json([]);
        }
    } catch (error) {
        console.error("Error fetching watchlist:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteAsset = async (req, res) => {
    const db = await connectToDatabase();
    if(!db){
        return res.status(500).json({message: "Database connection failed"});
    }
    try {
        const {user_id,asset_symbol} = req.body;
        if(!user_id || !asset_symbol){
            return res.status(400).json({message: "User ID and Asset Symbol are required"});
        }
        const query = `DELETE FROM user_watchlist WHERE user_id = ? AND asset_symbol = ?`;
        const [rows] = await db.execute(query,[user_id,asset_symbol]);
        if(rows.affectedRows > 0){
            res.status(200).json({message: "Asset Deleted from Watchlist"});
        }
        else{
            res.status(404).json({message: "Asset not found in Watchlist"});
        }
    }
    catch(error){
        console.error("Error deleting asset:", error);
        res.status(500).json({ message: "Server error" });
    }
};
