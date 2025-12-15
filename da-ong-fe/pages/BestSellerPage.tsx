import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBestSellers, ApiBestSeller } from '../services/api';
import { ChevronLeft, ChevronRight, Star, Loader2, ShoppingBag, CheckCircle, X, ArrowRight } from 'lucide-react';
import ImageGallery from '../components/ImageGallery';
import { useBookingCart } from '../contexts/BookingContext';

import { API_BASE_ORIGIN } from '../services/api';

// Helper to get full image URL
const getImageUrl = (url?: string) => {
  if (!url) return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';
  return url.startsWith('http') ? url : `${API_BASE_ORIGIN}${url}`;
};

// Helper to get images array - prioritize own images, then menu_item images
const getImagesArray = (item: ApiBestSeller): string[] => {
  // First check for own images
  if ((item as any).images_urls && (item as any).images_urls.length > 0) {
    return (item as any).images_urls.map((url: string) => getImageUrl(url));
  }
  // Fallback to menu_item images
  const menuItem = item.menu_item;
  if (menuItem?.images_urls && menuItem.images_urls.length > 0) {
    return menuItem.images_urls.map(url => getImageUrl(url));
  }
  return [];
};

// Helper to get display image (thumbnail)
const getDisplayImage = (item: ApiBestSeller): string => {
  // Priority: own thumbnail > own images > menu_item thumbnail > menu_item images > placeholder
  if ((item as any).thumbnail_url) return getImageUrl((item as any).thumbnail_url);
  if ((item as any).images_urls?.[0]) return getImageUrl((item as any).images_urls[0]);
  if (item.menu_item?.thumbnail_url) return getImageUrl(item.menu_item.thumbnail_url);
  if (item.menu_item?.image_url) return getImageUrl(item.menu_item.image_url);
  if (item.image_url) return getImageUrl(item.image_url);
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';
};

const BestSellerPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToCart } = useBookingCart();
  const [bestSellers, setBestSellers] = useState<ApiBestSeller[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getBestSellers();
        setBestSellers(data);
      } catch (err) {
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Auto-slide effect
  useEffect(() => {
    if (bestSellers.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev === bestSellers.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [bestSellers.length]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === bestSellers.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? bestSellers.length - 1 : prev - 1));
  };

  const handleAddToCart = () => {
    const currentItem = bestSellers[currentIndex];
    if (currentItem.menu_item_id) {
      addToCart(String(currentItem.menu_item_id));
    }
    setShowModal(true);
  };

  const handleContinue = () => {
    setShowModal(false);
  };

  const handleBookNow = () => {
    setShowModal(false);
    navigate('/booking');
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 bg-neutral-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || bestSellers.length === 0) {
    return (
      <div className="min-h-screen pt-20 bg-neutral-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Best Sellers</h2>
          <p className="text-gray-400">{error || 'Chưa có món best seller nào.'}</p>
        </div>
      </div>
    );
  }

  const currentItem = bestSellers[currentIndex];
  // Priority: best seller's own thumbnail first, then menu_item
  const itemImage = getImageUrl(currentItem.thumbnail_url || currentItem.menu_item?.thumbnail_url || currentItem.image_url || currentItem.menu_item?.image_url);
  const itemImages = getImagesArray(currentItem);
  const itemName = currentItem.title || currentItem.menu_item?.name || 'Món ngon';
  const itemDesc = currentItem.content || currentItem.menu_item?.description || '';
  const itemPrice = currentItem.menu_item?.price ? parseFloat(currentItem.menu_item.price) : 0;

  return (
    <div className="min-h-screen pt-20 bg-neutral-900 text-white flex items-center justify-center relative overflow-hidden">
        {/* Background Blur Effect */}
        <div 
            className="absolute inset-0 z-0 opacity-20 bg-cover bg-center blur-md scale-110 transition-all duration-700"
            style={{ backgroundImage: `url(${itemImage})` }}
        ></div>

      <div className="container mx-auto px-4 relative z-10 py-12">
        <h1 className="text-5xl font-serif font-bold text-center mb-2 text-primary">BEST SELLERS</h1>
        <p className="text-center text-gray-400 mb-12 uppercase tracking-widest text-sm">Món ăn được yêu thích nhất</p>

        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-10 bg-black/40 backdrop-blur-md p-8 md:p-12 rounded-3xl border border-white/10 shadow-2xl">
          
          {/* Image Side */}
          <div className="w-full md:w-1/2 relative group">
            <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl border-2 border-primary/30">
                {itemImages.length > 1 ? (
                  <ImageGallery 
                    images={itemImages} 
                    alt={itemName}
                    showNavigation={true}
                    showDots={true}
                    autoSlide={false}
                  />
                ) : (
                  <img
                    src={itemImage}
                    alt={itemName}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                  />
                )}
                 <div className="absolute top-4 right-4 bg-primary text-dark font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-10">
                    <Star size={16} fill="black" />
                    NO. {currentIndex + 1}
                 </div>
                 {currentItem.pinned && (
                   <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full z-10">
                     📌 PINNED
                   </div>
                 )}
            </div>
            
            {/* Navigation Buttons (Desktop overlay) */}
            <button 
                onClick={prevSlide}
                className="absolute left-[-20px] top-1/2 -translate-y-1/2 bg-white/10 hover:bg-primary hover:text-dark text-white p-3 rounded-full backdrop-blur transition-all border border-white/20"
            >
                <ChevronLeft size={24} />
            </button>
            <button 
                onClick={nextSlide}
                className="absolute right-[-20px] top-1/2 -translate-y-1/2 bg-white/10 hover:bg-primary hover:text-dark text-white p-3 rounded-full backdrop-blur transition-all border border-white/20"
            >
                <ChevronRight size={24} />
            </button>
          </div>

          {/* Content Side */}
          <div className="w-full md:w-1/2 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-4">
                {[1,2,3,4,5].map(i => <Star key={i} className="text-primary w-5 h-5" fill="#fbbf24" />)}
            </div>
            <h2 className="text-4xl font-serif font-bold mb-4 leading-tight">{itemName}</h2>
            <p className="text-xl text-gray-300 mb-8 font-light italic">"{itemDesc}"</p>
            
            {itemPrice > 0 && (
              <div className="flex items-baseline gap-4 mb-8">
                  <span className="text-3xl font-bold text-primary">{itemPrice.toLocaleString('vi-VN')}đ</span>
                  <span className="text-gray-500 text-sm">/ phần</span>
              </div>
            )}

            <button 
              onClick={handleAddToCart}
              className="bg-primary hover:bg-yellow-500 text-dark font-bold py-4 px-8 rounded-lg shadow-lg transition-colors w-fit flex items-center gap-2"
            >
              <ShoppingBag size={20} />
              Chọn món nhanh
            </button>
          </div>
        </div>

        {/* Thumbnails */}
        <div className="flex justify-center mt-12 gap-4">
            {bestSellers.map((item, idx) => (
                <button 
                    key={item.id} 
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-primary w-8' : 'bg-gray-600'}`}
                />
            ))}
        </div>
      </div>

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
                Bạn đã chọn món <span className="font-bold text-primary">{itemName}</span>. Bạn muốn làm gì tiếp theo?
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

export default BestSellerPage;