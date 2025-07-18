const { db } = require('../config/db');
const bcrypt = require('bcryptjs');
const { createValidationError, createError } = require('../middlewares/errorHandler');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Only .jpg, .jpeg and .png format allowed!'));
    }
    cb(null, true);
  }
});

const checkAdminAccess = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

exports.getDashboard = async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== 'admin') {
      return res.redirect('/login?error=Admin access required');
    }

    const [users] = await db.query(`
      SELECT u.*, r.name as role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      ORDER BY u.created_at DESC
    `);

    const [roles] = await db.query('SELECT * FROM roles');

    const currentUserId = req.session.user?.id;

    res.render('admin/dashboard', { 
      title: 'Admin Dashboard',
      users, 
      roles, 
      currentUser: { id: currentUserId },
      user: req.session.user,
      success: req.query.success,
      error: req.query.error
    });

  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || 'Server error',
      error: process.env.NODE_ENV === 'development' ? error : null
    });
  }
};

exports.getCreateUser = async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== 'admin') {
      throw createError(403, 'Admin access required');
    }

    const [roles] = await db.query('SELECT * FROM roles');
    res.render('create-user', { roles });
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || 'Server error',
      error: process.env.NODE_ENV === 'development' ? error : null
    });
  }
};

exports.postCreateUser = async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== 'admin') {
      throw createError(403, 'Admin access required');
    }

    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const [results] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (results.length > 0) {
      throw createValidationError('Email already registered');
    }

    const [roleResults] = await db.query('SELECT id FROM roles WHERE name = ?', [role]);
    if (roleResults.length === 0) {
      throw createValidationError('Invalid role');
    }
    const roleId = roleResults[0].id;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await db.query(
      `INSERT INTO users (name, email, password, role_id) VALUES (?, ?, ?, ?)`,
      [name, email, hashedPassword, roleId]
    );

    res.redirect('/admin/dashboard?success=User created successfully');
  } catch (error) {
    if (error.status === 400) {
      res.render('create-user', {
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

exports.getEditUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const [user] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (user.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.render('edit-user', { 
      user: user[0],
      currentUser: req.session.user,
      error: req.query.error,
      success: req.query.success
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.postEditUser = async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== 'admin') {
      return res.redirect('/login?error=Admin access required');
    }

    const { id } = req.params;
    const { name, email, role } = req.body;
    const fs = require('fs');
    const path = require('path');

    if (!name || !email || !role) {
      return res.redirect(`/admin/edit-user/${id}?error=All fields are required`);
    }

    try {
      const [emailCheck] = await db.query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, id]
      );
      if (emailCheck.length > 0) {
        return res.redirect(`/admin/edit-user/${id}?error=Email already registered`);
      }
    } catch (error) {
      return res.redirect(`/admin/edit-user/${id}?error=Error checking email`);
    }

    let photoPath = null;
    if (req.file) {
      try {
        photoPath = req.file.filename;

        const [userResult] = await db.query('SELECT photo FROM users WHERE id = ?', [id]);
        const oldPhoto = userResult[0]?.photo;

        if (oldPhoto) {
          const oldPhotoPath = path.join(__dirname, '../public/uploads/', oldPhoto);
          if (fs.existsSync(oldPhotoPath)) {
            fs.unlink(oldPhotoPath, (err) => {
              if (err) {
                console.error('Failed to delete old photo:', err);
              }
            });
          }
        }
      } catch (error) {
        return res.redirect(`/admin/edit-user/${id}?error=Error uploading photo`);
      }
    }

    try {
      if (photoPath) {
        await db.query(
          'UPDATE users SET name = ?, email = ?, role_id = ?, photo = ? WHERE id = ?',
          [name, email, role, photoPath, id]
        );
      } else {
        await db.query(
          'UPDATE users SET name = ?, email = ?, role_id = ? WHERE id = ?',
          [name, email, role, id]
        );
      }

      return res.redirect('/admin/users?success=User updated successfully');
    } catch (error) {
      return res.redirect(`/admin/edit-user/${id}?error=Error updating user`);
    }
  } catch (error) {
    return res.redirect(`/admin/edit-user/${req.params.id}?error=An unexpected error occurred`);
  }
};

exports.getDeleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    if (parseInt(userId) === req.session.user.id) {
      return res.redirect('/admin/dashboard?error=Cannot delete your own account');
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      const [user] = await connection.query('SELECT photo FROM users WHERE id = ?', [userId]);

      if (user.length === 0) {
        await connection.rollback();
        return res.redirect('/admin/dashboard?error=User not found');
      }

      await connection.query('DELETE FROM users WHERE id = ?', [userId]);

      await connection.commit();
      res.redirect('/admin/dashboard?success=User deleted successfully');
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    res.redirect(`/admin/dashboard?error=${encodeURIComponent(error.message || 'Error deleting user')}`);
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    if (parseInt(userId) === req.session.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      const [user] = await connection.query('SELECT photo FROM users WHERE id = ?', [userId]);

      if (user.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await connection.query('DELETE FROM users WHERE id = ?', [userId]);

      await connection.commit();

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    const [user] = await db.query('SELECT is_active FROM users WHERE id = ?', [userId]);

    if (user.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const newStatus = !user[0].is_active;
    await db.query('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, userId]);

    res.json({ 
      success: true, 
      message: `User ${newStatus ? 'activated' : 'deactivated'} successfully`,
      isActive: newStatus
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const userId = req.params.id;
    const [user] = await db.query(
      'SELECT id, name, email, role_id, is_active FROM users WHERE id = ?', 
      [userId]
    );

    if (user.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const [roles] = await db.query('SELECT * FROM roles');

    res.json({ 
      success: true, 
      user: user[0],
      roles: roles
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
