import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useListingStore } from '@/store/listingStore';

const Listing = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, profile } = useAuthStore();
  const {
    myListings,
    currentListing,
    isLoading,
    fetchMyListings,
    createListing,
    updateListing,
    deleteListing,
    toggleListingStatus,
  } = useListingStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editingListingId, setEditingListingId] = useState(null); // Track which listing is being edited
  const [pricingType, setPricingType] = useState('per_day'); // 'per_day' or 'per_hour'
  const [coverImage, setCoverImage] = useState(null); // Cover image file
  const [coverImagePreview, setCoverImagePreview] = useState(null); // Preview URL
  const [isUploadingImage, setIsUploadingImage] = useState(false); // Upload state
  const fileInputRef = useState(null); // Reference to file input
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    service_type: [],
    accepted_pet_types: [],
    accepted_pet_sizes: [],
    max_pets: 1,
    price_per_day: '',
    price_per_hour: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    amenities: [],
    house_rules: '',
    cancellation_policy: '',
    available_from: '',
    available_to: '',
  });

  // Service types options
  const serviceTypes = [
    { value: 'boarding', label: 'Pet Boarding' },
    { value: 'daycare', label: 'Daycare' },
    { value: 'walking', label: 'Dog Walking' },
    { value: 'grooming', label: 'Grooming' },
  ];

  // Pet types options
  const petTypes = [
    { value: 'dog', label: 'Dog' },
    { value: 'cat', label: 'Cat' },
    { value: 'bird', label: 'Bird' },
    { value: 'rabbit', label: 'Rabbit' },
    { value: 'hamster', label: 'Hamster' },
    { value: 'other', label: 'Other' },
  ];

  // Pet sizes options
  const petSizes = [
    { value: 'small', label: 'Small (0-10 kg)' },
    { value: 'medium', label: 'Medium (10-25 kg)' },
    { value: 'large', label: 'Large (25+ kg)' },
  ];

  // Amenities options
  const amenitiesOptions = [
    { value: 'fenced_yard', label: 'Fenced Yard' },
    { value: 'air_conditioning', label: 'Air Conditioning' },
    { value: 'pool', label: 'Pool' },
    { value: 'park_nearby', label: 'Park Nearby' },
    { value: 'emergency_transport', label: 'Emergency Transport' },
  ];

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchMyListings(user.id);
    }
  }, [isAuthenticated, user, fetchMyListings]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (name, value) => {
    setFormData((prev) => {
      const currentValues = prev[name] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];
      return {
        ...prev,
        [name]: newValues,
      };
    });
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (PNG, JPG, GIF, or WEBP)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5 MB');
      return;
    }

    setCoverImage(file);

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setCoverImagePreview(previewUrl);
  };

  const handleRemoveImage = () => {
    if (coverImagePreview) {
      URL.revokeObjectURL(coverImagePreview);
    }
    setCoverImage(null);
    setCoverImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert('Please log in to create a listing');
      return;
    }

    // Validate required fields
    if (!formData.title || !formData.description) {
      alert('Please fill in all required fields (Title, Description)');
      return;
    }

    if (formData.service_type.length === 0) {
      alert('Please select at least one service type');
      return;
    }

    if (formData.accepted_pet_types.length === 0) {
      alert('Please select at least one pet type');
      return;
    }

    // Validate pricing based on selected pricing type
    if (pricingType === 'per_day' && !formData.price_per_day) {
      alert('Please enter a price per day');
      return;
    }

    if (pricingType === 'per_hour' && !formData.price_per_hour) {
      alert('Please enter a price per hour');
      return;
    }

    // Validate that the price is a valid number
    const priceValue = pricingType === 'per_day' ? formData.price_per_day : formData.price_per_hour;
    if (isNaN(parseFloat(priceValue)) || parseFloat(priceValue) <= 0) {
      alert('Please enter a valid price greater than 0');
      return;
    }

    // Upload cover image if selected
    let coverImageUrl = null;
    if (coverImage) {
      setIsUploadingImage(true);
      try {
        const { listingImageService } = await import('@/services/listingImageService');

        // For new listings, create a temporary ID; for edits, use existing ID
        const tempListingId = editingListingId || `temp-${Date.now()}`;

        const uploadResult = await listingImageService.uploadCoverImage(coverImage, tempListingId);

        if (!uploadResult.success) {
          alert(`Failed to upload image: ${uploadResult.error}`);
          setIsUploadingImage(false);
          return;
        }

        coverImageUrl = uploadResult.url;
      } catch (error) {
        console.error('Image upload error:', error);
        alert('Failed to upload image. Please try again.');
        setIsUploadingImage(false);
        return;
      } finally {
        setIsUploadingImage(false);
      }
    }

    // Prepare data
    const listingData = {
      ...formData,
      // Convert prices to cents (integer) based on selected pricing type
      price_per_day: pricingType === 'per_day' && formData.price_per_day
        ? Math.round(parseFloat(formData.price_per_day) * 100)
        : null,
      price_per_hour: pricingType === 'per_hour' && formData.price_per_hour
        ? Math.round(parseFloat(formData.price_per_hour) * 100)
        : null,
      max_pets: parseInt(formData.max_pets),
      // Set dates or null
      available_from: formData.available_from || null,
      available_to: formData.available_to || null,
      // Add cover image URL if uploaded
      cover_image_url: coverImageUrl || formData.cover_image_url || null,
    };

    let result;
    if (editingListingId) {
      result = await updateListing(editingListingId, listingData);
    } else {
      result = await createListing(user.id, listingData);
    }

    if (result.success) {
      alert(editingListingId ? 'Listing updated successfully!' : 'Listing created successfully!');
      resetForm();
      fetchMyListings(user.id);
    } else {
      alert(`Failed to ${editingListingId ? 'update' : 'create'} listing: ${result.error}`);
    }
  };

  const handleEdit = (listing) => {
    setIsEditing(true);
    setEditingListingId(listing.id); // Set the ID of the listing being edited

    // Detect which pricing type the listing uses
    if (listing.price_per_day) {
      setPricingType('per_day');
    } else if (listing.price_per_hour) {
      setPricingType('per_hour');
    }

    // Load existing image if available
    if (listing.cover_image_url) {
      setCoverImagePreview(listing.cover_image_url);
    }

    setFormData({
      title: listing.title || '',
      description: listing.description || '',
      service_type: listing.service_type || [],
      accepted_pet_types: listing.accepted_pet_types || [],
      accepted_pet_sizes: listing.accepted_pet_sizes || [],
      max_pets: listing.max_pets || 1,
      price_per_day: listing.price_per_day ? (listing.price_per_day / 100).toFixed(2) : '',
      price_per_hour: listing.price_per_hour ? (listing.price_per_hour / 100).toFixed(2) : '',
      address: listing.address || '',
      city: listing.city || '',
      state: listing.state || '',
      postal_code: listing.postal_code || '',
      amenities: listing.amenities || [],
      house_rules: listing.house_rules || '',
      cancellation_policy: listing.cancellation_policy || '',
      available_from: listing.available_from || '',
      available_to: listing.available_to || '',
      cover_image_url: listing.cover_image_url || '',
    });
  };

  const handleDelete = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) {
      return;
    }

    const result = await deleteListing(listingId);
    if (result.success) {
      alert('Listing deleted successfully!');
      fetchMyListings(user.id);
    } else {
      alert(`Failed to delete listing: ${result.error}`);
    }
  };

  const handleToggleStatus = async (listingId, currentStatus) => {
    const result = await toggleListingStatus(listingId, !currentStatus);
    if (result.success) {
      alert(`Listing ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      fetchMyListings(user.id);
    } else {
      alert(`Failed to toggle listing status: ${result.error}`);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingListingId(null); // Clear the editing ID
    setPricingType('per_day'); // Reset to default pricing type

    // Clear image state
    if (coverImagePreview && !formData.cover_image_url) {
      // Only revoke if it's a local blob URL, not an existing image URL
      URL.revokeObjectURL(coverImagePreview);
    }
    setCoverImage(null);
    setCoverImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setFormData({
      title: '',
      description: '',
      service_type: [],
      accepted_pet_types: [],
      accepted_pet_sizes: [],
      max_pets: 1,
      price_per_day: '',
      price_per_hour: '',
      address: '',
      city: '',
      state: '',
      postal_code: '',
      amenities: [],
      house_rules: '',
      cancellation_policy: '',
      available_from: '',
      available_to: '',
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <svg
          className="w-24 h-24 text-text-disabled mb-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
        <h2 className="text-2xl font-bold text-text-primary mb-3">Please log in to manage your listing</h2>
        <p className="text-text-secondary mb-6">You need to be logged in to create and manage listings</p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-3 bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          Log In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header with Add Button */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Listings</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage your pet sitting services</p>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-3 sm:px-6 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Add Listing</span>
          </button>
        </div>

      {/* Create/Edit Form Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-gradient-to-br from-gray-900/70 via-indigo-900/70 to-purple-900/70 backdrop-blur-sm transition-opacity"
            onClick={resetForm}
          />

          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
              {/* Close Button */}
              <button
                onClick={resetForm}
                className="absolute top-6 right-6 z-10 p-2.5 bg-white rounded-full shadow-lg hover:bg-red-50 hover:text-red-600 transition-all duration-200 group border border-gray-200"
              >
                <svg className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Header with Gradient */}
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  {editingListingId ? 'Edit Listing' : 'Create New Listing'}
                </h2>
                <p className="text-indigo-100 mt-2 text-sm">Fill in the details about your pet sitting services</p>
              </div>

              <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">

                <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-indigo-100">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Basic Information</h3>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Listing Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="e.g., Loving Pet Care in Your Home"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="5"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                placeholder="Describe your services, experience, and what makes you a great pet sitter..."
                required
              />
              <p className="mt-2 text-xs text-gray-500">Make it engaging and informative for potential clients</p>
            </div>

            {/* Cover Image Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Cover Image
                <span className="text-gray-500 font-normal ml-2">(Recommended)</span>
              </label>

              {/* Image Preview or Upload Button */}
              {coverImagePreview ? (
                <div className="relative">
                  <img
                    src={coverImagePreview}
                    alt="Cover preview"
                    className="w-full h-64 object-cover rounded-xl border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-64 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/50 transition-all flex flex-col items-center justify-center gap-3 group"
                  >
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                      <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-700 group-hover:text-indigo-600 transition-colors">
                        Click to upload cover image
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF or WEBP (max 5MB)</p>
                    </div>
                  </button>
                </div>
              )}
              <p className="mt-2 text-xs text-gray-500">
                A great cover image helps attract more bookings. Show your space or happy pets you've cared for!
              </p>
            </div>
          </div>

          {/* Services Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-purple-100">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Services & Pets</h3>
            </div>

            {/* Service Types */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Service Types <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {serviceTypes.map((service) => (
                  <label key={service.value} className="relative flex items-center p-4 cursor-pointer border-2 border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group">
                    <input
                      type="checkbox"
                      checked={formData.service_type.includes(service.value)}
                      onChange={() => handleCheckboxChange('service_type', service.value)}
                      className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-indigo-700">{service.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Accepted Pet Types */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Accepted Pet Types <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {petTypes.map((pet) => (
                  <label key={pet.value} className="relative flex items-center p-4 cursor-pointer border-2 border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50/50 transition-all group">
                    <input
                      type="checkbox"
                      checked={formData.accepted_pet_types.includes(pet.value)}
                      onChange={() => handleCheckboxChange('accepted_pet_types', pet.value)}
                      className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-purple-700">{pet.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Accepted Pet Sizes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Accepted Pet Sizes
              </label>
              <div className="grid grid-cols-3 gap-3">
                {petSizes.map((size) => (
                  <label key={size.value} className="relative flex items-center p-4 cursor-pointer border-2 border-gray-200 rounded-xl hover:border-pink-300 hover:bg-pink-50/50 transition-all group">
                    <input
                      type="checkbox"
                      checked={formData.accepted_pet_sizes.includes(size.value)}
                      onChange={() => handleCheckboxChange('accepted_pet_sizes', size.value)}
                      className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-pink-700">{size.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Capacity & Pricing Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-green-100">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Capacity & Pricing</h3>
            </div>

            {/* Max Pets */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Maximum Pets at Once</label>
              <input
                type="number"
                name="max_pets"
                value={formData.max_pets}
                onChange={handleInputChange}
                min="1"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              />
            </div>

            {/* Pricing Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Pricing Type <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4 mb-4">
                <label className="relative flex items-center p-4 cursor-pointer border-2 rounded-xl hover:border-green-300 hover:bg-green-50/50 transition-all group flex-1">
                  <input
                    type="radio"
                    name="pricingType"
                    value="per_day"
                    checked={pricingType === 'per_day'}
                    onChange={(e) => setPricingType(e.target.value)}
                    className="w-5 h-5 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-700 group-hover:text-green-700 block">Per Day</span>
                    <span className="text-xs text-gray-500">Charge by daily rate</span>
                  </div>
                </label>
                <label className="relative flex items-center p-4 cursor-pointer border-2 rounded-xl hover:border-green-300 hover:bg-green-50/50 transition-all group flex-1">
                  <input
                    type="radio"
                    name="pricingType"
                    value="per_hour"
                    checked={pricingType === 'per_hour'}
                    onChange={(e) => setPricingType(e.target.value)}
                    className="w-5 h-5 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-700 group-hover:text-green-700 block">Per Hour</span>
                    <span className="text-xs text-gray-500">Charge by hourly rate</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Price Input (based on selected pricing type) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {pricingType === 'per_day' ? 'Price per Day ($)' : 'Price per Hour ($)'}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-lg">$</span>
                </div>
                <input
                  type="text"
                  name={pricingType === 'per_day' ? 'price_per_day' : 'price_per_hour'}
                  value={pricingType === 'per_day' ? formData.price_per_day : formData.price_per_hour}
                  onChange={handleInputChange}
                  className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder={pricingType === 'per_day' ? '50.00' : '10.00'}
                  required
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Enter the {pricingType === 'per_day' ? 'daily' : 'hourly'} rate for your services
              </p>
            </div>
          </div>

          {/* Location Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-blue-100">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Location</h3>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Street Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="123 Main Street"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="New York"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="NY"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Postal Code</label>
                <input
                  type="text"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="10001"
                />
              </div>
            </div>
          </div>

          {/* Amenities Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-amber-100">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Amenities & Features</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {amenitiesOptions.map((amenity) => (
                <label key={amenity.value} className="relative flex items-center p-4 cursor-pointer border-2 border-gray-200 rounded-xl hover:border-amber-300 hover:bg-amber-50/50 transition-all group">
                  <input
                    type="checkbox"
                    checked={formData.amenities.includes(amenity.value)}
                    onChange={() => handleCheckboxChange('amenities', amenity.value)}
                    className="w-5 h-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-amber-700">{amenity.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Availability Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-teal-100">
              <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Availability</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Available From
                </label>
                <input
                  type="date"
                  name="available_from"
                  value={formData.available_from}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Available To</label>
                <input
                  type="date"
                  name="available_to"
                  value={formData.available_to}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Policies Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-rose-100">
              <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Rules & Policies</h3>
            </div>

            {/* House Rules */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">House Rules</label>
              <textarea
                name="house_rules"
                value={formData.house_rules}
                onChange={handleInputChange}
                rows="4"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors resize-none"
                placeholder="Any rules or expectations for pet owners..."
              />
            </div>

            {/* Cancellation Policy */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Cancellation Policy
              </label>
              <textarea
                name="cancellation_policy"
                value={formData.cancellation_policy}
                onChange={handleInputChange}
                rows="4"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors resize-none"
                placeholder="Your cancellation policy..."
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-6 border-t-2 border-gray-100">
            <button
              type="button"
              onClick={resetForm}
              className="px-8 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || isUploadingImage}
              className="flex-1 px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              {isUploadingImage ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading Image...
                </>
              ) : isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {editingListingId ? 'Update Listing' : 'Create Listing'}
                </>
              )}
            </button>
          </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* My Listings */}
        <div>
          {isLoading && myListings.length === 0 ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : myListings.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-200">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No listings yet</h3>
              <p className="text-gray-600 mb-6">Create your first listing to start accepting bookings from pet owners</p>
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Listing
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {myListings.map((listing) => {
                // Get location for display
                const location = listing.city && listing.state
                  ? `${listing.city}, ${listing.state}`
                  : 'Location not set';

                // Get primary service
                const primaryService = listing.service_type?.[0]?.replace(/_/g, ' ') || 'Pet Care';

                // Calculate price display
                const priceDisplay = (() => {
                  if (listing.price_per_day) {
                    return {
                      value: (listing.price_per_day / 100).toFixed(0),
                      unit: 'day',
                    };
                  }
                  if (listing.price_per_hour) {
                    return {
                      value: (listing.price_per_hour / 100).toFixed(0),
                      unit: 'hour',
                    };
                  }
                  return null;
                })();

                // Determine image source
                const cardImage = listing.cover_image_url || listing.image_urls?.[0];

                // Get gradient for service type
                const getPlaceholderGradient = () => {
                  const gradients = {
                    boarding: 'from-blue-400 to-indigo-600',
                    daycare: 'from-green-400 to-emerald-600',
                    walking: 'from-amber-400 to-orange-600',
                    grooming: 'from-purple-400 to-pink-600',
                    default: 'from-gray-400 to-gray-600',
                  };
                  return gradients[listing.service_type?.[0]] || gradients.default;
                };

                return (
                  <div key={listing.id} className="group">
                    <div className="relative overflow-hidden rounded-xl">
                      {/* Image Section */}
                      <div className="relative aspect-[4/3] overflow-hidden bg-gray-200">
                        {cardImage ? (
                          <img
                            src={cardImage}
                            alt={listing.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className={`absolute inset-0 bg-gradient-to-br ${getPlaceholderGradient()} flex items-center justify-center`}>
                            <svg className="w-16 h-16 text-white opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                              />
                            </svg>
                          </div>
                        )}

                        {/* Status Badge */}
                        <div className="absolute top-3 right-3">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm ${
                            listing.is_active
                              ? 'bg-green-500/90 text-white'
                              : 'bg-gray-500/90 text-white'
                          }`}>
                            {listing.is_active ? '● Active' : '○ Inactive'}
                          </span>
                        </div>

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                      </div>

                      {/* Info Section */}
                      <div className="pt-3">
                        {/* Location & Title */}
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {location}
                        </h3>
                        <p className="text-sm text-gray-600 truncate mt-0.5">
                          {listing.title}
                        </p>
                        <p className="text-sm text-gray-500 capitalize mt-0.5">
                          {primaryService}
                        </p>

                        {/* Price */}
                        <div className="mt-2">
                          {priceDisplay ? (
                            <p className="text-sm">
                              <span className="font-semibold text-gray-900">${priceDisplay.value}</span>
                              <span className="text-gray-600"> / {priceDisplay.unit}</span>
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500">Price upon request</p>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-3 gap-2 mt-4">
                          <button
                            onClick={() => handleEdit(listing)}
                            className="px-3 py-2 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleStatus(listing.id, listing.is_active)}
                            className={`px-3 py-2 text-xs rounded-lg transition-colors font-medium ${
                              listing.is_active
                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {listing.is_active ? 'Pause' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDelete(listing.id)}
                            className="px-3 py-2 bg-red-100 text-red-600 text-xs rounded-lg hover:bg-red-200 transition-colors font-medium flex items-center justify-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Listing;
