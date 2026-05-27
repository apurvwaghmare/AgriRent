import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../utils/apiHelpers';

// Initial auth state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false, // Start with false - only set to true when actually checking token
  error: null,
};

// Auth action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  LOGOUT: 'LOGOUT',
  LOAD_USER_START: 'LOAD_USER_START',
  LOAD_USER_SUCCESS: 'LOAD_USER_SUCCESS',
  LOAD_USER_FAILURE: 'LOAD_USER_FAILURE',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
    case AUTH_ACTIONS.LOAD_USER_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null,
      };

    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: action.payload.user ? true : false, // Only authenticate if user exists
        loading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOAD_USER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        loading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
    case AUTH_ACTIONS.LOAD_USER_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload.error,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload.user },
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

// Create AuthContext
const AuthContext = createContext();

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user from localStorage on app startup
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    
    if (token) {
      console.log('Token found, verifying with backend...');
      loadUser();
    } else {
      console.log('No token found - user not authenticated');
      // No need to dispatch anything, initial state is already correct
    }
  }, []);

  // Load user from token in localStorage (only called when token exists)
  const loadUser = async () => {
    dispatch({ type: AUTH_ACTIONS.LOAD_USER_START });

    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        // This shouldn't happen since we check before calling loadUser
        console.log('No token found during loadUser');
        dispatch({ 
          type: AUTH_ACTIONS.LOAD_USER_FAILURE, 
          payload: { error: 'No token found' } 
        });
        return;
      }

      console.log('Verifying existing token with backend...');
      
      // Verify token and get user data
      const response = await authAPI.getProfile();
      
      if (response.success) {
        console.log('Token valid - user authenticated');
        console.log('📊 Profile response:', response);
        
        // The user data might be in response.user or response.data
        const userData = response.user || response.data;
        
        // Fix: Convert userType to role for consistency with frontend
        if (userData.userType && !userData.role) {
          userData.role = userData.userType;
        }
        
        console.log('👤 User data from profile:', userData);
        
        dispatch({
          type: AUTH_ACTIONS.LOAD_USER_SUCCESS,
          payload: { user: userData },
        });
      } else {
        // Token is invalid
        console.log('Token invalid - removing from storage');
        localStorage.removeItem('authToken');
        dispatch({
          type: AUTH_ACTIONS.LOAD_USER_FAILURE,
          payload: { error: 'Invalid token' },
        });
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('authToken');
      dispatch({
        type: AUTH_ACTIONS.LOAD_USER_FAILURE,
        payload: { error: error.response?.data?.message || 'Failed to verify token' },
      });
    }
  };

  // Login function
  const login = async (credentials) => {
    console.log('🔐 AuthContext login called with:', { 
      email: credentials.email, 
      role: credentials.role 
    });
    
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      console.log('📡 Making API call to login...');
      
      // Map 'role' to 'userType' for the API call
      const apiCredentials = {
        email: credentials.email,
        password: credentials.password,
        userType: credentials.role // Convert role to userType for API
      };
      
      const response = await authAPI.login(apiCredentials);
      console.log('📡 API response:', response);

      if (response.success && response.data && response.data.token) {
        console.log('✅ Login successful, storing token and user data');
        console.log('📊 Full response.data:', response.data);
        
        // Extract user data and token from response.data
        const { token, user, ...otherData } = response.data;
        
        // The user data might be in response.data.user or directly in response.data
        const userData = user || { ...otherData };
        
        // Fix: Convert userType to role for consistency with frontend
        if (userData.userType && !userData.role) {
          userData.role = userData.userType;
        }
        
        console.log('👤 User data to store:', userData);
        
        // Store token in localStorage
        localStorage.setItem('authToken', token);
        
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: userData,
            token: token,
          },
        });

        return { success: true, user: userData };
      } else {
        const error = response.message || 'Login failed';
        console.error('❌ Login failed - API returned error:', error);
        
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: { error },
        });
        return { success: false, error };
      }
    } catch (error) {
      console.error('❌ Login error - Exception caught:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: errorMessage },
      });

      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });

    try {
      // Map 'role' to 'userType' for the API call
      const apiUserData = {
        ...userData,
        userType: userData.role // Convert role to userType for API
      };
      delete apiUserData.role; // Remove the role field
      
      const response = await authAPI.register(apiUserData);

      if (response.success) {
        // If registration includes automatic login
        if (response.token) {
          localStorage.setItem('authToken', response.token);
          
          dispatch({
            type: AUTH_ACTIONS.REGISTER_SUCCESS,
            payload: {
              user: response.user,
              token: response.token,
            },
          });
        } else {
          // Registration successful but requires separate login
          dispatch({
            type: AUTH_ACTIONS.REGISTER_SUCCESS,
            payload: {
              user: null,
              token: null,
            },
          });
        }

        return { success: true, user: response.user, message: response.message };
      } else {
        const error = response.message || 'Registration failed';
        dispatch({
          type: AUTH_ACTIONS.REGISTER_FAILURE,
          payload: { error },
        });
        return { success: false, error };
      }
    } catch (error) {
      console.error('Register error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: { error: errorMessage },
      });

      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = () => {
    // Remove token from localStorage
    localStorage.removeItem('authToken');
    
    // Clear auth state
    dispatch({ type: AUTH_ACTIONS.LOGOUT });

    // Optional: Call logout API endpoint
    // This could be used to invalidate the token on the server
    // authAPI.logout().catch(console.error);
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      
      if (response.success) {
        dispatch({
          type: AUTH_ACTIONS.UPDATE_USER,
          payload: { user: response.user },
        });
        return { success: true, user: response.user };
      } else {
        return { success: false, error: response.message };
      }
    } catch (error) {
      console.error('Update profile error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Profile update failed';
      return { success: false, error: errorMessage };
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return state.user && (state.user.role === role || state.user.userType === role);
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return state.user && roles.some(role => 
      state.user.role === role || state.user.userType === role
    );
  };

  // Check if user is admin
  const isAdmin = () => hasRole('admin');

  // Check if user is vendor
  const isVendor = () => hasRole('vendor');

  // Check if user is customer
  const isCustomer = () => hasRole('customer');

  // Check if vendor is approved (for vendors only)
  const isVendorApproved = () => {
    return isVendor() && state.user?.status === 'approved';
  };

  // Auth context value
  const value = {
    // State
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,

    // Actions
    login,
    register,
    logout,
    updateProfile,
    loadUser,
    clearError,

    // Helper functions
    hasRole,
    hasAnyRole,
    isAdmin,
    isVendor,
    isCustomer,
    isVendorApproved,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Higher-order component for protected routes
export const withAuth = (Component, allowedRoles = []) => {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) {
      return (
        <div className="auth-loading">
          <div className="spinner">Loading...</div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="auth-required">
          <h3>Authentication Required</h3>
          <p>Please log in to access this page.</p>
        </div>
      );
    }

    if (allowedRoles.length > 0) {
      const userRole = user?.role || user?.userType;
      if (!allowedRoles.includes(userRole)) {
        return (
          <div className="access-denied">
            <h3>Access Denied</h3>
            <p>You don't have permission to access this page.</p>
          </div>
        );
      }
    }

    return <Component {...props} />;
  };
};

// Component for protecting routes
export const ProtectedRoute = ({ 
  children, 
  allowedRoles = [], 
  fallback = null,
  requireAuth = true 
}) => {
  const { isAuthenticated, loading, hasAnyRole } = useAuth();

  if (loading) {
    return fallback || (
      <div className="auth-loading">
        <div className="spinner">Loading...</div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return fallback || (
      <div className="auth-required">
        <h3>Authentication Required</h3>
        <p>Please log in to access this page.</p>
      </div>
    );
  }

  if (allowedRoles.length > 0 && !hasAnyRole(allowedRoles)) {
    return fallback || (
      <div className="access-denied">
        <h3>Access Denied</h3>
        <p>You don't have permission to access this page.</p>
      </div>
    );
  }

  return children;
};

export default AuthContext;