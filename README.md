# RBAC - Role-Based Access Control System

A comprehensive Role-Based Access Control (RBAC) system built with Node.js, Express.js, and MySQL. This system provides secure user authentication, authorization, and role management with a clean web interface.

## 🚀 Features

- **User Authentication**: Secure login/logout with session management
- **Role-Based Authorization**: Admin and User roles with different permission levels
- **User Management**: Create, read, update, and delete users (Admin only)
- **Profile Management**: Users can view and update their profiles
- **File Upload**: Profile photo upload functionality
- **Permission System**: Granular permission control for different operations
- **Responsive UI**: Clean and modern web interface using EJS templates
- **Security**: Password hashing with bcrypt, session security, and input validation

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Template Engine**: EJS
- **Authentication**: bcryptjs, express-session
- **Validation**: Joi
- **File Upload**: Multer
- **Email**: Nodemailer
- **Environment**: dotenv

## 📁 Project Structure

```
RBAC/
├── config/
│   ├── db.js              # Database configuration and initialization
│   └── schema.sql         # Database schema and initial data
├── controllers/
│   ├── adminController.js # Admin-specific operations
│   └── userController.js  # User operations and authentication
├── middlewares/
│   ├── auth.js           # Authentication and authorization middleware
│   ├── errorHandler.js   # Global error handling
│   └── validation.js     # Input validation middleware
├── routes/
│   ├── adminRoutes.js    # Admin routes
│   └── userRoutes.js     # User routes
├── views/
│   ├── admin/            # Admin-specific views
│   ├── public/           # Static assets
│   ├── *.ejs            # EJS templates
├── public/
│   └── uploads/          # User uploaded files
├── index.js              # Main application entry point
├── package.json          # Dependencies and scripts
└── .env                  # Environment variables (not tracked)
```

## 🗄️ Database Schema

The system uses four main tables:

- **users**: Store user information (id, name, email, password, photo, role_id)
- **roles**: Define available roles (admin, user)
- **permissions**: Define system permissions (user:read, user:create, etc.)
- **role_permissions**: Map roles to their permissions

### Roles:
- **Admin**: Full system access
- **User**: Limited access (can only view user profiles)

### Permissions:
- `user:read` - View user profiles
- `user:create` - Create new users
- `user:update` - Update user profiles
- `user:delete` - Delete users
- `role:read` - View roles
- `role:create` - Create new roles
- `role:update` - Update roles
- `role:delete` - Delete roles

## 🌐 API Endpoints

### User Routes (`/users`)
- `GET /login` - Login page
- `POST /login` - Authenticate user
- `GET /register` - Registration page
- `POST /register` - Create new user account
- `GET /dashboard` - User dashboard
- `GET /profile` - User profile page
- `POST /profile` - Update user profile
- `POST /logout` - Logout user

### Admin Routes (`/admin`)
- `GET /dashboard` - Admin dashboard
- `GET /users` - List all users
- `GET /users/create` - Create user form
- `POST /users/create` - Create new user
- `GET /users/:id/edit` - Edit user form
- `POST /users/:id/edit` - Update user
- `POST /users/:id/delete` - Delete user

## 🔒 Security Features

- **Password Hashing**: All passwords are hashed using bcrypt
- **Session Management**: Secure session handling with HTTP-only cookies
- **Input Validation**: Server-side validation using Joi
- **SQL Injection Protection**: Parameterized queries
- **File Upload Security**: Restricted file types and sizes
- **Role-Based Access**: Middleware-based authorization
- **Error Handling**: Comprehensive error handling and logging

**Built with ❤️ using Node.js and Express.js**
