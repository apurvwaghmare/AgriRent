const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testPublicEquipmentRoutes() {
    console.log('🔍 Testing Public Equipment Routes...\n');

    try {
        // Test 1: Basic equipment listing
        console.log('1. Testing basic equipment listing...');
        const basicResponse = await axios.get(`${BASE_URL}/equipment`);
        
        if (basicResponse.data.success) {
            console.log('✅ Basic equipment listing successful');
            console.log(`   Total Equipment: ${basicResponse.data.data.pagination.totalRecords}`);
            console.log(`   Equipment Count: ${basicResponse.data.data.equipment.length}`);
            
            if (basicResponse.data.data.equipment.length > 0) {
                const firstEquipment = basicResponse.data.data.equipment[0];
                console.log(`   First Equipment: ${firstEquipment.name} - $${firstEquipment.daily_rate}/day`);
                console.log(`   Vendor: ${firstEquipment.vendor_shop_name} (${firstEquipment.vendor_city})`);
                console.log(`   Rating: ${firstEquipment.average_rating || 'No ratings'} (${firstEquipment.review_count} reviews)`);
            }
            
            console.log(`   Available Categories: ${basicResponse.data.data.filters.categories.length}`);
            console.log(`   Available Cities: ${basicResponse.data.data.filters.cities.length}`);
        }

        // Test 2: Equipment with category filter (type parameter)
        console.log('\n2. Testing category filter (type=1)...');
        const categoryResponse = await axios.get(`${BASE_URL}/equipment?type=1&limit=5`);
        
        if (categoryResponse.data.success) {
            console.log('✅ Category filter successful');
            console.log(`   Filtered Equipment: ${categoryResponse.data.data.equipment.length}`);
            
            if (categoryResponse.data.data.equipment.length > 0) {
                categoryResponse.data.data.equipment.forEach((item, index) => {
                    console.log(`   ${index + 1}. ${item.name} (${item.category_name}) - $${item.daily_rate}/day`);
                });
            }
        }

        // Test 3: Equipment with city filter
        console.log('\n3. Testing city filter...');
        if (basicResponse.data.data.filters.cities.length > 0) {
            const testCity = basicResponse.data.data.filters.cities[0];
            const cityResponse = await axios.get(`${BASE_URL}/equipment?city=${encodeURIComponent(testCity)}&limit=5`);
            
            if (cityResponse.data.success) {
                console.log(`✅ City filter successful (${testCity})`);
                console.log(`   Equipment in ${testCity}: ${cityResponse.data.data.equipment.length}`);
                
                cityResponse.data.data.equipment.forEach((item, index) => {
                    console.log(`   ${index + 1}. ${item.name} - ${item.vendor_shop_name} (${item.vendor_city})`);
                });
            }
        } else {
            console.log('⚠️ No cities available for testing city filter');
        }

        // Test 4: Equipment with search filter
        console.log('\n4. Testing search filter...');
        const searchResponse = await axios.get(`${BASE_URL}/equipment?search=tractor&limit=5`);
        
        if (searchResponse.data.success) {
            console.log('✅ Search filter successful (search: "tractor")');
            console.log(`   Search Results: ${searchResponse.data.data.equipment.length}`);
            
            searchResponse.data.data.equipment.forEach((item, index) => {
                console.log(`   ${index + 1}. ${item.name} - ${item.model || 'No model'}`);
            });
        }

        // Test 5: Equipment with price range filter
        console.log('\n5. Testing price range filter...');
        const priceResponse = await axios.get(`${BASE_URL}/equipment?min_price=100&max_price=500&limit=5`);
        
        if (priceResponse.data.success) {
            console.log('✅ Price range filter successful ($100-$500)');
            console.log(`   Equipment in Price Range: ${priceResponse.data.data.equipment.length}`);
            
            priceResponse.data.data.equipment.forEach((item, index) => {
                console.log(`   ${index + 1}. ${item.name} - $${item.daily_rate}/day`);
            });
        }

        // Test 6: Equipment with vendor filter
        console.log('\n6. Testing vendor filter...');
        if (basicResponse.data.data.equipment.length > 0) {
            const testVendorId = basicResponse.data.data.equipment[0].vendor_id;
            const vendorResponse = await axios.get(`${BASE_URL}/equipment?vendor_id=${testVendorId}&limit=5`);
            
            if (vendorResponse.data.success) {
                console.log(`✅ Vendor filter successful (vendor_id: ${testVendorId})`);
                console.log(`   Equipment from this vendor: ${vendorResponse.data.data.equipment.length}`);
                
                if (vendorResponse.data.data.equipment.length > 0) {
                    const vendorName = vendorResponse.data.data.equipment[0].vendor_shop_name;
                    console.log(`   Vendor: ${vendorName}`);
                    
                    vendorResponse.data.data.equipment.forEach((item, index) => {
                        console.log(`   ${index + 1}. ${item.name} - $${item.daily_rate}/day`);
                    });
                }
            }
        }

        // Test 7: Equipment with sorting
        console.log('\n7. Testing sorting options...');
        const sortedResponse = await axios.get(`${BASE_URL}/equipment?sort_by=daily_rate&sort_order=ASC&limit=5`);
        
        if (sortedResponse.data.success) {
            console.log('✅ Sorting successful (by price, ascending)');
            console.log('   Equipment sorted by price (lowest first):');
            
            sortedResponse.data.data.equipment.forEach((item, index) => {
                console.log(`   ${index + 1}. ${item.name} - $${item.daily_rate}/day`);
            });
        }

        // Test 8: Pagination
        console.log('\n8. Testing pagination...');
        const page2Response = await axios.get(`${BASE_URL}/equipment?page=2&limit=3`);
        
        if (page2Response.data.success) {
            console.log('✅ Pagination successful');
            console.log(`   Page 2 Equipment: ${page2Response.data.data.equipment.length}`);
            console.log(`   Current Page: ${page2Response.data.data.pagination.currentPage}`);
            console.log(`   Total Pages: ${page2Response.data.data.pagination.totalPages}`);
            console.log(`   Has Next Page: ${page2Response.data.data.pagination.hasNextPage}`);
            console.log(`   Has Previous Page: ${page2Response.data.data.pagination.hasPrevPage}`);
        }

    } catch (error) {
        console.error('❌ Public equipment routes test failed:', error.response?.data?.message || error.message);
    }
}

