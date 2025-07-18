const { db } = require('../config/db');

const authenticate = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/users/login');
    }
    next();
};

const authorizeAdmin = async (req, res, next) => {
    try {
        if (!req.session.user) {
            return res.redirect('/users/login');
        }

        if (req.session.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const authorizeRole = async (req, res, next) => {
    try {
        if (!req.session.user) {
            return res.redirect('/users/login');
        }

        const [results] = await db.query(
            `SELECT p.name 
             FROM permissions p 
             JOIN role_permissions rp ON p.id = rp.permission_id 
             WHERE rp.role_id = ?`,
            [req.session.user.roleId]
        );

        req.session.user.permissions = results.map(row => row.name);

        const requiredPermission = req.route.path.split('/')[1];
        if (!req.session.user.permissions.includes(requiredPermission)) {
            return res.status(403).json({ message: 'Permission denied' });
        }

        next();
    } catch (error) {
        console.error('Error in role authorization:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports.authenticate = authenticate;
module.exports.authorizeAdmin = authorizeAdmin;
module.exports.authorizeRole = authorizeRole;
