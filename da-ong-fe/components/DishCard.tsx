import React, { useState } from 'react';
import { Dish } from '../types';
import { useNavigate } from 'react-router-dom';
import { useBookingCart } from '../contexts/BookingContext';
import { CheckCircle, X, ShoppingBag, ArrowRight } from 'lucide-react';
// Bỏ import ImageGallery

interface DishCardProps {
  dish: Dish;
  showTags?: boolean;
  showAddToCart?: boolean;
}

const DishCard: React.FC<DishCardProps> = ({ dish, showTags = true, showAddToCart = true }) => {
  const navigate = useNavigate();
  const { addToCart } = useBookingCart();
  const [showModal, setShowModal] = useState(false);

  const handleAddToCart = () => {
    addToCart(dish.id);
    setShowModal(true);
  };

  const handleContinue = () => {
    setShowModal(false);
  };

  const handleBookNow = () => {
    setShowModal(false);
    navigate('/booking');
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 group h-full flex flex-col relative">
        <div
          className="relative aspect-square overflow-hidden bg-gray-100 flex-shrink-0 cursor-pointer"
          onClick={handleAddToCart}
        >
          <img
            src={dish.image}
            alt={dish.name}
            className="w-full h-full object-cover object-center transition-transform duration-200 group-hover:scale-105"
            draggable={false}
          />
          {showTags && (
            <div className="absolute top-2 left-2 flex flex-col gap-2 z-10 pointer-events-none">
              {dish.isBestSeller && (
                <span className="bg-primary text-dark text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  Best Seller
                </span>
              )}
              {dish.isRecommended && (
                <span className="bg-dark text-primary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  Recommended
                </span>
              )}
            </div>
          )}
        </div>
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <h3
              className="text-lg font-bold text-gray-800 line-clamp-2 cursor-pointer hover:text-primary"
              onClick={handleAddToCart}
            >
              {dish.name}
            </h3>
            <span className={`font-bold text-lg whitespace-nowrap ${dish.isMarketPrice ? 'text-orange-500 italic' : 'text-primary'}`}>
              {dish.isMarketPrice ? 'Thời giá' : `${dish.price.toLocaleString('vi-VN')}đ`}
            </span>
          </div>
          <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-1">{dish.description}</p>
          {/* Không hiển thị button chọn món ở homepage */}
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
                Bạn đã chọn món <span className="font-bold text-primary">{dish.name}</span>. Bạn muốn làm gì tiếp theo?
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
    </>
  );
};

export default DishCard;