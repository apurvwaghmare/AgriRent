import React, { useState, useEffect, useCallback } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { useAuth } from '../contexts/AuthContext';
import { vendorAPI } from '../utils/apiHelpers';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const VendorDashboard = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [salesData, setSalesData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [newEquipment, setNewEquipment] = useState({
    name: '',
    type: '',
    description: '',
    category_id: '',
    daily_rate: '',
    weekly_rate: '',
    monthly_rate: '',
    availability: 'available',
    condition_status: 'good',
    location: ''
  });

  const addNewEquipment = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await vendorAPI.createEquipment(newEquipment);
      setNewEquipment({
        name: '',
        type: '',
        description: '',
        category_id: '',
        daily_rate: '',
        weekly_rate: '',
        monthly_rate: '',
        availability: 'available',
        condition_status: 'good',
        location: ''
      });
      setShowAddEquipment(false);
      loadEquipment(); // Reload equipment list
      alert('Equipment added successfully!');
    } catch (err) {
      alert('Failed to add equipment: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = useCallback(async () => {
    console.log('🔍 Loading vendor dashboard data...');
    console.log('🔍 Current user:', user);
    console.log('🔍 Auth token:', localStorage.getItem('authToken'));
    
    setLoading(true);
    setError('');
    try {
      console.log('📡 Making API call to vendor dashboard...');
      const response = await vendorAPI.getDashboard();
      console.log('📡 Dashboard API response:', response);
      
      // Handle the response structure from backend
      if (response && response.success && response.data) {
        setDashboardData(response.data);
        setError(''); // Clear any previous errors
      } else {
        console.error('❌ Invalid dashboard response:', response);
        // Set default data structure to show the cards
        setDashboardData({
          stats: {
            equipment: { total: 0 },
            bookings: { total: 0, completed: 0 },
            revenue: { total: 0 }
          },
          recentBookings: []
        });
      }
    } catch (err) {
      console.error('❌ Dashboard API error:', err);
      console.error('❌ Error response:', err.response);
      // Set default data structure even on error so cards still show
      setDashboardData({
        stats: {
          equipment: { total: 0 },
          bookings: { total: 0, completed: 0 },
          revenue: { total: 0 }
        },
        recentBookings: []
      });
      setError('Failed to load dashboard: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load dashboard data on component mount
  useEffect(() => {
    if (currentView === 'dashboard') {
      loadDashboardData();
    } else if (currentView === 'equipment') {
      loadEquipment();
    } else if (currentView === 'bookings') {
      loadBookings();
    } else if (currentView === 'feedback') {
      loadFeedback();
    } else if (currentView === 'sales') {
      loadSalesData();
    } else if (currentView === 'analytics') {
      loadAnalyticsData();
    }
  }, [currentView, loadDashboardData]);

  const loadEquipment = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await vendorAPI.getEquipment();
      // Handle the response structure from backend
      if (response.success && response.data) {
        setEquipment(response.data.equipment || []);
      } else {
        setEquipment([]);
      }
    } catch (err) {
      setError('Failed to load equipment: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await vendorAPI.getBookings();
      // Handle the response structure from backend
      if (response.success && response.data) {
        setBookings(response.data.bookings || []);
      } else {
        setBookings([]);
      }
    } catch (err) {
      setError('Failed to load bookings: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadFeedback = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await vendorAPI.getFeedback();
      // Handle the response structure from backend
      if (response.success && response.data) {
        setFeedback(response.data.feedback || []);
      } else {
        setFeedback([]);
      }
    } catch (err) {
      setError('Failed to load feedback: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadSalesData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await vendorAPI.getSales('month');
      // Handle the response structure from backend
      if (response.success && response.data) {
        setSalesData(response.data);
      } else {
        setSalesData(null);
      }
    } catch (err) {
      setError('Failed to load sales data: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadAnalyticsData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await vendorAPI.getAnalytics('month');
      // Handle the response structure from backend
      if (response.success && response.data) {
        setAnalyticsData(response.data);
      } else {
        setAnalyticsData(null);
      }
    } catch (err) {
      setError('Failed to load analytics: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId, status, notes = '') => {
    try {
      await vendorAPI.updateBookingStatus(bookingId, { status, notes });
      setBookings(bookings.map(booking => 
        booking.id === bookingId ? { ...booking, status } : booking
      ));
      alert(`Booking ${status} successfully!`);
    } catch (err) {
      alert('Failed to update booking: ' + (err.response?.data?.message || err.message));
    }
  };

  const deleteEquipment = async (equipmentId) => {
    if (!window.confirm('Are you sure you want to delete this equipment?')) return;
    
    try {
      await vendorAPI.deleteEquipment(equipmentId);
      setEquipment(equipment.filter(item => item.id !== equipmentId));
      alert('Equipment deleted successfully!');
    } catch (err) {
      alert('Failed to delete equipment: ' + (err.response?.data?.message || err.message));
    }
  };

  const renderDashboard = () => (
    <div className="vendor-dashboard-overview">
      <h2>Vendor Dashboard</h2>
      <p>Welcome, {user?.owner_name || user?.name || 'Vendor'}!</p>
      
      {/* Show approval status */}
      {user?.status && (
        <div className={`status-banner ${user.status}`}>
          <h3>Account Status: {user.status.toUpperCase()}</h3>
          {user.status === 'pending' && (
            <p>Your vendor account is pending approval. You'll be able to access all features once approved by admin.</p>
          )}
          {user.status === 'approved' && (
            <p>✅ Your vendor account is approved! You have full access to all features.</p>
          )}
          {user.status === 'suspended' && (
            <p>⚠️ Your vendor account has been suspended. Please contact admin for assistance.</p>
          )}
        </div>
      )}
      
      {dashboardData && (
        <>
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Equipment</h3>
              <p className="stat-number">{dashboardData.stats?.equipment?.total || 0}</p>
              <div className="stat-actions">
                <button className="stat-action-btn" onClick={() => setCurrentView('equipment')}>
                  ✓ Manage
                </button>
              </div>
            </div>
            <div className="stat-card">
              <h3>Total Bookings</h3>
              <p className="stat-number">{dashboardData.stats?.bookings?.total || 0}</p>
              <div className="stat-actions">
                <button className="stat-action-btn" onClick={() => setCurrentView('bookings')}>
                  👁 View
                </button>
              </div>
            </div>
            <div className="stat-card">
              <h3>Completed Bookings</h3>
              <p className="stat-number">{dashboardData.stats?.bookings?.completed || 0}</p>
              <div className="stat-actions">
                <button className="stat-action-btn" onClick={() => setCurrentView('bookings')}>
                  📋 Details
                </button>
              </div>
            </div>
          </div>

          {/* Action Cards */}
          <div className="action-cards-grid">
            <div className="action-card">
              <div className="action-icon">🔧</div>
              <h3>Manage Equipment</h3>
              <button className="action-btn" onClick={() => setCurrentView('equipment')}>
                👁 Go
              </button>
            </div>
            <div className="action-card">
              <div className="action-icon">📋</div>
              <h3>View Bookings</h3>
              <button className="action-btn" onClick={() => setCurrentView('bookings')}>
                👁 Go
              </button>
            </div>
            <div className="action-card">
              <div className="action-icon">💬</div>
              <h3>Customer Feedback</h3>
              <button className="action-btn" onClick={() => setCurrentView('feedback')}>
                👁 Go
              </button>
            </div>
            <div className="action-card">
              <div className="action-icon">📊</div>
              <h3>Analytics</h3>
              <button className="action-btn" onClick={() => setCurrentView('analytics')}>
                👁 Go
              </button>
            </div>
          </div>

          {/* Recent Bookings */}
          {dashboardData.recentBookings?.length > 0 && (
            <div className="recent-bookings">
              <h3>Recent Bookings</h3>
              <div className="bookings-list">
                {dashboardData.recentBookings.map(booking => (
                  <div key={booking.id} className="booking-card">
                    <h4>{booking.equipment_name}</h4>
                    <p>Customer: {booking.customer_name}</p>
                    <p>Date: {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}</p>
                    <p>Amount: ₹{booking.total_cost}</p>
                    <span className={`status ${booking.status}`}>{booking.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Show error if data failed to load - but less prominent */}
      {error && (
        <div className="error-message-small">
          <p>⚠️ {error}</p>
          <button onClick={loadDashboardData} className="retry-btn">Retry</button>
        </div>
      )}
    </div>
  );

  const renderEquipment = () => (
    <div className="vendor-equipment">
      <div className="vendor-header">
        <h2>Manage Equipment</h2>
        <div className="header-actions">
          <button 
            onClick={() => setShowAddEquipment(!showAddEquipment)}
            className="add-btn"
          >
            {showAddEquipment ? 'Cancel' : 'Add New Equipment'}
          </button>
          <button onClick={() => setCurrentView('dashboard')} className="back-to-dashboard-btn">Back to Dashboard</button>
        </div>
      </div>

      {/* Add Equipment Form */}
      {showAddEquipment && (
        <div className="add-equipment-form">
          <h3>Add New Equipment</h3>
          <form onSubmit={addNewEquipment}>
            <div className="form-grid">
              <div className="form-group">
                <label>Equipment Name *</label>
                <input
                  type="text"
                  value={newEquipment.name}
                  onChange={(e) => setNewEquipment({...newEquipment, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Type *</label>
                <input
                  type="text"
                  value={newEquipment.type}
                  onChange={(e) => setNewEquipment({...newEquipment, type: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Category ID *</label>
                <input
                  type="number"
                  value={newEquipment.category_id}
                  onChange={(e) => setNewEquipment({...newEquipment, category_id: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Daily Rate (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={newEquipment.daily_rate}
                  onChange={(e) => setNewEquipment({...newEquipment, daily_rate: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Weekly Rate (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newEquipment.weekly_rate}
                  onChange={(e) => setNewEquipment({...newEquipment, weekly_rate: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Monthly Rate (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newEquipment.monthly_rate}
                  onChange={(e) => setNewEquipment({...newEquipment, monthly_rate: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={newEquipment.location}
                  onChange={(e) => setNewEquipment({...newEquipment, location: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Availability Status</label>
                <select
                  value={newEquipment.availability}
                  onChange={(e) => setNewEquipment({...newEquipment, availability: e.target.value})}
                >
                  <option value="available">Available</option>
                  <option value="rented">Rented</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
            </div>
            <div className="form-group full-width">
              <label>Description</label>
              <textarea
                value={newEquipment.description}
                onChange={(e) => setNewEquipment({...newEquipment, description: e.target.value})}
                rows="3"
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="add-btn" disabled={loading}>
                {loading ? 'Adding...' : 'Add Equipment'}
              </button>
              <button type="button" onClick={() => setShowAddEquipment(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Equipment List */}
      {equipment.length > 0 ? (
        <div className="equipment-grid">
          {equipment.map(item => (
            <div key={item.id} className="equipment-card">
              <div className="equipment-header">
                <h3>{item.name}</h3>
                <span className={`status ${item.availability}`}>
                  {item.availability}
                </span>
              </div>
              <div className="equipment-details">
                <p><strong>Equipment Name:</strong> {item.name}</p>
                <p><strong>Type:</strong> {item.type}</p>
                <p><strong>Category:</strong> {item.category_name || 'Not specified'}</p>
                <p><strong>Daily Rate:</strong> ₹{item.price_per_day}/day</p>
                {item.weekly_rate && <p><strong>Weekly Rate:</strong> ₹{item.weekly_rate}/week</p>}
                {item.monthly_rate && <p><strong>Monthly Rate:</strong> ₹{item.monthly_rate}/month</p>}
                {item.location && <p><strong>Location:</strong> {item.location}</p>}
                <p><strong>Condition:</strong> {item.condition_status || item.availability}</p>
                <p><strong>Availability:</strong> {item.availability}</p>
                {item.description && <p><strong>Description:</strong> {item.description}</p>}
                {item.specifications && <p><strong>Specifications:</strong> {typeof item.specifications === 'string' ? item.specifications : JSON.stringify(item.specifications)}</p>}
              </div>
              <div className="equipment-actions">
                <button className="edit-btn">Edit</button>
                <button 
                  onClick={() => deleteEquipment(item.id)}
                  className="delete-btn"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No equipment added yet.</p>
          <button 
            onClick={() => setShowAddEquipment(true)}
            className="add-btn"
          >
            Add Your First Equipment
          </button>
        </div>
      )}
    </div>
  );

  const renderBookings = () => (
    <div className="vendor-bookings">
      <div className="vendor-header">
        <h2>Manage Bookings</h2>
        <button onClick={() => setCurrentView('dashboard')} className="back-to-dashboard-btn">Back to Dashboard</button>
      </div>
      
      {bookings.length > 0 ? (
        <div className="bookings-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Equipment</th>
                <th>Customer</th>
                <th>Dates</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(booking => (
                <tr key={booking.id}>
                  <td>{booking.id}</td>
                  <td>{booking.equipment_name}</td>
                  <td>{booking.customer_name}</td>
                  <td>{new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}</td>
                  <td>₹{booking.total_cost}</td>
                  <td>
                    <span className={`status ${booking.status}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td>
                    {booking.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => updateBookingStatus(booking.id, 'approved')}
                          className="approve-btn"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => updateBookingStatus(booking.id, 'rejected')}
                          className="reject-btn"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {booking.status === 'approved' && (
                      <button 
                        onClick={() => updateBookingStatus(booking.id, 'completed')}
                        className="approve-btn"
                      >
                        Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No bookings found.</p>
      )}
    </div>
  );

  const renderFeedback = () => (
    <div className="vendor-feedback">
      <div className="vendor-header">
        <h2>Customer Feedback</h2>
        <button onClick={() => setCurrentView('dashboard')}>Back to Dashboard</button>
      </div>
      
      {feedback.length > 0 ? (
        <div className="feedback-list">
          {feedback.map(item => (
            <div key={item.id} className="feedback-card">
              <div className="feedback-header">
                <h4>{item.customer_name}</h4>
                <div className="rating">
                  {'★'.repeat(item.rating)}{'☆'.repeat(5-item.rating)}
                  <span>({item.rating}/5)</span>
                </div>
              </div>
              <p><strong>Equipment:</strong> {item.equipment_name}</p>
              <p><strong>Comment:</strong> {item.comment}</p>
              <p><strong>Date:</strong> {new Date(item.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>No feedback received yet.</p>
      )}
    </div>
  );

  const renderSales = () => (
    <div className="vendor-sales">
      <div className="vendor-header">
        <h2>Sales Report</h2>
        <button onClick={() => setCurrentView('dashboard')}>Back to Dashboard</button>
      </div>
      
      {salesData && (
        <div className="sales-overview">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Sales</h3>
              <p className="stat-number">{salesData.summary.totalSales}</p>
            </div>
            <div className="stat-card">
              <h3>Total Revenue</h3>
              <p className="stat-number">₹{salesData.summary.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="stat-card">
              <h3>Average Order</h3>
              <p className="stat-number">₹{salesData.summary.averageOrderValue.toFixed(0)}</p>
            </div>
            <div className="stat-card">
              <h3>Unique Customers</h3>
              <p className="stat-number">{salesData.summary.uniqueCustomers}</p>
            </div>
          </div>

          <div className="top-equipment">
            <h3>Top Performing Equipment</h3>
            {salesData.topEquipment.map(item => (
              <div key={item.id} className="equipment-performance">
                <h4>{item.name} - {item.model}</h4>
                <p>Bookings: {item.bookings_count} | Revenue: ₹{item.revenue}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => {
    if (!analyticsData) {
      return (
        <div className="vendor-analytics">
          <div className="vendor-header">
            <h2>Analytics Dashboard</h2>
            <button onClick={() => setCurrentView('dashboard')}>Back to Dashboard</button>
          </div>
          <p>Loading analytics data...</p>
        </div>
      );
    }

    // Prepare chart data
    const bookingsTrendData = {
      labels: analyticsData.bookingsTrend?.map(item => item.period) || [],
      datasets: [
        {
          label: 'Bookings',
          data: analyticsData.bookingsTrend?.map(item => item.bookings) || [],
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1
        },
        {
          label: 'Revenue (₹)',
          data: analyticsData.bookingsTrend?.map(item => item.revenue) || [],
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1,
          yAxisID: 'y1'
        }
      ]
    };

    const equipmentPerformanceData = {
      labels: analyticsData.categoryPerformance?.map(item => item.category_name) || [],
      datasets: [
        {
          label: 'Revenue (₹)',
          data: analyticsData.categoryPerformance?.map(item => item.revenue) || [],
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 205, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
          ],
        }
      ]
    };

    const bookingStatusData = {
      labels: analyticsData.statusDistribution?.map(item => item.status) || [],
      datasets: [
        {
          data: analyticsData.statusDistribution?.map(item => item.count) || [],
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 205, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
          ],
        }
      ]
    };

    const chartOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Analytics Overview'
        },
      },
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: {
            drawOnChartArea: false,
          },
        },
      },
    };

    const barOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Equipment Performance'
        },
      },
    };

    const doughnutOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Booking Status Distribution'
        },
      },
    };

    return (
      <div className="vendor-analytics">
        <div className="vendor-header">
          <h2>Analytics Dashboard</h2>
          <button onClick={() => setCurrentView('dashboard')}>Back to Dashboard</button>
        </div>
        
        <div className="analytics-overview">
          {/* Summary Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Bookings</h3>
              <p className="stat-number">{analyticsData.bookingsTrend?.reduce((total, item) => total + (item.bookings || 0), 0) || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Total Revenue</h3>
              <p className="stat-number">₹{(analyticsData.bookingsTrend?.reduce((total, item) => total + (item.revenue || 0), 0) || 0).toLocaleString()}</p>
            </div>
            <div className="stat-card">
              <h3>Active Categories</h3>
              <p className="stat-number">{analyticsData.categoryPerformance?.length || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Status Types</h3>
              <p className="stat-number">{analyticsData.statusDistribution?.length || 0}</p>
            </div>
          </div>

          {/* Charts */}
          <div className="charts-grid">
            <div className="chart-container">
              <h3>Bookings & Revenue Trend</h3>
              {analyticsData.bookingsTrend?.length > 0 ? (
                <Line data={bookingsTrendData} options={chartOptions} />
              ) : (
                <p>No trend data available</p>
              )}
            </div>

            <div className="chart-container">
              <h3>Category Performance</h3>
              {analyticsData.categoryPerformance?.length > 0 ? (
                <Bar data={equipmentPerformanceData} options={barOptions} />
              ) : (
                <p>No category data available</p>
              )}
            </div>

            <div className="chart-container">
              <h3>Booking Status Distribution</h3>
              {analyticsData.statusDistribution?.length > 0 ? (
                <Doughnut data={bookingStatusData} options={doughnutOptions} />
              ) : (
                <p>No status data available</p>
              )}
            </div>
          </div>

          {/* Detailed Analytics */}
          <div className="detailed-analytics">
            <div className="analytics-section">
              <h4>Category Performance</h4>
              {analyticsData.categoryPerformance?.length > 0 ? (
                <div className="category-list">
                  {analyticsData.categoryPerformance.map((category, index) => (
                    <div key={index} className="category-item">
                      <h5>{category.category_name}</h5>
                      <p>Bookings: {category.bookings} | Revenue: ₹{category.revenue}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No category data available</p>
              )}
            </div>

            <div className="analytics-section">
              <h4>Monthly Trends</h4>
              {analyticsData.bookingsTrend?.length > 0 ? (
                <div className="trend-list">
                  {analyticsData.bookingsTrend.map((item, index) => (
                    <div key={index} className="trend-item">
                      <span><strong>{item.period}:</strong> {item.bookings} bookings, ₹{item.revenue} revenue</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No trend data available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="vendor-dashboard">
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      
      {/* Render based on current view */}
      {currentView === 'dashboard' && renderDashboard()}
      {currentView === 'equipment' && renderEquipment()}
      {currentView === 'bookings' && renderBookings()}
      {currentView === 'feedback' && renderFeedback()}
      {currentView === 'sales' && renderSales()}
      {currentView === 'analytics' && renderAnalytics()}
    </div>
  );
};

export default VendorDashboard;