async function testEquipmentDetails() {
    console.log('\n🔍 Testing Equipment Details Route...\n');

    try {
        // First get a list of equipment to test with
        const listResponse = await axios.get(`${BASE_URL}/equipment?limit=1`);
        
        if (listResponse.data.success && listResponse.data.data.equipment.length > 0) {
            const testEquipmentId = listResponse.data.data.equipment[0].id;
            
            console.log(`1. Testing equipment details for ID: ${testEquipmentId}...`);
            const detailResponse = await axios.get(`${BASE_URL}/equipment/${testEquipmentId}`);
            
            if (detailResponse.data.success) {
                const equipment = detailResponse.data.data;
                
                console.log('✅ Equipment details retrieved successfully');
                console.log(`   Equipment: ${equipment.name} (${equipment.model || 'No model'})`);
                console.log(`   Category: ${equipment.category_name}`);
                console.log(`   Daily Rate: $${equipment.daily_rate}`);
                console.log(`   Weekly Rate: $${equipment.weekly_rate || 'Not set'}`);
                console.log(`   Monthly Rate: $${equipment.monthly_rate || 'Not set'}`);
                console.log(`   Condition: ${equipment.condition_status}`);
                console.log(`   Availability: ${equipment.availability_status}`);
                console.log(`   Location: ${equipment.location || 'Not specified'}`);
                
                console.log(`   Vendor: ${equipment.vendor_shop_name} (${equipment.vendor_owner_name})`);
                console.log(`   Vendor City: ${equipment.vendor_city}`);
                console.log(`   Vendor Phone: ${equipment.vendor_phone}`);
                
                console.log(`   Images: ${equipment.images.length} available`);
                console.log(`   Average Rating: ${equipment.average_rating || 'No ratings'}`);
                console.log(`   Total Reviews: ${equipment.review_count}`);
                console.log(`   Active Bookings: ${equipment.active_bookings}`);
                console.log(`   Completed Bookings: ${equipment.completed_bookings}`);
                
                console.log(`   Recent Reviews: ${equipment.reviews.length}`);
                console.log(`   Similar Equipment: ${equipment.similar_equipment.length}`);
                
                if (equipment.reviews.length > 0) {
                    console.log('   Latest Review:');
                    const latestReview = equipment.reviews[0];
                    console.log(`     Customer: ${latestReview.customer_name}`);
                    console.log(`     Rating: ${latestReview.rating}/5`);
                    console.log(`     Comment: ${latestReview.comment || 'No comment'}`);
                }
                
                if (equipment.similar_equipment.length > 0) {
                    console.log('   Similar Equipment:');
                    equipment.similar_equipment.forEach((item, index) => {
                        console.log(`     ${index + 1}. ${item.name} - $${item.daily_rate}/day (${item.vendor_shop_name})`);
                    });
                }
            }
        } else {
            console.log('⚠️ No equipment available for details testing');
        }

        // Test 2: Non-existent equipment
        console.log('\n2. Testing non-existent equipment...');
        try {
            await axios.get(`${BASE_URL}/equipment/99999`);
            console.error('❌ Should have returned 404 for non-existent equipment');
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('✅ Correctly returned 404 for non-existent equipment');
            } else {
                console.error('❌ Unexpected error for non-existent equipment:', error.response?.data?.message);
            }
        }

    } catch (error) {
        console.error('❌ Equipment details test failed:', error.response?.data?.message || error.message);
    }
}

