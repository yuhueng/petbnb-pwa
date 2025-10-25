import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

// Layouts
import Layout from '@/components/common/Layout';

// Public Pages
import Landing from '@/pages/public/Landing';

// Owner Pages
import OwnerExplore from '@/pages/owner/Explore';
import OwnerWishlist from '@/pages/owner/Wishlist';
import OwnerBookings from '@/pages/owner/Bookings';
import OwnerMessages from '@/pages/owner/Messages';
import OwnerProfile from '@/pages/owner/Profile';

// Sitter Pages
import SitterDashboard from '@/pages/sitter/Dashboard';
import SitterCertificates from '@/pages/sitter/Certificates';
import SitterListing from '@/pages/sitter/Listing';
import SitterMessages from '@/pages/sitter/Messages';
import SitterProfile from '@/pages/sitter/Profile';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// No auth gates needed - routes are public, pages handle authentication internally

function App() {
  const { initialize } = useAuthStore();

  // Initialize auth state from storage on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Landing page - entry point */}
          <Route path="/" element={<Landing />} />

          {/* Owner Routes - Public, pages handle auth internally */}
          <Route path="/owner" element={<Layout />}>
            <Route index element={<Navigate to="/owner/explore" replace />} />
            <Route path="explore" element={<OwnerExplore />} />
            <Route path="wishlist" element={<OwnerWishlist />} />
            <Route path="bookings" element={<OwnerBookings />} />
            <Route path="messages" element={<OwnerMessages />} />
            <Route path="profile" element={<OwnerProfile />} />
          </Route>

          {/* Sitter Routes - Public, pages handle auth internally */}
          <Route path="/sitter" element={<Layout />}>
            <Route index element={<Navigate to="/sitter/dashboard" replace />} />
            <Route path="dashboard" element={<SitterDashboard />} />
            <Route path="certificates" element={<SitterCertificates />} />
            <Route path="listing" element={<SitterListing />} />
            <Route path="messages" element={<SitterMessages />} />
            <Route path="profile" element={<SitterProfile />} />
          </Route>

          {/* Catch all - redirect to explore */}
          <Route path="*" element={<Navigate to="/owner/explore" replace />} />
        </Routes>

        {/* Toast Notifications */}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
