import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl } from '../utils/apiConfig';

const CustomerDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  
  // Equipment browsing filters
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    location: '',
    vendor: ''
  });
  
  // Booking form data
  const [bookingForm, setBookingForm] = useState({
    equipment_id: '',
    start_date: '',
    end_date: '',
    delivery_address: ''
  });
  
  // Feedback form data
  const [feedbackForm, setFeedbackForm] = useState({
    booking_id: '',
    rating: 5,
    comment: ''
  });

  useEffect(() => {
    if (currentView === 'dashboard') {
      loadDashboardData();
    } else if (currentView === 'bookings') {
      loadBookings();
    } else if (currentView === 'feedback') {
      loadFeedback();
    }
  }, [currentView]);

  // =====================================================
  // DATA LOADING FUNCTIONS
  // =====================================================

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(getApiUrl('/api/customer/dashboard'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data.data);
      } else {
        throw new Error('Failed to load dashboard data');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadEquipment = async () => {
    setLoading(true);
    setError('');
    setHasSearched(true);
    console.log('🔍 Starting equipment search...');
    console.log('🔧 Search filters:', filters);
    
    try {
      const params = new URLSearchParams(filters).toString();
      const url = getApiUrl(`/api/customer/equipment?${params}`);
      console.log('🌐 API URL:', url);
      
      const response = await fetch(url);
      console.log('📡 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📦 Response data:', data);
        setEquipment(data.data.equipment || []);
        console.log('✅ Equipment set:', data.data.equipment?.length || 0, 'items');
      } else {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error('Failed to load equipment');
      }
    } catch (err) {
      console.error('💥 Load equipment error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(getApiUrl('/api/customer/bookings'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.data || []);
      } else {
        throw new Error('Failed to load bookings');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadFeedback = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(getApiUrl('/api/customer/feedback'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFeedback(data.data || []);
      } else {
        throw new Error('Failed to load feedback');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // ACTION FUNCTIONS
  // =====================================================

  const handleBooking = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(getApiUrl('/api/customer/bookings'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingForm)
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Booking created successfully! Total cost: $${data.data.total_cost}`);
        setBookingForm({
          equipment_id: '',
          start_date: '',
          end_date: '',
          delivery_address: ''
        });
        setCurrentView('bookings');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(getApiUrl('/api/customer/feedback'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(feedbackForm)
      });

      if (response.ok) {
        alert('Feedback submitted successfully!');
        setFeedbackForm({
          booking_id: '',
          rating: 5,
          comment: ''
        });
        loadFeedback();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (bookingId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(getApiUrl(`/api/customer/bookings/${bookingId}/invoice`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${bookingId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Failed to download invoice');
      }
    } catch (err) {
      alert('Error downloading invoice: ' + err.message);
    }
  };

  // =====================================================
  // RENDER FUNCTIONS
  // =====================================================

  const renderDashboard = () => (
    <div className="customer-dashboard">
      <h2>Customer Dashboard</h2>
      <p>Welcome, {user?.name || 'Customer'}!</p>
      
      {dashboardData && (
        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>Total Bookings</h3>
            <p className="stat-number">{dashboardData.totalBookings}</p>
          </div>
          <div className="stat-card">
            <h3>Pending Bookings</h3>
            <p className="stat-number">{dashboardData.pendingBookings}</p>
          </div>
          <div className="stat-card">
            <h3>Completed Bookings</h3>
            <p className="stat-number">{dashboardData.completedBookings}</p>
          </div>
          <div className="stat-card">
            <h3>Feedback Pending</h3>
            <p className="stat-number">{dashboardData.feedbackPending}</p>
          </div>
        </div>
      )}

      {dashboardData?.recentBookings && dashboardData.recentBookings.length > 0 && (
        <div className="recent-bookings">
          <h3>Recent Bookings</h3>
          <table>
            <thead>
              <tr>
                <th>Equipment</th>
                <th>Vendor</th>
                <th>Dates</th>
                <th>Status</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.recentBookings.map(booking => (
                <tr key={booking.id}>
                  <td>{booking.equipment_name}</td>
                  <td>{booking.vendor_name}</td>
                  <td>{new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}</td>
                  <td>
                    <span className={`status ${booking.status}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td>${booking.total_cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="customer-actions">
        <button onClick={() => setCurrentView('equipment')}>Browse Equipment</button>
        <button onClick={() => setCurrentView('bookings')}>My Bookings</button>
        <button onClick={() => setCurrentView('feedback')}>My Feedback</button>
      </div>
    </div>
  );

  const renderEquipment = () => (
    <div className="browse-equipment-container">
      <div className="browse-equipment-header">
        <h2>🚜 Browse Equipment</h2>
        <p>Find the perfect agricultural equipment for your farming needs</p>
      </div>
      
      {/* Beautiful Search Container */}
      <div className="search-container">
        <div className="search-filters">
          <div className="search-input-group">
            <label>Search Equipment</label>
            <input
              type="text"
              placeholder="Search equipment..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
          </div>
          
          <div className="search-input-group">
            <label>Equipment Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value})}
            >
              <option value="">All Types</option>
              <option value="Tractor">Tractor</option>
              <option value="Harvester">Harvester</option>
              <option value="Plough">Plough</option>
              <option value="Sprayer">Sprayer</option>
              <option value="Cultivator">Cultivator</option>
            </select>
          </div>
          
          <div className="search-input-group">
            <label>City</label>
            <input
              type="text"
              placeholder="Enter city..."
              value={filters.location}
              onChange={(e) => setFilters({...filters, location: e.target.value})}
            />
          </div>
        </div>
        
        <div style={{textAlign: 'center'}}>
          <button className="search-button" onClick={loadEquipment}>
            🔍 Search Equipment
          </button>
        </div>
      </div>

      {/* Equipment Grid */}
      {!hasSearched ? (
        <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>
          <div style={{fontSize: '3rem', marginBottom: '20px'}}>🔍</div>
          <h3>Search for Equipment</h3>
          <p>Use the search filters above to find agricultural equipment in your area.</p>
          <p>You can search by equipment name, type, or city.</p>
        </div>
      ) : equipment.length === 0 ? (
        <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>
          <div style={{fontSize: '3rem', marginBottom: '20px'}}>❌</div>
          <h3>No Equipment Found</h3>
          <p>No equipment matches your search criteria.</p>
          <p>Try adjusting your search filters or searching in a different city.</p>
        </div>
      ) : (
        <div className="equipment-grid">
          {equipment.map(item => (
            <div key={item.id} className="equipment-card">
              {item.image_url && (
                <img src={item.image_url} alt={item.name} />
              )}
              <h3>{item.name}</h3>
              <p className="type">{item.type}</p>
              <p className="description">{item.description}</p>
              <p className="price">${item.price_per_day}/day</p>
              <p className="vendor">By: {item.vendor_name}</p>
              <p className="location">{item.vendor_city}</p>
              <button 
                onClick={() => {
                  setBookingForm({...bookingForm, equipment_id: item.id});
                  setCurrentView('booking');
                }}
                disabled={item.availability !== 'available'}
              >
                {item.availability === 'available' ? 'Book Now' : 'Not Available'}
              </button>
            </div>
          ))}
        </div>
      )}

      <button className="back-to-dashboard-btn" onClick={() => setCurrentView('dashboard')}>
        Back to Dashboard
      </button>
    </div>
  );

  const renderBookingForm = () => (
    <div className="booking-form">
      <h2>Book Equipment</h2>
      
      <form onSubmit={handleBooking}>
        <div className="form-group">
          <label>Start Date:</label>
          <input
            type="date"
            value={bookingForm.start_date}
            onChange={(e) => setBookingForm({...bookingForm, start_date: e.target.value})}
            required
          />
        </div>
        
        <div className="form-group">
          <label>End Date:</label>
          <input
            type="date"
            value={bookingForm.end_date}
            onChange={(e) => setBookingForm({...bookingForm, end_date: e.target.value})}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Delivery Address:</label>
          <textarea
            value={bookingForm.delivery_address}
            onChange={(e) => setBookingForm({...bookingForm, delivery_address: e.target.value})}
            required
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Creating Booking...' : 'Create Booking'}
        </button>
      </form>
      
      <button onClick={() => setCurrentView('equipment')}>Back to Equipment</button>
    </div>
  );

  const renderBookings = () => (
    <div className="bookings-list">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
        <h2>My Bookings</h2>
        <button 
          onClick={() => setCurrentView('dashboard')}
          className="back-to-dashboard-btn"
        >
          Back to Dashboard
        </button>
      </div>
      
      {bookings.length === 0 ? (
        <div style={{textAlign: 'center', padding: '40px'}}>
          <p>No bookings found.</p>
          <button 
            onClick={() => setCurrentView('equipment')}
            style={{
              background: '#28a745',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Browse Equipment
          </button>
        </div>
      ) : (
        <div style={{overflowX: 'auto'}}>
          <table>
            <thead>
              <tr>
                <th>Equipment</th>
                <th>Vendor</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Total Cost</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(booking => (
                <tr key={booking.id}>
                  <td>
                    <div>
                      {booking.equipment_image && (
                        <img src={booking.equipment_image} alt={booking.equipment_name} style={{width: '50px', height: '50px'}} />
                      )}
                      <div>
                        <strong>{booking.equipment_name}</strong>
                        <br />
                        <small>{booking.equipment_type}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <strong>{booking.vendor_name}</strong>
                      <br />
                      <small style={{color: '#666'}}>📞 {booking.vendor_phone}</small>
                    </div>
                  </td>
                  <td>{new Date(booking.start_date).toLocaleDateString()}</td>
                  <td>{new Date(booking.end_date).toLocaleDateString()}</td>
                  <td>
                    <span className={`status ${booking.status}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td>${booking.total_cost}</td>
                  <td>
                    {booking.status === 'completed' && (
                      <>
                        <button onClick={() => downloadInvoice(booking.id)}>
                          Download Invoice
                        </button>
                        <button 
                          onClick={() => {
                            setFeedbackForm({...feedbackForm, booking_id: booking.id});
                            setCurrentView('feedback-form');
                          }}
                        >
                          Give Feedback
                        </button>
                      </>
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

  const renderFeedbackForm = () => (
    <div className="feedback-form">
      <h2>Submit Feedback</h2>
      
      <form onSubmit={handleFeedbackSubmit}>
        <div className="form-group">
          <label>Rating (1-5):</label>
          <select
            value={feedbackForm.rating}
            onChange={(e) => setFeedbackForm({...feedbackForm, rating: parseInt(e.target.value)})}
          >
            <option value={1}>1 - Poor</option>
            <option value={2}>2 - Fair</option>
            <option value={3}>3 - Good</option>
            <option value={4}>4 - Very Good</option>
            <option value={5}>5 - Excellent</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Comment:</label>
          <textarea
            value={feedbackForm.comment}
            onChange={(e) => setFeedbackForm({...feedbackForm, comment: e.target.value})}
            placeholder="Share your experience..."
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>
      
      <button onClick={() => setCurrentView('bookings')}>Back to Bookings</button>
    </div>
  );

  const renderFeedback = () => (
    <div className="feedback-list">
      <h2>My Feedback</h2>
      
      {feedback.length === 0 ? (
        <p>No feedback submitted yet.</p>
      ) : (
        <div className="feedback-items">
          {feedback.map(item => (
            <div key={item.id} className="feedback-item">
              <div className="feedback-header">
                <h4>{item.equipment_name}</h4>
                <div className="rating">
                  {'★'.repeat(item.rating)}{'☆'.repeat(5-item.rating)}
                </div>
                <span className="date">{new Date(item.created_at).toLocaleDateString()}</span>
              </div>
              <p className="vendor">Vendor: {item.vendor_name}</p>
              <p className="period">
                Rental Period: {new Date(item.start_date).toLocaleDateString()} - {new Date(item.end_date).toLocaleDateString()}
              </p>
              {item.comment && (
                <p className="comment">"{item.comment}"</p>
              )}
            </div>
          ))}
        </div>
      )}
      
      <button className="back-to-dashboard-btn" onClick={() => setCurrentView('dashboard')}>Back to Dashboard</button>
    </div>
  );

  // =====================================================
  // MAIN RENDER
  // =====================================================

  if (!isAuthenticated) {
    return <div>Please login to access customer dashboard.</div>;
  }

  return (
    <div className="customer-dashboard-container">
      {loading && <div className="loading">Loading...</div>}
      {error && <div className="error">Error: {error}</div>}
      
      {currentView === 'dashboard' && renderDashboard()}
      {currentView === 'equipment' && renderEquipment()}
      {currentView === 'booking' && renderBookingForm()}
      {currentView === 'bookings' && renderBookings()}
      {currentView === 'feedback-form' && renderFeedbackForm()}
      {currentView === 'feedback' && renderFeedback()}
    </div>
  );
};

export default CustomerDashboard;