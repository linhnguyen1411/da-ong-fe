import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { label: 'THỰC ĐƠN', path: '/menu' },
    { label: 'BEST SELLER', path: '/best-seller' },
    { label: 'MÓN NGON', path: '/daily-special' },
    { label: 'LIÊN HỆ', path: '/contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 w-full bg-dark/95 backdrop-blur-sm text-white z-50 border-b border-gray-800 shadow-lg h-20">
      <div className="container mx-auto px-4 h-full flex items-center justify-between relative">
        {/* Logo: Đá (White) & Ong (Yellow/Primary) */}
        <Link to="/" className="flex items-center gap-2 relative z-10">
          <div className="bg-white rounded-lg p-2 border-2 border-primary/30 shadow-md">
            <img 
              src="/LOGO-DA-ONG.png" 
              alt="ĐÁ & ONG" 
              className="h-10 w-auto object-contain"
              onError={(e) => {
                // Fallback to text if image fails
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement?.parentElement;
                if (parent) {
                  const textFallback = document.createElement('span');
                  textFallback.className = 'text-2xl font-serif font-bold tracking-wider uppercase';
                  textFallback.innerHTML = '<span class="text-white">ĐÁ</span> <span class="text-primary">& ONG</span>';
                  parent.appendChild(textFallback);
                }
              }}
            />
          </div>
        </Link>

        {/* Desktop Nav - Absolutely Centered */}
        <nav className="hidden md:flex items-center space-x-8 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-max">
          {navItems.slice(0, 2).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm font-medium tracking-wide hover:text-primary transition-colors ${
                isActive(item.path) ? 'text-primary' : 'text-gray-300'
              }`}
            >
              {item.label}
            </Link>
          ))}

          {/* Center CTA Button - Yellow background, Black text for contrast */}
          <Link
            to="/booking"
            className="bg-primary hover:bg-yellow-500 text-dark font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300 border-2 border-primary ring-2 ring-primary/50 ring-offset-2 ring-offset-dark animate-pulse-glow"
          >
            ĐẶT BÀN
          </Link>

          {navItems.slice(2).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm font-medium tracking-wide hover:text-primary transition-colors ${
                isActive(item.path) ? 'text-primary' : 'text-gray-300'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile Menu Button - Pushed to right by justify-between */}
        <div className="relative z-10 flex items-center">
            <button
            className="md:hidden text-gray-300 hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-dark border-t border-gray-800 absolute w-full top-20 left-0 shadow-xl animate-fadeIn">
          <div className="flex flex-col p-4 space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-300 hover:text-primary font-medium py-2 border-b border-gray-800"
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/booking"
              onClick={() => setIsMobileMenuOpen(false)}
              className="bg-primary text-dark font-bold py-3 text-center rounded-lg shadow-md animate-pulse-glow"
            >
              ĐẶT BÀN NGAY
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;