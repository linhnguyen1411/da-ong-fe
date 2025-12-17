import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategories, getMenuItems, ApiCategory, ApiMenuItem } from '../services/api';
import { Loader2, ShoppingBag, CheckCircle, X, ArrowRight } from 'lucide-react';
import DishCard from '../components/DishCard';
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
  const { cartItems } = useBookingCart();
  const [activeCategory, setActiveCategory] = useState<number | 'ALL'>('ALL');
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [menuItems, setMenuItems] = useState<ApiMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Không cần modal và handleAddToCart nữa, đã dùng trong DishCard

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
        <DishCard key={dish.id} dish={dish} showAddToCart={false} />
      );
    })}
  </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            Không tìm thấy món ăn nào trong danh mục này.
          </div>
        )}
      </div>
  {/* Không cần Decision Modal, đã có trong DishCard */}
    </div>
  );
};

export default MenuPage;