import api from './api';

// Authentication API calls
export const authAPI = {
  // Login user (role-specific)
  login: async (credentials) => {
    const { email, password, userType } = credentials;
    let endpoint;
    
    console.log('🔐 ApiHelpers.login called with:', { email, userType, passwordLength: password?.length });
    
    // Use role-specific endpoints as they exist in backend
    switch (userType) {
      case 'vendor':
        endpoint = '/auth/vendor/login';
        break;
      case 'customer':
        endpoint = '/auth/customer/login';
        break;
      case 'admin':
        endpoint = '/auth/admin/login';
        break;
      default:
        throw new Error('Invalid userType specified');
    }
    
    console.log('📡 Making API call to endpoint:', endpoint);
    console.log('📡 Request payload:', { email, password: '***hidden***' });
    
    try {
      const response = await api.post(endpoint, { email, password });
      console.log('📡 Raw API response:', response);
      console.log('📡 Response data:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API call failed:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      throw error;
    }
  },

  // Register user (role-specific)
  register: async (userData) => {
    const { userType, ...data } = userData;
    let endpoint;
    let payload;
    
    switch (userType) {
      case 'vendor':
        endpoint = '/auth/vendor/register';
        // Transform frontend fields to backend expected fields for vendor
        payload = {
          shop_name: data.name, // Use name as shop_name
          owner_name: data.name,
          email: data.email,
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          password: data.password
        };
        break;
        
      case 'customer':
        endpoint = '/auth/customer/register';
        // Transform frontend fields to backend expected fields for customer
        payload = {
          name: data.name,
          email: data.email,
          phone: data.phone || '',
          address: data.address || '',
          password: data.password
        };
        break;
        
      default:
        throw new Error('Invalid userType specified. Only vendor and customer registration is supported.');
    }
    
    const response = await api.post(endpoint, payload);
    return response.data;
  },

  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Update profile
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },
};

// Equipment API calls
export const equipmentAPI = {
  // Get all equipment with filters
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/equipment?${params}`);
    return response.data;
  },

  // Get equipment by ID
  getById: async (id) => {
    const response = await api.get(`/equipment/${id}`);
    return response.data;
  },

  // Search equipment
  search: async (searchParams) => {
    const params = new URLSearchParams(searchParams).toString();
    const response = await api.get(`/equipment/search?${params}`);
    return response.data;
  },
};

// Booking API calls
export const bookingAPI = {
  // Create new booking
  create: async (bookingData) => {
    const response = await api.post('/booking', bookingData);
    return response.data;
  },

  // Get customer bookings
  getCustomerBookings: async (email) => {
    const response = await api.get(`/booking/customer?email=${email}`);
    return response.data;
  },

  // Get vendor bookings (requires auth)
  getVendorBookings: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/booking/vendor?${params}`);
    return response.data;
  },

  // Update booking status (vendor only)
  updateStatus: async (bookingId, statusData) => {
    const response = await api.put(`/booking/${bookingId}/status`, statusData);
    return response.data;
  },

  // Get admin booking overview (admin only)
  getAdminOverview: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/booking/admin?${params}`);
    return response.data;
  },
};

// Vendor API calls
export const vendorAPI = {
  // Get vendor dashboard data
  getDashboard: async () => {
    const response = await api.get('/vendor/dashboard');
    return response.data;
  },

  // Get vendor equipment
  getEquipment: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/vendor/equipment?${params}`);
    return response.data;
  },

  // Create new equipment
  createEquipment: async (equipmentData) => {
    const response = await api.post('/vendor/equipment', equipmentData);
    return response.data;
  },

  // Update equipment
  updateEquipment: async (equipmentId, equipmentData) => {
    const response = await api.put(`/vendor/equipment/${equipmentId}`, equipmentData);
    return response.data;
  },

  // Delete equipment
  deleteEquipment: async (equipmentId) => {
    const response = await api.delete(`/vendor/equipment/${equipmentId}`);
    return response.data;
  },

  // Get vendor bookings
  getBookings: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/vendor/bookings?${params}`);
    return response.data;
  },

  // Update booking status
  updateBookingStatus: async (bookingId, statusData) => {
    const response = await api.put(`/vendor/bookings/${bookingId}/status`, statusData);
    return response.data;
  },

  // Get vendor feedback
  getFeedback: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/vendor/feedback?${params}`);
    return response.data;
  },

  // Get sales data
  getSales: async (period = 'month') => {
    const response = await api.get(`/vendor/sales?period=${period}`);
    return response.data;
  },

  // Get analytics data for charts
  getAnalytics: async (period = 'month') => {
    const response = await api.get(`/vendor/analytics?period=${period}`);
    return response.data;
  },
};

