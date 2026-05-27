# Frontend API Configuration

This document explains how to use the axios configuration and API helpers in the Agriculture Equipment Rental System frontend.

## 📁 File Structure

```
src/
├── utils/
│   ├── api.js           # Axios instance configuration
│   ├── apiHelpers.js    # API function helpers
│   └── hooks.js         # Custom React hooks for API calls
├── components/
│   └── APIExamples.js   # Usage examples
└── .env                 # Environment variables
```

## 🔧 Configuration

### Environment Variables (.env)

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_NAME=Agriculture Equipment Rental System
REACT_APP_MAX_FILE_SIZE=5242880
REACT_APP_ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp
```

### Axios Instance (utils/api.js)

The axios instance is pre-configured with:
- ✅ Base URL from environment variables
- ✅ JSON headers
- ✅ 10-second timeout
- ✅ Authorization token injection
- ✅ Error handling interceptors
- ✅ Automatic token management

## 🚀 Usage Examples

### 1. Basic API Call

```javascript
import api from '../utils/api';

// Simple GET request
const response = await api.get('/equipment');
console.log(response.data);

// POST request with data
const newBooking = await api.post('/booking', {
  equipment_id: 1,
  customer_name: 'John Doe',
  // ... other fields
});
```

### 2. Using API Helper Functions

```javascript
import { equipmentAPI, bookingAPI } from '../utils/apiHelpers';

// Get all equipment with filters
const equipment = await equipmentAPI.getAll({
  category: 'tractors',
  location: 'Mumbai'
});

// Create a booking
const booking = await bookingAPI.create({
  equipment_id: 1,
  customer_name: 'John Doe',
  customer_email: 'john@example.com',
  // ... other fields
});
```

### 3. Using Custom Hooks

```javascript
import { useAPI, useAPIOnMount, useAuth } from '../utils/hooks';
import { equipmentAPI } from '../utils/apiHelpers';

function EquipmentList() {
  // API call with manual trigger
  const { data, loading, error, execute } = useAPI(equipmentAPI.getAll);
  
  // API call that runs on component mount
  const { data: vendors, loading: vendorsLoading } = useAPIOnMount(
    () => vendorAPI.getAll()
  );
  
  // Authentication hook
  const { user, isAuthenticated, login, logout } = useAuth();
  
  // Trigger API call
  const handleSearch = () => {
    execute({ category: 'tractors' });
  };
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {data?.equipment?.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

### 4. Form Submission with API

```javascript
import { useAPIForm } from '../utils/hooks';
import { bookingAPI } from '../utils/apiHelpers';

function BookingForm() {
  const { loading, error, submit } = useAPIForm(
    bookingAPI.create,
    (result) => {
      alert('Booking created successfully!');
      // Handle success
    },
    (error) => {
      console.error('Booking failed:', error);
    }
  );
  
  const handleSubmit = (formData) => {
    submit(formData);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Booking'}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
}
```

### 5. File Upload

```javascript
import { apiHelpers } from '../utils/apiHelpers';

function FileUpload() {
  const handleFileUpload = async (file) => {
    try {
      const result = await apiHelpers.uploadFile('/vendor/equipment', file, {
        name: 'New Equipment',
        category: 'tractors'
      });
      console.log('Upload successful:', result);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };
  
  return (
    <input 
      type="file" 
      onChange={(e) => handleFileUpload(e.target.files[0])} 
    />
  );
}
```

## 🔐 Authentication

The axios instance automatically handles authentication:

1. **Token Storage**: Tokens are stored in localStorage
2. **Auto-Injection**: Tokens are automatically added to request headers
3. **Error Handling**: Invalid tokens trigger automatic logout
4. **Interceptors**: Request/response interceptors handle auth flow

```javascript
// Login (token automatically stored)
const result = await authAPI.login({ email, password });

// Subsequent requests automatically include token
const equipment = await equipmentAPI.getAll(); // Token included automatically

// Logout (token automatically removed)
logout();
```

## 📋 Available API Functions

### Authentication (authAPI)
- `login(credentials)` - User login
- `register(userData)` - User registration
- `getProfile()` - Get current user
- `updateProfile(data)` - Update user profile

### Equipment (equipmentAPI)
- `getAll(filters)` - Get equipment with filters
- `getById(id)` - Get single equipment
- `search(params)` - Search equipment

### Booking (bookingAPI)
- `create(data)` - Create new booking
- `getCustomerBookings(email)` - Get customer bookings
- `getVendorBookings(filters)` - Get vendor bookings
- `updateStatus(id, status)` - Update booking status
- `getAdminOverview(filters)` - Admin overview

### Vendor (vendorAPI)
- `getDashboard()` - Vendor dashboard data
- `getEquipment(filters)` - Vendor's equipment
- `createEquipment(data)` - Add new equipment
- `updateEquipment(id, data)` - Update equipment
- `deleteEquipment(id)` - Delete equipment

### Feedback (feedbackAPI)
- `submit(data)` - Submit feedback
- `getVendorFeedback(vendorId)` - Get vendor feedback

## 🔄 Error Handling

The configuration includes comprehensive error handling:

```javascript
// Automatic error handling for common status codes
// 401: Automatic logout and redirect
// 403: Access denied logging
// 404: Resource not found logging
// 500: Server error logging

// Custom error handling in components
const { data, error, loading } = useAPI(someAPIFunction);

if (error) {
  return <div className="error">Error: {error}</div>;
}
```

## 🎯 Best Practices

1. **Use Environment Variables**: Always use `REACT_APP_API_URL` for the base URL
2. **Use API Helpers**: Prefer `apiHelpers` over direct axios calls
3. **Use Custom Hooks**: Use `useAPI` hooks for consistent loading/error states
4. **Handle Loading States**: Always show loading indicators
5. **Handle Errors**: Display user-friendly error messages
6. **Token Management**: Let the interceptors handle tokens automatically

## 🧪 Testing API Calls

```javascript
// Test if API is reachable
const testConnection = async () => {
  try {
    const response = await api.get('/health');
    console.log('API connected:', response.data);
  } catch (error) {
    console.error('API connection failed:', error);
  }
};
```

This configuration provides a robust, scalable foundation for all API interactions in your React application!