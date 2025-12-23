import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard, UtensilsCrossed, FolderOpen, Calendar,
  Mail, DoorOpen, LogOut, Menu, X, ChevronRight, Star, Sparkles
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const menuItems = [
  { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/categories', icon: FolderOpen, label: 'Danh mục' },
  { path: '/admin/menu-items', icon: UtensilsCrossed, label: 'Món ăn' },
  { path: '/admin/best-sellers', icon: Star, label: 'Best Sellers' },
  { path: '/admin/daily-specials', icon: Sparkles, label: 'Món ngon mỗi ngày' },
  { path: '/admin/bookings', icon: Calendar, label: 'Đặt bàn' },
  { path: '/admin/contacts', icon: Mail, label: 'Liên hệ' },
  { path: '/admin/rooms', icon: DoorOpen, label: 'Phòng' },
];

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Closed by default on mobile
  const [adminUser, setAdminUser] = useState<any>(null);

  useEffect(() => {
    // Auto-open sidebar on desktop, close on mobile
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const user = localStorage.getItem('admin_user');

    if (!token) {
      navigate('/admin/login');
      return;
    }

    if (user) {
      setAdminUser(JSON.parse(user));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } w-64 bg-dark text-white transition-all duration-300 flex flex-col fixed h-full z-50`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <Link to="/admin/dashboard" className="text-xl font-serif font-bold">
            <span className="text-white">ĐÁ</span> <span className="text-primary">&amp; ONG</span>
          </Link>
          <button
            onClick={handleToggleSidebar}
            className="text-gray-400 hover:text-white p-1 lg:hidden"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition ${
                  isActive
                    ? 'bg-primary text-dark font-bold'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <item.icon size={20} />
                <span className="lg:inline">{item.label}</span>
                {isActive && <ChevronRight size={16} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">{adminUser?.name}</p>
              <p className="text-xs text-gray-400">{adminUser?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-red-400 hover:text-red-300 p-2"
              title="Đăng xuất"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 transition-all duration-300">
        {/* Top Header */}
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="px-4 lg:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-gray-600 hover:text-dark p-2"
              >
                <Menu size={24} />
              </button>
              <h1 className="text-lg lg:text-xl font-bold text-dark">{title || 'Admin Panel'}</h1>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
