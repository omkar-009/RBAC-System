 const { db } = require('../config/db');
const bcrypt = require('bcryptjs');
const { createValidationError, createError } = require('../middlewares/errorHandler');

exports.getRegister = (req, res) => {
    try {
        res.render('register', { 
            title: 'Register',
            user: req.session.user,
            error: req.query.error,
            success: req.query.success
        });
    } catch (error) {
        console.error('Error rendering register page:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.postRegister = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const [results] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (results.length > 0) {
            throw createValidationError('Email already registered');
        }

        const [roleResults] = await db.query('SELECT id FROM roles WHERE name = ?', ['user']);
        if (roleResults.length === 0) {
            throw createError(500, 'Default role not found');
        }
        const defaultRoleId = roleResults[0].id;

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await db.query(
            `INSERT INTO users (name, email, password, role_id) VALUES (?, ?, ?, ?)`,
            [name, email, hashedPassword, defaultRoleId]
        );

        res.redirect('/users/login?success=Registration successful. Please login.');
    } catch (error) {
        console.error('Error in registration:', error);
        if (error.status === 400) {
            res.render('register', {
                title: 'Register',
                user: req.session.user,
                error: error.message
            });
        } else {
            res.status(error.status || 500).json({
                message: error.message || 'Server error',
                error: process.env.NODE_ENV === 'development' ? error : null
            });
        }
    }
};

exports.getLogin = (req, res) => {
    try {
        res.render('login', { 
            title: 'Login',
            user: req.session.user,
            error: req.query.error,
            success: req.query.success
        });
    } catch (error) {
        console.error('Error rendering login page:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.postLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const [results] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (results.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = results[0];
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const [roleResults] = await db.query('SELECT name FROM roles WHERE id = ?', [user.role_id]);
        if (roleResults.length === 0) {
            throw createError(500, 'User role not found');
        }
        const roleName = roleResults[0].name;

        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: roleName,
            roleId: user.role_id
        };

        res.redirect('/users/dashboard?success=Login successful');
    } catch (error) {
        console.error('Error in login:', error);
        if (error.status === 401) {
            res.render('login', {
                title: 'Login',
                user: req.session.user,
                error: error.message
            });
        } else {
            res.status(error.status || 500).json({
                message: error.message || 'Server error',
                error: process.env.NODE_ENV === 'development' ? error : null
            });
        }
    }
};

exports.getLogout = (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
                res.status(500).json({ message: 'Error logging out' });
            } else {
                res.redirect('/');
            }
        });
    } catch (error) {
        console.error('Error handling logout:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getDashboard = async (req, res) => {
    try {
        const [userData] = await db.query(
            'SELECT id, name, email, photo, role_id, (SELECT name FROM roles WHERE id = users.role_id) as role FROM users WHERE id = ?', 
            [req.session.user.id]
        );
        
        if (userData.length > 0) {
            req.session.user = {
                ...req.session.user,
                name: userData[0].name,
                email: userData[0].email,
                photo: userData[0].photo,
                role: userData[0].role,
                role_id: userData[0].role_id
            };
        }
        
        res.render('dashboard', { 
            title: 'Dashboard', 
            user: req.session.user 
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.render('dashboard', { 
            title: 'Dashboard',
            user: req.session.user,
            error: 'Error loading dashboard data'
        });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const [userResults] = await db.query('SELECT * FROM users WHERE id = ?', [req.session.user.id]);
        if (userResults.length === 0) {
            throw createError(404, 'User not found');
        }
        const user = userResults[0];

        res.render('profile', { user });
    } catch (error) {
        console.error('Error getting profile:', error);
        res.status(error.status || 500).json({
            message: error.message || 'Server error',
            error: process.env.NODE_ENV === 'development' ? error : null
        });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, email } = req.body;
        const userId = req.session.user.id;
        const fs = require('fs');
        const path = require('path');

        if (!name || !email) {
            return res.redirect('/users/profile?error=Name and email are required');
        }

        try {
            const [emailCheck] = await db.query(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [email, userId]
            );
            if (emailCheck.length > 0) {
                return res.redirect('/users/profile?error=Email already registered');
            }
        } catch (error) {
            console.error('Error checking email:', error);
            return res.redirect('/users/profile?error=Error checking email');
        }

        let photoPath = null;
        if (req.file) {
            try {
                photoPath = req.file.filename;
                
                const [userResult] = await db.query('SELECT photo FROM users WHERE id = ?', [userId]);
                const oldPhoto = userResult[0]?.photo;
                
                if (oldPhoto) {
                    const oldPhotoPath = path.join(__dirname, '../public/uploads/', oldPhoto);
                    if (fs.existsSync(oldPhotoPath)) {
                        fs.unlink(oldPhotoPath, (err) => {
                            if (err) console.error('Error deleting old photo:', err);
                        });
                    }
                }
            } catch (error) {
                console.error('Error handling photo upload:', error);
                return res.redirect('/users/profile?error=Error uploading photo');
            }
        }

        try {
            if (photoPath) {
                await db.query(
                    'UPDATE users SET name = ?, email = ?, photo = ? WHERE id = ?',
                    [name, email, photoPath, userId]
                );
                req.session.user.photo = photoPath;
            } else {
                await db.query(
                    'UPDATE users SET name = ?, email = ? WHERE id = ?',
                    [name, email, userId]
                );
            }

            req.session.user.name = name;
            req.session.user.email = email;

            return res.redirect('/users/profile?success=Profile updated successfully');
        } catch (error) {
            console.error('Error updating user in database:', error);
            return res.redirect('/users/profile?error=Error updating profile');
        }
    } catch (error) {
        console.error('Unexpected error in updateProfile:', error);
        return res.redirect('/users/profile?error=An unexpected error occurred');
    }
};
