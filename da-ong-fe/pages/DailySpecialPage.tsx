import React, { useState, useEffect } from 'react';
import { getDailySpecials, ApiDailySpecial } from '../services/api';
import { Loader2, Star, Sparkles } from 'lucide-react';
import ImageGallery from '../components/ImageGallery';

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
                  <div className="p-5">
                    <h3 className="font-bold text-xl text-dark mb-2">{name}</h3>
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">{desc}</p>
                    {price > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-primary font-bold text-xl">
                          {price.toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DailySpecialPage;