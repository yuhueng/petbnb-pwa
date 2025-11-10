import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';

/**
 * ProfileModal Component
 * Displays detailed profile information for owners or sitters
 * @param {Object} props
 * @param {string} props.userId - The user ID to display
 * @param {boolean} props.isOpen - Modal open state
 * @param {Function} props.onClose - Close handler
 */
const ProfileModal = ({ userId, isOpen, onClose }) => {
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [pets, setPets] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId || !isOpen) return;

    loadProfile();
  }, [userId, isOpen]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // If sitter, fetch listings and certifications
      if (profileData.last_role === 'sitter') {
        // Fetch listings
        const { data: listingsData } = await supabase
          .from('listings')
          .select('*')
          .eq('sitter_id', userId)
          .eq('is_active', true);

        setListings(listingsData || []);

        // Fetch certifications
        const { data: certsData } = await supabase
          .from('certifications')
          .select('*')
          .eq('sitter_id', userId);

        setCertifications(certsData || []);
      }

      // If owner, fetch pets
      if (profileData.last_role === 'owner') {
        const { data: petsData } = await supabase
          .from('pets')
          .select('*')
          .eq('owner_id', userId)
          .eq('is_active', true);

        setPets(petsData || []);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !userId) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div
          className="fixed inset-0 bg-black bg-opacity-60 transition-opacity backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-12">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#fb7678]"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const isSitter = profile.last_role === 'sitter';
  const memberSince = new Date(profile.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-60 transition-opacity backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-10 p-2 bg-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Scrollable Content */}
          <div className="overflow-y-auto max-h-[90vh]">
            {/* Header with Gradient */}
            <div className={`px-8 py-8 text-white ${
              isSitter
                ? 'bg-gradient-to-r from-[#fb7678] to-[#ffa8aa]'
                : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600'
            }`}>
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.name}
                      className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-xl"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white shadow-xl">
                      <span className="text-white font-bold text-4xl">
                        {profile.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Profile Info */}
                <div className="flex-1 pt-2">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-bold">{profile.name}</h2>
                    {profile.is_verified && (
                      <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center" title="Verified">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mb-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      isSitter
                        ? 'bg-white/30 backdrop-blur-sm'
                        : 'bg-teal-500/30 backdrop-blur-sm'
                    }`}>
                      {isSitter ? '🐾 Pet Sitter' : '👤 Pet Owner'}
                    </span>
                    <span className="text-white/90 text-sm">
                      Member since {memberSince}
                    </span>
                  </div>

                  {profile.location && (
                    <p className="flex items-center text-white/90 mb-3">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {profile.location}
                    </p>
                  )}

                  {profile.bio && (
                    <p className="text-white/90 text-sm leading-relaxed">{profile.bio}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="px-8 py-6">
              {/* Sitter-specific content */}
              {isSitter && (
                <>
                  {/* Active Listings */}
                  {listings.length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-lg font-bold text-[#3e2d2e] mb-4 flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-[#fb7678] to-[#ffa8aa] rounded-lg flex items-center justify-center mr-2">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        Active Services ({listings.length})
                      </h4>
                      <div className="space-y-4">
                        {listings.map((listing) => (
                          <div key={listing.id} className="bg-gradient-to-r from-[#fcf3f3] to-[#ffe5e5] rounded-xl p-5 border border-[#ffa8aa]">
                            <h5 className="font-bold text-[#3e2d2e] mb-2">{listing.title}</h5>
                            <p className="text-[#6d6d6d] text-sm mb-3 line-clamp-2">{listing.description}</p>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {listing.service_type?.map((service) => (
                                <span
                                  key={service}
                                  className="px-3 py-1 bg-gradient-to-r from-[#fb7678] to-[#ffa8aa] text-white text-xs rounded-full font-semibold capitalize"
                                >
                                  {service.replace(/_/g, ' ')}
                                </span>
                              ))}
                            </div>
                            {(listing.price_per_day || listing.price_per_hour) && (
                              <div className="text-sm font-semibold text-[#3e2d2e]">
                                {listing.price_per_day && `$${(listing.price_per_day / 100).toFixed(0)}/day`}
                                {listing.price_per_day && listing.price_per_hour && ' • '}
                                {listing.price_per_hour && `$${(listing.price_per_hour / 100).toFixed(0)}/hour`}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {certifications.length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-lg font-bold text-[#3e2d2e] mb-4 flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-[#fb7678] to-[#ffa8aa] rounded-lg flex items-center justify-center mr-2">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                        </div>
                        Certifications ({certifications.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {certifications.map((cert) => (
                          <div key={cert.id} className="bg-gradient-to-r from-[#fcf3f3] to-[#ffe5e5] rounded-lg p-4 border border-[#ffa8aa]">
                            <div className="flex items-start gap-3">
                              {cert.is_verified && (
                                <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                              <div className="flex-1">
                                <h5 className="font-semibold text-[#3e2d2e] text-sm">{cert.certification_name}</h5>
                                {cert.issuing_organization && (
                                  <p className="text-xs text-[#6d6d6d] mt-1">{cert.issuing_organization}</p>
                                )}
                                {cert.issued_date && (
                                  <p className="text-xs text-[#6d6d6d] mt-1">
                                    Issued: {new Date(cert.issued_date).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty state for sitters */}
                  {listings.length === 0 && certifications.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-[#ffe5e5] rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-[#fb7678]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-[#6d6d6d]">No services or certifications listed yet</p>
                    </div>
                  )}
                </>
              )}

              {/* Owner-specific content */}
              {!isSitter && (
                <>
                  {/* Pets */}
                  {pets.length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-lg font-bold text-[#3e2d2e] mb-4 flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-2">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        Pets ({pets.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pets.map((pet) => (
                          <div key={pet.id} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
                            <div className="flex items-start gap-4">
                              {pet.photo_url ? (
                                <img
                                  src={pet.photo_url}
                                  alt={pet.name}
                                  className="w-16 h-16 rounded-full object-cover border-2 border-green-300"
                                />
                              ) : (
                                <div className="w-16 h-16 rounded-full bg-green-200 flex items-center justify-center border-2 border-green-300">
                                  <span className="text-2xl">🐾</span>
                                </div>
                              )}
                              <div className="flex-1">
                                <h5 className="font-bold text-[#3e2d2e] mb-1">{pet.name}</h5>
                                <div className="flex flex-wrap gap-2 mb-2">
                                  <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full font-medium capitalize">
                                    {pet.species}
                                  </span>
                                  {pet.breed && (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                      {pet.breed}
                                    </span>
                                  )}
                                </div>
                                {pet.age && (
                                  <p className="text-xs text-[#6d6d6d]">
                                    {pet.age} {pet.age === 1 ? 'year' : 'years'} old
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty state for owners */}
                  {pets.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-[#ffe5e5] rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-[#fb7678]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-[#6d6d6d]">No pets added yet</p>
                    </div>
                  )}
                </>
              )}

              {/* Close Button */}
              <div className="flex justify-end pt-6 border-t-2 border-gray-200">
                <button
                  onClick={onClose}
                  className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