// Feedback API calls
export const feedbackAPI = {
  // Submit feedback for completed booking
  submit: async (feedbackData) => {
    const response = await api.post('/feedback', feedbackData);
    return response.data;
  },

  // Get vendor feedback
  getVendorFeedback: async (vendorId, filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/feedback/vendor/${vendorId}?${params}`);
    return response.data;
  },
};

// Generic API helper functions
export const apiHelpers = {
  // Handle file upload
  uploadFile: async (endpoint, file, additionalData = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add additional data to form
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    const response = await api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Download file
  downloadFile: async (endpoint, filename) => {
    const response = await api.get(endpoint, {
      responseType: 'blob',
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

// Customer API calls
export const customerAPI = {
  // Get customer dashboard data
  getDashboard: async () => {
    const response = await api.get('/customer/dashboard');
    return response.data;
  },

  // Browse equipment
  getEquipment: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/customer/equipment?${params}`);
    return response.data;
  },

  // Get equipment details
  getEquipmentDetails: async (id) => {
    const response = await api.get(`/customer/equipment/${id}`);
    return response.data;
  },

  // Create booking
  createBooking: async (bookingData) => {
    const response = await api.post('/customer/bookings', bookingData);
    return response.data;
  },

  // Get customer bookings
  getBookings: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/customer/bookings?${params}`);
    return response.data;
  },

  // Submit feedback
  submitFeedback: async (feedbackData) => {
    const response = await api.post('/customer/feedback', feedbackData);
    return response.data;
  },

  // Get feedback history
  getFeedback: async () => {
    const response = await api.get('/customer/feedback');
    return response.data;
  },

  // Download invoice
  downloadInvoice: async (bookingId) => {
    const response = await api.get(`/customer/bookings/${bookingId}/invoice`, {
      responseType: 'blob'
    });
    return response.data;
  },
};

// Admin API calls
export const adminAPI = {
  // Test admin API connectivity (no auth required)
  testAPI: async () => {
    try {
      console.log('🔧 Testing admin API connectivity...');
      const response = await api.get('/admin/test');
      console.log('✅ Admin API test successful:', response);
      return response.data;
    } catch (error) {
      console.error('❌ Admin API test failed:', error);
      console.error('❌ Error details:', error.response);
      throw error;
    }
  },

  // Get all users
  getAllUsers: async () => {
    try {
      console.log('🔍 Making API call to: GET /admin/users');
      const response = await api.get('/admin/users');
      console.log('✅ Users API response:', response);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get users:', error);
      console.error('❌ Error details:', error.response);
      throw error;
    }
  },

  // Get all vendors
  getAllVendors: async () => {
    try {
      console.log('🔍 Making API call to: GET /admin/vendors');
      const response = await api.get('/admin/vendors');
      console.log('✅ Vendors API response:', response);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get vendors:', error);
      console.error('❌ Error details:', error.response);
      throw error;
    }
  },

  // Get all bookings
  getAllBookings: async () => {
    try {
      console.log('🔍 Making API call to: GET /admin/bookings');
      const response = await api.get('/admin/bookings');
      console.log('✅ Bookings API response:', response);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get bookings:', error);
      console.error('❌ Error details:', error.response);
      throw error;
    }
  },

  // Approve vendor
  approveVendor: async (vendorId) => {
    try {
      console.log(`🔍 Making API call to: PUT /admin/vendors/${vendorId}/approve`);
      const response = await api.put(`/admin/vendors/${vendorId}/approve`);
      console.log('✅ Approve vendor API response:', response);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to approve vendor:', error);
      console.error('❌ Error details:', error.response);
      throw error;
    }
  },

  // Reject vendor
  rejectVendor: async (vendorId) => {
    try {
      console.log(`🔍 Making API call to: PUT /admin/vendors/${vendorId}/reject`);
      const response = await api.put(`/admin/vendors/${vendorId}/reject`);
      console.log('✅ Reject vendor API response:', response);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to reject vendor:', error);
      console.error('❌ Error details:', error.response);
      throw error;
    }
  },

  // Approve customer
  approveCustomer: async (customerId) => {
    try {
      console.log(`🔍 Making API call to: PUT /admin/customers/${customerId}/approve`);
      const response = await api.put(`/admin/customers/${customerId}/approve`);
      console.log('✅ Approve customer API response:', response);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to approve customer:', error);
      console.error('❌ Error details:', error.response);
      throw error;
    }
  },

  // Reject customer
  rejectCustomer: async (customerId) => {
    try {
      console.log(`🔍 Making API call to: PUT /admin/customers/${customerId}/reject`);
      const response = await api.put(`/admin/customers/${customerId}/reject`);
      console.log('✅ Reject customer API response:', response);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to reject customer:', error);
      console.error('❌ Error details:', error.response);
      throw error;
    }
  },

  // Delete user
  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw error;
    }
  },

  // Get system stats
  getSystemStats: async () => {
    try {
      const response = await api.get('/admin/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to get system stats:', error);
      throw error;
    }
  },

  // Get analytics dashboard
  getDashboardAnalytics: async () => {
    try {
      console.log('🔍 Making API call to: GET /admin/analytics');
      const response = await api.get('/admin/analytics');
      console.log('✅ Dashboard analytics response:', response);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get dashboard analytics:', error);
      console.error('❌ Error details:', error.response);
      throw error;
    }
  },

  // Get chart data
  getChartData: async () => {
    try {
      console.log('🔍 Making API call to: GET /admin/analytics');
      const response = await api.get('/admin/analytics');
      console.log('✅ Chart data response:', response);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get chart data:', error);
      console.error('❌ Error details:', error.response);
      throw error;
    }
  },

  // Get all feedback
  getAllFeedback: async () => {
    try {
      console.log('🔍 Making API call to: GET /admin/feedback');
      const response = await api.get('/admin/feedback');
      console.log('✅ Feedback response:', response);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get feedback:', error);
      console.error('❌ Error details:', error.response);
      throw error;
    }
  },

  // Delete feedback
  deleteFeedback: async (feedbackId) => {
    try {
      console.log(`🔍 Making API call to: DELETE /admin/feedback/${feedbackId}`);
      const response = await api.delete(`/admin/feedback/${feedbackId}`);
      console.log('✅ Delete feedback response:', response);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to delete feedback:', error);
      console.error('❌ Error details:', error.response);
      throw error;
    }
  },

  // Send message to user
  sendMessageToUser: async (userId, message) => {
    try {
      console.log(`🔍 Making API call to: POST /admin/users/${userId}/message`);
      const response = await api.post(`/admin/users/${userId}/message`, { message });
      console.log('✅ Send message response:', response);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      console.error('❌ Error details:', error.response);
      throw error;
    }
  },

  // Get user booking history
  getUserBookingHistory: async (userId) => {
    try {
      console.log(`🔍 Making API call to: GET /admin/users/${userId}/bookings`);
      const response = await api.get(`/admin/users/${userId}/bookings`);
      console.log('✅ User booking history response:', response);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get booking history:', error);
      console.error('❌ Error details:', error.response);
      throw error;
    }
  },

  // Suspend user account
  suspendUser: async (userId) => {
    try {
      console.log(`🔍 Making API call to: PUT /admin/users/${userId}/suspend`);
      const response = await api.put(`/admin/users/${userId}/suspend`);
      console.log('✅ Suspend user response:', response);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to suspend user:', error);
      console.error('❌ Error details:', error.response);
      throw error;
    }
  },

  // Vendor-specific functions
  // Get vendor details
  getVendorDetails: async (vendorId) => {
    try {
      console.log(`🔍 Making API call to: GET /admin/vendors/${vendorId}`);
      const response = await api.get(`/admin/vendors/${vendorId}`);
      console.log('✅ Vendor details response:', response);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get vendor details:', error);
      console.error('❌ Error details:', error.response);
      throw error;
    }
  },

  // Get vendor equipment
  getVendorEquipment: async (vendorId) => {
    try {
      console.log(`🔍 Making API call to: GET /admin/vendors/${vendorId}/equipment`);
      const response = await api.get(`/admin/vendors/${vendorId}/equipment`);
      console.log('✅ Vendor equipment response:', response);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get vendor equipment:', error);
      console.error('❌ Error details:', error.response);
      throw error;
    }
  },

  // Get vendor bookings
  getVendorBookings: async (vendorId) => {
    try {
      console.log(`🔍 Making API call to: GET /admin/vendors/${vendorId}/bookings`);
      const response = await api.get(`/admin/vendors/${vendorId}/bookings`);
      console.log('✅ Vendor bookings response:', response);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get vendor bookings:', error);
      console.error('❌ Error details:', error.response);
      throw error;
    }
  },

  // Send message to vendor
  sendMessageToVendor: async (vendorId, message) => {
    try {
      console.log(`🔍 Making API call to: POST /admin/vendors/${vendorId}/message`);
      const response = await api.post(`/admin/vendors/${vendorId}/message`, { message });
      console.log('✅ Send message to vendor response:', response);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to send message to vendor:', error);
      console.error('❌ Error details:', error.response);
      throw error;
    }
  },
};

export default api;