import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { certificationService } from '@/services/certificationService';
import toast from 'react-hot-toast';

const Certificates = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCert, setEditingCert] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [certificateImage, setCertificateImage] = useState(null);
  const [certificateImagePreview, setCertificateImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    certification_type: '',
    certification_name: '',
    issuing_organization: '',
    certificate_number: '',
    document_url: '',
    issued_date: '',
    expiry_date: '',
  });

  const certificationTypes = [
    { value: 'pet_first_aid', label: 'Pet First Aid' },
    { value: 'cpr_certified', label: 'CPR Certified' },
    { value: 'dog_training', label: 'Dog Training' },
    { value: 'cat_behavior', label: 'Cat Behavior Specialist' },
    { value: 'grooming', label: 'Professional Grooming' },
    { value: 'veterinary_assistant', label: 'Veterinary Assistant' },
    { value: 'animal_care', label: 'Animal Care Certificate' },
    { value: 'pet_nutrition', label: 'Pet Nutrition' },
    { value: 'other', label: 'Other' },
  ];

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchCertifications();
    }
  }, [isAuthenticated, user]);

  const fetchCertifications = async () => {
    try {
      setLoading(true);
      const data = await certificationService.fetchCertificationsBySitter(user.id);
      setCertifications(data);
    } catch (error) {
      console.error('Error fetching certifications:', error);
      toast.error('Failed to load certifications');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (PNG, JPG, or WEBP)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5 MB');
      return;
    }

    setCertificateImage(file);

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setCertificateImagePreview(previewUrl);
  };

  const handleRemoveImage = () => {
    if (certificateImagePreview) {
      URL.revokeObjectURL(certificateImagePreview);
    }
    setCertificateImage(null);
    setCertificateImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.certification_type) {
      toast.error('Please select a certification type');
      return;
    }

    if (!formData.certification_name) {
      toast.error('Please enter the certification name');
      return;
    }

    if (!formData.issued_date) {
      toast.error('Please enter the issued date');
      return;
    }

    if (!formData.expiry_date) {
      toast.error('Please enter the expiry date');
      return;
    }

    // Validate that expiry date is after issued date
    if (new Date(formData.expiry_date) <= new Date(formData.issued_date)) {
      toast.error('Expiry date must be after the issued date');
      return;
    }

    try {
      setUploadingImage(true);
      let documentUrl = formData.document_url;

      // Upload image if selected
      if (certificateImage) {
        const uploadResult = await certificationService.uploadCertificateImage(
          certificateImage,
          user.id
        );

        if (uploadResult.success) {
          documentUrl = uploadResult.url;
        } else {
          throw new Error('Failed to upload certificate image');
        }
      }

      const certData = {
        ...formData,
        document_url: documentUrl,
        sitter_id: user.id,
      };

      if (editingCert) {
        await certificationService.updateCertification(editingCert.id, {
          ...formData,
          document_url: documentUrl,
        });
        toast.success('Certification updated successfully!');
      } else {
        await certificationService.createCertification(certData);
        toast.success('Certification added successfully!');
      }

      // Reset form and close modal
      resetForm();
      setShowAddModal(false);
      setEditingCert(null);
      fetchCertifications();
    } catch (error) {
      console.error('Error saving certification:', error);
      toast.error('Failed to save certification. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEdit = (cert) => {
    setEditingCert(cert);
    setFormData({
      certification_type: cert.certification_type || '',
      certification_name: cert.certification_name || '',
      issuing_organization: cert.issuing_organization || '',
      certificate_number: cert.certificate_number || '',
      document_url: cert.document_url || '',
      issued_date: cert.issued_date || '',
      expiry_date: cert.expiry_date || '',
    });

    // Set preview if there's an existing image
    if (cert.document_url) {
      setCertificateImagePreview(cert.document_url);
    }

    setShowAddModal(true);
  };

  const handleDelete = async (certId) => {
    if (!confirm('Are you sure you want to delete this certification?')) {
      return;
    }

    try {
      await certificationService.deleteCertification(certId);
      toast.success('Certification deleted');
      fetchCertifications();
    } catch (error) {
      console.error('Error deleting certification:', error);
      toast.error('Failed to delete certification');
    }
  };

  const resetForm = () => {
    setFormData({
      certification_type: '',
      certification_name: '',
      issuing_organization: '',
      certificate_number: '',
      document_url: '',
      issued_date: '',
      expiry_date: '',
    });
    handleRemoveImage();
  };

  const handleAddNew = () => {
    setEditingCert(null);
    resetForm();
    setShowAddModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h2 className="text-2xl font-bold text-[#3e2d2e] mb-3">Please log in to view certificates</h2>
        <p className="text-[#6d6d6d] mb-6">You need to be logged in to manage your certifications</p>
        <button
          onClick={() => navigate('/sitter/profile')}
          className="px-6 py-3 bg-[#fb7678] text-white rounded-lg font-medium hover:bg-[#fa6568] transition-colors"
        >
          Log In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fef5f6]">
      {/* Mobile-First Container - 393px max width */}
      <div className="max-w-[393px] mx-auto px-[22px] py-[82px] pb-[50px]">
        {/* Page Header */}
        <header className="flex justify-center items-center gap-[66px] mb-[22px]">
          <h1 className="text-[20px] font-semibold leading-[1.2] text-[#3e2d2e] m-0">
            My Certifications
          </h1>
        </header>

        {/* Main Content */}
        <main>
          {/* Add Certificate Section */}
          <section className="mb-[27px]">
            <h2 className="text-[18px] font-semibold leading-[1.2] text-[#3e2d2e] mb-[13px] m-0">
              Add Certificate
            </h2>
            <button
              onClick={handleAddNew}
              className="w-full h-[115px] bg-white rounded-[10px] shadow-[0px_2px_4px_-2px_rgba(0,0,0,0.1),0px_4px_6px_-1px_rgba(0,0,0,0.1)] flex items-center justify-center cursor-pointer hover:-translate-y-0.5 transition-transform duration-200"
              aria-label="Add new certificate"
            >
              {/* <div className="w-[52px] h-[52px] bg-[#fb8284] rounded-full flex items-center justify-center text-white text-[28px] font-light">
                +
              </div> */}
              <div className="flex items-center justify-center">
                <img src="/icons/common/add-pink-icon.svg" alt="Add Certificates" className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full" />
              </div>
            </button>
          </section>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#fb7678]"></div>
            </div>
          )}

          {/* Your Certifications Section */}
          {!loading && (
            <section>
              <h2 className="text-[18px] font-semibold leading-[1.2] text-[#3e2d2e] mb-[12px] m-0">
                Your Certifications
              </h2>

              {/* Empty State */}
              {certifications.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[#7d7d7d] text-sm">No certifications yet</p>
                  <p className="text-[#7d7d7d] text-xs mt-2">Click "Add Certificate" to get started</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-[10px]">
                  {certifications.map((cert) => (
                    <article key={cert.id} className="flex flex-col group">
                      {/* Certificate Image */}
                      {cert.document_url ? (
                        <img
                          src={cert.document_url}
                          alt={cert.certification_name}
                          className="w-full h-[139px] rounded-[10px] object-cover shadow-[0px_1px_2px_-1px_rgba(0,0,0,0.1),0px_1px_3px_0px_rgba(0,0,0,0.1)]"
                        />
                      ) : (
                        <div className="w-full h-[139px] rounded-[10px] bg-gradient-to-br from-[#fb7678] to-[#ffa8aa] shadow-[0px_1px_2px_-1px_rgba(0,0,0,0.1),0px_1px_3px_0px_rgba(0,0,0,0.1)] flex items-center justify-center">
                          <svg className="w-12 h-12 text-white opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      )}

                      {/* Certificate Info */}
                      <div className="pt-[6px] flex flex-col gap-[3px]">
                        <h3 className="text-[16px] font-semibold leading-[1.2] text-[#3e2d2e] m-0 line-clamp-1">
                          {cert.certification_name}
                        </h3>
                        {cert.issued_date && (
                          <p className="text-[12px] font-semibold leading-[1.2] text-[#7d7d7d] m-0">
                            Issued: {formatDate(cert.issued_date)}
                          </p>
                        )}
                        {cert.expiry_date && (
                          <p className="text-[12px] font-semibold leading-[1.2] text-[#7d7d7d] m-0">
                            Valid till: {formatDate(cert.expiry_date)}
                          </p>
                        )}

                        {/* Action Buttons - Show on hover/tap */}
                        <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(cert)}
                            className="flex-1 px-2 py-1 bg-[#fb7678] text-white text-[10px] rounded hover:bg-[#fa6568] transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(cert.id)}
                            className="flex-1 px-2 py-1 bg-red-500 text-white text-[10px] rounded hover:bg-red-600 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </main>

        {/* Responsive behavior for extra small screens */}
        <style jsx>{`
          @media (max-width: 380px) {
            .grid-cols-2 {
              grid-template-columns: 1fr;
              justify-items: center;
            }
            article {
              max-width: 250px;
            }
          }
        `}</style>
      </div>

      {/* Add/Edit Certification Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => {
              setShowAddModal(false);
              setEditingCert(null);
              resetForm();
            }}
          />

          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
              {/* Close Button */}
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCert(null);
                  resetForm();
                }}
                className="absolute top-4 right-4 z-10 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Header */}
              <div className="bg-gradient-to-r from-[#fb7678] to-[#ffa8aa] px-6 py-4">
                <h2 className="text-xl font-bold text-white">
                  {editingCert ? 'Edit Certification' : 'Add New Certification'}
                </h2>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Certificate Image Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Certificate Image
                    </label>
                    {certificateImagePreview ? (
                      <div className="relative">
                        <img
                          src={certificateImagePreview}
                          alt="Certificate preview"
                          className="w-full h-40 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                          className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#fb7678] hover:bg-[#ffe5e5]/50 transition-all flex flex-col items-center justify-center gap-2 group"
                        >
                          <div className="w-12 h-12 bg-[#ffe5e5] rounded-full flex items-center justify-center group-hover:bg-[#ffa8aa]/30 transition-colors">
                            <svg className="w-6 h-6 text-[#fb7678]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-semibold text-gray-700 group-hover:text-[#fb7678] transition-colors">
                              Click to upload image
                            </p>
                            <p className="text-xs text-gray-500 mt-1">PNG, JPG, or WEBP (max 5MB)</p>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Certification Type */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Certification Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="certification_type"
                      value={formData.certification_type}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#fb7678] focus:border-[#fb7678] transition-colors text-sm"
                    >
                      <option value="">Select a type</option>
                      {certificationTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Certification Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Certification Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="certification_name"
                      value={formData.certification_name}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., Pet Grooming Certificate"
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#fb7678] focus:border-[#fb7678] transition-colors text-sm"
                    />
                  </div>

                  {/* Issuing Organization */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Issuing Organization
                    </label>
                    <input
                      type="text"
                      name="issuing_organization"
                      value={formData.issuing_organization}
                      onChange={handleInputChange}
                      placeholder="e.g., American Red Cross"
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#fb7678] focus:border-[#fb7678] transition-colors text-sm"
                    />
                  </div>

                  {/* Date Fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Issued Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="issued_date"
                        value={formData.issued_date}
                        onChange={handleInputChange}
                        required
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#fb7678] focus:border-[#fb7678] transition-colors text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Valid Till <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="expiry_date"
                        value={formData.expiry_date}
                        onChange={handleInputChange}
                        required
                        min={formData.issued_date || new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#fb7678] focus:border-[#fb7678] transition-colors text-sm"
                      />
                    </div>
                  </div>

                  {/* Helper text for dates */}
                  <p className="text-xs text-gray-500 -mt-2">
                    Both issued date and expiry date are required for verification
                  </p>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setEditingCert(null);
                        resetForm();
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={uploadingImage}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-[#fb7678] to-[#ffa8aa] text-white rounded-lg font-medium hover:from-[#fa6568] hover:to-[#fe8c85] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                    >
                      {uploadingImage ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Uploading...
                        </>
                      ) : (
                        <>{editingCert ? 'Update' : 'Add'} Certification</>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Certificates;
