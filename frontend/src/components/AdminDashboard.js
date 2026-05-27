import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../utils/apiHelpers';
import Chart from 'chart.js/auto';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [currentAdminView, setCurrentAdminView] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminAPI.getDashboardAnalytics();
      setAnalyticsData(response.data);
    } catch (err) {
      const errorMsg = 'Failed to load dashboard data: ' + (err.response?.data?.message || err.message);
      setError(errorMsg);
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dashboardResponse, chartResponse] = await Promise.all([
        adminAPI.getDashboardAnalytics(),
        adminAPI.getChartData()
      ]);
      setAnalyticsData(dashboardResponse.data);
      setChartData(chartResponse.data);
      
      // Render charts after data is loaded
      setTimeout(() => {
        renderCharts(chartResponse.data);
      }, 100);
    } catch (err) {
      const errorMsg = 'Failed to load analytics: ' + (err.response?.data?.message || err.message);
      setError(errorMsg);
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data based on current view
  useEffect(() => {
    if (currentAdminView === 'users') {
      loadUsers();
    } else if (currentAdminView === 'vendors') {
      loadVendors();
    } else if (currentAdminView === 'bookings') {
      loadBookings();
    } else if (currentAdminView === 'feedback') {
      loadFeedback();
    } else if (currentAdminView === 'analytics') {
      loadAnalytics();
    } else if (currentAdminView === 'dashboard') {
      loadDashboardData();
    }
  }, [currentAdminView, loadAnalytics, loadDashboardData]);

  const loadFeedback = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminAPI.getAllFeedback();
      setFeedback(response.data || []);
    } catch (err) {
      const errorMsg = 'Failed to load feedback: ' + (err.response?.data?.message || err.message);
      setError(errorMsg);
      console.error('Feedback error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminAPI.getAllUsers();
      setUsers(response.data || []);
    } catch (err) {
      const errorMsg = 'Failed to load users: ' + (err.response?.data?.message || err.message);
      setError(errorMsg);
      console.error('Backend error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadVendors = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminAPI.getAllVendors();
      setVendors(response.data || []);
    } catch (err) {
      const errorMsg = 'Failed to load vendors: ' + (err.response?.data?.message || err.message);
      setError(errorMsg);
      console.error('Backend error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminAPI.getAllBookings();
      setBookings(response.data || []);
    } catch (err) {
      const errorMsg = 'Failed to load bookings: ' + (err.response?.data?.message || err.message);
      setError(errorMsg);
      console.error('Backend error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVendorApproval = async (vendorId, action) => {
    setLoading(true);
    setError('');
    try {
      if (action === 'approve') {
        await adminAPI.approveVendor(vendorId);
      } else {
        await adminAPI.rejectVendor(vendorId);
      }
      // Reload vendors list
      loadVendors();
      alert(`Vendor ${action}d successfully!`);
    } catch (err) {
      const errorMsg = `Failed to ${action} vendor: ` + (err.response?.data?.message || err.message);
      setError(errorMsg);
      console.error(`${action} vendor error:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerApproval = async (customerId, action) => {
    setLoading(true);
    setError('');
    try {
      if (action === 'approve') {
        await adminAPI.approveCustomer(customerId);
      } else {
        await adminAPI.rejectCustomer(customerId);
      }
      // Reload users list
      loadUsers();
      alert(`Customer ${action}d successfully!`);
    } catch (err) {
      const errorMsg = `Failed to ${action} customer: ` + (err.response?.data?.message || err.message);
      setError(errorMsg);
      console.error(`${action} customer error:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFeedback = async (feedbackId) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) {
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await adminAPI.deleteFeedback(feedbackId);
      loadFeedback();
      alert('Feedback deleted successfully!');
    } catch (err) {
      const errorMsg = 'Failed to delete feedback: ' + (err.response?.data?.message || err.message);
      setError(errorMsg);
      console.error('Delete feedback error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderCharts = (data) => {
    // Clear existing charts
    const charts = ['bookingsChart', 'revenueChart', 'equipmentChart'];
    charts.forEach(chartId => {
      const canvas = document.getElementById(chartId);
      if (canvas) {
        const existingChart = Chart.getChart(canvas);
        if (existingChart) {
          existingChart.destroy();
        }
      }
    });

    // Monthly Bookings Chart
    const bookingsCtx = document.getElementById('bookingsChart');
    if (bookingsCtx && data.monthlyBookings) {
      new Chart(bookingsCtx, {
        type: 'line',
        data: {
          labels: data.monthlyBookings.map(item => item.month),
          datasets: [{
            label: 'Monthly Bookings',
            data: data.monthlyBookings.map(item => item.count),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }

    // Monthly Revenue Chart
    const revenueCtx = document.getElementById('revenueChart');
    if (revenueCtx && data.monthlyRevenue) {
      new Chart(revenueCtx, {
        type: 'bar',
        data: {
          labels: data.monthlyRevenue.map(item => item.month),
          datasets: [{
            label: 'Monthly Revenue ($)',
            data: data.monthlyRevenue.map(item => item.revenue),
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }

    // Equipment Types Chart
    const equipmentCtx = document.getElementById('equipmentChart');
    if (equipmentCtx && data.equipmentTypes) {
      new Chart(equipmentCtx, {
        type: 'pie',
        data: {
          labels: data.equipmentTypes.map(item => item.type),
          datasets: [{
            data: data.equipmentTypes.map(item => item.count),
            backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(255, 205, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(153, 102, 255, 0.2)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 205, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true
        }
      });
    }
  };

  const showUserDetails = (userData) => {
    setSelectedUser(userData);
    setCurrentAdminView('user-details');
  };

  const showVendorDetails = (vendorData) => {
    setSelectedVendor(vendorData);
    setCurrentAdminView('vendor-details');
  };

  const renderDashboard = () => (
    <div className="admin-dashboard">
      <h2>Admin Panel</h2>
      <p>Welcome, {user?.name || 'Admin'}!</p>
      
      <div className="admin-dashboard-buttons">
        <button className="admin-nav-btn" onClick={() => setCurrentAdminView('users')}>
          👥 Manage Users
        </button>
        <button className="admin-nav-btn" onClick={() => setCurrentAdminView('vendors')}>
          🏪 Vendor Approvals
        </button>
        <button className="admin-nav-btn" onClick={() => setCurrentAdminView('bookings')}>
          📅 View All Bookings
        </button>
        <button className="admin-nav-btn" onClick={() => setCurrentAdminView('feedback')}>
          💬 Manage Feedback
        </button>
        <button className="admin-nav-btn" onClick={() => setCurrentAdminView('analytics')}>
          📊 Analytics & Charts
        </button>
        <button className="admin-nav-btn" onClick={() => setCurrentAdminView('settings')}>
          ⚙️ System Settings
        </button>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="admin-users">
      <div className="admin-header">
        <h2>Customer Approvals</h2>
        <button className="back-to-dashboard-btn" onClick={() => setCurrentAdminView('dashboard')}>Back to Dashboard</button>
      </div>
      
      {loading && <p>Loading customers...</p>}
      {error && <p className="error">{error}</p>}
      
      {!loading && users.length === 0 && <p>No customers found.</p>}
      
      {users.length > 0 && (
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.phone}</td>
                  <td>{user.address || 'N/A'}</td>
                  <td>
                    <span className={`status ${user.status}`}>
                      {user.status || 'approved'}
                    </span>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    {user.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleCustomerApproval(user.id, 'approve')}
                          className="approve-btn"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleCustomerApproval(user.id, 'reject')}
                          className="reject-btn"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {user.status !== 'pending' && (
                      <button 
                        onClick={() => showUserDetails(user)}
                        className="view-details-btn"
                      >
                        View Details
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderVendors = () => (
    <div className="admin-vendors">
      <div className="admin-header">
        <h2>Vendor Approvals</h2>
        <button className="back-to-dashboard-btn" onClick={() => setCurrentAdminView('dashboard')}>Back to Dashboard</button>
      </div>
      
      {loading && <p>Loading vendors...</p>}
      {error && <p className="error">{error}</p>}
      
      {!loading && vendors.length === 0 && <p>No vendors found.</p>}
      
      {vendors.length > 0 && (
        <div className="vendors-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Shop Name</th>
                <th>Owner</th>
                <th>Email</th>
                <th>Phone</th>
                <th>City</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map(vendor => (
                <tr key={vendor.id}>
                  <td>{vendor.id}</td>
                  <td>{vendor.shop_name}</td>
                  <td>{vendor.owner_name}</td>
                  <td>{vendor.email}</td>
                  <td>{vendor.phone}</td>
                  <td>{vendor.city}</td>
                  <td>
                    <span className={`status ${vendor.status}`}>
                      {vendor.status}
                    </span>
                  </td>
                  <td>
                    {vendor.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleVendorApproval(vendor.id, 'approve')}
                          className="approve-btn"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleVendorApproval(vendor.id, 'reject')}
                          className="reject-btn"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {vendor.status !== 'pending' && (
                      <button 
                        onClick={() => showVendorDetails(vendor)}
                        className="view-details-btn"
                      >
                        View Details
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderBookings = () => (
    <div className="admin-bookings">
      <div className="admin-header">
        <h2>All System Bookings</h2>
        <div className="admin-header-info">
          <span>Total Bookings: {bookings.length}</span>
          <button className="back-to-dashboard-btn" onClick={() => setCurrentAdminView('dashboard')}>Back to Dashboard</button>
        </div>
      </div>
      
      {loading && <p>Loading bookings...</p>}
      {error && <p className="error">{error}</p>}
      
      {!loading && bookings.length === 0 && <p>No bookings found.</p>}
      
      {bookings.length > 0 && (
        <div className="bookings-table">
          <table>
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Customer Details</th>
                <th>Equipment Details</th>
                <th>Vendor Details</th>
                <th>Rental Period</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Booking Info</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(booking => (
                <tr key={booking.id}>
                  <td>
                    <strong>#{booking.id}</strong>
                    <br />
                    <small>{new Date(booking.created_at).toLocaleDateString()}</small>
                  </td>
                  <td>
                    <div>
                      <strong>{booking.customer_name}</strong>
                      <br />
                      <small>{booking.customer_email}</small>
                      {booking.customer_phone && (
                        <>
                          <br />
                          <small>📞 {booking.customer_phone}</small>
                        </>
                      )}
                    </div>
                  </td>
                  <td>
                    <div>
                      <strong>{booking.equipment_name}</strong>
                      <br />
                      <small>{booking.equipment_type}</small>
                    </div>
                  </td>
                  <td>
                    <div>
                      <strong>{booking.vendor_name}</strong>
                      <br />
                      <small>{booking.vendor_owner}</small>
                      {booking.vendor_phone && (
                        <>
                          <br />
                          <small>📞 {booking.vendor_phone}</small>
                        </>
                      )}
                    </div>
                  </td>
                  <td>
                    <div>
                      <strong>{new Date(booking.start_date).toLocaleDateString()}</strong>
                      <br />
                      to
                      <br />
                      <strong>{new Date(booking.end_date).toLocaleDateString()}</strong>
                      <br />
                      <small>{booking.rental_type || 'daily'} rental</small>
                    </div>
                  </td>
                  <td>
                    <span className={`status ${booking.status}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td>
                    <strong>₹{booking.total_cost}</strong>
                  </td>
                  <td>
                    <div style={{fontSize: '12px'}}>
                      {booking.delivery_address && (
                        <>
                          <strong>Delivery:</strong>
                          <br />
                          {booking.delivery_address}
                          <br />
                        </>
                      )}
                      {booking.notes && (
                        <>
                          <strong>Notes:</strong>
                          <br />
                          {booking.notes}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="admin-settings">
      <div className="admin-header">
        <h2>System Settings</h2>
        <button onClick={() => setCurrentAdminView('dashboard')}>Back to Dashboard</button>
      </div>
      
      <div className="settings-content">
        <h3>System Configuration</h3>
        <p>System settings functionality will be implemented here.</p>
        
        <div className="setting-item">
          <label>Platform Commission (%)</label>
          <input type="number" placeholder="5" disabled />
          <small>Coming soon</small>
        </div>
        
        <div className="setting-item">
          <label>Minimum Booking Duration (days)</label>
          <input type="number" placeholder="1" disabled />
          <small>Coming soon</small>
        </div>
        
        <div className="setting-item">
          <label>Maximum Booking Duration (days)</label>
          <input type="number" placeholder="30" disabled />
          <small>Coming soon</small>
        </div>
        
        <button disabled>Save Settings (Coming Soon)</button>
      </div>
    </div>
  );

  const renderUserDetails = () => (
    <div className="admin-user-details">
      <div className="admin-header">
        <h2>User Details</h2>
        <button onClick={() => setCurrentAdminView('users')}>Back to Users</button>
      </div>
      
      {selectedUser && (
        <div className="details-card">
          <h3>{selectedUser.name}</h3>
          <div className="details-grid">
            <div className="detail-item">
              <strong>ID:</strong> {selectedUser.id}
            </div>
            <div className="detail-item">
              <strong>Email:</strong> {selectedUser.email}
            </div>
            <div className="detail-item">
              <strong>Phone:</strong> {selectedUser.phone}
            </div>
            <div className="detail-item">
              <strong>Address:</strong> {selectedUser.address || 'Not provided'}
            </div>
            <div className="detail-item">
              <strong>Registration Date:</strong> {new Date(selectedUser.created_at).toLocaleDateString()}
            </div>
          </div>
          
          <div className="user-actions">
            <button 
              className="approve-btn"
              onClick={async () => {
                const message = window.prompt('Enter message to send to customer:');
                if (message) {
                  try {
                    await adminAPI.sendMessageToUser(selectedUser.id, message);
                    alert('Message sent successfully!');
                  } catch (err) {
                    alert('Failed to send message: ' + (err.response?.data?.message || err.message));
                  }
                }
              }}
            >
              Send Message
            </button>
            <button 
              className="view-details-btn"
              onClick={async () => {
                try {
                  const response = await adminAPI.getUserBookingHistory(selectedUser.id);
                  alert(`Booking History: ${response.data.length} bookings found. ${response.message}`);
                } catch (err) {
                  alert('Failed to load booking history: ' + (err.response?.data?.message || err.message));
                }
              }}
            >
              View Booking History
            </button>
            <button 
              className="reject-btn"
              onClick={async () => {
                if (window.confirm(`Are you sure you want to suspend ${selectedUser.name}'s account?`)) {
                  try {
                    await adminAPI.suspendUser(selectedUser.id);
                    alert('Account suspended successfully!');
                    loadUsers(); // Refresh the users list
                    setCurrentAdminView('users'); // Go back to users list
                  } catch (err) {
                    alert('Failed to suspend account: ' + (err.response?.data?.message || err.message));
                  }
                }
              }}
            >
              Suspend Account
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderVendorDetails = () => (
    <div className="admin-vendor-details">
      <div className="admin-header">
        <h2>Vendor Details</h2>
        <button onClick={() => setCurrentAdminView('vendors')}>Back to Vendors</button>
      </div>
      
      {selectedVendor && (
        <div className="details-card">
          <h3>{selectedVendor.shop_name}</h3>
          <div className="details-grid">
            <div className="detail-item">
              <strong>ID:</strong> {selectedVendor.id}
            </div>
            <div className="detail-item">
              <strong>Owner:</strong> {selectedVendor.owner_name}
            </div>
            <div className="detail-item">
              <strong>Email:</strong> {selectedVendor.email}
            </div>
            <div className="detail-item">
              <strong>Phone:</strong> {selectedVendor.phone}
            </div>
            <div className="detail-item">
              <strong>City:</strong> {selectedVendor.city}
            </div>
            <div className="detail-item">
              <strong>Status:</strong> 
              <span className={`status ${selectedVendor.status}`}>
                {selectedVendor.status}
              </span>
            </div>
          </div>
          
          <div className="vendor-actions">
            {selectedVendor.status === 'pending' && (
              <>
                <button 
                  onClick={() => handleVendorApproval(selectedVendor.id, 'approve')}
                  className="approve-btn"
                >
                  Approve Vendor
                </button>
                <button 
                  onClick={() => handleVendorApproval(selectedVendor.id, 'reject')}
                  className="reject-btn"
                >
                  Reject Vendor
                </button>
              </>
            )}
            <button 
              className="view-details-btn"
              onClick={async () => {
                try {
                  const response = await adminAPI.getVendorEquipment(selectedVendor.id);
                  alert(`Equipment: ${response.data.length} items found. ${response.message}`);
                } catch (err) {
                  alert('Failed to load equipment: ' + (err.response?.data?.message || err.message));
                }
              }}
            >
              View Equipment
            </button>
            <button 
              className="view-details-btn"
              onClick={async () => {
                try {
                  const response = await adminAPI.getVendorBookings(selectedVendor.id);
                  alert(`Bookings: ${response.data.length} bookings found. ${response.message}`);
                } catch (err) {
                  alert('Failed to load bookings: ' + (err.response?.data?.message || err.message));
                }
              }}
            >
              View Bookings
            </button>
            <button 
              className="approve-btn"
              onClick={async () => {
                const message = window.prompt('Enter message to send to vendor:');
                if (message) {
                  try {
                    await adminAPI.sendMessageToVendor(selectedVendor.id, message);
                    alert('Message sent to vendor successfully!');
                  } catch (err) {
                    alert('Failed to send message: ' + (err.response?.data?.message || err.message));
                  }
                }
              }}
            >
              Send Message
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderFeedback = () => (
    <div className="admin-feedback">
      <div className="admin-header">
        <h2>All System Feedback</h2>
        <div className="admin-header-info">
          <span>Total Feedback: {feedback.length}</span>
          <span>Average Rating: {feedback.length > 0 ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1) : 'N/A'}</span>
          <button className="back-to-dashboard-btn" onClick={() => setCurrentAdminView('dashboard')}>Back to Dashboard</button>
        </div>
      </div>
      
      {loading && <p>Loading feedback...</p>}
      {error && <p className="error">{error}</p>}
      
      {!loading && feedback.length === 0 && <p>No feedback found.</p>}
      
      {feedback.length > 0 && (
        <div className="feedback-list">
          {feedback.map(item => (
            <div key={item.id} className="feedback-item">
              <div className="feedback-header">
                <div className="feedback-main-info">
                  <h4>🚜 {item.equipment_name}</h4>
                  <div className="rating">
                    {'★'.repeat(item.rating)}{'☆'.repeat(5-item.rating)} ({item.rating}/5)
                  </div>
                </div>
                <div className="feedback-meta">
                  <span className="feedback-date">📅 {new Date(item.created_at).toLocaleDateString()}</span>
                  <span className="feedback-id">ID: #{item.id}</span>
                </div>
              </div>
              
              <div className="feedback-details">
                <div className="feedback-row">
                  <div className="feedback-section">
                    <h5>👤 Customer Details</h5>
                    <p><strong>Name:</strong> {item.customer_name}</p>
                    <p><strong>Email:</strong> {item.customer_email}</p>
                  </div>
                  
                  <div className="feedback-section">
                    <h5>🏪 Vendor Details</h5>
                    <p><strong>Shop:</strong> {item.vendor_name}</p>
                    <p><strong>Owner:</strong> {item.vendor_owner}</p>
                  </div>
                  
                  <div className="feedback-section">
                    <h5>📊 Rental Details</h5>
                    <p><strong>Equipment:</strong> {item.equipment_type}</p>
                    <p><strong>Period:</strong> {new Date(item.start_date).toLocaleDateString()} - {new Date(item.end_date).toLocaleDateString()}</p>
                  </div>
                </div>
                
                {item.comment && (
                  <div className="feedback-comment">
                    <h5>💬 Customer Comment</h5>
                    <blockquote>"{item.comment}"</blockquote>
                  </div>
                )}
              </div>
              
              <div className="feedback-actions">
                <button 
                  onClick={() => handleDeleteFeedback(item.id)}
                  className="delete-btn"
                  title="Delete this feedback"
                >
                  🗑️ Delete Feedback
                </button>
                <button 
                  className="view-btn"
                  onClick={() => alert(`Feedback Details:\n\nCustomer: ${item.customer_name}\nVendor: ${item.vendor_name}\nEquipment: ${item.equipment_name}\nRating: ${item.rating}/5\nDate: ${new Date(item.created_at).toLocaleDateString()}\n\nComment: ${item.comment || 'No comment provided'}`)}
                >
                  👁️ View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div className="admin-analytics">
      <div className="admin-header">
        <h2>Analytics & Charts</h2>
        <button className="back-to-dashboard-btn" onClick={() => setCurrentAdminView('dashboard')}>Back to Dashboard</button>
      </div>
      
      {loading && <p>Loading analytics...</p>}
      {error && <p className="error">{error}</p>}
      
      {analyticsData && (
        <div className="analytics-overview">
          {/* System Overview Section */}
          <div className="dashboard-analytics">
            <h3>System Overview</h3>
            <div className="analytics-cards">
              <div className="analytics-card">
                <h4>Total Vendors</h4>
                <p className="analytics-number">{analyticsData.totals.vendors}</p>
                <small>Pending: {analyticsData.status.pendingVendors}</small>
              </div>
              <div className="analytics-card">
                <h4>Total Customers</h4>
                <p className="analytics-number">{analyticsData.totals.customers}</p>
              </div>
              <div className="analytics-card">
                <h4>Total Equipment</h4>
                <p className="analytics-number">{analyticsData.totals.equipment}</p>
              </div>
              <div className="analytics-card">
                <h4>Total Bookings</h4>
                <p className="analytics-number">{analyticsData.totals.bookings}</p>
                <small>Pending: {analyticsData.status.pendingBookings}</small>
              </div>
              <div className="analytics-card">
                <h4>Total Revenue</h4>
                <p className="analytics-number">${analyticsData.totals.revenue || 0}</p>
                <small>Completed: {analyticsData.status.completedBookings}</small>
              </div>
            </div>
          </div>

          {/* Detailed Analytics */}
          <div className="analytics-cards">
            <div className="analytics-card">
              <h4>System Totals</h4>
              <ul>
                <li>Vendors: {analyticsData.totals.vendors}</li>
                <li>Customers: {analyticsData.totals.customers}</li>
                <li>Equipment: {analyticsData.totals.equipment}</li>
                <li>Bookings: {analyticsData.totals.bookings}</li>
                <li>Revenue: ${analyticsData.totals.revenue || 0}</li>
              </ul>
            </div>
            <div className="analytics-card">
              <h4>Status Breakdown</h4>
              <ul>
                <li>Pending Vendors: {analyticsData.status.pendingVendors}</li>
                <li>Approved Vendors: {analyticsData.status.approvedVendors}</li>
                <li>Pending Bookings: {analyticsData.status.pendingBookings}</li>
                <li>Completed Bookings: {analyticsData.status.completedBookings}</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {chartData && (
        <div className="charts-container">
          <div className="chart-section">
            <h3>Monthly Bookings Trend</h3>
            <canvas id="bookingsChart" width="400" height="200"></canvas>
          </div>
          
          <div className="chart-section">
            <h3>Monthly Revenue</h3>
            <canvas id="revenueChart" width="400" height="200"></canvas>
          </div>
          
          <div className="chart-section">
            <h3>Equipment Type Distribution</h3>
            <canvas id="equipmentChart" width="400" height="200"></canvas>
          </div>
          
          {chartData.topVendors && chartData.topVendors.length > 0 && (
            <div className="top-vendors">
              <h3>Top Performing Vendors</h3>
              <table>
                <thead>
                  <tr>
                    <th>Vendor</th>
                    <th>Bookings</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.topVendors.map((vendor, index) => (
                    <tr key={index}>
                      <td>{vendor.shop_name}</td>
                      <td>{vendor.booking_count}</td>
                      <td>${vendor.revenue || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Render based on current view
  switch (currentAdminView) {
    case 'users':
      return renderUsers();
    case 'user-details':
      return renderUserDetails();
    case 'vendors':
      return renderVendors();
    case 'vendor-details':
      return renderVendorDetails();
    case 'bookings':
      return renderBookings();
    case 'feedback':
      return renderFeedback();
    case 'analytics':
      return renderAnalytics();
    case 'settings':
      return renderSettings();
    default:
      return renderDashboard();
  }
};

export default AdminDashboard;