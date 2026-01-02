import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategories, getMenuItems, getMenuImages, ApiCategory, ApiMenuItem, ApiMenuImage } from '../services/api';
import { Loader2, ShoppingBag, CheckCircle, X, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
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
  isMarketPrice: item.is_market_price || false,
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
  const [menuImages, setMenuImages] = useState<ApiMenuImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  // Không cần modal và handleAddToCart nữa, đã dùng trong DishCard

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [categoriesData, menuItemsData, menuImagesData] = await Promise.all([
          getCategories(),
          getMenuItems(),
          getMenuImages().catch(() => []) // Menu images optional
        ]);
        setCategories(categoriesData);
        setMenuItems(menuItemsData);
        setMenuImages(menuImagesData);
      } catch (err) {
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Auto slide menu images for mobile
  useEffect(() => {
    if (menuImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % menuImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [menuImages.length]);

  // Auto scroll for PC (4 images per row)
  useEffect(() => {
    if (menuImages.length <= 4) return;
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    let currentScroll = 0;
    let scrollDirection = 1; // 1 = right, -1 = left

    const scroll = () => {
      if (!scrollContainerRef.current) return;
      const container = scrollContainerRef.current;
      const scrollWidth = container.scrollWidth;
      const clientWidth = container.clientWidth;
      const maxScroll = scrollWidth - clientWidth;

      if (maxScroll <= 0) return;

      // Calculate width of 4 images (each image is 25% - gap)
      const imageWidth = clientWidth / 4;
      const scrollStep = imageWidth;

      currentScroll += scrollStep * scrollDirection;

      // Reverse direction at boundaries
      if (currentScroll >= maxScroll) {
        currentScroll = maxScroll;
        scrollDirection = -1;
      } else if (currentScroll <= 0) {
        currentScroll = 0;
        scrollDirection = 1;
      }

      container.scrollTo({ left: currentScroll, behavior: 'smooth' });
    };

    const interval = setInterval(scroll, 4000); // Auto scroll every 4 seconds

    return () => clearInterval(interval);
  }, [menuImages.length]);

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

        {/* Menu Images Gallery */}
        {menuImages.length > 0 && (
          <div className="mb-12">
            {/* Mobile: Carousel/Slider */}
            <div className="lg:hidden">
              <div className="relative bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="relative aspect-[3/4] max-h-[600px] bg-gray-100">
                  {menuImages.map((img, idx) => (
                    <img
                      key={img.id}
                      src={img.image_url.startsWith('http') ? img.image_url : `${API_BASE_ORIGIN}${img.image_url}`}
                      alt={`Menu ${idx + 1}`}
                      className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${
                        idx === currentImageIndex ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  ))}
                  
                  {/* Navigation */}
                  {menuImages.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImageIndex((prev) => (prev - 1 + menuImages.length) % menuImages.length)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-10"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={() => setCurrentImageIndex((prev) => (prev + 1) % menuImages.length)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-10"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                      
                      {/* Dots indicator */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                        {menuImages.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-all ${
                              idx === currentImageIndex ? 'bg-primary w-6' : 'bg-white/60 hover:bg-white'
                            }`}
                          />
                        ))}
                      </div>
                      
                      {/* Image counter */}
                      <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm z-10">
                        {currentImageIndex + 1} / {menuImages.length}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* PC: Horizontal scroll với 4 ảnh hiển thị, auto-scroll */}
            <div className="hidden lg:block">
              <div
                ref={scrollContainerRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                {menuImages.map((img, idx) => (
                  <div
                    key={img.id}
                    className="flex-shrink-0 w-[calc(25%-12px)] min-w-[calc(25%-12px)] bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    <div className="relative aspect-[3/4] bg-gray-100">
                      <img
                        src={img.image_url.startsWith('http') ? img.image_url : `${API_BASE_ORIGIN}${img.image_url}`}
                        alt={`Menu ${idx + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                ))}
              </div>
              {/* Navigation arrows for manual scroll */}
              {menuImages.length > 4 && (
                <div className="flex justify-center items-center gap-4 mt-4">
                  <button
                    onClick={() => {
                      if (scrollContainerRef.current) {
                        const container = scrollContainerRef.current;
                        const imageWidth = container.clientWidth / 4;
                        container.scrollBy({ left: -imageWidth, behavior: 'smooth' });
                      }
                    }}
                    className="p-2 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-gray-600">
                    {menuImages.length} ảnh menu
                  </span>
                  <button
                    onClick={() => {
                      if (scrollContainerRef.current) {
                        const container = scrollContainerRef.current;
                        const imageWidth = container.clientWidth / 4;
                        container.scrollBy({ left: imageWidth, behavior: 'smooth' });
                      }
                    }}
                    className="p-2 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

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