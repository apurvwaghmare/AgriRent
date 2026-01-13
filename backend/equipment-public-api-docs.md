# Public Equipment Routes API Documentation

## 🌐 Overview

The public equipment routes provide customers and visitors with comprehensive access to browse and view agricultural equipment available for rental. These routes are **public** and do not require authentication.

## 🔍 Equipment Listing

### GET /api/equipment

Retrieve a paginated list of available equipment with comprehensive filtering options.

**Request:**
```http
GET /api/equipment?type=1&city=Agriculture%20City&vendor_id=5&search=tractor&min_price=100&max_price=500&sort_by=daily_rate&sort_order=ASC&page=1&limit=12
```

**Query Parameters:**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `type` | integer | Category ID filter (alternative: `category_id`) | - |
| `city` | string | Filter by vendor city (partial match) | - |
| `vendor_id` | integer | Filter by specific vendor | - |
| `search` | string | Search in name, model, description, specifications | - |
| `min_price` | decimal | Minimum daily rate | - |
| `max_price` | decimal | Maximum daily rate | - |
| `availability_status` | string | Equipment availability status | `'available'` |
| `sort_by` | string | Sort field (`created_at`, `daily_rate`, `name`, `model`) | `'created_at'` |
| `sort_order` | string | Sort direction (`ASC`, `DESC`) | `'DESC'` |
| `page` | integer | Page number for pagination | `1` |
| `limit` | integer | Items per page | `12` |

**Response:**
```json
{
    "success": true,
    "message": "Equipment retrieved successfully",
    "data": {
        "equipment": [
            {
                "id": 1,
                "name": "John Deere 5055E Tractor",
                "model": "5055E",
                "description": "Reliable mid-size tractor perfect for farming operations",
                "category_id": 1,
                "category_name": "Tractors",
                "category_description": "Agricultural tractors and farming vehicles",
                "daily_rate": 150.00,
                "weekly_rate": 900.00,
                "monthly_rate": 3500.00,
                "availability_status": "available",
                "condition_status": "excellent",
                "specifications": "Engine: 55HP, 4WD, PTO, Hydraulic system",
                "location": "Warehouse A",
                "images": [
                    "/uploads/equipment/vendor_1_1696874400000_tractor1.jpg",
                    "/uploads/equipment/vendor_1_1696874400001_tractor2.jpg"
                ],
                "vendor_id": 1,
                "vendor_shop_name": "Green Farm Equipment",
                "vendor_owner_name": "John Farmer",
                "vendor_city": "Agriculture City",
                "vendor_phone": "+1234567890",
                "vendor_email": "vendor@greenfarm.com",
                "vendor_address": "123 Farm Street",
                "active_bookings": 2,
                "average_rating": 4.5,
                "review_count": 12,
                "created_at": "2025-10-09T10:00:00.000Z",
                "updated_at": "2025-10-09T15:30:00.000Z"
            }
        ],
        "pagination": {
            "currentPage": 1,
            "totalPages": 5,
            "totalRecords": 58,
            "hasNextPage": true,
            "hasPrevPage": false,
            "itemsPerPage": 12
        },
        "filters": {
            "categories": [
                { "id": 1, "name": "Tractors" },
                { "id": 2, "name": "Harvesters" },
                { "id": 3, "name": "Tillers" }
            ],
            "cities": [
                "Agriculture City",
                "Farm Town",
                "Rural Valley"
            ],
            "appliedFilters": {
                "type": 1,
                "city": "Agriculture City",
                "vendor_id": null,
                "search": "tractor",
                "min_price": "100",
                "max_price": "500",
                "availability_status": "available"
            }
        }
    }
}
```

## 🔍 Equipment Details

### GET /api/equipment/:id

Get comprehensive details for a specific equipment item.

**Request:**
```http
GET /api/equipment/1
```

