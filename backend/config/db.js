const path = require('path');
const dotenvPath = path.resolve(__dirname, '..', '.env');
const isDevelopment = process.env.NODE_ENV === 'development';

// ✅ Load environment variables once
require('dotenv').config({ path: dotenvPath });

const mysql = require('mysql2/promise');

// ✅ Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'agriculture',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
};

// ✅ Create connection pool
const pool = mysql.createPool(dbConfig);

if (isDevelopment) {
    console.log('🔧 Database Configuration:');
    console.log(`   Host: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`   User: ${dbConfig.user}`);
    console.log(`   Database: ${dbConfig.database}`);
}

// ✅ Test DB connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        if (isDevelopment) {
            console.log('✅ Database connected successfully');
            console.log(`📊 Connected to database: ${dbConfig.database}`);
        }
        connection.release();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.error('Please check your database configuration and ensure MySQL server is running');
    }
};

// Run test connection
testConnection();

// ✅ Helper functions
const query = async (sql, params = []) => {
    const [rows] = await pool.execute(sql, params);
    return rows;
};

const transaction = async (callback) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const closePool = async () => {
    await pool.end();
    if (isDevelopment) {
        console.log('Database pool closed');
    }
};

// Graceful shutdown
process.on('SIGINT', async () => { await closePool(); process.exit(0); });
process.on('SIGTERM', async () => { await closePool(); process.exit(0); });

module.exports = { pool, query, transaction, closePool };
