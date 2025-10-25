import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { USER_ROLES } from '@/utils/constants';
import toast from 'react-hot-toast';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, activeRole, profile, switchRole, isAuthenticated } = useAuthStore();

  const isOwnerView = location.pathname.startsWith('/owner');
  const isSitterView = location.pathname.startsWith('/sitter');

  const ownerTabs = [
    { name: 'Explore', path: '/owner/explore', icon: '🔍' },
    { name: 'Wishlist', path: '/owner/wishlist', icon: '❤️' },
    { name: 'Bookings', path: '/owner/bookings', icon: '📅' },
    { name: 'Messages', path: '/owner/messages', icon: '💬' },
    { name: 'Profile', path: '/owner/profile', icon: '👤' },
  ];

  const sitterTabs = [
    { name: 'Home', path: '/sitter/dashboard', icon: '🏠' },
    { name: 'Certificates', path: '/sitter/certificates', icon: '🎓' },
    { name: 'Listing', path: '/sitter/listing', icon: '📝' },
    { name: 'Messages', path: '/sitter/messages', icon: '💬' },
    { name: 'Profile', path: '/sitter/profile', icon: '👤' },
  ];

  const tabs = isOwnerView ? ownerTabs : isSitterView ? sitterTabs : [];

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      toast.success('Logged out successfully');
      navigate('/');
    }
  };

  const handleRoleSwitch = async () => {
    if (activeRole === USER_ROLES.OWNER) {
      // Switching from owner to sitter - check if verified
      if (profile?.is_verified) {
        const result = await switchRole(USER_ROLES.SITTER);
        if (result.success) {
          navigate('/sitter/dashboard');
          toast.success('Switched to Sitter mode!');
        } else {
          toast.error(result.error || 'Failed to switch role');
        }
      } else {
        toast.error('You need to become a sitter first. Visit your profile to get started.');
      }
    } else {
      // Switching from sitter to owner - always allowed
      const result = await switchRole(USER_ROLES.OWNER);
      if (result.success) {
        navigate('/owner/explore');
        toast.success('Switched to Owner mode!');
      } else {
        toast.error(result.error || 'Failed to switch role');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1
              className="text-2xl font-bold text-primary-600 cursor-pointer"
              onClick={() => navigate('/owner/explore')}
            >
              PetBNB
            </h1>
            <div className="flex gap-2">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={handleRoleSwitch}
                    className="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100"
                  >
                    Switch to {activeRole === USER_ROLES.OWNER ? 'Sitter' : 'Owner'}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => navigate(isOwnerView ? '/owner/profile' : '/sitter/profile')}
                  className="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-600 rounded-md border-2 hover:bg-primary-700"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20">
        <div className="flex justify-around">
          {tabs.map((tab) => (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex-1 flex flex-col items-center py-3 text-xs font-medium ${
                location.pathname === tab.path
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="text-xl mb-1">{tab.icon}</span>
              <span>{tab.name}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