**Response:**
```json
{
    "success": true,
    "message": "Equipment details retrieved successfully",
    "data": {
        "id": 1,
        "name": "John Deere 5055E Tractor",
        "model": "5055E",
        "description": "Reliable mid-size tractor perfect for farming operations",
        "category_id": 1,
        "category_name": "Tractors",
        "category_description": "Agricultural tractors and farming vehicles",
        "daily_rate": 150.00,
        "weekly_rate": 900.00,
        "monthly_rate": 3500.00,
        "availability_status": "available",
        "condition_status": "excellent",
        "specifications": "Engine: 55HP, 4WD, PTO, Hydraulic system",
        "location": "Warehouse A",
        "images": [
            "/uploads/equipment/vendor_1_1696874400000_tractor1.jpg",
            "/uploads/equipment/vendor_1_1696874400001_tractor2.jpg"
        ],
        "vendor_id": 1,
        "vendor_shop_name": "Green Farm Equipment",
        "vendor_owner_name": "John Farmer",
        "vendor_city": "Agriculture City",
        "vendor_phone": "+1234567890",
        "vendor_email": "vendor@greenfarm.com",
        "vendor_address": "123 Farm Street",
        "active_bookings": 2,
        "completed_bookings": 15,
        "average_rating": 4.5,
        "review_count": 12,
        "reviews": [
            {
                "id": 1,
                "booking_id": 123,
                "rating": 5,
                "comment": "Excellent tractor, very reliable and powerful!",
                "customer_name": "Farm Corp Ltd",
                "start_date": "2025-09-15",
                "end_date": "2025-09-20",
                "created_at": "2025-09-21T10:00:00.000Z"
            }
        ],
        "similar_equipment": [
            {
                "id": 5,
                "name": "Massey Ferguson 4707",
                "model": "4707",
                "daily_rate": 140.00,
                "images": ["/uploads/equipment/tractor_mf.jpg"],
                "vendor_shop_name": "Farm Equipment Plus",
                "vendor_city": "Agriculture City",
                "average_rating": 4.2
            }
        ],
        "created_at": "2025-10-09T10:00:00.000Z",
        "updated_at": "2025-10-09T15:30:00.000Z"
    }
}
```

## 🎯 Key Features

### 🔍 **Advanced Filtering**
- **Category Filter**: Filter by equipment type/category
- **Location Filter**: Find equipment in specific cities
- **Vendor Filter**: View equipment from specific vendors
- **Price Range**: Filter by daily rental rates
- **Search**: Full-text search across multiple fields
- **Availability**: Filter by equipment availability status

### 📊 **Rich Data Integration**
- **Vendor Information**: Complete vendor details including contact info
- **Rating System**: Average ratings and review counts
- **Booking Statistics**: Active and completed booking counts
- **Image Gallery**: Multiple images per equipment
- **Similar Equipment**: Related equipment suggestions
- **Recent Reviews**: Customer feedback with details

### 📄 **Pagination & Sorting**
- **Flexible Pagination**: Configurable page size
- **Multiple Sort Options**: By date, price, name, model
- **Navigation Helpers**: Next/previous page indicators
- **Total Count**: Complete pagination metadata

### 🏷️ **Filter Metadata**
- **Available Categories**: Dynamic category list for filtering
- **Available Cities**: List of cities with equipment
- **Applied Filters**: Current filter state for UI

## 🎨 Frontend Integration Examples

### Equipment Listing Component
```javascript
// Fetch equipment with filters
const fetchEquipment = async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.category) params.append('type', filters.category);
    if (filters.city) params.append('city', filters.city);
    if (filters.search) params.append('search', filters.search);
    if (filters.minPrice) params.append('min_price', filters.minPrice);
    if (filters.maxPrice) params.append('max_price', filters.maxPrice);
    if (filters.sortBy) params.append('sort_by', filters.sortBy);
    if (filters.sortOrder) params.append('sort_order', filters.sortOrder);
    if (filters.page) params.append('page', filters.page);
    
    const response = await fetch(`/api/equipment?${params}`);
    return response.json();
};

// Usage
const equipmentData = await fetchEquipment({
    category: 1,
    city: 'Agriculture City',
    search: 'tractor',
    minPrice: 100,
    maxPrice: 500,
    sortBy: 'daily_rate',
    sortOrder: 'ASC',
    page: 1
});
```

