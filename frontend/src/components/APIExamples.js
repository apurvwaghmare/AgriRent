import React, { useState, useEffect } from 'react';
import { equipmentAPI, bookingAPI } from '../utils/apiHelpers';
import { useAPI, useAPIOnMount, useAuth } from '../utils/hooks';
import { getUploadUrl } from '../utils/apiConfig';

// Example component showing how to use the API configuration
const EquipmentListExample = () => {
  // Using the custom hook for API calls
  const { data: equipment, loading, error, execute: fetchEquipment } = useAPI(equipmentAPI.getAll);
  const { user, isAuthenticated } = useAuth();

  // State for filters
  const [filters, setFilters] = useState({
    category: '',
    location: '',
    minPrice: '',
    maxPrice: '',
  });

  // Fetch equipment on component mount
  useEffect(() => {
    fetchEquipment(filters);
  }, []);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Apply filters
  const applyFilters = () => {
    fetchEquipment(filters);
  };

  // Handle booking creation
  const handleBookEquipment = async (equipmentId) => {
    if (!isAuthenticated) {
      alert('Please log in to make a booking');
      return;
    }

    try {
      const bookingData = {
        equipment_id: equipmentId,
        customer_name: user.name,
        customer_email: user.email,
        customer_phone: user.phone,
        rental_type: 'daily',
        start_date: '2025-10-15',
        end_date: '2025-10-17',
        delivery_address: user.address || '123 Default Address',
      };

      const result = await bookingAPI.create(bookingData);
      alert('Booking created successfully!');
      console.log('Booking result:', result);
    } catch (error) {
      alert('Failed to create booking: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner">Loading equipment...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>Error loading equipment</h3>
        <p>{error}</p>
        <button onClick={() => fetchEquipment(filters)}>Retry</button>
      </div>
    );
  }

  return (
    <div className="equipment-list-container">
      <h2>Agriculture Equipment Rental</h2>
      
      {/* Filters Section */}
      <div className="filters-section">
        <h3>Filter Equipment</h3>
        <div className="filter-row">
          <select 
            name="category" 
            value={filters.category} 
            onChange={handleFilterChange}
          >
            <option value="">All Categories</option>
            <option value="tractors">Tractors</option>
            <option value="harvesters">Harvesters</option>
            <option value="plows">Plows</option>
            <option value="seeders">Seeders</option>
          </select>

          <input
            type="text"
            name="location"
            placeholder="Location"
            value={filters.location}
            onChange={handleFilterChange}
          />

          <input
            type="number"
            name="minPrice"
            placeholder="Min Price"
            value={filters.minPrice}
            onChange={handleFilterChange}
          />

          <input
            type="number"
            name="maxPrice"
            placeholder="Max Price"
            value={filters.maxPrice}
            onChange={handleFilterChange}
          />

          <button onClick={applyFilters}>Apply Filters</button>
        </div>
      </div>

      {/* Equipment Grid */}
      <div className="equipment-grid">
        {equipment && equipment.length > 0 ? (
          equipment.map((item) => (
            <div key={item.id} className="equipment-card">
              <div className="equipment-image">
                {item.images && item.images.length > 0 ? (
                  <img 
                    src={getUploadUrl(`/uploads/equipment/${item.images[0]}`)} 
                    alt={item.name}
                  />
                ) : (
                  <div className="no-image">No Image</div>
                )}
              </div>
              
              <div className="equipment-details">
                <h3>{item.name}</h3>
                <p className="description">{item.description}</p>
                <p className="category">Category: {item.category}</p>
                <p className="location">Location: {item.location}</p>
                
                <div className="pricing">
                  {item.hourly_rate && (
                    <span className="price">₹{item.hourly_rate}/hour</span>
                  )}
                  {item.daily_rate && (
                    <span className="price">₹{item.daily_rate}/day</span>
                  )}
                </div>
                
                <div className="vendor-info">
                  <p>Vendor: {item.vendor_name}</p>
                </div>
                
                <div className="equipment-actions">
                  <button 
                    className="book-button"
                    onClick={() => handleBookEquipment(item.id)}
                    disabled={item.availability_status !== 'available'}
                  >
                    {item.availability_status === 'available' ? 'Book Now' : 'Not Available'}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-equipment">
            <p>No equipment found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Example component for vendor dashboard using API hooks
const VendorDashboardExample = () => {
  // Fetch vendor dashboard data on mount
  const { data: dashboardData, loading, error } = useAPIOnMount(() => 
    import('../utils/apiHelpers').then(({ vendorAPI }) => vendorAPI.getDashboard())
  );

  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="vendor-dashboard">
      <h2>Vendor Dashboard</h2>
      {dashboardData && (
        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>Total Equipment</h3>
            <p>{dashboardData.totalEquipment || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Active Bookings</h3>
            <p>{dashboardData.activeBookings || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Monthly Revenue</h3>
            <p>₹{dashboardData.monthlyRevenue || 0}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export { EquipmentListExample, VendorDashboardExample };