// lib/db.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10, // Adjust based on expected concurrency
  queueLimit: 0,       // 0 = unlimited queue
  connectTimeout: 10000,
  timeout: 60000,
});

// Function to get a connection from the pool
export const getConnection = async () => {
  try {
    const connection = await pool.getConnection();
    return connection;
  } catch (error) {
    console.error('❌ Error getting connection from pool:', error);
    throw error;
  }
};

export default pool;