### Equipment Details Component
```javascript
// Fetch single equipment details
const fetchEquipmentDetails = async (equipmentId) => {
    const response = await fetch(`/api/equipment/${equipmentId}`);
    return response.json();
};

// Usage
const equipment = await fetchEquipmentDetails(1);
console.log(equipment.data.name); // Equipment name
console.log(equipment.data.vendor_shop_name); // Vendor name
console.log(equipment.data.average_rating); // Rating
console.log(equipment.data.images); // Image gallery
console.log(equipment.data.similar_equipment); // Recommendations
```

### Search and Filter UI
```javascript
// Dynamic filter building
const buildFilterUI = (filterData) => {
    const categories = filterData.categories.map(cat => ({
        value: cat.id,
        label: cat.name
    }));
    
    const cities = filterData.cities.map(city => ({
        value: city,
        label: city
    }));
    
    return { categories, cities };
};

// Apply filters
const applyFilters = (filters) => {
    const filteredData = await fetchEquipment(filters);
    updateEquipmentList(filteredData.data.equipment);
    updatePagination(filteredData.data.pagination);
};
```

## 🔍 Search Capabilities

### Multi-Field Search
The search parameter searches across:
- **Equipment Name**: Primary equipment identifier
- **Model**: Equipment model number/name
- **Description**: Detailed equipment description
- **Specifications**: Technical specifications and features

### Search Examples
```http
# Search for tractors
GET /api/equipment?search=tractor

# Search for specific power range
GET /api/equipment?search=120HP

# Search for features
GET /api/equipment?search=4WD hydraulic

# Combined search with filters
GET /api/equipment?search=tractor&type=1&city=Farm%20Town&min_price=100
```

## 💡 Usage Patterns

### Equipment Marketplace
```javascript
// Homepage - Featured equipment
const featured = await fetchEquipment({ limit: 8, sort_by: 'daily_rate' });

// Category page - Tractors
const tractors = await fetchEquipment({ type: 1, limit: 20 });

// Search results
const searchResults = await fetchEquipment({ 
    search: userQuery, 
    page: currentPage 
});

// Vendor page - All equipment from vendor
const vendorEquipment = await fetchEquipment({ vendor_id: vendorId });
```

### Equipment Discovery
```javascript
// Browse by location
const localEquipment = await fetchEquipment({ 
    city: userCity, 
    sort_by: 'daily_rate',
    sort_order: 'ASC'
});

// Price range filtering
const budgetEquipment = await fetchEquipment({
    min_price: 50,
    max_price: 200,
    sort_by: 'daily_rate'
});

// Similar equipment recommendations
const equipmentDetails = await fetchEquipmentDetails(equipmentId);
const similar = equipmentDetails.data.similar_equipment;
```

## ❌ Error Handling

### Common Error Responses

**Equipment Not Found:**
```json
{
    "success": false,
    "message": "Equipment not found or vendor not approved"
}
```

**Invalid Parameters:**
```json
{
    "success": false,
    "message": "Failed to retrieve equipment"
}
```

**Server Error:**
```json
{
    "success": false,
    "message": "Failed to retrieve equipment details"
}
```

## 🧪 Testing

### Run Equipment Tests
```bash
# Start server
npm start

# Run public equipment tests
node test-equipment-public.js
```

### Test Coverage
- ✅ Basic equipment listing with pagination
- ✅ Category and city filtering
- ✅ Vendor-specific equipment
- ✅ Search functionality
- ✅ Price range filtering
- ✅ Sorting options
- ✅ Equipment details with related data
- ✅ Filter combinations
- ✅ Error handling

## 🎯 Performance Considerations

- **Efficient Queries**: Optimized SQL with proper joins
- **Pagination**: Prevents large data transfers
- **Index Usage**: Database indexes on commonly filtered fields
- **Image Handling**: Efficient image path storage and retrieval
- **Vendor Filtering**: Only shows equipment from approved vendors

The public equipment routes provide a comprehensive equipment browsing experience with powerful filtering and detailed information! 🚜🔍