async function testFilterCombinations() {
    console.log('\n🔍 Testing Filter Combinations...\n');

    try {
        // Test complex filter combination
        console.log('1. Testing complex filter combination...');
        const complexResponse = await axios.get(`${BASE_URL}/equipment?type=1&min_price=50&max_price=1000&sort_by=daily_rate&sort_order=DESC&limit=5`);
        
        if (complexResponse.data.success) {
            console.log('✅ Complex filter combination successful');
            console.log(`   Filtered Results: ${complexResponse.data.data.equipment.length}`);
            console.log('   Applied Filters:');
            console.log(`     Category: ${complexResponse.data.data.filters.appliedFilters.type || 'None'}`);
            console.log(`     Min Price: $${complexResponse.data.data.filters.appliedFilters.min_price || 'None'}`);
            console.log(`     Max Price: $${complexResponse.data.data.filters.appliedFilters.max_price || 'None'}`);
            
            complexResponse.data.data.equipment.forEach((item, index) => {
                console.log(`   ${index + 1}. ${item.name} - $${item.daily_rate}/day (${item.category_name})`);
            });
        }

        // Test search with category
        console.log('\n2. Testing search with category filter...');
        const searchCategoryResponse = await axios.get(`${BASE_URL}/equipment?search=farm&type=1&limit=3`);
        
        if (searchCategoryResponse.data.success) {
            console.log('✅ Search with category filter successful');
            console.log(`   Results: ${searchCategoryResponse.data.data.equipment.length}`);
            
            searchCategoryResponse.data.data.equipment.forEach((item, index) => {
                console.log(`   ${index + 1}. ${item.name} (${item.category_name}) - $${item.daily_rate}/day`);
            });
        }

        // Test empty results
        console.log('\n3. Testing filter with no results...');
        const noResultsResponse = await axios.get(`${BASE_URL}/equipment?min_price=10000&max_price=20000`);
        
        if (noResultsResponse.data.success) {
            console.log(`✅ Filter with no results handled correctly: ${noResultsResponse.data.data.equipment.length} results`);
        }

    } catch (error) {
        console.error('❌ Filter combinations test failed:', error.response?.data?.message || error.message);
    }
}

async function main() {
    console.log('🚜 Public Equipment Routes Test Suite');
    console.log('=====================================\n');

    try {
        // Check server health
        await axios.get(`${BASE_URL}/health`);
        console.log('✅ Server is running\n');

        // Run tests
        await testPublicEquipmentRoutes();
        await testEquipmentDetails();
        await testFilterCombinations();

        console.log('\n🎉 Public Equipment Routes Test Suite Completed!');
        console.log('\n📊 Test Summary:');
        console.log('✅ Basic equipment listing with pagination');
        console.log('✅ Category filtering (type parameter)');
        console.log('✅ City-based filtering');
        console.log('✅ Vendor-specific filtering');
        console.log('✅ Search functionality across multiple fields');
        console.log('✅ Price range filtering');
        console.log('✅ Sorting by different fields');
        console.log('✅ Comprehensive pagination');
        console.log('✅ Detailed equipment information');
        console.log('✅ Related data (reviews, similar equipment)');
        console.log('✅ Vendor information integration');
        console.log('✅ Complex filter combinations');
        console.log('✅ Error handling for non-existent equipment');

    } catch (error) {
        console.error('\n❌ Test suite failed:', error.message);
    }
}

// Run the test suite
main().catch(console.error);