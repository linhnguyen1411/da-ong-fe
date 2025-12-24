import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import DishCard from '../components/DishCard';
import { getBestSellers, getDailySpecials, ApiBestSeller, ApiDailySpecial, getRooms, ApiRoom, ApiMenuItem, API_BASE_ORIGIN } from '../services/api';
import { Dish, DishCategory } from '../types';
import RoomCard from '../components/RoomCard';

// Helper to get full image URL
const getFullUrl = (url: string | undefined): string => {
  if (!url) return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';
  if (url.startsWith('http')) return url;
  return url.startsWith('http') ? url : `${API_BASE_ORIGIN}${url}`;
};

// Helper to convert API item to Dish type
const apiToDish = (item: ApiMenuItem): Dish => ({
  id: String(item.id),
  name: item.name,
  price: parseInt(item.price),
  description: item.description || '',
  image: getFullUrl(item.thumbnail_url || item.image_url),
  images: item.images_urls?.map(url => getFullUrl(url)) || [],
  category: DishCategory.MAIN,
  isBestSeller: false,
  isRecommended: false,
  isMarketPrice: item.is_market_price || false,
});

const HomePage: React.FC = () => {
  const [featured, setFeatured] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<ApiRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        // Fetch best sellers and daily specials
        const [bestSellers, dailySpecials] = await Promise.all([
          getBestSellers(),
          getDailySpecials(true) // Only today's specials
        ]);
        
        const dishes: Dish[] = [];
        const addedIds = new Set<string>();
        
        // Add best sellers (limit to 3)
        bestSellers.slice(0, 3).forEach(bs => {
          if (bs.menu_item) {
            const menuItem = bs.menu_item as ApiMenuItem;
            const dishId = String(menuItem.id);
            if (!addedIds.has(dishId)) {
              dishes.push(apiToDish(menuItem));
              addedIds.add(dishId);
            }
          }
        });
        
        // Add daily specials if we don't have 3 yet
        if (dishes.length < 3) {
          dailySpecials.forEach(ds => {
            if (ds.menu_item && dishes.length < 3) {
              const menuItem = ds.menu_item as ApiMenuItem;
              const dishId = String(menuItem.id);
              if (!addedIds.has(dishId)) {
                dishes.push(apiToDish(menuItem));
                addedIds.add(dishId);
              }
            }
          });
        }
        
        setFeatured(dishes);
      } catch (err) {
        console.error('Error fetching featured items:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const data = await getRooms();
        // Only show private rooms (VIP rooms)
        setRooms(data.filter(r => r.room_type === 'private'));
      } catch (err) {
        console.error('Error fetching rooms:', err);
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchRooms();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image - User will replace this */}
        <div 
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
            style={{ 
                backgroundImage: 'url("/restaurant-background.jpg")', // User will replace this image
            }}
        >
             {/* 60% overlay */}
             <div className="absolute inset-0 bg-black/60"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center text-white">
          <span className="block text-primary text-lg md:text-xl font-medium tracking-[0.2em] mb-4 animate-fadeInUp uppercase drop-shadow-lg">WELCOME TO ĐÁ & ONG</span>
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 leading-tight animate-fadeInUp drop-shadow-2xl" style={{animationDelay: '0.2s'}}>
            Thưởng Thức <br/> <span className="text-primary">Tinh Hoa</span> Ẩm Thực
          </h1>
          <p className="max-w-2xl mx-auto text-gray-200 text-lg mb-10 animate-fadeInUp drop-shadow-md font-medium" style={{animationDelay: '0.4s'}}>
            Sự kết hợp hoàn hảo giữa hương vị truyền thống Việt Nam và không gian hiện đại giữa lòng Đà Nẵng.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center animate-fadeInUp" style={{animationDelay: '0.6s'}}>
             <Link 
                to="/booking" 
                className="bg-primary hover:bg-yellow-500 text-dark font-bold py-4 px-10 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2 animate-pulse-glow"
             >
                ĐẶT BÀN NGAY
             </Link>
             <Link 
                to="/menu" 
                className="bg-black/30 hover:bg-white hover:text-dark text-white border-2 border-white font-bold py-4 px-10 rounded-full transition-all flex items-center justify-center gap-2 backdrop-blur-sm"
             >
                XEM THỰC ĐƠN
             </Link>
          </div>
        </div>
      </section>

      {/* Intro Grid */}
      <section className="py-20 bg-light">
          <div className="container mx-auto px-4 grid md:grid-cols-3 gap-8 text-center">
              <div className="p-6">
                  <h3 className="text-2xl font-serif font-bold mb-3 text-dark">Nguyên Liệu Tươi Ngon</h3>
                  <p className="text-gray-600">Sử dụng nguồn nguyên liệu nhập khẩu và hữu cơ trong ngày.</p>
              </div>
               <div className="p-6 border-l border-r border-gray-200">
                  <h3 className="text-2xl font-serif font-bold mb-3 text-dark">Đầu Bếp 5 Sao</h3>
                  <p className="text-gray-600">Đội ngũ đầu bếp hàng đầu với 20 năm kinh nghiệm.</p>
              </div>
               <div className="p-6">
                  <h3 className="text-2xl font-serif font-bold mb-3 text-dark">Không Gian Riêng Tư</h3>
                  <p className="text-gray-600">Hệ thống phòng VIP sang trọng và sân vườn thoáng đãng.</p>
              </div>
          </div>
      </section>

      {/* Sơ Đồ Quán & Phòng */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <span className="text-primary font-bold tracking-wider text-sm">KHÔNG GIAN</span>
              <h2 className="text-4xl font-serif font-bold text-dark mt-2">Sơ Đồ Quán & Phòng</h2>
            </div>
          </div>
          
          {/* Sơ đồ nhà hàng - User will upload image */}
          <div className="mb-12 rounded-lg overflow-hidden shadow-lg">
            <img 
              src="/restaurant-floor-plan.jpg" 
              alt="Sơ đồ nhà hàng Đá & Ong" 
              className="w-full h-auto object-cover"
              onError={(e) => {
                // Fallback if image not uploaded yet
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const placeholder = document.createElement('div');
                  placeholder.className = 'w-full h-96 bg-gray-100 flex items-center justify-center text-gray-400';
                  placeholder.textContent = 'Sơ đồ nhà hàng sẽ được cập nhật';
                  parent.appendChild(placeholder);
                }
              }}
            />
          </div>
          
          {/* Phòng VIP */}
          {loadingRooms ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <h3 className="text-2xl font-bold mb-4 text-primary">Phòng VIP</h3>
              <div className="grid md:grid-cols-3 gap-8">
                {rooms.map(room => (
                  <RoomCard key={room.id} room={room} />
                ))}
                {rooms.length === 0 && <div className="text-gray-400 italic">Chưa có phòng VIP</div>}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Featured Menu Teaser */}
      <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
              <div className="flex justify-between items-end mb-12">
                  <div>
                      <span className="text-primary font-bold tracking-wider text-sm">KHÁM PHÁ</span>
                      <h2 className="text-4xl font-serif font-bold text-dark mt-2">Thực Đơn Nổi Bật</h2>
                  </div>
                  <Link to="/menu" className="hidden md:flex items-center gap-2 text-dark font-bold hover:text-primary transition">
                      Xem tất cả <ArrowRight size={20} />
                  </Link>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-8">
                    {featured.map(dish => <DishCard key={dish.id} dish={dish} showAddToCart={false} />)}
                </div>
              )}

              <div className="mt-12 text-center md:hidden">
                   <Link to="/menu" className="inline-flex items-center gap-2 text-dark font-bold hover:text-primary transition">
                      Xem tất cả <ArrowRight size={20} />
                  </Link>
              </div>
          </div>
      </section>
    </div>
  );
};

export default HomePage;