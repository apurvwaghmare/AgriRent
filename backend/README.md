# Agriculture Equipment Rental System - Backend

This is the backend API for the Agriculture Equipment Rental System built with Node.js and Express.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Equipment Management**: CRUD operations for agricultural equipment
- **Rental Management**: Complete rental booking and management system
- **User Management**: User registration, profile management, and admin controls
- **File Upload**: Image upload for equipment with file validation
- **Database**: MySQL database with connection pooling
- **Rate Limiting**: Protection against abuse with configurable rate limits
- **Error Handling**: Comprehensive error handling and validation

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL with mysql2 driver
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **File Upload**: Multer
- **Environment Variables**: dotenv
- **CORS**: cors middleware

## API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - User login
- `GET /profile` - Get current user profile
- `POST /logout` - User logout

### Equipment Routes (`/api/equipment`)
- `GET /` - Get all equipment (with pagination and filters)
- `GET /:id` - Get single equipment by ID
- `POST /` - Create new equipment (admin only)
- `PUT /:id` - Update equipment (admin only)
- `DELETE /:id` - Delete equipment (admin only)

### Rental Routes (`/api/rentals`)
- `GET /` - Get all rentals (admin sees all, users see their own)
- `GET /:id` - Get single rental by ID
- `POST /` - Create new rental request
- `PUT /:id/status` - Update rental status (admin only)
- `PUT /:id/cancel` - Cancel rental

### User Routes (`/api/users`)
- `GET /` - Get all users (admin only)
- `GET /:id` - Get single user by ID
- `PUT /:id` - Update user profile
- `PUT /:id/password` - Change user password
- `PUT /:id/role` - Update user role (admin only)
- `DELETE /:id` - Delete user (admin only)

## Database Schema

The system uses the following main tables:
- `users` - User accounts and profiles
- `categories` - Equipment categories
- `equipment` - Agricultural equipment listings
- `rentals` - Rental bookings and history

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=agriculture
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up your MySQL database:
   - Create a database named 'agriculture'
   - Import the database schema from `../database/agriculture.sql`

3. Configure environment variables in `.env` file

4. Start the server:
```bash
# Development mode with nodemon
npm run dev

# Production mode
npm start
```

## Project Structure

```
backend/
├── config/
│   └── db.js              # Database connection configuration
├── controllers/           # Route controllers (optional, currently using route files)
├── middleware/
│   ├── auth.js           # Authentication middleware
│   ├── adminAuth.js      # Admin authorization middleware
│   └── rateLimiter.js    # Rate limiting middleware
├── models/
│   ├── User.js           # User model
│   ├── Equipment.js      # Equipment model
│   └── Rental.js         # Rental model
├── routes/
│   ├── auth.js           # Authentication routes
│   ├── equipment.js      # Equipment routes
│   ├── rental.js         # Rental routes
│   └── user.js           # User routes
├── uploads/
│   └── equipment/        # Equipment image uploads
├── .env                  # Environment variables
├── package.json          # Dependencies and scripts
└── server.js             # Main application entry point
```

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS protection
- Admin-only routes protection
- File upload validation

## Development

To run in development mode with automatic restart:
```bash
npm run dev
```

## API Testing

You can test the API endpoints using tools like:
- Postman
- Thunder Client (VS Code extension)
- curl commands
- Frontend application

## Health Check

The API includes a health check endpoint:
- `GET /api/health` - Returns server status and information