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

## ⚙️ Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

### 1. Clone the Repository

```bash
git clone <repository-url>
cd RBAC
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

1. Create a MySQL database named `rbac`
2. Import the schema:
```bash
mysql -u your_username -p rbac < config/schema.sql
```

### 4. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=rbac

# Session Configuration
SESSION_SECRET=your_super_secret_session_key

# Server Configuration
PORT=3000
NODE_ENV=development

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### 5. Start the Application

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The application will be available at `http://localhost:3000`

## 🔐 Default Accounts

The system comes with pre-configured roles and permissions:

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

## 🎨 UI Features

- Responsive design that works on desktop and mobile
- Clean and modern interface
- User-friendly forms with validation feedback
- Dashboard with role-specific content
- Profile management with photo upload
- Admin panel for user management

## 🚀 Usage

1. **First Time Setup**: Register as a new user or use admin credentials
2. **User Registration**: New users are assigned the 'user' role by default
3. **Admin Access**: Admin users can manage all users and their roles
4. **Profile Management**: Users can update their profiles and upload photos
5. **Role-Based Features**: Different features are available based on user roles

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🐛 Troubleshooting

### Common Issues:

1. **Database Connection Error**: Check your MySQL credentials in `.env`
2. **Session Issues**: Ensure `SESSION_SECRET` is set in `.env`
3. **File Upload Issues**: Check if `public/uploads` directory exists
4. **Permission Denied**: Verify user roles and permissions in database

### Debug Mode:

Set `NODE_ENV=development` in your `.env` file for detailed error messages.

## 📞 Support

For support and questions, please open an issue in the GitHub repository.

---

**Built with ❤️ using Node.js and Express.js**
