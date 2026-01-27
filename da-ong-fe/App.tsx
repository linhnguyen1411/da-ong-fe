import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import BestSellerPage from './pages/BestSellerPage';
import DailySpecialPage from './pages/DailySpecialPage';
import ContactPage from './pages/ContactPage';
import BookingPage from './pages/BookingPage';
import AdminLoginPage from './pages/AdminLoginPage';
// Admin pages
import AdminDashboard from './pages/admin/AdminDashboardNew';
import AdminCategories from './pages/admin/AdminCategories';
import AdminMenuItems from './pages/admin/AdminMenuItems';
import AdminBookings from './pages/admin/AdminBookings';
import AdminContacts from './pages/admin/AdminContacts';
import AdminRooms from './pages/admin/AdminRooms';
import AdminBestSellers from './pages/admin/AdminBestSellers';
import AdminDailySpecials from './pages/admin/AdminDailySpecials';
import AdminMenuImages from './pages/admin/AdminMenuImages';
import AdminCustomers from './pages/admin/AdminCustomers';
import { BookingProvider } from './contexts/BookingContext';
import CartFloatingButton from './components/CartFloatingButton';

const ScrollToTop = () => {
    const { pathname } = useLocation();
  
    React.useEffect(() => {
      window.scrollTo(0, 0);
    }, [pathname]);
  
    return null;
};

// Layout cho trang khách hàng (có Header & Footer)
const CustomerLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex flex-col min-h-screen">
    <Header />
    <main className="flex-grow">{children}</main>
    <Footer />
    <CartFloatingButton />
  </div>
);

const App: React.FC = () => {
  return (
    <BookingProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/menu-items" element={<AdminMenuItems />} />
          <Route path="/admin/best-sellers" element={<AdminBestSellers />} />
          <Route path="/admin/daily-specials" element={<AdminDailySpecials />} />
          <Route path="/admin/bookings" element={<AdminBookings />} />
          <Route path="/admin/contacts" element={<AdminContacts />} />
          <Route path="/admin/rooms" element={<AdminRooms />} />
          <Route path="/admin/menu-images" element={<AdminMenuImages />} />
          <Route path="/admin/customers" element={<AdminCustomers />} />
          
          {/* Customer routes - có Header/Footer */}
          <Route path="/" element={<CustomerLayout><HomePage /></CustomerLayout>} />
          <Route path="/menu" element={<CustomerLayout><MenuPage /></CustomerLayout>} />
          <Route path="/best-seller" element={<CustomerLayout><BestSellerPage /></CustomerLayout>} />
          <Route path="/daily-special" element={<CustomerLayout><DailySpecialPage /></CustomerLayout>} />
          <Route path="/contact" element={<CustomerLayout><ContactPage /></CustomerLayout>} />
          <Route path="/booking" element={<CustomerLayout><BookingPage /></CustomerLayout>} />
        </Routes>
      </Router>
    </BookingProvider>
  );
};

export default App;