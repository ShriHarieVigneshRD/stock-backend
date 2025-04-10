import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config(); // ✅ Load env vars at top-level (only once when file is loaded)

let connection;

export const connectToDatabase = async () => {
    if (!connection) {
        try {
            connection = await mysql.createConnection({
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306, // 👈 safe default
                connectTimeout: 10000, // Add 10-second timeout
                // Add timeout for individual queries
                timeout: 60000,
            });
            console.log('✅ Connected to MySQL Database');
        } catch (error) {
            console.error('❌ Error connecting to the database:', error);
            throw error; // Let index.js handle this
        }
    }
    return connection;
};
