import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import api from './lib/api';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Navbar from './components/layout/Navbar';
import PageLayout from './components/layout/PageLayout';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import AdminDashboard from './pages/AdminDashboard';
import AdminRoute from './components/AdminRoute';
import Profile from './pages/Profile';
import AddressBook from './pages/AddressBook';
import ChangePassword from './pages/ChnagePassword';
import ToastProvider from './components/ui/ToastProvider';
import Wishlist from './pages/Wishlist'
import useWishlistStore from './store/wishlistStore'

// For pages that require login (cart, checkout, orders, profile, etc.)
function ProtectedLayout({ children }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" />;
  return (
    <>
      <Navbar />
      <PageLayout>{children}</PageLayout>
    </>
  );
}

// For pages guests can view (home, shop, product detail)
function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      <PageLayout>{children}</PageLayout>
    </>
  );
}

function App() {
  const { setUser, clearUser, setLoading } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // const res = await api.get('/api/auth/me'); this is for node.js backend api
        const res = await api.get('/me');
        setUser(res.data);
        // fetch wishlist IDs after login
        const { fetchIds } = useWishlistStore.getState()
        fetchIds()
      } catch {
        clearUser();
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const { isLoading } = useAuthStore();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <Router>
      <ToastProvider />
      <Routes>
        {/* Auth pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Public pages — guests can view */}
        <Route path="/home" element={<PublicLayout><Home /></PublicLayout>} />
        <Route path="/shop" element={<PublicLayout><Shop /></PublicLayout>} />
        <Route path="/product/:id" element={<PublicLayout><ProductDetail /></PublicLayout>} />

        {/* Protected pages — login required */}
        <Route path="/cart" element={<ProtectedLayout><Cart /></ProtectedLayout>} />
        <Route path="/checkout" element={<ProtectedLayout><Checkout /></ProtectedLayout>} />
        <Route path="/orders" element={<ProtectedLayout><Orders /></ProtectedLayout>} />
        <Route path="/profile" element={<ProtectedLayout><Profile /></ProtectedLayout>} />
        <Route path="/address-book" element={<ProtectedLayout><AddressBook /></ProtectedLayout>} />
        <Route path="/change-password" element={<ProtectedLayout><ChangePassword /></ProtectedLayout>} />

        <Route path="/wishlist" element={<ProtectedLayout><Wishlist /></ProtectedLayout>} />

        {/* Admin only */}
        <Route
          path="/admin"
          element={
            <ProtectedLayout>
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            </ProtectedLayout>
          }
        />

        <Route path="/" element={<Navigate to="/home" />} />
      </Routes>
    </Router>
  );
}

export default App;