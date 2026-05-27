import React, { useState, useEffect } from 'react';
import './App.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm, RegisterForm, UserProfile } from './components/AuthComponents';
import AdminDashboard from './components/AdminDashboard';
import VendorDashboard from './components/VendorDashboard';
import CustomerDashboard from './components/CustomerDashboard';
import EquipmentUpload from './components/EquipmentUpload';
import ProtectedRoute from './components/ProtectedRoute';

// App Content Component
const AppContent = () => {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const [currentView, setCurrentView] = useState('home');

  // Helper functions for role checking
  const isAdmin = () => user?.role === 'admin';
  const isVendor = () => user?.role === 'vendor';
  const isCustomer = () => user?.role === 'customer';

  // Security: Redirect to home if user loses authentication while on protected pages
  useEffect(() => {
    const protectedViews = ['admin', 'vendor', 'customer', 'add-equipment', 'profile'];
    if (!isAuthenticated && protectedViews.includes(currentView)) {
      console.log('🔒 User not authenticated, redirecting to home from:', currentView);
      setCurrentView('home');
    }
  }, [isAuthenticated, currentView]);

  // Debug logging
  console.log('🔍 App State:', { isAuthenticated, loading, currentView });
  console.log('🔍 User Data:', user);
  console.log('🔍 Role Check:', { 
    isAdmin: isAdmin(), 
    isVendor: isVendor(), 
    isCustomer: isCustomer(),
    userRole: user?.role 
  });

  // Force show home page for testing - bypass loading entirely
  if (currentView === 'home') {
    return (
      <div className="app-container">
        {/* Navigation Header */}
        <header className="app-header">
          <div className="header-content">
            <div className="logo" onClick={() => setCurrentView('home')}>
              🚜 AgriRent
            </div>
            
            <nav className="main-nav">
              <button 
                onClick={() => setCurrentView('home')}
                className={currentView === 'home' ? 'active' : ''}
              >
                Home
              </button>
              <button 
                onClick={() => setCurrentView('login')}
                className="nav-login-btn"
              >
                Customer Login
              </button>
              <button 
                onClick={() => setCurrentView('vendor-login')}
                className="nav-login-btn"
              >
                Vendor Login
              </button>
              <button 
                onClick={() => setCurrentView('admin-login')}
                className="nav-login-btn"
              >
                Admin Login
              </button>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h1>Modern Agriculture Equipment Rental</h1>
            <p>Rent high-quality farming equipment from trusted vendors in your area. Boost your productivity with our wide range of agricultural machinery.</p>
          </div>
          <div className="hero-equipment">
            <div className="equipment-showcase">
              <div className="equipment-card">
                <h4>🚜 Tractors</h4>
                <p>Powerful farming tractors</p>
              </div>
              <div className="equipment-card">
                <h4>🌾 Harvesters</h4>
                <p>Efficient crop harvesting</p>
              </div>
              <div className="equipment-card">
                <h4>🚛 Cultivators</h4>
                <p>Soil preparation tools</p>
              </div>
            </div>
          </div>
        </section>        {/* Features Section */}
        <section className="features-section">
          <div className="container">
            <h2>Why Choose AgriRent?</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">🚜</div>
                <h3>Wide Selection</h3>
                <p>Choose from tractors, harvesters, plows, and more farming equipment</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">✅</div>
                <h3>Verified Vendors</h3>
                <p>All vendors are verified and approved by our admin team</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📱</div>
                <h3>Easy Booking</h3>
                <p>Simple online booking system with instant confirmations</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">💳</div>
                <h3>Secure Payments</h3>
                <p>Safe and secure payment processing with multiple options</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="how-it-works">
          <div className="container">
            <h2>How It Works</h2>
            <div className="steps-grid">
              <div className="step-card">
                <div className="step-number">1</div>
                <h3>Browse Equipment</h3>
                <p>Browse through our wide selection of farming equipment</p>
              </div>
              <div className="step-card">
                <div className="step-number">2</div>
                <h3>Book Online</h3>
                <p>Select your dates and book equipment online instantly</p>
              </div>
              <div className="step-card">
                <div className="step-number">3</div>
                <h3>Use & Return</h3>
                <p>Use the equipment and return it on the agreed date</p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="app-footer">
          <div className="container">
            <p>&copy; 2025 AgriRent - Agriculture Equipment Rental System</p>
          </div>
        </footer>
      </div>
    );
  }

  const renderEquipmentCatalog = () => (
    <div className="equipment-catalog">
      <div className="page-header">
        <h2>Equipment Catalog</h2>
        <button onClick={() => setCurrentView('home')} className="back-btn">Back to Home</button>
      </div>
      <div className="catalog-grid">
        <div className="category-card">
          <h3>🚜 Tractors</h3>
          <p>Heavy-duty tractors for all farming needs</p>
          <ul>
            <li>John Deere Series</li>
            <li>Massey Ferguson</li>
            <li>New Holland</li>
            <li>Case IH</li>
          </ul>
          <button className="rent-btn">View Available</button>
        </div>
        <div className="category-card">
          <h3>🌾 Harvesters</h3>
          <p>Efficient crop harvesting equipment</p>
          <ul>
            <li>Combine Harvesters</li>
            <li>Rice Harvesters</li>
            <li>Corn Harvesters</li>
            <li>Wheat Harvesters</li>
          </ul>
          <button className="rent-btn">View Available</button>
        </div>
        <div className="category-card">
          <h3>🚛 Cultivators</h3>
          <p>Soil preparation and cultivation tools</p>
          <ul>
            <li>Disc Harrows</li>
            <li>Field Cultivators</li>
            <li>Rotary Tillers</li>
            <li>Chisel Plows</li>
          </ul>
          <button className="rent-btn">View Available</button>
        </div>
        <div className="category-card">
          <h3>💧 Irrigation</h3>
          <p>Water management systems</p>
          <ul>
            <li>Sprinkler Systems</li>
            <li>Drip Irrigation</li>
            <li>Water Pumps</li>
            <li>Hose Reels</li>
          </ul>
          <button className="rent-btn">View Available</button>
        </div>
        <div className="category-card">
          <h3>🌱 Planters</h3>
          <p>Seeding and planting equipment</p>
          <ul>
            <li>Seed Drills</li>
            <li>Corn Planters</li>
            <li>Broadcast Seeders</li>
            <li>Transplanting Machines</li>
          </ul>
          <button className="rent-btn">View Available</button>
        </div>
        <div className="category-card">
          <h3>🔧 Implements</h3>
          <p>Various farming implements</p>
          <ul>
            <li>Mowers</li>
            <li>Balers</li>
            <li>Spreaders</li>
            <li>Graders</li>
          </ul>
          <button className="rent-btn">View Available</button>
        </div>
      </div>
    </div>
  );

  const renderAbout = () => (
    <div className="about-page">
      <div className="page-header">
        <h2>About AgriRent</h2>
        <button onClick={() => setCurrentView('home')} className="back-btn">Back to Home</button>
      </div>
      <div className="about-content">
        <div className="about-section">
          <h3>🎯 Our Mission</h3>
          <p>To revolutionize agriculture by making high-quality farming equipment accessible and affordable for farmers of all sizes. We bridge the gap between equipment vendors and farmers, creating a sustainable ecosystem for modern agriculture.</p>
        </div>
        <div className="about-section">
          <h3>🌟 Why Choose AgriRent?</h3>
          <div className="features-grid">
            <div className="feature-item">
              <h4>🚀 Latest Equipment</h4>
              <p>Access to modern, well-maintained agricultural machinery</p>
            </div>
            <div className="feature-item">
              <h4>💰 Cost Effective</h4>
              <p>Affordable rental rates that fit your budget</p>
            </div>
            <div className="feature-item">
              <h4>📍 Local Vendors</h4>
              <p>Find equipment from trusted vendors in your area</p>
            </div>
            <div className="feature-item">
              <h4>⚡ Quick Booking</h4>
              <p>Easy and fast equipment booking process</p>
            </div>
            <div className="feature-item">
              <h4>🛠️ Maintenance Support</h4>
              <p>Technical support and maintenance assistance</p>
            </div>
            <div className="feature-item">
              <h4>📊 Analytics</h4>
              <p>Track your usage and optimize farming operations</p>
            </div>
          </div>
        </div>
        <div className="about-section">
          <h3>👥 How It Works</h3>
          <div className="process-steps">
            <div className="step">
              <div className="step-number">1</div>
              <h4>Browse Equipment</h4>
              <p>Explore our extensive catalog of farming equipment</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h4>Select & Book</h4>
              <p>Choose your equipment and book for desired dates</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h4>Get Delivered</h4>
              <p>Equipment delivered to your farm ready to use</p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h4>Farm & Return</h4>
              <p>Use the equipment and return when done</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Show loading screen
  if (loading) {
    return (
      <div className="app-container">
        <div className="app-loading">
          <div className="spinner"></div>
          <p>Loading AgriRent...</p>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'login':
      case 'vendor-login':
      case 'admin-login':
        const loginRole = currentView === 'vendor-login' ? 'vendor' : 
                         currentView === 'admin-login' ? 'admin' : 'customer';
        return (
          <LoginForm 
            defaultRole={loginRole}
            onSuccess={(user) => {
              console.log('Login successful:', user);
              // Redirect directly to appropriate dashboard based on role
              if (user.role === 'admin') {
                setCurrentView('admin');
              } else if (user.role === 'vendor') {
                setCurrentView('vendor');
              } else if (user.role === 'customer') {
                setCurrentView('customer');
              } else {
                // Fallback to dashboard view
                setCurrentView('admin'); // Default admin for testing
              }
            }}
          />
        );
      
      case 'register':
        return (
          <RegisterForm 
            onSuccess={(user, message) => {
              console.log('Registration successful:', user);
              alert(message || 'Registration successful!');
              if (user) {
                // Redirect to appropriate dashboard based on role
                if (user.role === 'admin') {
                  setCurrentView('admin');
                } else if (user.role === 'vendor') {
                  setCurrentView('vendor');
                } else if (user.role === 'customer') {
                  setCurrentView('customer');
                } else {
                  setCurrentView('profile');
                }
              } else {
                setCurrentView('login');
              }
            }}
          />
        );
      
      case 'equipment-catalog':
        return renderEquipmentCatalog();
      
      case 'about':
        return renderAbout();
      
      case 'profile':
        return (
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        );
      
      case 'admin':
        if (!isAuthenticated || user?.role !== 'admin') {
          setCurrentView('login');
          return (
            <div className="auth-required">
              <h2>Authentication Required</h2>
              <p>Please log in as an admin to access the dashboard.</p>
            </div>
          );
        }
        return (
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        );
      
      case 'vendor':
        if (!isAuthenticated || user?.role !== 'vendor') {
          setCurrentView('login');
          return (
            <div className="auth-required">
              <h2>Authentication Required</h2>
              <p>Please log in as a vendor to access the dashboard.</p>
            </div>
          );
        }
        return (
          <ProtectedRoute allowedRoles={['vendor']}>
            <VendorDashboard />
          </ProtectedRoute>
        );
      
      case 'add-equipment':
        if (!isAuthenticated || user?.role !== 'vendor') {
          setCurrentView('login');
          return (
            <div className="auth-required">
              <h2>Authentication Required</h2>
              <p>Please log in as a vendor to add equipment.</p>
            </div>
          );
        }
        return (
          <ProtectedRoute allowedRoles={['vendor']}>
            <EquipmentUpload 
              onSuccess={(equipment) => {
                console.log('Equipment uploaded:', equipment);
                alert('Equipment uploaded successfully!');
                setCurrentView('vendor');
              }}
              onCancel={() => setCurrentView('vendor')}
            />
          </ProtectedRoute>
        );
      
      case 'customer':
        if (!isAuthenticated || user?.role !== 'customer') {
          setCurrentView('login');
          return (
            <div className="auth-required">
              <h2>Authentication Required</h2>
              <p>Please log in as a customer to access the dashboard.</p>
            </div>
          );
        }
        return (
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerDashboard />
          </ProtectedRoute>
        );
      
      default:
        return (
          <div className="home-page">
            <h1>🚜 Agriculture Equipment Rental System</h1>
            <p>Rent high-quality farming equipment from verified vendors</p>
            
            {/* Always show auth buttons as fallback */}
            <div className="auth-options">
              <h3>Get Started</h3>
              <button 
                onClick={() => {
                  console.log('Login button clicked');
                  setCurrentView('login');
                }}
                className="primary-button"
              >
                Login
              </button>
              <button 
                onClick={() => {
                  console.log('Register button clicked');
                  setCurrentView('register');
                }}
                className="secondary-button"
              >
                Register
              </button>
            </div>
            
            {/* Original conditional rendering */}
            {!isAuthenticated ? (
              <div className="auth-options" style={{marginTop: '20px', border: '1px solid blue', padding: '10px'}}>
                <h3>Get Started (Conditional)</h3>
                <button 
                  onClick={() => setCurrentView('login')}
                  className="primary-button"
                >
                  Login
                </button>
                <button 
                  onClick={() => setCurrentView('register')}
                  className="secondary-button"
                >
                  Register
                </button>
              </div>
            ) : (
              <div className="dashboard-options">
                <h3>Welcome back!</h3>
                <div className="role-actions">
                  {user?.role === 'admin' && (
                    <button 
                      onClick={() => setCurrentView('admin')}
                      className="admin-button"
                    >
                      Admin Panel
                    </button>
                  )}
                  {user?.role === 'vendor' && (
                    <button 
                      onClick={() => setCurrentView('vendor')}
                      className="vendor-button"
                    >
                      Vendor Dashboard
                    </button>
                  )}
                  {user?.role === 'customer' && (
                    <button 
                      onClick={() => setCurrentView('customer')}
                      className="customer-button"
                    >
                      Browse Equipment
                    </button>
                  )}
                </div>
              </div>
            )}
            
            <div className="features-preview">
              <h3>Features</h3>
              <div className="feature-grid">
                <div className="feature-card">
                  <h4>🚜 Wide Selection</h4>
                  <p>Choose from tractors, harvesters, and more</p>
                </div>
                <div className="feature-card">
                  <h4>✅ Verified Vendors</h4>
                  <p>All vendors are verified and approved</p>
                </div>
                <div className="feature-card">
                  <h4>📱 Easy Booking</h4>
                  <p>Simple online booking system</p>
                </div>
                <div className="feature-card">
                  <h4>💳 Secure Payments</h4>
                  <p>Safe and secure payment processing</p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="app-container">
      {/* Navigation Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo" onClick={() => setCurrentView('home')}>
            🚜 AgriRent
          </div>
          
          <nav className="main-nav">
            <button 
              onClick={() => setCurrentView('home')}
              className={currentView === 'home' ? 'active' : ''}
            >
              Home
            </button>
            
            {isAuthenticated && (
              <>
                <button 
                  onClick={() => setCurrentView('profile')}
                  className={currentView === 'profile' ? 'active' : ''}
                >
                  Profile
                </button>
                
                {user?.role === 'admin' && (
                  <button 
                    onClick={() => setCurrentView('admin')}
                    className={currentView === 'admin' ? 'active' : ''}
                  >
                    Admin Dashboard
                  </button>
                )}
                
                {user?.role === 'vendor' && (
                  <button 
                    onClick={() => setCurrentView('vendor')}
                    className={currentView === 'vendor' || currentView === 'add-equipment' ? 'active' : ''}
                  >
                    Vendor Dashboard
                  </button>
                )}
                
                {user?.role === 'customer' && (
                  <button 
                    onClick={() => setCurrentView('customer')}
                    className={currentView === 'customer' ? 'active' : ''}
                  >
                    Customer Dashboard
                  </button>
                )}
                
                <button 
                  onClick={() => {
                    logout();
                    setCurrentView('home');
                  }}
                  className="logout-button"
                >
                  Logout
                </button>
              </>
            )}
            
            {!isAuthenticated && (
              <>
                <button 
                  onClick={() => setCurrentView('login')}
                  className={currentView === 'login' ? 'active' : ''}
                >
                  Login
                </button>
                <button 
                  onClick={() => setCurrentView('register')}
                  className={currentView === 'register' ? 'active' : ''}
                >
                  Register
                </button>
              </>
            )}
          </nav>
          
          <div className="auth-status">
            {isAuthenticated ? (
              <span>Welcome, {user?.name || user?.role}! (Role: {user?.role})</span>
            ) : (
              <span>Please log in</span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {renderView()}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <p>&copy; 2025 Agriculture Equipment Rental System. All rights reserved.</p>
          <div className="footer-links">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Contact Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Main App Component with AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
