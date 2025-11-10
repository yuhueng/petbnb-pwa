import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { certificationService } from '@/services/certificationService';

const Certificates = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCert, setEditingCert] = useState(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const certData = {
        ...formData,
        sitter_id: user.id,
      };

      if (editingCert) {
        await certificationService.updateCertification(editingCert.id, formData);
      } else {
        await certificationService.createCertification(certData);
      }

      // Reset form and close modal
      setFormData({
        certification_type: '',
        certification_name: '',
        issuing_organization: '',
        certificate_number: '',
        document_url: '',
        issued_date: '',
        expiry_date: '',
      });
      setShowAddModal(false);
      setEditingCert(null);
      fetchCertifications();
    } catch (error) {
      console.error('Error saving certification:', error);
      alert('Failed to save certification. Please try again.');
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
    setShowAddModal(true);
  };

  const handleDelete = async (certId) => {
    if (!confirm('Are you sure you want to delete this certification?')) {
      return;
    }

    try {
      await certificationService.deleteCertification(certId);
      fetchCertifications();
    } catch (error) {
      console.error('Error deleting certification:', error);
      alert('Failed to delete certification. Please try again.');
    }
  };

  const handleAddNew = () => {
    setEditingCert(null);
    setFormData({
      certification_type: '',
      certification_name: '',
      issuing_organization: '',
      certificate_number: '',
      document_url: '',
      issued_date: '',
      expiry_date: '',
    });
    setShowAddModal(true);
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
    <div className="min-h-screen bg-gradient-to-br from-[#fef5f6] to-[#fcf3f3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#3e2d2e]">My Certifications</h1>
            <p className="text-[#6d6d6d] mt-1 text-sm sm:text-base">Showcase your professional qualifications</p>
          </div>
          <button
            onClick={handleAddNew}
            className="px-3 py-3 sm:px-6 bg-[#fb7678] text-white rounded-lg font-medium hover:bg-[#fa6568] transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Add Certification</span>
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#fb7678]"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && certifications.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-200">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-[#ffe5e5] to-[#fcf3f3] rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-[#fb7678]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-[#3e2d2e] mb-2">No certifications yet</h3>
            <p className="text-[#6d6d6d] mb-6">Add your professional certifications to build trust with pet owners</p>
            <button
              onClick={handleAddNew}
              className="px-6 py-3 bg-[#fb7678] text-white rounded-lg font-medium hover:bg-[#fa6568] transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Your First Certification
            </button>
          </div>
        )}

        {/* Certifications Grid */}
        {!loading && certifications.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {certifications.map((cert) => (
              <div
                key={cert.id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200"
              >
                {/* Card Header with Gradient */}
                <div className="relative bg-gradient-to-br from-[#fb7678] to-[#ffa8aa] p-6">
                  <div className="absolute top-0 right-0 left-0 h-full bg-gradient-to-b from-transparent to-black/10"></div>
                  <div className="relative">
                    <h3 className="text-xl font-bold text-white line-clamp-2 mb-2">
                      {cert.certification_name}
                    </h3>
                    {cert.issuing_organization && (
                      <div className="flex items-center gap-1.5 text-white/90">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="text-sm font-medium">{cert.issuing_organization}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  {/* Certification Type Badge */}
                  <div className="mb-4">
                    <span className="px-3 py-1.5 bg-[#ffe5e5] text-[#fb7678] text-xs rounded-lg font-medium border border-[#ffa8aa] capitalize">
                      {cert.certification_type.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Certification Details */}
                  <div className="space-y-3 mb-5">
                    {cert.certificate_number && (
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                        <div>
                          <p className="text-xs text-[#ababab] font-medium">Certificate Number</p>
                          <p className="text-sm text-[#3e2d2e]">{cert.certificate_number}</p>
                        </div>
                      </div>
                    )}
                    {cert.issued_date && (
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <p className="text-xs text-[#ababab] font-medium">Issued Date</p>
                          <p className="text-sm text-[#3e2d2e]">{new Date(cert.issued_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}
                    {cert.expiry_date && (
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-xs text-[#ababab] font-medium">Expiry Date</p>
                          <p className="text-sm text-[#3e2d2e]">{new Date(cert.expiry_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}
                    {cert.document_url && (
                      <a
                        href={cert.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-[#fb7678] hover:text-[#fa6568] font-medium"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                        View Certificate Document
                      </a>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleEdit(cert)}
                      className="px-4 py-2.5 bg-[#fb7678] text-white text-sm rounded-lg hover:bg-[#fa6568] transition-colors font-medium flex items-center justify-center gap-1.5"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(cert.id)}
                      className="px-4 py-2.5 bg-red-50 text-red-600 text-sm rounded-lg hover:bg-red-100 transition-colors font-medium flex items-center justify-center gap-1.5"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Certification Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-gradient-to-br from-gray-900/70 via-[#fb7678]/30 to-[#ffa8aa]/30 backdrop-blur-sm transition-opacity"
              onClick={() => {
                setShowAddModal(false);
                setEditingCert(null);
              }}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                {/* Close Button */}
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingCert(null);
                  }}
                  className="absolute top-6 right-6 z-10 p-2.5 bg-white rounded-full shadow-lg hover:bg-red-50 hover:text-red-600 transition-all duration-200 group border border-gray-200"
                >
                  <svg className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Header with Gradient */}
                <div className="bg-gradient-to-r from-[#fb7678] to-[#ffa8aa] px-8 py-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    {editingCert ? 'Edit Certification' : 'Add New Certification'}
                  </h2>
                  <p className="text-white/90 mt-2 text-sm">Add your professional credentials to showcase your expertise</p>
                </div>

                <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">

                  <form onSubmit={handleSubmit} className="space-y-6">
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
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#fb7678] focus:border-[#fb7678] transition-colors"
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
                        placeholder="e.g., Certified Pet First Aid & CPR"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#fb7678] focus:border-[#fb7678] transition-colors"
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
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#fb7678] focus:border-[#fb7678] transition-colors"
                      />
                    </div>

                    {/* Certificate Number */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Certificate Number
                      </label>
                      <input
                        type="text"
                        name="certificate_number"
                        value={formData.certificate_number}
                        onChange={handleInputChange}
                        placeholder="Optional certificate/license number"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#fb7678] focus:border-[#fb7678] transition-colors"
                      />
                    </div>

                    {/* Document URL */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Document URL
                      </label>
                      <input
                        type="url"
                        name="document_url"
                        value={formData.document_url}
                        onChange={handleInputChange}
                        placeholder="https://example.com/certificate.pdf"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#fb7678] focus:border-[#fb7678] transition-colors"
                      />
                      <p className="mt-2 text-xs text-[#ababab]">
                        Link to your certification document (PDF, image, etc.)
                      </p>
                    </div>

                    {/* Date Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Issued Date
                        </label>
                        <input
                          type="date"
                          name="issued_date"
                          value={formData.issued_date}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#fb7678] focus:border-[#fb7678] transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Expiry Date
                        </label>
                        <input
                          type="date"
                          name="expiry_date"
                          value={formData.expiry_date}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#fb7678] focus:border-[#fb7678] transition-colors"
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-6 border-t-2 border-gray-100">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddModal(false);
                          setEditingCert(null);
                        }}
                        className="px-8 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-8 py-3.5 bg-gradient-to-r from-[#fb7678] to-[#ffa8aa] text-white rounded-xl font-semibold hover:from-[#fa6568] hover:to-[#fe8c85] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {editingCert ? 'Update Certification' : 'Add Certification'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Certificates;
