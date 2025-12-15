import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategories, getMenuItems, ApiCategory, ApiMenuItem } from '../services/api';
import { Loader2, ShoppingBag, CheckCircle, X, ArrowRight } from 'lucide-react';
import ImageGallery from '../components/ImageGallery';
import { useBookingCart } from '../contexts/BookingContext';

import { API_BASE_ORIGIN } from '../services/api';

// Helper to get full image URL
const getFullUrl = (url: string | undefined): string => {
  if (!url) return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';
  if (url.startsWith('http')) return url;
  return url.startsWith('http') ? url : `${API_BASE_ORIGIN}${url}`;
};

// Convert API data to frontend format
const mapApiMenuItemToDish = (item: ApiMenuItem) => ({
  id: String(item.id),
  name: item.name,
  price: parseFloat(item.price) || 0,
  description: item.description || '',
  image: getFullUrl(item.thumbnail_url || item.image_url),
  images: item.images_urls?.map(url => getFullUrl(url)) || [],
  category: item.category?.name || 'Khác',
  isBestSeller: false,
  isRecommended: false,
});

const MenuPage: React.FC = () => {
  // Kiểm tra nếu đang trong flow đặt bàn
  const params = new URLSearchParams(window.location.search);
  const fromBooking = params.get('fromBooking') === '1';
  const navigate = useNavigate();
  const { cartItems, addToCart, removeFromCart } = useBookingCart();
  const handleDecrease = (id: string) => {
    if (cartItems[id] > 1) {
      removeFromCart(id); // removeFromCart giảm, nên cần custom hàm tăng
    } else {
      removeFromCart(id);
    }
  };
  const [activeCategory, setActiveCategory] = useState<number | 'ALL'>('ALL');
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [menuItems, setMenuItems] = useState<ApiMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedDish, setSelectedDish] = useState<string>('');

  const handleAddToCart = (id: string, name: string) => {
    addToCart(id);
    setSelectedDish(name);
    setShowModal(true);
  };

  const handleContinue = () => {
    setShowModal(false);
  };

  const handleBookNow = () => {
    setShowModal(false);
    navigate('/booking');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [categoriesData, menuItemsData] = await Promise.all([
          getCategories(),
          getMenuItems()
        ]);
        setCategories(categoriesData);
        setMenuItems(menuItemsData);
      } catch (err) {
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredItems = activeCategory === 'ALL'
    ? menuItems
    : menuItems.filter(item => item.category_id === activeCategory);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 bg-light flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-24 pb-12 bg-light flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  // Lấy danh sách món đã chọn
  const selectedDishes = Object.entries(cartItems)
    .map(([id, qty]) => {
      const item = menuItems.find(i => String(i.id) === id);
      return item ? { ...item, qty: Number(qty) } : null;
    })
    .filter(Boolean);
  const totalPrice = selectedDishes.reduce((sum, d) => sum + (d.price * d.qty), 0);

  return (
    <div className={`min-h-screen pt-24 pb-12 bg-light ${fromBooking ? 'lg:flex lg:items-start' : ''}`}> 
      <div className={`container mx-auto px-4 ${fromBooking ? 'lg:w-3/4' : ''}`}> 
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-dark mb-4">Thực Đơn Nhà Hàng</h1>
          {fromBooking && (
            <button
              onClick={() => {
                // Lấy lại trạng thái booking tạm và chuyển về bước 4
                const pending = localStorage.getItem('pendingBooking');
                if (pending) {
                  try {
                    const state = JSON.parse(pending);
                    // Chuyển về booking, truyền step=4 qua query
                    window.location.href = '/booking?step=4';
                  } catch {}
                } else {
                  window.location.href = '/booking?step=4';
                }
              }}
              className="mt-4 px-6 py-3 bg-primary text-dark font-bold rounded-full shadow-lg hover:bg-yellow-500 transition-all text-lg"
            >
              ← Quay lại đặt bàn
            </button>
          )}
          <div className="w-24 h-1 bg-primary mx-auto"></div>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
            Khám phá hương vị ẩm thực tinh tế được chế biến bởi các đầu bếp hàng đầu.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          <button
            onClick={() => setActiveCategory('ALL')}
            className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
              activeCategory === 'ALL'
                ? 'bg-primary text-dark shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Tất cả
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                activeCategory === cat.id
                  ? 'bg-primary text-dark shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

  {/* Grid */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => {
            const dish = mapApiMenuItemToDish(item);
            return (
              <div key={item.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow flex flex-col">
                <div className="relative aspect-square overflow-hidden bg-gray-100 flex-shrink-0">
                  <ImageGallery
                    images={dish.images}
                    thumbnailUrl={dish.image}
                    alt={dish.name}
                    className="w-full h-full"
                    showThumbnails={true}
                  />
                  <div className="absolute top-3 left-3 bg-primary text-dark text-xs font-bold px-3 py-1 rounded-full z-10 pointer-events-none">
                    {dish.category}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg text-dark mb-2">{dish.name}</h3>
                  <p className="text-gray-500 text-sm mb-3 line-clamp-2">{dish.description}</p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-primary font-bold text-lg">
                      {dish.price.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                  <button 
                    onClick={() => handleAddToCart(dish.id, dish.name)}
                    className="w-full py-2 bg-primary text-dark rounded-lg font-bold hover:bg-yellow-500 transition-colors shadow-md uppercase text-sm flex items-center justify-center gap-2"
                  >
                    <ShoppingBag size={16} />
                    CHỌN MÓN
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            Không tìm thấy món ăn nào trong danh mục này.
          </div>
        )}
      </div>

      {/* Sidebar chọn món */}
      <aside className="w-full lg:w-1/4 lg:sticky lg:top-32 mt-8 lg:mt-0 lg:ml-6 bg-white rounded-2xl shadow-xl border border-gray-100 p-6 h-fit">
        <h3 className="font-bold text-lg mb-4 text-dark">Món đã chọn</h3>
        {/* Tổng kết số món ăn/đồ uống */}
        {selectedDishes.length > 0 && (
          <div className="text-sm text-gray-600 mb-2">
            {(() => {
              let foodCount = 0, drinkCount = 0;
              const getCategoryName = (cat: any) => {
                if (!cat) return '';
                if (typeof cat === 'string') return cat;
                if (typeof cat === 'object' && cat.name) return cat.name;
                return '';
              };
              selectedDishes.forEach(d => {
                const catName = getCategoryName(d.category).toLowerCase();
                if (catName.includes('uống')) drinkCount += d.qty;
                else foodCount += d.qty;
              });
              return `Đã chọn ${foodCount} món ăn, ${drinkCount} đồ uống`;
            })()}
          </div>
        )}
        {selectedDishes.length === 0 ? (
          <div className="text-gray-400 text-sm mb-4">Chưa chọn món nào.</div>
        ) : (
          <ul className="divide-y divide-gray-200 mb-4">
            {selectedDishes.map(dish => (
              <li key={dish.id} className="flex items-center justify-between py-2">
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-dark line-clamp-1">{dish.name}</span>
                  <span className="block text-xs text-gray-400">{Number(dish.price).toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <button onClick={() => removeFromCart(String(dish.id))} className="w-6 h-6 rounded-full bg-gray-200 hover:bg-red-400 text-gray-600 hover:text-white flex items-center justify-center font-bold">×</button>
                  <button onClick={() => handleDecrease(String(dish.id))} className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 text-lg font-bold">-</button>
                  <span className="font-bold w-5 text-center">{dish.qty}</span>
                  <button onClick={() => addToCart(String(dish.id))} className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 text-lg font-bold">+</button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="flex justify-between items-center font-bold text-dark mb-4">
          <span>Tổng:</span>
          <span className="text-primary text-lg">{totalPrice.toLocaleString('vi-VN')}đ</span>
        </div>
        <button
          onClick={() => {
            // Luôn đồng bộ selectedDishes vào pendingBooking trước khi chuyển bước
            const pending = localStorage.getItem('pendingBooking');
            let state = pending ? JSON.parse(pending) : {};
            state.selectedDishes = { ...cartItems };
            localStorage.setItem('pendingBooking', JSON.stringify(state));
            window.location.href = '/booking?step=1';
          }}
          className="w-full py-3 bg-primary text-dark font-bold rounded-xl shadow-lg hover:bg-yellow-500 transition-all text-lg mt-2"
        >
          Tiếp tục đặt bàn
        </button>
      </aside>

      {/* Decision Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-scaleIn">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-dark transition-colors"
            >
              <X size={24} />
            </button>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-green-600 w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-dark mb-2">Đã thêm vào danh sách!</h3>
              <p className="text-gray-600">
                Bạn đã chọn món <span className="font-bold text-primary">{selectedDish}</span>. Bạn muốn làm gì tiếp theo?
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleContinue}
                className="w-full bg-white hover:bg-gray-50 text-gray-700 font-bold py-3 rounded-xl border border-gray-300 transition-colors"
              >
                Chọn thêm món khác
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuPage;