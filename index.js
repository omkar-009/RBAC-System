require('dotenv').config();

const express = require('express');
const session = require('express-session');
const { db, initializeDatabase } = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/views/public', express.static(__dirname + '/views/public'));

app.set('view engine', 'ejs');

const fs = require('fs').promises;
const path = require('path');

try {
    fs.mkdir(path.join(__dirname, 'public', 'uploads'), { recursive: true });
} catch (err) {
    console.error('Error creating uploads directory:', err);
}

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24
    }
}));

async function startServer() {
    try {
        console.log('Attempting to initialize database...');
        
        const [results] = await db.query('SELECT 1');
        console.log('Connected to database successfully');

        await initializeDatabase();
        console.log('Database initialized successfully');

        app.use('/users', userRoutes);
        app.use('/admin', adminRoutes);

        app.use((err, req, res, next) => {
            console.error('Error:', err);
            res.status(err.status || 500).json({
                message: err.message || 'Internal Server Error',
                error: process.env.NODE_ENV === 'development' ? err : {}
            });
        });

        const PORT = process.env.PORT || 3000;
        const server = app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

const shutdown = () => {
    console.log('Shutting down server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    shutdown();
});
        
    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
}

startServer();
