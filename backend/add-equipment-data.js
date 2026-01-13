const { query } = require('./config/db');

async function addEquipmentData() {
    try {
        console.log('🔧 Adding sample equipment data...');

        // Get the test vendor
        const vendors = await query('SELECT id FROM vendors WHERE email = "vendor@test.com"');
        if (vendors.length === 0) {
            console.log('❌ Test vendor not found');
            return;
        }

        const vendorId = vendors[0].id;
        
        // Check if equipment already exists
        const existingEquipment = await query('SELECT COUNT(*) as count FROM equipment WHERE vendor_id = ?', [vendorId]);
        
        if (existingEquipment[0].count > 0) {
            console.log('✅ Equipment already exists');
            const equipment = await query('SELECT * FROM equipment WHERE vendor_id = ?', [vendorId]);
            equipment.forEach((item, index) => {
                console.log(`${index + 1}. ${item.name} - $${item.price_per_day}/day`);
            });
            return;
        }

        // Add sample equipment
        await query(`
            INSERT INTO equipment (
                vendor_id, name, type, description, 
                price_per_day, weekly_rate, monthly_rate, 
                availability, location, image
            ) VALUES 
            (?, 'John Deere Tractor 5075E', 'Tractor', 'Reliable 75HP tractor perfect for field operations, plowing, and cultivation', 200.00, 1200.00, 4500.00, 'available', 'Test City', '/uploads/equipment/tractor1.jpg'),
            (?, 'Case IH Combine Harvester', 'Harvester', 'High-capacity combine harvester for efficient grain harvesting', 400.00, 2400.00, 9000.00, 'available', 'Test City', '/uploads/equipment/harvester1.jpg'),
            (?, 'Kubota Rotary Tiller', 'Tiller', 'Heavy-duty tiller for soil preparation and seedbed cultivation', 120.00, 700.00, 2500.00, 'available', 'Test City', '/uploads/equipment/tiller1.jpg'),
            (?, 'Mahindra Disc Harrow', 'Harrow', 'Professional disc harrow for breaking up soil after plowing', 90.00, 500.00, 1800.00, 'available', 'Test City', '/uploads/equipment/harrow1.jpg'),
            (?, 'New Holland Hay Baler', 'Baler', 'Efficient round baler for hay and straw production', 180.00, 1000.00, 3600.00, 'available', 'Test City', '/uploads/equipment/baler1.jpg')
        `, [vendorId, vendorId, vendorId, vendorId, vendorId]);
        
        console.log('✅ Sample equipment added successfully!');
        
        // Display the added equipment
        const equipment = await query('SELECT * FROM equipment WHERE vendor_id = ?', [vendorId]);
        console.log('\n🚜 Equipment List:');
        equipment.forEach((item, index) => {
            console.log(`${index + 1}. ${item.name} - $${item.price_per_day}/day`);
        });

        console.log('\n🎉 Equipment data setup completed!');

    } catch (error) {
        console.error('❌ Error adding equipment data:', error);
    } finally {
        process.exit(0);
    }
}

addEquipmentData();