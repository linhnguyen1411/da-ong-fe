import React, { useState, useEffect } from 'react';
import { getDailySpecials, ApiDailySpecial } from '../services/api';
import { Loader2, Star, Sparkles, ShoppingBag, CheckCircle, X, ArrowRight } from 'lucide-react';
import ImageGallery from '../components/ImageGallery';
import { useBookingCart } from '../contexts/BookingContext';
import { useNavigate } from 'react-router-dom';

import { API_BASE_ORIGIN } from '../services/api';

// Helper to get full image URL
const getImageUrl = (url?: string) => {
  if (!url) return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';
  return url.startsWith('http') ? url : `${API_BASE_ORIGIN}${url}`;
};

// Helper to get images array from a daily special
const getImagesArray = (item: ApiDailySpecial): string[] => {
  // Priority: daily special's own images first
  if (item.images_urls && item.images_urls.length > 0) {
    return item.images_urls.map((url: string) => getImageUrl(url));
  }
  // Fallback to menu_item images
  const menuItem = item.menu_item as any;
  if (menuItem?.images_urls && menuItem.images_urls.length > 0) {
    return menuItem.images_urls.map((url: string) => getImageUrl(url));
  }
  // Fallback to single image
  const singleImage = item.thumbnail_url || item.image_url || menuItem?.thumbnail_url || menuItem?.image_url;
  if (singleImage) {
    return [getImageUrl(singleImage)];
  }
  return ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'];
};

const DailySpecialPage: React.FC = () => {
  const [specials, setSpecials] = useState<ApiDailySpecial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useBookingCart();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ApiDailySpecial | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getDailySpecials();
        setSpecials(data);
      } catch (err) {
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddToCart = (item: ApiDailySpecial) => {
    if (!item.menu_item_id) {
      alert('Món này chưa liên kết với món ăn. Vui lòng chọn món khác.');
      return;
    }
    addToCart(String(item.menu_item_id));
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleContinue = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  const handleBookNow = () => {
    setShowModal(false);
    setSelectedItem(null);
    navigate('/booking');
  };

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

  return (
    <div className="min-h-screen pt-24 pb-12 bg-light">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
            <span className="text-primary font-bold tracking-widest uppercase text-sm">Sự lựa chọn của Bếp Trưởng</span>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-dark mt-2 mb-6">Món Ngon Mỗi Ngày</h1>
            <p className="max-w-2xl mx-auto text-gray-600">
                Những món ăn được tuyển chọn kỹ lưỡng, sử dụng nguyên liệu tươi ngon nhất trong ngày để mang đến trải nghiệm tuyệt vời.
            </p>
        </div>

        {specials.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            Chưa có món ngon đặc biệt nào hôm nay.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {specials.map((item) => {
              const images = getImagesArray(item);
              const name = item.title || item.menu_item?.name || 'Món ngon mỗi ngày';
              const desc = item.content || item.menu_item?.description || '';
              const price = item.menu_item?.price ? parseFloat(item.menu_item.price) : 0;
              const isMarketPrice = item.menu_item?.is_market_price || false;

              return (
                <div key={item.id} className="relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow group flex flex-col">
                  {/* Badges */}
                  {item.pinned && (
                    <div className="absolute top-3 left-3 z-10 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Star size={12} fill="white" /> PINNED
                    </div>
                  )}
                  {item.highlighted && (
                    <div className="absolute top-3 right-3 z-10 bg-primary text-dark text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Sparkles size={12} /> HOT
                    </div>
                  )}

                  <div className="relative aspect-square overflow-hidden bg-gray-100 flex-shrink-0">
                    {images.length > 1 ? (
                      <ImageGallery 
                        images={images} 
                        alt={name}
                        showNavigation={true}
                        showDots={true}
                        autoSlide={false}
                        className="w-full h-full"
                      />
                    ) : (
                      <img 
                        src={images[0]} 
                        alt={name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-xl text-dark mb-2">{name}</h3>
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-1">{desc}</p>
                    <div className="flex items-center justify-between mt-auto">
                      {isMarketPrice ? (
                        <span className="text-orange-500 font-bold text-xl italic">
                          Thời giá
                        </span>
                      ) : price > 0 ? (
                        <span className="text-primary font-bold text-xl">
                          {price.toLocaleString('vi-VN')}đ
                        </span>
                      ) : null}
                      {item.menu_item_id && (
                        <button
                          onClick={() => handleAddToCart(item)}
                          className="flex items-center gap-2 bg-primary hover:bg-yellow-500 text-dark font-bold px-4 py-2 rounded-lg transition-colors shadow-md hover:shadow-lg"
                        >
                          <ShoppingBag size={18} />
                          Thêm vào giỏ
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Decision Modal */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-scaleIn">
            <button 
              onClick={handleContinue}
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
                Bạn đã chọn món <span className="font-bold text-primary">{selectedItem.title || selectedItem.menu_item?.name || 'Món ngon mỗi ngày'}</span>. Bạn muốn làm gì tiếp theo?
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleBookNow}
                className="w-full bg-primary hover:bg-yellow-500 text-dark font-bold py-3 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
              >
                ĐẶT BÀN NGAY <ArrowRight size={18} />
              </button>
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

export default DailySpecialPage;