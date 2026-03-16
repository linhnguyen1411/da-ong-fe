import React, { useState, useEffect } from 'react';
import { ShoppingBag, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useBookingCart } from '../contexts/BookingContext';
import { getMenuItems, API_BASE_ORIGIN } from '../services/api';
import { MENU_ITEMS } from '../data';
import { useLocation } from 'react-router-dom';

// Helper to get proper image URL
const getImageUrl = (url?: string) => {
  if (!url) return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPktow7RuZyBjw7MgaMOsbmgg4bqjbmg8L3RleHQ+PC9zdmc+';
  return url.startsWith('http') ? url : `${API_BASE_ORIGIN}${url}`;
};

interface CartFloatingButtonProps {}

const CartFloatingButton: React.FC<CartFloatingButtonProps> = () => {
  const { cartItems, removeFromCart, clearCart, updateCartItemQuantity } = useBookingCart();
  const location = useLocation();
  const isHomePage = location.pathname === '/' || location.pathname === '/menu';
  
  // Check if desktop (PC) - width >= 1024px
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [minimized, setMinimized] = useState(false);
  const [open, setOpen] = useState(false);
  const [dishes, setDishes] = useState<any[]>([]);
  const [apiMenuItems, setApiMenuItems] = useState<any[]>([]);

  // Listen for window resize
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load all menu items from API once
  useEffect(() => {
    getMenuItems().then(setApiMenuItems).catch(() => setApiMenuItems([]));
  }, []);

  useEffect(() => {
    // Build dish info for all items in cart
    const ids = Object.keys(cartItems);
    const dishMap = {};
    if (apiMenuItems.length > 0) {
      apiMenuItems.forEach(item => {
        dishMap[String(item.id)] = item;
      });
    }
    MENU_ITEMS.forEach(item => {
      if (!dishMap[item.id]) dishMap[item.id] = item;
    });
    // Compose dish list for cart
    const result = ids.map(id => {
      let dish = dishMap[id];
      if (!dish) return null;
      return dish;
    }).filter(Boolean);
    setDishes(result);
  }, [open, cartItems, apiMenuItems]);

  const totalCount: number = (Object.values(cartItems) as number[]).reduce((a, b) => a + b, 0);

  // Tính tổng tiền tạm tính (bỏ qua món thời giá)
  const totalPrice = dishes.reduce((sum, dish) => {
    const qty = cartItems[dish.id] || 1;
    const isMarketPrice = dish.is_market_price || dish.isMarketPrice || false;
    if (isMarketPrice) return sum; // Bỏ qua món thời giá khi tính tổng
    const price = Number(dish.price || dish.price === 0 ? dish.price : dish.price || dish.price_vnd || 0);
    return sum + price * qty;
  }, 0);

  // Desktop sticky panel content
  const renderCartContent = (isSticky = false) => (
    <div className={isSticky ? "" : "animate-fadeIn"}>
      <h3 className="text-xl font-bold mb-4 text-dark flex items-center gap-2">
        <ShoppingBag size={24} className="text-primary" />
        Đơn tạm tính
        {totalCount > 0 && (
          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">
            {totalCount}
          </span>
        )}
      </h3>
      {dishes.length === 0 ? (
        <div className="text-gray-500 italic text-center py-4">Chưa chọn món nào</div>
      ) : (
        <>
          <ul className="divide-y divide-gray-200 mb-4 max-h-[300px] overflow-y-auto">
            {dishes.map(dish => {
              const qty = cartItems[dish.id] || 1;
              const price = Number(dish.price || dish.price === 0 ? dish.price : dish.price || dish.price_vnd || 0);
              const isMarketPrice = dish.is_market_price || dish.isMarketPrice || false;
              return (
                <li key={dish.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <img src={getImageUrl(dish.thumbnail_url || dish.image_url || dish.images_urls?.[0] || dish.image)} alt={dish.name} className="w-12 h-12 object-cover rounded" />
                    <div>
                      <div className="font-bold text-dark text-sm">{dish.name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <button onClick={() => updateCartItemQuantity(String(dish.id), qty - 1)} className="px-2 py-0.5 bg-gray-200 rounded text-lg font-bold">-</button>
                        <span className="w-6 text-center font-bold">{qty}</span>
                        <button onClick={() => updateCartItemQuantity(String(dish.id), qty + 1)} className="px-2 py-0.5 bg-gray-200 rounded text-lg font-bold">+</button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`font-bold text-sm ${isMarketPrice ? 'text-orange-500 italic' : 'text-primary'}`}>
                      {isMarketPrice ? 'Thời giá' : `${(price * qty).toLocaleString('vi-VN')}đ`}
                    </span>
                    <button onClick={() => removeFromCart(String(dish.id))} className="text-red-500 hover:text-red-700 text-xs font-bold mt-1">Xóa</button>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center justify-between border-t pt-4 mb-2">
            <span className="font-bold text-lg text-dark">Tạm tính</span>
            <div className="flex flex-col items-end">
              <span className="font-bold text-primary text-2xl">{totalPrice.toLocaleString('vi-VN')}đ</span>
              {dishes.some(d => d.is_market_price || d.isMarketPrice) && (
                <span className="text-xs text-orange-500 italic mt-1">*Có món thời giá</span>
              )}
            </div>
          </div>
        </>
      )}
      {dishes.length > 0 && (
        <>
          <button
            onClick={() => {
              clearCart();
              setDishes([]);
              localStorage.removeItem('pendingBooking');
              if (!isSticky) setTimeout(() => setOpen(false), 50);
            }}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 rounded-xl mb-2"
          >
            Xóa tất cả
          </button>
          <button
            onClick={() => {
              setOpen(false);
              window.location.href = '/booking';
            }}
            className="w-full bg-primary hover:bg-yellow-500 text-dark font-bold py-3 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
          >
            🍽️ Tiến hành đặt bàn
          </button>
        </>
      )}
    </div>
  );

  // Desktop: Show sticky panel on homepage/menu
  if (isDesktop && isHomePage) {
    return (
      <div className={`fixed right-4 top-24 z-[200] transition-all duration-300 ${minimized ? 'w-auto' : 'w-80'}`}>
        {minimized ? (
          // Minimized state - just show a button
          <button
            onClick={() => setMinimized(false)}
            className="bg-primary text-dark rounded-xl shadow-xl px-4 py-3 flex items-center gap-2 font-bold hover:bg-yellow-500 transition-all"
          >
            <ShoppingBag size={24} />
            {totalCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">
                {totalCount}
              </span>
            )}
            <ChevronDown size={20} />
          </button>
        ) : (
          // Expanded state - show full panel
          <div className="bg-white rounded-2xl shadow-2xl p-5 border border-gray-100">
            <button
              onClick={() => setMinimized(true)}
              className="absolute top-3 right-3 text-gray-400 hover:text-dark transition-colors p-1 hover:bg-gray-100 rounded"
              title="Thu nhỏ"
            >
              <ChevronUp size={20} />
            </button>
            {renderCartContent(true)}
          </div>
        )}
      </div>
    );
  }

  // Mobile & other pages: Show floating button
  return (
    <>
      <button
        className="fixed bottom-6 right-6 z-[200] bg-primary text-dark rounded-full shadow-xl w-16 h-16 flex items-center justify-center text-2xl font-bold hover:bg-yellow-500 transition-all border-4 border-white"
        onClick={() => setOpen(true)}
        aria-label="Xem giỏ hàng"
      >
        <ShoppingBag size={32} />
        {totalCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold border-2 border-white">
            {totalCount}
          </span>
        )}
      </button>
      {open && (
        <div className="fixed inset-0 z-[201] flex items-end justify-end p-4 bg-black/40" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-dark transition-colors"
            >
              <X size={24} />
            </button>
            {renderCartContent(false)}
          </div>
        </div>
      )}
    </>
  );
};

export default CartFloatingButton;
