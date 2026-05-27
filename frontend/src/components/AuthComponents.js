import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Login Form Component
export const LoginForm = ({ onSuccess, defaultRole = 'customer' }) => {
  const { login, loading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: defaultRole, // Use the defaultRole prop
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🔐 Attempting login with:', { 
      email: formData.email, 
      role: formData.role,
      password: formData.password ? '***hidden***' : 'NO PASSWORD'
    });
    
    const result = await login(formData);
    
    console.log('🔐 Login result:', result);
    
    if (result.success) {
      console.log('✅ Login successful:', result.user);
      if (onSuccess) {
        onSuccess(result.user);
      }
    } else {
      console.error('❌ Login failed:', result.error);
      // Show the error to user
      alert(`Login failed: ${result.error}`);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Login as {defaultRole.charAt(0).toUpperCase() + defaultRole.slice(1)}</h2>
        
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Enter your email"
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Enter your password"
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="submit-button"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Register Form Component
export const RegisterForm = ({ onSuccess }) => {
  const { register, loading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'customer',
    phone: '',
    // Vendor specific fields
    company_name: '',
    address: '',
    city: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    // Prepare registration data
    const registrationData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      phone: formData.phone,
    };

    // Add vendor-specific fields if role is vendor
    if (formData.role === 'vendor') {
      // For vendors, the backend expects shop_name, owner_name, city, address
      registrationData.shop_name = formData.company_name || formData.name;
      registrationData.owner_name = formData.name;
      registrationData.address = formData.address;
      registrationData.city = formData.city;
    } else if (formData.role === 'customer') {
      // For customers, add address (required by backend)
      registrationData.address = formData.address || 'Not provided';
    }

    const result = await register(registrationData);
    
    if (result.success) {
      console.log('Registration successful:', result.user);
      if (onSuccess) {
        onSuccess(result.user, result.message);
      }
    } else {
      console.error('Registration failed:', result.error);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form register-form">
        <h2>Register</h2>
        
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="register-form-grid">
            <div className="form-group">
              <label htmlFor="name">Name:</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone:</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">Account Type:</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="customer">Customer</option>
                <option value="vendor">Vendor</option>
              </select>
            </div>

            {/* Vendor specific fields */}
            {formData.role === 'vendor' && (
              <>
                <div className="form-group full-width">
                  <label htmlFor="company_name">Company/Shop Name:</label>
                  <input
                    type="text"
                    id="company_name"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    placeholder="Enter your business name"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="address">Business Address:</label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    placeholder="Enter your business address"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="city">City:</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    placeholder="Enter your city"
                  />
                </div>
              </>
            )}

            {/* Customer specific fields */}
            {formData.role === 'customer' && (
              <div className="form-group full-width">
                <label htmlFor="address">Address:</label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Enter your address"
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password:</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
                minLength={6}
                autoComplete="new-password"
              />
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="submit-button"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>

        {formData.role === 'vendor' && (
          <div className="form-info">
            <small>
              <strong>Note:</strong> Vendor accounts require admin approval before you can start listing equipment for rent.
            </small>
          </div>
        )}
      </form>
      </div>
    </div>
  );
};

// User Profile Component
export const UserProfile = () => {
  const { 
    user, 
    updateProfile, 
    isAdmin, 
    isVendor, 
    isCustomer, 
    isVendorApproved 
  } = useAuth();
  
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    const result = await updateProfile(formData);
    
    if (result.success) {
      setEditing(false);
      alert('Profile updated successfully!');
    } else {
      alert('Failed to update profile: ' + result.error);
    }
  };

  if (!user) {
    return <div>No user data available</div>;
  }

  return (
    <div className="user-profile">
      <div className="profile-header">
        <h2>User Profile</h2>
        <div className="user-role">
          {isAdmin() && <span className="role-badge admin">Admin</span>}
          {isVendor() && (
            <span className={`role-badge vendor ${isVendorApproved() ? 'approved' : 'pending'}`}>
              Vendor {isVendorApproved() ? '(Approved)' : '(Pending Approval)'}
            </span>
          )}
          {isCustomer() && <span className="role-badge customer">Customer</span>}
        </div>
      </div>

      <div className="profile-content">
        {editing ? (
          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label>Name:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="disabled-field"
              />
              <small>Email cannot be changed</small>
            </div>
            
            <div className="form-group">
              <label>Phone:</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label>Address:</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-actions">
              <button type="submit" className="save-button">Save Changes</button>
              <button 
                type="button" 
                onClick={() => setEditing(false)}
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-view">
            <div className="profile-field">
              <label>Name:</label>
              <span>{user.name}</span>
            </div>
            
            <div className="profile-field">
              <label>Email:</label>
              <span>{user.email}</span>
            </div>
            
            <div className="profile-field">
              <label>Phone:</label>
              <span>{user.phone || 'Not provided'}</span>
            </div>
            
            <div className="profile-field">
              <label>Role:</label>
              <span>{user.role || user.userType}</span>
            </div>
            
            {isVendor() && (
              <>
                <div className="profile-field">
                  <label>Company:</label>
                  <span>{user.shopName || user.company_name || 'Not provided'}</span>
                </div>
                
                <div className="profile-field">
                  <label>Status:</label>
                  <span className={`status ${user.status}`}>{user.status}</span>
                </div>
              </>
            )}
            
            <div className="profile-field">
              <label>Member Since:</label>
              <span>{new Date(user.createdAt || user.created_at).toLocaleDateString()}</span>
            </div>
            
            <div className="profile-actions">
              <button 
                onClick={() => setEditing(true)}
                className="edit-button"
              >
                Edit Profile
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Auth Status Component (shows current auth state)
export const AuthStatus = () => {
  const { 
    user, 
    isAuthenticated, 
    loading, 
    isAdmin, 
    isVendor, 
    isCustomer,
    logout 
  } = useAuth();

  if (loading) {
    return <div className="auth-status">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return <div className="auth-status">Not logged in</div>;
  }

  return (
    <div className="auth-status">
      <div className="user-info">
        <span className="user-name">{user?.name || 'User'}</span>
        <span className="user-email">({user?.email || ''})</span>
        {isAdmin() && <span className="role-indicator admin">Admin</span>}
        {isVendor() && <span className="role-indicator vendor">Vendor</span>}
        {isCustomer() && <span className="role-indicator customer">Customer</span>}
      </div>
      <button onClick={logout} className="logout-btn">
        Logout
      </button>
    </div>
  );
};

const authComponents = {
  LoginForm,
  RegisterForm,
  UserProfile,
  AuthStatus,
};

export default authComponents;