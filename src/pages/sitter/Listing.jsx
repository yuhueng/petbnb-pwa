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

    // Prepare data
    const listingData = {
      ...formData,
      // Convert prices to cents (integer)
      price_per_day: formData.price_per_day ? Math.round(parseFloat(formData.price_per_day) * 100) : null,
      price_per_hour: formData.price_per_hour ? Math.round(parseFloat(formData.price_per_hour) * 100) : null,
      max_pets: parseInt(formData.max_pets),
      // Set dates or null
      available_from: formData.available_from || null,
      available_to: formData.available_to || null,
    };

    let result;
    if (isEditing && currentListing) {
      result = await updateListing(currentListing.id, listingData);
    } else {
      result = await createListing(user.id, listingData);
    }

    if (result.success) {
      alert(isEditing ? 'Listing updated successfully!' : 'Listing created successfully!');
      resetForm();
      fetchMyListings(user.id);
    } else {
      alert(`Failed to ${isEditing ? 'update' : 'create'} listing: ${result.error}`);
    }
  };

  const handleEdit = (listing) => {
    setIsEditing(true);
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
          className="w-24 h-24 text-gray-300 mb-6"
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
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Please log in to manage your listing</h2>
        <p className="text-gray-600 mb-6">You need to be logged in to create and manage listings</p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          Log In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Listing</h1>

      {/* Create/Edit Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {isEditing ? 'Edit Listing' : 'Create New Listing'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Loving Pet Care in Your Home"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Describe your services, experience, and what makes you a great pet sitter..."
              required
            />
          </div>

          {/* Service Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Types <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {serviceTypes.map((service) => (
                <label key={service.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.service_type.includes(service.value)}
                    onChange={() => handleCheckboxChange('service_type', service.value)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm">{service.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Accepted Pet Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Accepted Pet Types <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {petTypes.map((pet) => (
                <label key={pet.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.accepted_pet_types.includes(pet.value)}
                    onChange={() => handleCheckboxChange('accepted_pet_types', pet.value)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm">{pet.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Accepted Pet Sizes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Accepted Pet Sizes
            </label>
            <div className="grid grid-cols-2 gap-3">
              {petSizes.map((size) => (
                <label key={size.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.accepted_pet_sizes.includes(size.value)}
                    onChange={() => handleCheckboxChange('accepted_pet_sizes', size.value)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm">{size.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Max Pets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Pets</label>
            <input
              type="number"
              name="max_pets"
              value={formData.max_pets}
              onChange={handleInputChange}
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price per Day ($)
              </label>
              <input
                type="number"
                name="price_per_day"
                value={formData.price_per_day}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="50.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price per Hour ($)
              </label>
              <input
                type="number"
                name="price_per_hour"
                value={formData.price_per_hour}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="10.00"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Location</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="123 Main St"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="New York"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="NY"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                <input
                  type="text"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="10001"
                />
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
            <div className="grid grid-cols-2 gap-3">
              {amenitiesOptions.map((amenity) => (
                <label key={amenity.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.amenities.includes(amenity.value)}
                    onChange={() => handleCheckboxChange('amenities', amenity.value)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm">{amenity.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available From
              </label>
              <input
                type="date"
                name="available_from"
                value={formData.available_from}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Available To</label>
              <input
                type="date"
                name="available_to"
                value={formData.available_to}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* House Rules */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">House Rules</label>
            <textarea
              name="house_rules"
              value={formData.house_rules}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Any rules or expectations for pet owners..."
            />
          </div>

          {/* Cancellation Policy */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cancellation Policy
            </label>
            <textarea
              name="cancellation_policy"
              value={formData.cancellation_policy}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Your cancellation policy..."
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : isEditing ? 'Update Listing' : 'Create Listing'}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* My Listings */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">My Listings</h2>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        ) : myListings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No listings yet. Create your first listing above!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myListings.map((listing) => (
              <div
                key={listing.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold">{listing.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {listing.city && listing.state
                        ? `${listing.city}, ${listing.state}`
                        : 'No location'}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      listing.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {listing.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <p className="text-gray-700 text-sm mb-3 line-clamp-2">{listing.description}</p>

                <div className="flex flex-wrap gap-2 mb-3">
                  {listing.service_type?.map((service) => (
                    <span
                      key={service}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {service}
                    </span>
                  ))}
                </div>

                <div className="text-sm text-gray-600 mb-4">
                  {listing.price_per_day && (
                    <span className="mr-4">
                      ${(listing.price_per_day / 100).toFixed(2)}/day
                    </span>
                  )}
                  {listing.price_per_hour && (
                    <span>${(listing.price_per_hour / 100).toFixed(2)}/hour</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(listing)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleStatus(listing.id, listing.is_active)}
                    className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    {listing.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(listing.id)}
                    className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Listing;
