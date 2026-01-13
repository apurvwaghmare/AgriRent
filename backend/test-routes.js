// Simple route tester
const testRoutes = async () => {
  const baseUrl = 'http://localhost:5000/api';
  
  console.log('🧪 Testing Routes...\n');

  // Test 1: Health check
  try {
    const response = await fetch(`${baseUrl}/health`);
    const data = await response.json();
    console.log('✅ Health Check:', data.status);
  } catch (err) {
    console.log('❌ Health Check failed:', err.message);
  }

  // Test 2: Admin test route
  try {
    const response = await fetch(`${baseUrl}/admin/test`);
    const data = await response.json();
    console.log('✅ Admin Test Route:', data.message);
  } catch (err) {
    console.log('❌ Admin Test Route failed:', err.message);
  }

  // Test 3: Vendors (no auth)
  try {
    const response = await fetch(`${baseUrl}/admin/test-vendors`);
    const data = await response.json();
    console.log('✅ Test Vendors:', `Found ${data.count} vendors`);
  } catch (err) {
    console.log('❌ Test Vendors failed:', err.message);
  }

  // Test 4: Customers (no auth)
  try {
    const response = await fetch(`${baseUrl}/admin/test-customers`);
    const data = await response.json();
    console.log('✅ Test Customers:', `Found ${data.count} customers`);
  } catch (err) {
    console.log('❌ Test Customers failed:', err.message);
  }

  console.log('\n🏁 Route testing complete!');
};

// Run if called directly
if (require.main === module) {
  testRoutes();
}

module.exports = testRoutes;