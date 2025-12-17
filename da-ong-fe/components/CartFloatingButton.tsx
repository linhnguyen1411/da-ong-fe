import React, { useState } from 'react';
import { ShoppingBag, X } from 'lucide-react';
import { useBookingCart } from '../contexts/BookingContext';
import { getMenuItem, getMenuItems } from '../services/api';
import { useEffect } from 'react';
import { MENU_ITEMS } from '../data';

interface CartFloatingButtonProps {}

const CartFloatingButton: React.FC<CartFloatingButtonProps> = () => {
  const { cartItems, removeFromCart, clearCart, updateCartItemQuantity } = useBookingCart();
  const [open, setOpen] = useState(false);
  const [dishes, setDishes] = useState<any[]>([]);
  const [apiMenuItems, setApiMenuItems] = useState<any[]>([]);

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

  // Tính tổng tiền tạm tính
  const totalPrice = dishes.reduce((sum, dish) => {
    const qty = cartItems[dish.id] || 1;
    const price = Number(dish.price || dish.price === 0 ? dish.price : dish.price || dish.price_vnd || 0);
    return sum + price * qty;
  }, 0);

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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative animate-fadeIn" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-dark transition-colors"
            >
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold mb-4 text-dark">Đơn tạm tính</h3>
            {dishes.length === 0 ? (
              <div className="text-gray-500 italic text-center">Chưa chọn món nào</div>
            ) : (
              <>
                <ul className="divide-y divide-gray-200 mb-4">
                  {dishes.map(dish => {
                    const qty = cartItems[dish.id] || 1;
                    const price = Number(dish.price || dish.price === 0 ? dish.price : dish.price || dish.price_vnd || 0);
                    return (
                      <li key={dish.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <img src={dish.thumbnail_url || dish.image_url || dish.image} alt={dish.name} className="w-12 h-12 object-cover rounded" />
                          <div>
                            <div className="font-bold text-dark">{dish.name}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-2">
                              <button onClick={() => updateCartItemQuantity(String(dish.id), qty - 1)} className="px-2 py-0.5 bg-gray-200 rounded text-lg font-bold">-</button>
                              <input
                                type="number"
                                min={1}
                                value={qty}
                                onChange={e => updateCartItemQuantity(String(dish.id), Number(e.target.value))}
                                className="w-10 text-center border border-gray-200 rounded mx-1"
                              />
                              <button onClick={() => updateCartItemQuantity(String(dish.id), qty + 1)} className="px-2 py-0.5 bg-gray-200 rounded text-lg font-bold">+</button>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-sm text-gray-700">x{qty}</span>
                          <span className="text-primary font-bold text-base">{(price * qty).toLocaleString('vi-VN')}đ</span>
                          <button onClick={() => removeFromCart(String(dish.id))} className="text-red-500 hover:text-red-700 text-xs font-bold mt-1">Xóa</button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <div className="flex items-center justify-between border-t pt-4 mb-2">
                  <span className="font-bold text-lg text-dark">Tạm tính</span>
                  <span className="font-bold text-primary text-2xl">{totalPrice.toLocaleString('vi-VN')}đ</span>
                </div>
              </>
            )}
            {dishes.length > 0 && (
              <>
                <button
                  onClick={() => {
                    clearCart();
                    setDishes([]);
                    // Also clear pending booking if exists to reset selectedDishes
                    localStorage.removeItem('pendingBooking');
                    setTimeout(() => setOpen(false), 50);
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
                  className="w-full bg-primary hover:bg-yellow-500 text-dark font-bold py-2 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 mb-1"
                >
                  Tiến hành đặt bàn
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CartFloatingButton;
