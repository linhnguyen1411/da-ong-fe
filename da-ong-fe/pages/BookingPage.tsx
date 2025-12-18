import React, { useState, useMemo, useEffect } from 'react';
import { BookingState, Room, DishCategory } from '../types';
import { MENU_ITEMS } from '../data';
import { ChevronRight, ChevronLeft, Users, Volume2, Info, Loader2, CheckCircle, Utensils, Wine } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useBookingCart } from '../contexts/BookingContext';
import { createBookingApi, getRooms, getMenuItems, checkAvailability, ApiRoom, ApiMenuItem } from '../services/api';
import { SelectedDishesSummary } from '../components/SelectedDishesSummary';

import { API_BASE_ORIGIN } from '../services/api';

const getImageUrl = (url?: string) => {
  if (!url) return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPktow7RuZyBjw7MgaMOsbmgg4bqjbmg8L3RleHQ+PC9zdmc+';
    return url.startsWith('http') ? url : `${API_BASE_ORIGIN}${url}`;
};

const BookingPage: React.FC = () => {
    // State cho API data và UI
    const [apiRooms, setApiRooms] = useState<ApiRoom[]>([]);
    const [apiMenuItems, setApiMenuItems] = useState<ApiMenuItem[]>([]);
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [roomsError, setRoomsError] = useState<string | null>(null);
    const [activeMenuTab, setActiveMenuTab] = useState<'FOOD' | 'DRINK'>('FOOD');
    const [showRoomModal, setShowRoomModal] = useState<Room | null>(null);
    const [modalImageIndex, setModalImageIndex] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [bookingCompleted, setBookingCompleted] = useState(false); // Flag to prevent re-saving after success
  const location = useLocation();
  const navigate = useNavigate();
    const { cartItems, clearCart } = useBookingCart();
    // Clear both cart and selectedDishes
    const clearAllDishes = () => {
        clearCart();
        setBooking(prev => {
            const cleared = { ...prev, selectedDishes: {} };
            saveBooking(cleared);
            return cleared;
        });
    };
    // Initial State (chỉ giữ 1 useState, logic mới)
    const [booking, setBooking] = useState<BookingState>(() => {
        // Always try to restore from pendingBooking if available and not expired
        let cartFromStorage = {};
        try {
            const stored = localStorage.getItem('cartItems');
            cartFromStorage = stored ? JSON.parse(stored) : {};
        } catch {}
        // Handle auto-expiry after 15 minutes
        const pendingRaw = localStorage.getItem('pendingBooking');
        let pending = null;
        if (pendingRaw) {
            try {
                const obj = JSON.parse(pendingRaw);
                if (obj && obj._ts && Date.now() - obj._ts > 15 * 60 * 1000) {
                    localStorage.removeItem('pendingBooking');
                } else {
                    pending = obj;
                }
            } catch {}
        }
        if (pending) {
            // Always restore last saved step and state from pendingBooking
            try {
                const state = pending;
                return {
                    ...state
                };
            } catch {}
        }
        // Fallback: new booking
        return {
            step: 1,
            guestCount: 2,
            date: '',
            time: '',
            locationType: 'private',
            audioNeeded: false,
            selectedRoom: null,
            selectedDishes: { ...cartFromStorage },
            customerName: '',
            customerPhone: '',
            note: ''
        };
    });

    // Sync selectedDishes with cartItems when cartItems change
    useEffect(() => {
        setBooking(prev => {
            const newSelectedDishes = { ...prev.selectedDishes };
            // Add any new items from cartItems
            Object.entries(cartItems).forEach(([id, qty]) => {
                if (typeof qty === 'number' && qty > 0) {
                    newSelectedDishes[id] = qty;
                }
            });
            // Remove items that are no longer in cartItems
            Object.keys(newSelectedDishes).forEach(id => {
                if (!cartItems[id] || cartItems[id] <= 0) {
                    delete newSelectedDishes[id];
                }
            });
            if (JSON.stringify(newSelectedDishes) !== JSON.stringify(prev.selectedDishes)) {
                const updated = { ...prev, selectedDishes: newSelectedDishes };
                saveBooking(updated);
                return updated;
            }
            return prev;
        });
    }, [cartItems]);

    // Helper: lưu booking vào localStorage kèm timestamp
    const saveBooking = (data: BookingState) => {
        // Don't save if booking was completed
        if (bookingCompleted) return;
        localStorage.setItem('pendingBooking', JSON.stringify({ ...data, _ts: Date.now() }));
    };

    const handleNext = () => {
        setBooking(prev => {
            const next = { ...prev, step: prev.step + 1 };
            saveBooking(next);
            if (prev.step === 2) {
                const hasDishes = Object.keys(mergedDishes).length > 0;
                if (hasDishes) {
                    saveBooking({ ...prev, step: 4 });
                    return { ...prev, step: 4 };
                } else {
                    saveBooking({ ...prev, step: 3 });
                    navigate('/menu?fromBooking=1');
                    return prev;
                }
            }
            return next;
        });
    };
  const handleBack = () => setBooking(prev => ({ ...prev, step: prev.step - 1 }));

  // Handle room selection with auto-advance
  const handleSelectRoom = (room: Room) => {
    // Check cart items directly from localStorage for most up-to-date value
    let currentCartItems = {};
    try {
      const stored = localStorage.getItem('cartItems');
      currentCartItems = stored ? JSON.parse(stored) : {};
    } catch {}
    
    const hasDishes = Object.keys(currentCartItems).length > 0 || Object.keys(cartItems).length > 0;
    
    const updatedBooking = {...booking, selectedRoom: room};
    setBooking(updatedBooking);
    saveBooking(updatedBooking);
    setShowRoomModal(null);
    setModalImageIndex(0);
    
    // Auto go to next step after a short delay for visual feedback
    setTimeout(() => {
      if (hasDishes) {
        // Has dishes -> go directly to step 4
        setBooking(prev => ({ ...prev, step: 4 }));
        saveBooking({ ...updatedBooking, step: 4 });
      } else {
        // No dishes -> go to menu to select
        saveBooking({ ...updatedBooking, step: 3 });
        navigate('/menu?fromBooking=1');
      }
    }, 300);
  };

  // --- Step 2 Logic: Filter Rooms ---
  // Convert API rooms to Room format for filtering
  const roomsForFilter = useMemo(() => {
    if (apiRooms.length > 0) {
      // Sort by position first
      const sortedRooms = [...apiRooms].sort((a, b) => (a.position || 0) - (b.position || 0));

      return sortedRooms.map(r => {
        // Build amenities list from API fields
        const amenities: string[] = [];
        if (r.has_sound_system) amenities.push('Hệ thống âm thanh');
        if (r.has_projector) amenities.push('Máy chiếu');
        if (r.has_karaoke) amenities.push('Karaoke');
        if (r.capacity >= 20) amenities.push('Phòng lớn');

        // Room is NOT available if: status is not 'available' OR it's booked for the selected date
        const isAvailable = r.status === 'available' && !r.booked_for_date;

        return {
          id: r.id.toString(),
          name: r.name,
          type: r.room_type || 'private',
          capacity: r.capacity,
          hasAudio: r.has_sound_system || false,
          image: getImageUrl(r.thumbnail_url || r.images_urls?.[0]),
          images: (r.images_urls || []).map(url => getImageUrl(url)),
          description: r.description || '',
          isAvailable: isAvailable,
          bookedForDate: r.booked_for_date || false,
          surcharge: 0,
          amenities: amenities.length > 0 ? amenities : ['Điều hòa', 'Wifi']
        };
      }) as Room[];
    }
    return []; // No fallback to static data - rooms must come from database
  }, [apiRooms]);

  const filteredRooms = useMemo(() => {
    return roomsForFilter.filter(room => {
        // Must match type (Outdoor vs Private)
        if (room.type !== booking.locationType) return false;
        
        // Capacity check
        if (room.capacity < booking.guestCount) return false;
        
        // Audio Check (Only if private)
        if (booking.locationType === 'private' && booking.audioNeeded && !room.hasAudio) return false;
        
        return true;
    });
  }, [roomsForFilter, booking.locationType, booking.guestCount, booking.audioNeeded]);


  // --- Step 3 Logic: Cart total & Menu Filtering ---
  // Use API menu items if available, fallback to static, but merge to show all
  const menuItemsToUse = useMemo(() => {
    const apiItems = apiMenuItems.map(item => ({
      id: item.id.toString(),
      name: item.name,
      price: parseFloat(item.price) || 0,
      description: item.description || '',
      image: getImageUrl(item.thumbnail_url || item.image_url || item.images_urls?.[0]),
      category: (item.category?.name as DishCategory) || DishCategory.MAIN,
      isBestSeller: item.is_best_seller,
      isRecommended: item.is_recommended
    }));
    // Merge with static MENU_ITEMS, prioritizing API items
    const merged = [...apiItems];
    MENU_ITEMS.forEach(item => {
      if (!merged.find(m => m.id === item.id)) {
        merged.push(item);
      }
    });
    return merged;
  }, [apiMenuItems]);

  // Fetch menu items on mount
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const items = await getMenuItems();
        setApiMenuItems(items);
      } catch (error) {
        console.error('Failed to fetch menu items:', error);
      }
    };
    fetchMenuItems();
  }, []);

  // Fetch rooms on mount and when date/time changes
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoadingRooms(true);
        setRoomsError(null);
        const rooms = await getRooms(booking.date || undefined, booking.time || undefined);
        setApiRooms(rooms);
      } catch (error) {
        console.error('Failed to fetch rooms:', error);
        setRoomsError('Không thể tải danh sách phòng. Vui lòng thử lại sau.');
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchRooms();
  }, [booking.date, booking.time]);

  const cartTotal = useMemo(() => {
    return Object.entries(booking.selectedDishes).reduce((total, [id, qty]) => {
        const dish = menuItemsToUse.find(d => d.id === id);
        return total + (dish ? dish.price * (qty as number) : 0);
    }, 0);
  }, [booking.selectedDishes, menuItemsToUse]);

  // Merge selectedDishes and cartItems for consistent display
  const mergedDishes = useMemo(() => {
    const merged: { [id: string]: number } = { ...booking.selectedDishes };
    Object.entries(cartItems).forEach(([id, qty]) => {
      const prev = typeof merged[id] === 'number' ? merged[id] : 0;
      merged[id] = Math.max(prev, typeof qty === 'number' ? qty : 0);
    });
    return merged;
  }, [booking.selectedDishes, cartItems]);

  const currentTabItems = useMemo(() => {
    return menuItemsToUse.filter(item => {
        if (activeMenuTab === 'DRINK') {
            return item.category === DishCategory.DRINK;
        } else {
            return item.category !== DishCategory.DRINK;
        }
    });
  }, [activeMenuTab, menuItemsToUse]);

    // Khi chọn/thay đổi món ở bước 3, đồng bộ luôn cartItems
    const { addToCart, removeFromCart, updateCartItemQuantity } = useBookingCart();
    const toggleDish = (id: string, isChecked: boolean) => {
        setBooking(prev => {
            const newDishes = { ...prev.selectedDishes };
            if (isChecked) {
                if (!newDishes[id]) {
                    newDishes[id] = 1;
                }
            } else {
                if (newDishes[id]) {
                    delete newDishes[id];
                }
            }
            saveBooking({ ...prev, selectedDishes: newDishes });
            return { ...prev, selectedDishes: newDishes };
        });
        // Always sync cart
        if (isChecked) {
            addToCart(id);
        } else {
            removeFromCart(id);
        }
    };

    const updateDishQty = (id: string, delta: number) => {
        setBooking(prev => {
            const newQty = (prev.selectedDishes[id] || 0) + delta;
            const newDishes = { ...prev.selectedDishes };
            if (newQty <= 0) {
                delete newDishes[id];
                removeFromCart(id);
            } else {
                newDishes[id] = newQty;
                updateCartItemQuantity(id, newQty);
            }
            saveBooking({ ...prev, selectedDishes: newDishes });
            return { ...prev, selectedDishes: newDishes };
        });
    };

  // --- Final Step: Call API ---
  const handleFinish = async () => {
    setIsSubmitting(true);

    try {
        // Build booking items from merged dishes (selectedDishes + cartItems)
        const bookingItems = Object.entries(mergedDishes).map(([id, qty]) => ({
          menu_item_id: parseInt(id),
          quantity: qty as number,
        }));

        await createBookingApi({
          room_id: booking.selectedRoom ? parseInt(booking.selectedRoom.id) : undefined,
          customer_name: booking.customerName,
          customer_phone: booking.customerPhone,
          party_size: booking.guestCount,
          booking_date: booking.date,
          booking_time: booking.time,
          duration_hours: 2,
          notes: booking.note,
          booking_items_attributes: bookingItems.length > 0 ? bookingItems : undefined,
        });
        
        // On Success - Clear all storage
        setBookingCompleted(true); // Set flag FIRST to prevent useEffect from re-saving
        setIsSuccess(true);
        clearCart();
        localStorage.removeItem('pendingBooking');
        localStorage.removeItem('cartItems');
        
    } catch (error) {
        alert("Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại hoặc liên hệ hotline.");
        console.error(error);
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isSuccess) {
      return (
          <div className="min-h-screen pt-24 pb-12 bg-light flex items-center justify-center">
              <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center animate-scaleIn">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="text-green-600 w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-bold text-dark mb-4">Đặt Bàn Thành Công!</h2>
                  <p className="text-gray-600 mb-8">
                      Cảm ơn <strong>{booking.customerName}</strong>. Chúng tôi đã nhận được yêu cầu và sẽ liên hệ xác nhận qua số điện thoại <strong>{booking.customerPhone}</strong> sớm nhất.
                  </p>
                  <button 
                    onClick={() => navigate('/')}
                    className="w-full bg-primary text-dark font-bold py-3 rounded-xl shadow-lg hover:bg-yellow-500 transition"
                  >
                      Về Trang Chủ
                  </button>
              </div>
          </div>
      )
  }

  // --- Render Steps ---

  const renderStep1 = () => (
    <div className="space-y-6 animate-fadeIn">
        <h2 className="text-2xl font-bold mb-6 text-dark border-l-4 border-primary pl-4">Bước 1: Thông tin cơ bản</h2>
        {Object.keys(cartItems).length > 0 && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
                <span className="font-bold">✓</span> Đã chọn {Object.keys(cartItems).length} món từ thực đơn. Bạn có thể xem lại ở Bước 3.
            </div>
        )}
        <div className="grid md:grid-cols-2 gap-6">
            <div>
                <label className="block text-gray-700 font-medium mb-2">Số lượng khách</label>
                <div className="relative">
                    <Users className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                    <input 
                        type="number" 
                        min={1}
                        value={booking.guestCount}
                        onChange={(e) => setBooking({...booking, guestCount: parseInt(e.target.value) || 0})}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white text-gray-900"
                    />
                </div>
            </div>
            <div>
                <label className="block text-gray-700 font-medium mb-2">Ngày đặt</label>
                <div className="relative">
                    <input 
                        type="date" 
                        value={booking.date}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setBooking({...booking, date: e.target.value})}
                        className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white text-gray-900"
                    />
                </div>
            </div>
            <div>
                 <label className="block text-gray-700 font-medium mb-2">Giờ đến</label>
                 <select 
                    value={booking.time}
                    onChange={(e) => setBooking({...booking, time: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white text-gray-900"
                 >
                     <option value="">Chọn giờ</option>
                     {['10:00', '11:00', '12:00', '13:00', '17:00', '18:00', '19:00', '20:00'].map(t => (
                         <option key={t} value={t}>{t}</option>
                     ))}
                 </select>
            </div>
        </div>
        <div className="flex justify-end pt-4">
            <button 
                disabled={!booking.date || !booking.time || booking.guestCount < 1}
                onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    if (booking.date < today) {
                        alert('Không thể đặt bàn cho ngày trong quá khứ. Vui lòng chọn ngày hôm nay hoặc sau.');
                        return;
                    }
                    handleNext();
                }}
                className="bg-primary text-dark px-8 py-3 rounded-lg font-bold hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
                Tiếp tục <ChevronRight size={20} />
            </button>
        </div>
    </div>
  );

  const renderStep2 = () => (
      <div className="space-y-6 animate-fadeIn">
        <h2 className="text-2xl font-bold mb-6 text-dark border-l-4 border-primary pl-4">Bước 2: Chọn không gian</h2>
        
        {/* Type Toggle */}
        <div className="flex gap-4 mb-8">
            <button 
                onClick={() => setBooking({...booking, locationType: 'private'})}
                className={`flex-1 py-4 px-6 rounded-xl border-2 font-bold text-lg transition-all ${booking.locationType === 'private' ? 'border-primary bg-primary/20 text-dark' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
            >
                Phòng Riêng
            </button>
            <button 
                onClick={() => setBooking({...booking, locationType: 'outdoor'})}
                className={`flex-1 py-4 px-6 rounded-xl border-2 font-bold text-lg transition-all ${booking.locationType === 'outdoor' ? 'border-primary bg-primary/20 text-dark' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
            >
                Ngoài Trời
            </button>
        </div>

        {/* Audio Option (Private only) */}
        {booking.locationType === 'private' && (
            <div className="mb-8 flex items-center gap-3 bg-gray-50 p-4 rounded-lg">
                <input 
                    type="checkbox" 
                    id="audio"
                    checked={booking.audioNeeded}
                    onChange={(e) => setBooking({...booking, audioNeeded: e.target.checked})}
                    className="w-5 h-5 text-primary focus:ring-primary border-gray-300 rounded bg-white"
                />
                <label htmlFor="audio" className="text-gray-700 font-medium flex items-center gap-2 cursor-pointer select-none">
                    <Volume2 size={18} /> Cần hệ thống âm thanh / Karaoke
                </label>
            </div>
        )}

        {/* Room List */}
        {loadingRooms ? (
          <div className="text-center py-10">
            <Loader2 className="animate-spin mx-auto mb-4" size={40} />
            <p className="text-gray-600">Đang tải danh sách phòng...</p>
          </div>
        ) : roomsError ? (
          <div className="text-center py-10 bg-red-50 rounded-lg border border-red-200">
            <div className="text-red-600 font-bold text-lg mb-2">Lỗi tải dữ liệu</div>
            <p className="text-red-500">{roomsError}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : filteredRooms.length === 0 && booking.date && booking.time ? (
          <div className="text-center py-10 bg-red-50 rounded-lg border border-red-200">
            <div className="text-red-600 font-bold text-lg mb-2">Hiện tại các phòng đều bận</div>
            <p className="text-red-500">Vui lòng gọi trực tiếp hotline để được tư vấn và hỗ trợ đặt phòng.</p>
            <a 
              href="tel:19001234" 
              className="inline-block mt-4 bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition-colors"
            >
              📞 Gọi ngay: 1900 1234
            </a>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredRooms.map(room => (
                <div 
                    key={room.id}
                    className={`border rounded-xl overflow-hidden transition-all ${
                      room.bookedForDate 
                        ? 'cursor-not-allowed opacity-80' 
                        : 'cursor-pointer hover:shadow-lg'
                    } ${booking.selectedRoom?.id === room.id ? 'ring-2 ring-primary border-transparent' : 'border-gray-200'}`}
                    onClick={() => {
                      if (!room.bookedForDate && room.isAvailable) {
                        handleSelectRoom(room);
                      }
                    }}
                >
                    <div className="relative h-48">
                        <img src={room.image} alt={room.name} className="w-full h-full object-cover" />
                        {room.bookedForDate && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="text-white font-bold text-lg uppercase border-2 border-red-500 bg-red-500/80 px-4 py-2 rounded">
                                  Đã có người đặt ngày {booking.date}
                                </span>
                            </div>
                        )}
                        {!room.bookedForDate && !room.isAvailable && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="text-white font-bold text-lg uppercase border-2 border-white px-4 py-1">Không khả dụng</span>
                            </div>
                        )}
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowRoomModal(room); }}
                            className="absolute top-2 right-2 bg-white/90 p-2 rounded-full hover:bg-white text-primary shadow-sm"
                        >
                            <Info size={20} />
                        </button>
                    </div>
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-lg text-dark">{room.name}</h3>
                          {room.bookedForDate && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-medium">Đã đặt</span>
                          )}
                        </div>
                        <div className="flex justify-between text-sm text-gray-500 mb-2">
                            <span>Sức chứa: {room.capacity} khách</span>
                            {room.surcharge > 0 ? (
                                <span className="text-primary font-bold">+{room.surcharge.toLocaleString()}đ</span>
                            ) : (
                                <span className="text-green-600 font-bold">Miễn phí</span>
                            )}
                        </div>
                        {booking.selectedRoom?.id === room.id && !room.bookedForDate && (
                            <div className="mt-2 text-center bg-primary text-dark text-xs font-bold py-1 rounded">ĐÃ CHỌN</div>
                        )}
                    </div>
                </div>
            ))}
          </div>
        )}

        {filteredRooms.length === 0 && (!booking.date || !booking.time) && (
             <div className="text-center py-10 bg-gray-50 rounded-lg text-gray-500">
                Không tìm thấy phòng phù hợp với số lượng khách và yêu cầu của bạn.
            </div>
        )}

        <div className="flex justify-between pt-6">
            <button onClick={handleBack} className="text-gray-600 font-medium hover:text-dark flex items-center gap-2"><ChevronLeft size={20}/> Quay lại</button>
            <button 
                disabled={!booking.selectedRoom || !booking.selectedRoom.isAvailable || booking.selectedRoom.bookedForDate}
                onClick={handleNext}
                className="bg-primary text-dark px-8 py-3 rounded-lg font-bold hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
                Tiếp tục <ChevronRight size={20} />
            </button>
        </div>
      </div>
  );

  const renderStep3 = () => (
      <div className="space-y-6 animate-fadeIn">
         <h2 className="text-2xl font-bold mb-6 text-dark border-l-4 border-primary pl-4">Bước 3: Chọn thực đơn (Không bắt buộc)</h2>
         <p className="text-gray-500 mb-4">Đặt món trước giúp nhà bếp chuẩn bị chu đáo hơn và bạn không phải chờ đợi lâu.</p>
         
         {/* Menu Tabs */}
         <div className="flex border-b border-gray-200 mb-4">
            <button 
                onClick={() => setActiveMenuTab('FOOD')}
                className={`flex-1 py-3 font-bold text-sm md:text-base flex items-center justify-center gap-2 border-b-2 transition-colors ${activeMenuTab === 'FOOD' ? 'border-primary text-dark' : 'border-transparent text-gray-500 hover:text-dark'}`}
            >
                <Utensils size={18} /> MÓN ĂN
            </button>
            <button 
                onClick={() => setActiveMenuTab('DRINK')}
                className={`flex-1 py-3 font-bold text-sm md:text-base flex items-center justify-center gap-2 border-b-2 transition-colors ${activeMenuTab === 'DRINK' ? 'border-primary text-dark' : 'border-transparent text-gray-500 hover:text-dark'}`}
            >
                <Wine size={18} /> ĐỒ UỐNG
            </button>
         </div>

         <div className="bg-white border rounded-xl shadow-sm max-h-[500px] overflow-y-auto custom-scrollbar">
            {currentTabItems.map(dish => (
                <div key={dish.id} className="flex items-center p-4 border-b last:border-0 hover:bg-gray-50 transition-colors">
                     <input 
                        type="checkbox"
                        checked={!!mergedDishes[dish.id]}
                        onChange={(e) => toggleDish(dish.id, e.target.checked)}
                        className="w-5 h-5 text-primary rounded mr-4 bg-white flex-shrink-0"
                     />
                     <div className="w-16 h-16 rounded-lg overflow-hidden mr-4 flex-shrink-0 bg-gray-100">
                        <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
                     </div>
                     <div className="flex-1 min-w-0">
                         <h4 className="font-bold text-dark truncate">{dish.name}</h4>
                         <p className="text-primary font-bold">{dish.price.toLocaleString()}đ</p>
                     </div>
                     {mergedDishes[dish.id] && (
                         <div className="flex items-center gap-3">
                             <button onClick={() => updateDishQty(dish.id, -1)} className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold">-</button>
                             <span className="font-bold w-4 text-center">{mergedDishes[dish.id]}</span>
                             <button onClick={() => updateDishQty(dish.id, 1)} className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold">+</button>
                         </div>
                     )}
                </div>
            ))}
            {currentTabItems.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                    Chưa có món trong danh mục này.
                </div>
            )}
         </div>

         <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
             <span className="font-bold text-gray-700">Tổng tiền món dự kiến:</span>
             <span className="font-bold text-xl text-primary">{cartTotal.toLocaleString()}đ</span>
         </div>

         <div className="flex justify-between pt-6">
            <button onClick={handleBack} className="text-gray-600 font-medium hover:text-dark flex items-center gap-2"><ChevronLeft size={20}/> Quay lại</button>
            <button 
                onClick={handleNext}
                className="bg-primary text-dark px-8 py-3 rounded-lg font-bold hover:bg-yellow-500 flex items-center gap-2"
            >
                Tiếp tục <ChevronRight size={20} />
            </button>
            <button 
                onClick={clearAllDishes}
                className="ml-4 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium border border-gray-300 hover:bg-gray-200"
            >
                Xóa tất cả món
            </button>
        </div>
      </div>
  );

  const renderStep4 = () => (
      <div className="space-y-6 animate-fadeIn">
          <h2 className="text-2xl font-bold mb-6 text-dark border-l-4 border-primary pl-4">Bước 4: Xác nhận thông tin</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
              {/* Form Info */}
              <div className="space-y-4">
                  <div>
                      <label className="block text-gray-700 font-medium mb-2">Họ và tên</label>
                      <input 
                        type="text" 
                        value={booking.customerName}
                        onChange={(e) => setBooking({...booking, customerName: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900"
                        placeholder="Nhập họ tên của bạn"
                      />
                  </div>
                   <div>
                      <label className="block text-gray-700 font-medium mb-2">Số điện thoại</label>
                      <input 
                        type="tel" 
                        value={booking.customerPhone}
                        onChange={(e) => setBooking({...booking, customerPhone: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900"
                        placeholder="Nhập số điện thoại"
                      />
                  </div>
                  <div>
                      <label className="block text-gray-700 font-medium mb-2">Ghi chú thêm</label>
                      <textarea 
                        value={booking.note}
                        onChange={(e) => setBooking({...booking, note: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent h-24 bg-white text-gray-900"
                        placeholder="VD: Nhà có trẻ em, dị ứng hải sản..."
                      />
                  </div>
              </div>

              {/* Summary Card */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <h3 className="font-serif font-bold text-xl mb-4 text-center text-dark">THÔNG TIN ĐẶT BÀN</h3>
                  <div className="space-y-3 text-sm border-b border-gray-200 pb-4 mb-4">
                      <div className="flex justify-between">
                          <span className="text-gray-600">Thời gian:</span>
                          <span className="font-bold">{booking.time} - {booking.date}</span>
                      </div>
                      <div className="flex justify-between">
                          <span className="text-gray-600">Số khách:</span>
                          <span className="font-bold">{booking.guestCount} người</span>
                      </div>
                      <div className="flex justify-between">
                          <span className="text-gray-600">Khu vực:</span>
                          <span className="font-bold">{booking.locationType === 'private' ? 'Phòng riêng' : 'Ngoài trời'}</span>
                      </div>
                      <div className="flex justify-between">
                          <span className="text-gray-600">Phòng chọn:</span>
                          <span className="font-bold text-primary">{booking.selectedRoom?.name}</span>
                      </div>
                      {booking.selectedRoom && booking.selectedRoom.surcharge > 0 && (
                          <div className="flex justify-between text-gray-500 italic">
                             <span>Phụ thu phòng:</span>
                             <span>{booking.selectedRoom.surcharge.toLocaleString()}đ</span>
                          </div>
                      )}
                  </div>

                                    {/* Merge selectedDishes và cartItems để show đúng tên, số lượng */}
                                    {/* Merge selectedDishes và cartItems để show đúng tên, số lượng */}
                                    <SelectedDishesSummary
                                        selectedDishes={booking.selectedDishes}
                                        cartItems={cartItems}
                                        apiMenuItems={apiMenuItems}
                                    />

                                    <div className="pt-4 border-t border-gray-300 space-y-4">
                                            <div className="flex justify-between items-center">
                                                    <span className="font-bold text-lg text-dark">Tổng dự kiến:</span>
                                                    <span className="font-bold text-2xl text-primary">
                                                            {(cartTotal + (booking.selectedRoom?.surcharge || 0)).toLocaleString()}đ
                                                    </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2 text-center">*Giá chưa bao gồm VAT và đồ uống phát sinh tại quán.</p>

                                            {/* Tổng tiền cọc và QR ngân hàng */}
                                            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-bold text-dark">Số tiền cần thanh toán cọc:</span>
                                                    <span className="font-bold text-lg text-primary">
                                                        {(() => {
                                                            const deposit = Math.round(cartTotal * 0.3 + (booking.locationType === 'private' ? 300000 : 0));
                                                            return deposit.toLocaleString('vi-VN') + 'đ';
                                                        })()}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col items-center gap-2 mt-2">
                                                    <img src="/qr-bank.jpg" alt="QR chuyển khoản" className="w-40 h-40 object-contain border rounded-lg" />
                                                    <div className="text-center mt-2">
                                                        <div className="font-bold text-dark">Ngân hàng: <span className="text-primary">Sacombank</span></div>
                                                        <div className="font-bold text-dark">Số tài khoản: <span className="text-primary">040905944272</span></div>
                                                        <div className="text-dark">Chủ TK: <span className="font-semibold">TRẦN THỊ ÁI NHI</span></div>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2 text-center">Vui lòng chuyển khoản cọc để giữ chỗ. Ghi rõ họ tên và số điện thoại khi chuyển khoản.</p>
                                            </div>
                                    </div>
              </div>
          </div>

           <div className="flex justify-between pt-6">
            <button onClick={handleBack} className="text-gray-600 font-medium hover:text-dark flex items-center gap-2"><ChevronLeft size={20}/> Quay lại</button>
            <button 
                disabled={!booking.customerName || !booking.customerPhone || !(booking.selectedRoom && booking.selectedRoom.id) || isSubmitting}
                onClick={handleFinish}
                className="bg-primary text-dark px-8 py-3 rounded-lg font-bold hover:bg-yellow-500 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="animate-spin" size={20} /> ĐANG XỬ LÝ...
                    </>
                ) : (
                    <>
                         XÁC NHẬN ĐẶT BÀN <ChevronRight size={20} />
                    </>
                )}
            </button>
        </div>
      </div>
  );

  return (
    <div className="min-h-screen pt-24 pb-12 bg-light">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Progress Bar */}
        <div className="mb-10">
             <div className="flex justify-between mb-2">
                 {['Thông tin', 'Chọn phòng', 'Chọn món', 'Xác nhận'].map((label, idx) => (
                     <span key={idx} className={`text-xs md:text-sm font-bold ${booking.step > idx ? 'text-primary' : booking.step === idx + 1 ? 'text-dark' : 'text-gray-300'}`}>
                         {label}
                     </span>
                 ))}
             </div>
             <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                 <div 
                    className="h-full bg-primary transition-all duration-500 ease-in-out"
                    style={{ width: `${(booking.step / 4) * 100}%` }}
                 ></div>
             </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-gray-100 min-h-[500px]">
            {booking.step === 1 && renderStep1()}
            {booking.step === 2 && renderStep2()}
            {booking.step === 3 && renderStep3()}
            {booking.step === 4 && renderStep4()}
        </div>
      </div>

      {/* Room Detail Modal */}
      {showRoomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white rounded-2xl max-w-3xl lg:max-w-4xl w-full overflow-hidden shadow-2xl animate-scaleIn max-h-[90vh] overflow-y-auto">
                  <div className="relative h-64 md:h-80 lg:h-96">
                      {/* Main Image */}
                      <img 
                        src={showRoomModal.images && showRoomModal.images.length > 0 
                          ? showRoomModal.images[modalImageIndex] 
                          : showRoomModal.image} 
                        alt={showRoomModal.name} 
                        className="w-full h-full object-cover" 
                      />
                      
                      {/* Image Navigation - only show if multiple images */}
                      {showRoomModal.images && showRoomModal.images.length > 1 && (
                        <>
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setModalImageIndex(prev => prev === 0 ? showRoomModal.images!.length - 1 : prev - 1);
                            }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/80 transition"
                          >
                            <ChevronLeft size={24} />
                          </button>
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setModalImageIndex(prev => prev === showRoomModal.images!.length - 1 ? 0 : prev + 1);
                            }}
                            className="absolute right-12 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/80 transition"
                          >
                            <ChevronRight size={24} />
                          </button>
                          
                          {/* Image Counter */}
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                            {modalImageIndex + 1} / {showRoomModal.images.length}
                          </div>
                        </>
                      )}
                      
                      <button 
                        onClick={() => { setShowRoomModal(null); setModalImageIndex(0); }}
                        className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/80 transition"
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                      </button>
                  </div>
                  
                  {/* Thumbnail Strip */}
                  {showRoomModal.images && showRoomModal.images.length > 1 && (
                    <div className="flex gap-2 p-3 bg-gray-100 overflow-x-auto">
                      {showRoomModal.images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setModalImageIndex(idx)}
                          className={`flex-shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition ${
                            idx === modalImageIndex ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <div className="p-6">
                      <h3 className="text-2xl font-serif font-bold text-dark mb-2">{showRoomModal.name}</h3>
                      <p className="text-gray-600 mb-4">{showRoomModal.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="bg-gray-50 p-3 rounded-lg">
                              <span className="block text-xs text-gray-500 uppercase tracking-wider">Sức chứa</span>
                              <span className="font-bold text-dark">{showRoomModal.capacity} khách</span>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                              <span className="block text-xs text-gray-500 uppercase tracking-wider">Phụ thu</span>
                              <span className="font-bold text-primary">{showRoomModal.surcharge.toLocaleString()}đ</span>
                          </div>
                      </div>

                      <h4 className="font-bold text-sm uppercase text-gray-500 mb-2">Tiện ích phòng</h4>
                      <ul className="flex flex-wrap gap-2 mb-8">
                          {showRoomModal.amenities.map((item, idx) => (
                              <li key={idx} className="bg-primary/20 text-dark px-3 py-1 rounded-full text-sm font-medium">
                                  {item}
                              </li>
                          ))}
                      </ul>

                      <button 
                         onClick={() => handleSelectRoom(showRoomModal)}
                         className="w-full bg-primary text-dark font-bold py-3 rounded-lg hover:bg-yellow-500 transition"
                      >
                          CHỌN PHÒNG NÀY
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default BookingPage;