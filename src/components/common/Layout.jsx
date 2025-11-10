import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { USER_ROLES } from '@/utils/constants';
import toast from 'react-hot-toast';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeRole, profile, switchRole, isAuthenticated } = useAuthStore();

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
    <div className="min-h-screen bg-[#fef5f6] pb-20">
      {/* Header */}
      <header className="bg-white shadow-[0px_1px_4px_rgba(0,0,0,0.25)] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1
              className="text-xl sm:text-2xl font-bold text-[#fb7678] cursor-pointer font-['Inter']"
              onClick={() => navigate('/owner/explore')}
            >
              PetBNB
            </h1>
            <div className="flex gap-2">
              {isAuthenticated ? (
                <button
                  onClick={handleRoleSwitch}
                  className="px-4 py-2 text-sm font-semibold text-[#fb7678] bg-[#fcf3f3] border border-[#fb7678] rounded-[30px] hover:bg-[#f5f5f5] transition-all duration-300"
                >
                  Switch to {activeRole === USER_ROLES.OWNER ? 'Sitter' : 'Owner'}
                </button>
              ) : (
                <button
                  onClick={() => navigate(isOwnerView ? '/owner/profile' : '/sitter/profile')}
                  className="px-4 py-2 text-sm font-bold text-white bg-[#fb7678] rounded-[30px] border border-[#fe8c85] hover:bg-[#fa6568] transition-all duration-300"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Mobile Navigation - Matching the guide */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-[10px_3px_20px_rgba(0,0,0,0.25)] z-20">
        <div className="flex justify-around items-center h-[78px] relative">
          {/* Active indicator line */}
          {tabs.map((tab) => (
            location.pathname === tab.path && (
              <div
                key={`line-${tab.path}`}
                className="absolute top-[5px] h-[3px] w-10 bg-[#ff8c85] rounded-[2px]"
                style={{
                  left: `calc(${tabs.indexOf(tab) * (100 / tabs.length)}% + ${50 / tabs.length}% - 20px)`
                }}
              />
            )
          ))}

          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className="flex-1 flex flex-col items-center relative"
              >
                {/* Icon Circle */}
                <div className={`w-[30px] h-[30px] rounded-full flex items-center justify-center text-base mb-1 ${
                  isActive
                    ? 'bg-[#ffe5e5] text-[#ff8c85]'
                    : 'bg-[#f5f5f5] text-[#ababab]'
                }`}>
                  {tab.icon}
                </div>
                {/* Label */}
                <span className={`text-xs font-${isActive ? 'bold' : 'semibold'} ${
                  isActive
                    ? 'text-[#ff8c85]'
                    : 'text-[#ababab]'
                }`}>
                  {tab.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
