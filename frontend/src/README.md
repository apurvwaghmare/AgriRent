# Agriculture Equipment Rental System - Frontend

A modern React application for renting agricultural equipment with comprehensive authentication and role-based access control.

## Features

### 🔐 Authentication System
- **User Registration**: Customer, vendor, and admin registration
- **Login/Logout**: Secure JWT-based authentication
- **Role-Based Access Control**: Different interfaces for admin, vendor, and customer roles
- **Protected Routes**: Automatic route protection based on user roles
- **Persistent Sessions**: JWT tokens stored in localStorage

### 🎯 User Roles
- **Admin**: System management, user approvals, vendor verification
- **Vendor**: Equipment listing, booking management, feedback monitoring
- **Customer**: Equipment browsing, booking, feedback submission

### 🔧 Technical Features
- React Context API for state management
- Axios interceptors for automatic token handling
- Custom hooks for API integration
- Responsive design with modern CSS
- Error handling and loading states

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Backend API running on port 5000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
# Create .env file in the frontend root
REACT_APP_API_URL=http://localhost:5000
```

3. Start the development server:
```bash
npm start
```

The application will open at `http://localhost:3000`

## Project Structure

```
src/
├── components/
│   └── AuthComponents.js     # Login, Register, Profile components
├── contexts/
│   └── AuthContext.js        # Authentication context and state management
├── utils/
│   ├── api.js               # Axios configuration with interceptors
│   ├── apiHelpers.js        # Organized API functions
│   └── hooks.js             # Custom React hooks
├── App.js                   # Main application with routing
├── App.css                  # Application styles
└── index.js                 # React app entry point
```

## Authentication System

### AuthContext
The `AuthContext` provides global authentication state management:

```javascript
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { 
    user, 
    isAuthenticated, 
    isAdmin, 
    isVendor, 
    isCustomer,
    login, 
    logout, 
    register 
  } = useAuth();
  
  // Component logic
}
```

### API Configuration
The axios instance is automatically configured with:
- Base URL from environment variables
- Request interceptors for JWT token injection
- Response interceptors for token refresh and error handling

```javascript
import { apiHelpers } from './utils/apiHelpers';

// Example API usage
const equipment = await apiHelpers.equipment.getAll();
const booking = await apiHelpers.booking.create(bookingData);
```

### Protected Routes
Routes are automatically protected based on user roles:

```javascript
import { ProtectedRoute } from './contexts/AuthContext';

// Accessible to all authenticated users
<ProtectedRoute>
  <UserProfile />
</ProtectedRoute>

// Accessible only to admins
<ProtectedRoute allowedRoles={['admin']}>
  <AdminPanel />
</ProtectedRoute>

// Accessible to vendors and admins
<ProtectedRoute allowedRoles={['vendor', 'admin']}>
  <VendorDashboard />
</ProtectedRoute>
```

## API Integration

### Available API Functions

#### Authentication
- `apiHelpers.auth.login(credentials)`
- `apiHelpers.auth.register(userData)`
- `apiHelpers.auth.refreshToken()`
- `apiHelpers.auth.getProfile()`

#### Equipment Management
- `apiHelpers.equipment.getAll(filters)`
- `apiHelpers.equipment.getById(id)`
- `apiHelpers.equipment.create(equipmentData, images)`
- `apiHelpers.equipment.update(id, equipmentData)`

#### Booking System
- `apiHelpers.booking.create(bookingData)`
- `apiHelpers.booking.getUserBookings()`
- `apiHelpers.booking.getVendorBookings()`
- `apiHelpers.booking.updateStatus(id, status)`

#### Feedback System
- `apiHelpers.feedback.create(feedbackData)`
- `apiHelpers.feedback.getVendorFeedback(vendorId, filters)`

### Custom Hooks

#### useAuth
Authentication state and functions:
```javascript
const { user, isAuthenticated, login, logout } = useAuth();
```

#### useApi
API calls with loading and error states:
```javascript
const { data, loading, error, execute } = useApi(apiHelpers.equipment.getAll);
```

#### usePagination
Pagination state management:
```javascript
const { currentPage, totalPages, goToPage, nextPage, prevPage } = usePagination(totalItems, itemsPerPage);
```

## User Interface

### Navigation
- Dynamic navigation based on authentication status
- Role-based menu items
- Authentication status indicator

### Forms
- Login form with email/password
- Registration form with role selection
- Profile management with update capabilities
- Comprehensive validation and error handling

### Dashboards
- **Admin Panel**: User management, system settings
- **Vendor Dashboard**: Equipment and booking management
- **Customer Dashboard**: Equipment browsing and booking history

## Environment Variables

Create a `.env` file in the frontend root:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000

# Optional: Enable debug mode
REACT_APP_DEBUG=true
```

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

### Code Style
The project uses ESLint and Prettier for code formatting. Run:
```bash
npm run lint
npm run format
```

## Integration with Backend

This frontend is designed to work with the Agriculture Equipment Rental System backend. Ensure the backend is running and accessible at the configured API URL.

### Required Backend Endpoints
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/profile`
- `GET /api/equipment`
- `POST /api/booking`
- `POST /api/feedback`
- And more...

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend CORS is configured for your frontend URL
2. **Authentication Failures**: Check if backend is running and JWT secret is configured
3. **API Connection**: Verify `REACT_APP_API_URL` environment variable

### Debug Mode
Enable debug logging by setting `REACT_APP_DEBUG=true` in your `.env` file.

## Contributing

1. Follow the existing code structure
2. Add proper TypeScript types if migrating to TypeScript
3. Write tests for new components
4. Update documentation for new features

## License

This project is part of the Agriculture Equipment Rental System.