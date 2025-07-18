require('dotenv').config();
const mysql = require('mysql2');
const { createError } = require('http-errors');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'rbac',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 60 * 60 * 1000,
    acquireTimeout: 60 * 1000,
    timeout: 60 * 1000,
    debug: process.env.NODE_ENV === 'development'
});

const db = {
    query: async (sql, params = []) => {
        try {
            return new Promise((resolve, reject) => {
                pool.query(sql, params, (err, results, fields) => {
                    if (err) {
                        console.error(`Database error: ${err.message}`);
                        console.error(`SQL: ${sql}`);
                        console.error(`Params:`, params);
                        
                        if (err.code === 'ER_DUP_ENTRY') {
                            reject(createError(400, 'Duplicate entry. This record already exists.'));
                        } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
                            reject(createError(400, 'Invalid reference. The referenced record does not exist.'));
                        } else if (err.code === 'ER_TRUNCATED_WRONG_VALUE') {
                            reject(createError(400, 'Invalid value. Please check your input.'));
                        } else {
                            reject(createError(500, 'Database error occurred'));
                        }
                    }
                    resolve([results, fields]);
                });
            });
        } catch (error) {
            console.error('Error in query execution:', error);
            throw error;
        }
    },
    beginTransaction: async () => {
        return new Promise((resolve, reject) => {
            pool.getConnection((err, connection) => {
                if (err) {
                    console.error('Error getting connection:', err);
                    reject(createError(500, 'Database connection error'));
                    return;
                }
                connection.beginTransaction((err) => {
                    if (err) {
                        console.error('Error beginning transaction:', err);
                        connection.release();
                        reject(createError(500, 'Transaction error'));
                        return;
                    }
                    resolve(connection);
                });
            });
        });
    },
    commit: async (connection) => {
        try {
            await new Promise((resolve, reject) => {
                connection.commit((err) => {
                    if (err) {
                        console.error('Error committing transaction:', err);
                        reject(createError(500, 'Transaction commit error'));
                        return;
                    }
                    connection.release();
                    resolve();
                });
            });
        } catch (error) {
            console.error('Error in commit:', error);
            throw error;
        }
    },
    rollback: async (connection) => {
        try {
            await new Promise((resolve, reject) => {
                connection.rollback((err) => {
                    if (err) {
                        console.error('Error rolling back transaction:', err);
                        reject(createError(500, 'Transaction rollback error'));
                        return;
                    }
                    connection.release();
                    resolve();
                });
            });
        } catch (error) {
            console.error('Error in rollback:', error);
            throw error;
        }
    }
};

const initializeDatabase = async () => {
    try {
        console.log('Checking database and tables...');
        
        const [results] = await db.query('SELECT 1');
        console.log('Connected to database successfully');

        const [tableResults] = await db.query(
            `SELECT TABLE_NAME 
             FROM information_schema.TABLES 
             WHERE TABLE_SCHEMA = DATABASE()`
        );

        const existingTables = tableResults.map(row => row.TABLE_NAME);
        console.log('Existing tables:', existingTables);
        
        const requiredTables = ['users', 'roles', 'permissions', 'role_permissions'];
        
        const missingTables = requiredTables.filter(table => !existingTables.includes(table));
        
        if (missingTables.length > 0) {
            console.log(`Missing tables: ${missingTables.join(', ')}`);
            throw new Error(`Database initialization failed: Missing required tables: ${missingTables.join(', ')}`);
        }
        
        try {
            await db.query('SELECT photo FROM users LIMIT 1');
            console.log('Photo column exists in users table');
        } catch (error) {
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                console.log('Adding photo column to users table...');
                await db.query('ALTER TABLE users ADD COLUMN photo VARCHAR(255) NULL AFTER password');
                console.log('Successfully added photo column to users table');
            } else {
                throw error;
            }
        }

        const [rolesResults] = await db.query(
            `SELECT name FROM roles WHERE name IN ('admin', 'user')`
        );
        
        console.log('Found roles:', rolesResults);

        if (!Array.isArray(rolesResults) || rolesResults.length !== 2) {
            console.log('Missing default roles');
            throw new Error('Database initialization failed: Missing default roles (admin, user)');
        }

        console.log('Database and tables verified successfully');
        return true;
    } catch (error) {
        console.error('Error checking database:', error);
        throw error;
    }
};

module.exports = { db, initializeDatabase };