import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl } from '../utils/apiConfig';

const EquipmentUpload = ({ onSuccess, onCancel }) => {
  const { user, isVendor } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    dailyRate: '',
    hourlyRate: '',
    specifications: '',
    location: '',
    availability: true
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Equipment categories
  const categories = [
    'Tractors',
    'Harvesters',
    'Plowing Equipment',
    'Seeding Equipment',
    'Irrigation Systems',
    'Spraying Equipment',
    'Tillage Equipment',
    'Hay Equipment',
    'Livestock Equipment',
    'Other'
  ];

  // Handle text input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear errors when user starts typing
    if (error) setError('');
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      setError('Please select only image files (JPEG, PNG, WebP)');
      return;
    }

    // Validate file sizes (max 5MB per file)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = files.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      setError('Each image must be smaller than 5MB');
      return;
    }

    // Limit to 5 images
    if (files.length > 5) {
      setError('You can upload maximum 5 images');
      return;
    }

    setImages(files);
    setError('');

    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  // Remove image from selection
  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    // Revoke the URL to free memory
    URL.revokeObjectURL(imagePreviews[index]);
    
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  // Validate form
  const validateForm = () => {
    const requiredFields = ['name', 'description', 'category', 'dailyRate', 'location'];
    const missingFields = requiredFields.filter(field => !formData[field].trim());
    
    if (missingFields.length > 0) {
      setError(`Please fill in: ${missingFields.join(', ')}`);
      return false;
    }

    if (parseFloat(formData.dailyRate) <= 0) {
      setError('Daily rate must be greater than 0');
      return false;
    }

    if (formData.hourlyRate && parseFloat(formData.hourlyRate) <= 0) {
      setError('Hourly rate must be greater than 0');
      return false;
    }

    if (images.length === 0) {
      setError('Please upload at least one image');
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isVendor()) {
      setError('Only vendors can upload equipment');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Create FormData object
      const submitFormData = new FormData();
      
      // Add text fields
      Object.keys(formData).forEach(key => {
        submitFormData.append(key, formData[key]);
      });

      // Add vendor ID
      submitFormData.append('vendorId', user.id);

      // Add images
      images.forEach((image, index) => {
        submitFormData.append('images', image);
      });

      // Submit to API
      const response = await fetch(getApiUrl('/api/vendor/equipment'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
          // Don't set Content-Type - let browser set it with boundary for FormData
        },
        body: submitFormData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload equipment');
      }

      setSuccess('Equipment uploaded successfully!');
      
      // Clear form
      setFormData({
        name: '',
        description: '',
        category: '',
        dailyRate: '',
        hourlyRate: '',
        specifications: '',
        location: '',
        availability: true
      });
      setImages([]);
      setImagePreviews([]);

      // Call success callback
      if (onSuccess) {
        onSuccess(data.equipment);
      }

    } catch (err) {
      setError(err.message || 'Failed to upload equipment');
    } finally {
      setLoading(false);
    }
  };

  // Cleanup preview URLs on unmount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    return () => {
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  if (!isVendor()) {
    return (
      <div className="equipment-upload">
        <div className="error-message">
          Only vendors can upload equipment. Please log in as a vendor.
        </div>
      </div>
    );
  }

  return (
    <div className="equipment-upload">
      <div className="upload-header">
        <h2>🚜 Add New Equipment</h2>
        <p>Upload your agricultural equipment for rental</p>
      </div>

      <form onSubmit={handleSubmit} className="equipment-form">
        {/* Basic Information */}
        <div className="form-section">
          <h3>Basic Information</h3>
          
          <div className="form-group">
            <label htmlFor="name">Equipment Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., John Deere 8400R Tractor"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your equipment, its condition, and key features"
              rows="4"
              required
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="form-section">
          <h3>Pricing</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dailyRate">Daily Rate ($) *</label>
              <input
                type="number"
                id="dailyRate"
                name="dailyRate"
                value={formData.dailyRate}
                onChange={handleInputChange}
                placeholder="150"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="hourlyRate">Hourly Rate ($)</label>
              <input
                type="number"
                id="hourlyRate"
                name="hourlyRate"
                value={formData.hourlyRate}
                onChange={handleInputChange}
                placeholder="25"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="form-section">
          <h3>Technical Details</h3>
          
          <div className="form-group">
            <label htmlFor="specifications">Specifications</label>
            <textarea
              id="specifications"
              name="specifications"
              value={formData.specifications}
              onChange={handleInputChange}
              placeholder="Engine power, dimensions, weight, operating hours, etc."
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">Location *</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="City, State"
              required
            />
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="availability"
                checked={formData.availability}
                onChange={handleInputChange}
              />
              <span className="checkbox-text">Available for rental</span>
            </label>
          </div>
        </div>

        {/* Image Upload */}
        <div className="form-section">
          <h3>Equipment Images *</h3>
          
          <div className="image-upload">
            <div className="upload-area">
              <input
                type="file"
                id="images"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="file-input"
              />
              <label htmlFor="images" className="upload-label">
                <div className="upload-icon">📷</div>
                <div className="upload-text">
                  <strong>Click to upload images</strong>
                  <br />
                  <small>JPEG, PNG, WebP up to 5MB each (max 5 images)</small>
                </div>
              </label>
            </div>

            {imagePreviews.length > 0 && (
              <div className="image-previews">
                <h4>Selected Images ({imagePreviews.length}/5)</h4>
                <div className="preview-grid">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="preview-item">
                      <img src={preview} alt={`Preview ${index + 1}`} />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="remove-image"
                        title="Remove image"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        {success && (
          <div className="form-success">
            {success}
          </div>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="cancel-button"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Uploading...
              </>
            ) : (
              'Upload Equipment'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EquipmentUpload;