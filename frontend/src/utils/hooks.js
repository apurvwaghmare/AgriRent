import { useState, useEffect, useCallback } from 'react';

// Custom hook for API calls with loading and error states
export const useAPI = (apiFunction, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const executeAPI = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunction(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, dependencies);

  return { data, loading, error, execute: executeAPI, setData, setError };
};

// Custom hook for API calls that execute on mount
export const useAPIOnMount = (apiFunction, dependencies = []) => {
  const { data, loading, error, execute, setData, setError } = useAPI(apiFunction, dependencies);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, refetch: execute, setData, setError };
};

// Custom hook for form submissions with API calls
export const useAPIForm = (apiFunction, onSuccess, onError) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submitForm = useCallback(async (formData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunction(formData);
      if (onSuccess) {
        onSuccess(result);
      }
      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, onSuccess, onError]);

  return { loading, error, submit: submitForm, setError };
};

// Custom hook for managing authentication state
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth token on mount
    const token = localStorage.getItem('authToken');
    if (token) {
      // Verify token with backend
      import('../utils/apiHelpers').then(({ authAPI }) => {
        authAPI.getProfile()
          .then((userData) => {
            setUser(userData.user);
          })
          .catch(() => {
            // Token is invalid, remove it
            localStorage.removeItem('authToken');
          })
          .finally(() => {
            setLoading(false);
          });
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (credentials) => {
    const { authAPI } = await import('../utils/apiHelpers');
    const result = await authAPI.login(credentials);
    
    if (result.success && result.token) {
      localStorage.setItem('authToken', result.token);
      setUser(result.user);
    }
    
    return result;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    setUser(null);
  }, []);

  const updateUser = useCallback((userData) => {
    setUser(userData);
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser,
  };
};

// Custom hook for managing pagination
export const usePagination = (apiFunction, itemsPerPage = 10) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const fetchData = useCallback(async (page = currentPage, filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiFunction({
        page,
        limit: itemsPerPage,
        ...filters,
      });

      setData(result.data || result.items || []);
      setTotalPages(result.pagination?.totalPages || 0);
      setTotalItems(result.pagination?.total || 0);
      setCurrentPage(page);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiFunction, itemsPerPage, currentPage]);

  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      fetchData(page);
    }
  }, [fetchData, totalPages]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [goToPage, currentPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [goToPage, currentPage]);

  return {
    data,
    loading,
    error,
    currentPage,
    totalPages,
    totalItems,
    fetchData,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
};

export default {
  useAPI,
  useAPIOnMount,
  useAPIForm,
  useAuth,
  usePagination,
};