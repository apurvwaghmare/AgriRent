const { query } = require('./config/db');

async function approveVendor(email) {
  try {
    console.log('🔧 Approving vendor with email:', email);
    
    // Update vendor status to approved
    const result = await query(
      'UPDATE vendors SET status = ? WHERE email = ?',
      ['approved', email]
    );

    if (result.affectedRows > 0) {
      console.log('✅ Vendor approved successfully!');
      
      // Show updated vendor info
      const vendor = await query(
        'SELECT id, shop_name, owner_name, email, status FROM vendors WHERE email = ?',
        [email]
      );
      
      if (vendor.length > 0) {
        console.log('📊 Vendor Details:');
        console.log('   ID:', vendor[0].id);
        console.log('   Shop:', vendor[0].shop_name);
        console.log('   Owner:', vendor[0].owner_name);
        console.log('   Email:', vendor[0].email);
        console.log('   Status:', vendor[0].status);
      }
    } else {
      console.log('❌ No vendor found with that email address');
    }

  } catch (error) {
    console.error('❌ Error approving vendor:', error);
  }
}

// Get email from command line arguments or use default
const vendorEmail = process.argv[2] || 'arun@gmail.com';

// Run the function
approveVendor(vendorEmail).then(() => {
  console.log('🏁 Approval process complete!');
  process.exit(0);
}).catch(err => {
  console.error('💥 Approval failed:', err);
  process.exit(1);
});