import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { 
  adminGetDashboard, 
  adminConfirmBooking, 
  adminCancelBooking,
  adminMarkContactRead,
  adminUpdateRoomStatus,
  getRooms,
  adminGetBookings,
  createBookingApi,
  getMenuItems,
  adminGetRooms
} from '../../services/api';
import { 
  Loader2, Calendar, Users, Mail, DoorOpen, 
  CheckCircle, XCircle, Clock, AlertCircle, Eye,
  RefreshCw, Search, Plus, X, Edit2, Volume2, VolumeX, Monitor
} from 'lucide-react';
import { formatDateTime } from '../../utils/dateFormat';

interface DashboardData {
  stats: {
    total_bookings: number;
    pending: number;
    confirmed: number;
    today: number;
  };
  today_bookings: any[];
  upcoming_bookings: any[];
  recent_contacts: any[];
  room_status: any[];
}

const AdminDashboardNew: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [roomsByDate, setRoomsByDate] = useState<any[]>([]);
  const [bookingsByDate, setBookingsByDate] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [roomSearchTerm, setRoomSearchTerm] = useState<string>('');
  const [selectedRoomForAction, setSelectedRoomForAction] = useState<any>(null);
  const [showRoomActionModal, setShowRoomActionModal] = useState(false);
  
  // Quick booking modal
  const [showQuickBooking, setShowQuickBooking] = useState(false);
  const [allRooms, setAllRooms] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [quickBookingForm, setQuickBookingForm] = useState({
    customer_name: '',
    customer_phone: '',
    party_size: 2,
    booking_date: new Date().toISOString().split('T')[0],
    booking_time: '18:00',
    room_id: '',
    notes: '',
    booking_items: [] as Array<{ menu_item_id: number; quantity: number }>
  });
  const [menuItemSearch, setMenuItemSearch] = useState('');
  const [savingBooking, setSavingBooking] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchDashboard();
    fetchRoomsByDate();
    fetchAllRooms();
    fetchMenuItems();
  }, [navigate]);

  useEffect(() => {
    fetchRoomsByDate();
  }, [selectedDate]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const dashboardData = await adminGetDashboard();
      setData(dashboardData);
    } catch (err: any) {
      if (err.message === 'Unauthorized') {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        navigate('/admin/login');
      } else {
        setError('Không thể tải dữ liệu dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomsByDate = async () => {
    try {
      setLoadingRooms(true);
      const [rooms, bookings] = await Promise.all([
        getRooms(selectedDate),
        adminGetBookings({ date: selectedDate })
      ]);
      setRoomsByDate(rooms);
      setBookingsByDate(bookings);
    } catch (err: any) {
      console.error('Error fetching rooms by date:', err);
    } finally {
      setLoadingRooms(false);
    }
  };

  const fetchAllRooms = async () => {
    try {
      const rooms = await adminGetRooms();
      setAllRooms(rooms);
    } catch (err: any) {
      console.error('Error fetching rooms:', err);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const items = await getMenuItems();
      setMenuItems(items);
    } catch (err: any) {
      console.error('Error fetching menu items:', err);
    }
  };

  const handleOpenQuickBooking = () => {
    setQuickBookingForm({
      customer_name: '',
      customer_phone: '',
      party_size: 2,
      booking_date: new Date().toISOString().split('T')[0],
      booking_time: '18:00',
      room_id: '',
      notes: '',
      booking_items: []
    });
    setMenuItemSearch('');
    setShowQuickBooking(true);
  };

  const handleAddMenuItem = (menuItemId: number) => {
    const existing = quickBookingForm.booking_items.find(item => item.menu_item_id === menuItemId);
    if (existing) {
      setQuickBookingForm({
        ...quickBookingForm,
        booking_items: quickBookingForm.booking_items.map(item =>
          item.menu_item_id === menuItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      });
    } else {
      setQuickBookingForm({
        ...quickBookingForm,
        booking_items: [...quickBookingForm.booking_items, { menu_item_id: menuItemId, quantity: 1 }]
      });
    }
  };

  const handleRemoveMenuItem = (menuItemId: number) => {
    setQuickBookingForm({
      ...quickBookingForm,
      booking_items: quickBookingForm.booking_items.filter(item => item.menu_item_id !== menuItemId)
    });
  };

  const handleUpdateMenuItemQuantity = (menuItemId: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveMenuItem(menuItemId);
      return;
    }
    setQuickBookingForm({
      ...quickBookingForm,
      booking_items: quickBookingForm.booking_items.map(item =>
        item.menu_item_id === menuItemId
          ? { ...item, quantity }
          : item
      )
    });
  };

  const handleSubmitQuickBooking = async () => {
    if (!quickBookingForm.customer_phone || !quickBookingForm.booking_date || !quickBookingForm.booking_time) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc (SĐT, Ngày, Giờ)');
      return;
    }

    try {
      setSavingBooking(true);
      const bookingData: any = {
        customer_name: quickBookingForm.customer_name || 'Khách vãng lai',
        customer_phone: quickBookingForm.customer_phone,
        party_size: quickBookingForm.party_size,
        booking_date: quickBookingForm.booking_date,
        booking_time: quickBookingForm.booking_time,
        notes: quickBookingForm.notes || '',
        booking_items_attributes: quickBookingForm.booking_items
      };

      if (quickBookingForm.room_id) {
        bookingData.room_id = parseInt(quickBookingForm.room_id);
      }

      await createBookingApi(bookingData);
      alert('Đặt bàn thành công!');
      setShowQuickBooking(false);
      fetchDashboard();
      fetchRoomsByDate();
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || 'Không thể tạo booking'));
    } finally {
      setSavingBooking(false);
    }
  };

  const handleConfirmBooking = async (id: number) => {
    try {
      await adminConfirmBooking(id);
      fetchDashboard();
    } catch (err) {
      alert('Có lỗi xảy ra');
    }
  };

  const handleCancelBooking = async (id: number) => {
    if (confirm('Bạn có chắc muốn hủy đặt bàn này?')) {
      try {
        await adminCancelBooking(id);
        fetchDashboard();
      } catch (err) {
        alert('Có lỗi xảy ra');
      }
    }
  };

  const handleMarkContactRead = async (id: number) => {
    try {
      await adminMarkContactRead(id);
      fetchDashboard();
    } catch (err) {
      alert('Có lỗi xảy ra');
    }
  };

  const handleUpdateRoomStatus = async (id: number, status: string) => {
    try {
      await adminUpdateRoomStatus(id, status);
      fetchDashboard();
      fetchRoomsByDate(); // Reload rooms after status update
      setShowRoomActionModal(false);
      setSelectedRoomForAction(null);
    } catch (err) {
      alert('Có lỗi xảy ra');
    }
  };

  const handleRoomClick = (room: any) => {
    setSelectedRoomForAction(room);
    setShowRoomActionModal(true);
  };

  const handleQuickBookingForRoom = (room: any) => {
    setShowRoomActionModal(false);
    setSelectedRoomForAction(null);
    // Pre-fill room in quick booking form
    setQuickBookingForm({
      ...quickBookingForm,
      room_id: room.id.toString()
    });
    setShowQuickBooking(true);
  };

  const getRoomStatusColor = (room: any) => {
    if (room.booked_for_date) return 'bg-red-500'; // Đã đặt - đỏ
    if (room.status === 'occupied') return 'bg-orange-500'; // Đang sử dụng - cam
    if (room.status === 'maintenance') return 'bg-yellow-500'; // Bảo trì - vàng
    return 'bg-gray-200'; // Trống - xám nhạt (sẽ hiển thị icon người)
  };

  const getRoomStatusText = (room: any) => {
    if (room.booked_for_date) return 'Đã đặt';
    if (room.status === 'occupied') return 'Đang sử dụng';
    if (room.status === 'maintenance') return 'Bảo trì';
    return 'Trống';
  };

  // Helper function to get the last part of room name (after last space)
  const getShortRoomName = (roomName: string): string => {
    if (!roomName) return '';
    const parts = roomName.trim().split(/\s+/);
    return parts[parts.length - 1] || roomName;
  };

  const isRoomAvailable = (room: any) => {
    return !room.booked_for_date && room.status === 'available';
  };

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Dashboard">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={fetchDashboard}
            className="bg-primary text-dark px-4 py-2 rounded-lg font-bold"
          >
            Thử lại
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-4">
        <button 
          onClick={handleOpenQuickBooking}
          className="flex items-center justify-center gap-2 bg-primary text-dark px-4 py-2.5 rounded-lg font-bold hover:bg-yellow-500 transition shadow-md text-sm sm:text-base"
        >
          <Plus size={18} /> <span className="whitespace-nowrap">Đặt bàn nhanh</span>
        </button>
        <button 
          onClick={fetchDashboard}
          className="flex items-center justify-center gap-2 text-gray-500 hover:text-dark transition px-4 py-2.5 rounded-lg border border-gray-300 sm:border-0 text-sm sm:text-base"
        >
          <RefreshCw size={16} /> Làm mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="bg-blue-100 p-2 sm:p-3 rounded-full flex-shrink-0">
              <Calendar className="text-blue-600 w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-dark">{data?.stats.total_bookings || 0}</p>
              <p className="text-gray-500 text-xs sm:text-sm">Tổng đặt bàn</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="bg-yellow-100 p-2 sm:p-3 rounded-full flex-shrink-0">
              <Clock className="text-yellow-600 w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-dark">{data?.stats.pending || 0}</p>
              <p className="text-gray-500 text-xs sm:text-sm">Chờ xác nhận</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="bg-green-100 p-2 sm:p-3 rounded-full flex-shrink-0">
              <CheckCircle className="text-green-600 w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-dark">{data?.stats.confirmed || 0}</p>
              <p className="text-gray-500 text-xs sm:text-sm">Đã xác nhận</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="bg-primary/20 p-2 sm:p-3 rounded-full flex-shrink-0">
              <Users className="text-primary w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-dark">{data?.stats.today || 0}</p>
              <p className="text-gray-500 text-xs sm:text-sm">Hôm nay</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-10 gap-4 sm:gap-6">
        {/* Room Status - 6 columns */}
        <div className="lg:col-span-6 bg-white rounded-xl shadow-sm">
            <div className="p-4 sm:p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-dark flex items-center gap-2">
                  <DoorOpen size={20} className="text-primary" />
                  Trạng thái phòng
                </h2>
                <button
                  onClick={fetchRoomsByDate}
                  disabled={loadingRooms}
                  className="text-gray-500 hover:text-dark transition"
                  title="Làm mới"
                >
                  <RefreshCw size={16} className={loadingRooms ? 'animate-spin' : ''} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Chọn ngày:</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Tìm kiếm phòng:</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={roomSearchTerm}
                      onChange={(e) => setRoomSearchTerm(e.target.value)}
                      placeholder="Nhập tên phòng..."
                      className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-3 sm:p-4">
              {/* Legend */}
              <div className="mb-3 sm:mb-4 flex flex-wrap gap-2 sm:gap-4 text-xs">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-red-500"></div>
                  <span className="text-xs">Đã đặt</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-orange-500"></div>
                  <span className="text-xs">Đang sử dụng</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-yellow-500"></div>
                  <span className="text-xs">Bảo trì</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Users size={14} className="text-gray-600 sm:w-4 sm:h-4" />
                  <span className="text-xs">Trống (số người)</span>
                </div>
              </div>

              {loadingRooms ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : roomsByDate.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5 max-h-[400px] sm:max-h-[500px] overflow-y-auto">
                  {(() => {
                    const filteredRooms = roomsByDate.filter((room: any) => 
                      roomSearchTerm === '' || 
                      room.name.toLowerCase().includes(roomSearchTerm.toLowerCase())
                    );
                    if (filteredRooms.length === 0) {
                      return (
                        <div className="col-span-full text-center py-4">
                          <p className="text-gray-400">
                            Không tìm thấy phòng với từ khóa "{roomSearchTerm}"
                          </p>
                        </div>
                      );
                    }
                    return filteredRooms.map((room: any) => {
                      const statusColor = getRoomStatusColor(room);
                      const statusText = getRoomStatusText(room);
                      const isAvailable = isRoomAvailable(room);
                      const hasSound = room.has_sound_system || room.has_karaoke;
                      
                      return (
                        <button
                          key={room.id}
                          onClick={() => handleRoomClick(room)}
                          className="flex flex-col items-center gap-2 sm:gap-2.5 p-3 sm:p-4 rounded-lg border-2 border-gray-200 hover:border-primary transition-all hover:shadow-md group"
                        >
                          {/* Icon phòng - luôn hiển thị DoorOpen */}
                          <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg ${isAvailable ? 'bg-gray-200' : statusColor} flex items-center justify-center ${isAvailable ? '' : 'text-white'} font-bold shadow-md group-hover:scale-110 transition-transform`}>
                            <DoorOpen size={24} className={`sm:w-7 sm:h-7 md:w-8 md:h-8 ${isAvailable ? 'text-gray-700' : ''}`} />
                          </div>
                          <div className="text-center w-full">
                            <p className="font-bold text-sm sm:text-base text-dark truncate" title={room.name}>
                              {getShortRoomName(room.name)}
                            </p>
                            {isAvailable ? (
                              // Phòng trống - hiển thị icon người + số lượng và các icon tiện ích
                              <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-1 sm:mt-1.5 flex-wrap">
                                <div className="flex items-center gap-1">
                                  <Users size={14} className="text-gray-600 sm:w-4 sm:h-4" />
                                  <span className="text-xs sm:text-sm font-bold text-gray-600">{room.capacity || 0}</span>
                                </div>
                                {hasSound && (
                                  <Volume2 size={14} className="text-blue-500 sm:w-4 sm:h-4" title="Có âm thanh" />
                                )}
                                {room.has_projector && (
                                  <Monitor size={14} className="text-purple-500 sm:w-4 sm:h-4" title="Có máy chiếu" />
                                )}
                                {!hasSound && !room.has_projector && (
                                  <span className="text-xs sm:text-sm text-gray-400">-</span>
                                )}
                              </div>
                            ) : (
                              // Phòng đã đặt/đang dùng/bảo trì - hiển thị trạng thái
                              <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-1.5">{statusText}</p>
                            )}
                          </div>
                        </button>
                      );
                    });
                  })()}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">Chưa có phòng</p>
              )}
            </div>
          </div>

        {/* Bookings Today - 4 columns */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-6">
          {/* Bookings Today */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 sm:p-6 border-b border-gray-100">
              <h2 className="text-base sm:text-lg font-bold text-dark flex items-center gap-2">
                <Calendar size={18} className="text-primary sm:w-5 sm:h-5" />
                Đặt bàn hôm nay
              </h2>
            </div>
            <div className="p-3 sm:p-6">
              {data?.today_bookings && data.today_bookings.length > 0 ? (
                <div className="space-y-3 sm:space-y-4 max-h-[400px] sm:max-h-[500px] overflow-y-auto">
                  {data.today_bookings.map((booking: any) => (
                    <div key={booking.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm sm:text-base text-dark truncate">{booking.customer_name}</p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1 break-words">
                          {formatDateTime(booking.booking_date, booking.booking_time)} • {booking.party_size} khách
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">{booking.room?.name || 'Chưa chọn phòng'}</p>
                        <p className="text-xs sm:text-sm text-gray-400 mt-1">{booking.customer_phone}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {booking.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleConfirmBooking(booking.id)}
                              className="bg-green-500 text-white p-2 sm:p-2.5 rounded-lg hover:bg-green-600 transition flex-shrink-0"
                              title="Xác nhận"
                            >
                              <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                            </button>
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              className="bg-red-500 text-white p-2 sm:p-2.5 rounded-lg hover:bg-red-600 transition flex-shrink-0"
                              title="Hủy"
                            >
                              <XCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                            </button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <span className="bg-green-100 text-green-600 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap">
                            Đã xác nhận
                          </span>
                        )}
                        {booking.status === 'cancelled' && (
                          <span className="bg-red-100 text-red-600 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap">
                            Đã hủy
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-6 sm:py-8 text-sm sm:text-base">Không có đặt bàn hôm nay</p>
              )}
            </div>
          </div>

          {/* Recent Contacts */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 sm:p-6 border-b border-gray-100">
              <h2 className="text-base sm:text-lg font-bold text-dark flex items-center gap-2">
                <Mail size={18} className="text-primary sm:w-5 sm:h-5" />
                Liên hệ mới
              </h2>
            </div>
            <div className="p-3 sm:p-4">
              {data?.recent_contacts && data.recent_contacts.length > 0 ? (
                <div className="space-y-3">
                  {data.recent_contacts.map((contact: any) => (
                    <div 
                      key={contact.id} 
                      className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-dark text-sm">{contact.name}</p>
                          <p className="text-xs text-gray-500">{contact.email}</p>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{contact.message}</p>
                        </div>
                        <button
                          onClick={() => handleMarkContactRead(contact.id)}
                          className="text-blue-500 hover:text-blue-600"
                          title="Đánh dấu đã đọc"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">Không có liên hệ mới</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Bookings */}
      <div className="mt-4 sm:mt-6 bg-white rounded-xl shadow-sm">
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <h2 className="text-base sm:text-lg font-bold text-dark flex items-center gap-2">
            <AlertCircle size={18} className="text-primary sm:w-5 sm:h-5" />
            Đặt bàn sắp tới
          </h2>
        </div>
        <div className="p-3 sm:p-6">
          {data?.upcoming_bookings && data.upcoming_bookings.length > 0 ? (
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Khách hàng</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Ngày giờ</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Số khách</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Phòng</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.upcoming_bookings.map((booking: any) => (
                        <tr key={booking.id} className="hover:bg-gray-50">
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <p className="text-xs sm:text-sm font-medium text-dark">{booking.customer_name}</p>
                            <p className="text-xs text-gray-400 sm:hidden">{booking.customer_phone}</p>
                            <p className="text-xs text-gray-500 sm:hidden">{booking.room?.name || '-'}</p>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <p className="text-xs sm:text-sm text-gray-900">{formatDateTime(booking.booking_date, booking.booking_time)}</p>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <p className="text-xs sm:text-sm text-gray-900">{booking.party_size}</p>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                            <p className="text-xs sm:text-sm text-gray-900">{booking.room?.name || '-'}</p>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs font-bold ${
                              booking.status === 'pending' 
                                ? 'bg-yellow-100 text-yellow-600'
                                : booking.status === 'confirmed'
                                ? 'bg-green-100 text-green-600'
                                : 'bg-red-100 text-red-600'
                            }`}>
                              {booking.status === 'pending' ? 'Chờ' : booking.status === 'confirmed' ? 'Xác nhận' : 'Hủy'}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium">
                            {booking.status === 'pending' && (
                              <div className="flex gap-1 sm:gap-2">
                                <button
                                  onClick={() => handleConfirmBooking(booking.id)}
                                  className="text-green-500 hover:text-green-600 p-1"
                                  title="Xác nhận"
                                >
                                  <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                                </button>
                                <button
                                  onClick={() => handleCancelBooking(booking.id)}
                                  className="text-red-500 hover:text-red-600 p-1"
                                  title="Hủy"
                                >
                                  <XCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-6 sm:py-8 text-sm sm:text-base">Không có đặt bàn sắp tới</p>
          )}
        </div>
      </div>

      {/* Quick Booking Modal */}
      {showQuickBooking && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-dark flex items-center gap-2">
                <Plus size={24} className="text-primary" />
                Đặt bàn nhanh
              </h2>
              <button
                onClick={() => setShowQuickBooking(false)}
                className="text-gray-400 hover:text-dark transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              {/* Customer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên khách hàng</label>
                  <input
                    type="text"
                    value={quickBookingForm.customer_name}
                    onChange={(e) => setQuickBookingForm({ ...quickBookingForm, customer_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Tên khách hàng"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
                  <input
                    type="tel"
                    value={quickBookingForm.customer_phone}
                    onChange={(e) => setQuickBookingForm({ ...quickBookingForm, customer_phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Số điện thoại"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số khách *</label>
                  <input
                    type="number"
                    min="1"
                    value={quickBookingForm.party_size}
                    onChange={(e) => setQuickBookingForm({ ...quickBookingForm, party_size: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Booking Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày đặt bàn *</label>
                  <input
                    type="date"
                    value={quickBookingForm.booking_date}
                    onChange={(e) => setQuickBookingForm({ ...quickBookingForm, booking_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giờ đặt bàn *</label>
                  <input
                    type="time"
                    value={quickBookingForm.booking_time}
                    onChange={(e) => setQuickBookingForm({ ...quickBookingForm, booking_time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Room Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chọn phòng (tùy chọn)</label>
                <select
                  value={quickBookingForm.room_id}
                  onChange={(e) => setQuickBookingForm({ ...quickBookingForm, room_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">-- Không chọn phòng --</option>
                  {allRooms.map((room: any) => (
                    <option key={room.id} value={room.id}>
                      {room.name} - {room.capacity} người
                    </option>
                  ))}
                </select>
              </div>

              {/* Menu Items */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn món (tùy chọn)</label>
                
                {/* Searchable Select */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={menuItemSearch}
                    onChange={(e) => setMenuItemSearch(e.target.value)}
                    placeholder="Tìm kiếm món ăn..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div className="border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                  {menuItems.length > 0 ? (
                    <div className="space-y-2">
                      {menuItems
                        .filter((item: any) => 
                          menuItemSearch === '' || 
                          item.name.toLowerCase().includes(menuItemSearch.toLowerCase())
                        )
                        .map((item: any) => {
                        const selectedItem = quickBookingForm.booking_items.find(bi => bi.menu_item_id === item.id);
                        return (
                          <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex-1">
                              <p className="font-medium text-dark">{item.name}</p>
                              <p className="text-sm text-gray-500">
                                {item.is_market_price ? 'Thời giá' : `${parseFloat(item.price).toLocaleString('vi-VN')}đ`}
                              </p>
                            </div>
                            {selectedItem ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleUpdateMenuItemQuantity(item.id, selectedItem.quantity - 1)}
                                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold"
                                >
                                  -
                                </button>
                                <span className="w-8 text-center font-bold">{selectedItem.quantity}</span>
                                <button
                                  onClick={() => handleUpdateMenuItemQuantity(item.id, selectedItem.quantity + 1)}
                                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold"
                                >
                                  +
                                </button>
                                <button
                                  onClick={() => handleRemoveMenuItem(item.id)}
                                  className="ml-2 text-red-500 hover:text-red-600"
                                >
                                  <X size={18} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleAddMenuItem(item.id)}
                                className="px-3 py-1 bg-primary text-dark rounded-lg font-bold hover:bg-yellow-500 transition text-sm"
                              >
                                Thêm
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : menuItemSearch ? (
                    <p className="text-gray-400 text-center py-4">Không tìm thấy món ăn với từ khóa "{menuItemSearch}"</p>
                  ) : (
                    <p className="text-gray-400 text-center py-4">Đang tải món ăn...</p>
                  )}
                </div>
                {quickBookingForm.booking_items.length > 0 && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-bold text-gray-700 mb-1">Món đã chọn:</p>
                    {quickBookingForm.booking_items.map((bi: any) => {
                      const item = menuItems.find(mi => mi.id === bi.menu_item_id);
                      return item ? (
                        <p key={bi.menu_item_id} className="text-xs text-gray-600">
                          {item.name} x{bi.quantity}
                        </p>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <textarea
                  value={quickBookingForm.notes}
                  onChange={(e) => setQuickBookingForm({ ...quickBookingForm, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows={3}
                  placeholder="Ghi chú thêm..."
                />
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowQuickBooking(false)}
                className="w-full sm:flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-600 hover:bg-gray-50 transition text-sm sm:text-base"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmitQuickBooking}
                disabled={savingBooking || !quickBookingForm.customer_phone || !quickBookingForm.booking_date || !quickBookingForm.booking_time}
                className="w-full sm:flex-1 px-4 py-2.5 bg-primary text-dark rounded-lg font-bold hover:bg-yellow-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {savingBooking ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Tạo đặt bàn
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Room Action Modal */}
      {showRoomActionModal && selectedRoomForAction && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg sm:text-xl font-bold text-dark flex items-center gap-2">
                <DoorOpen size={20} className="text-primary sm:w-6 sm:h-6" />
                {selectedRoomForAction.name}
              </h2>
              <button
                onClick={() => {
                  setShowRoomActionModal(false);
                  setSelectedRoomForAction(null);
                }}
                className="text-gray-400 hover:text-dark transition p-1"
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div className="text-center mb-4">
                {/* Icon phòng - luôn hiển thị DoorOpen */}
                <div className={`w-20 h-20 rounded-lg ${isRoomAvailable(selectedRoomForAction) ? 'bg-gray-200' : getRoomStatusColor(selectedRoomForAction)} flex items-center justify-center ${isRoomAvailable(selectedRoomForAction) ? '' : 'text-white'} font-bold text-2xl shadow-md mx-auto mb-2`}>
                  <DoorOpen size={40} className={isRoomAvailable(selectedRoomForAction) ? 'text-gray-700' : ''} />
                </div>
                <p className="text-sm text-gray-500">Trạng thái: {getRoomStatusText(selectedRoomForAction)}</p>
                <div className="flex items-center justify-center gap-2 mt-1 flex-wrap">
                  {selectedRoomForAction.capacity && (
                    <div className="flex items-center gap-1">
                      <Users size={14} className="text-gray-600" />
                      <span className="text-xs text-gray-600 font-bold">{selectedRoomForAction.capacity} người</span>
                    </div>
                  )}
                  {(selectedRoomForAction.has_sound_system || selectedRoomForAction.has_karaoke) && (
                    <div className="flex items-center gap-1">
                      <Volume2 size={14} className="text-blue-500" />
                      <span className="text-xs text-blue-500">Có âm thanh</span>
                    </div>
                  )}
                  {selectedRoomForAction.has_projector && (
                    <div className="flex items-center gap-1">
                      <Monitor size={14} className="text-purple-500" />
                      <span className="text-xs text-purple-500">Có máy chiếu</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    const newStatus = selectedRoomForAction.status === 'available' 
                      ? 'occupied' 
                      : selectedRoomForAction.status === 'occupied'
                      ? 'maintenance'
                      : 'available';
                    handleUpdateRoomStatus(selectedRoomForAction.id, newStatus);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-3 rounded-lg font-bold hover:bg-blue-600 transition"
                >
                  <Edit2 size={20} />
                  Cập nhật trạng thái
                </button>

                <button
                  onClick={() => handleQuickBookingForRoom(selectedRoomForAction)}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-dark px-4 py-3 rounded-lg font-bold hover:bg-yellow-500 transition"
                >
                  <Plus size={20} />
                  Đặt bàn nhanh
                </button>
              </div>

              {/* Status Options */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">Chọn trạng thái:</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleUpdateRoomStatus(selectedRoomForAction.id, 'available')}
                    className={`px-3 py-2 rounded-lg text-sm font-bold transition ${
                      selectedRoomForAction.status === 'available'
                        ? 'bg-green-500 text-white'
                        : 'bg-green-100 text-green-600 hover:bg-green-200'
                    }`}
                  >
                    Trống
                  </button>
                  <button
                    onClick={() => handleUpdateRoomStatus(selectedRoomForAction.id, 'occupied')}
                    className={`px-3 py-2 rounded-lg text-sm font-bold transition ${
                      selectedRoomForAction.status === 'occupied'
                        ? 'bg-orange-500 text-white'
                        : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                    }`}
                  >
                    Đang dùng
                  </button>
                  <button
                    onClick={() => handleUpdateRoomStatus(selectedRoomForAction.id, 'maintenance')}
                    className={`px-3 py-2 rounded-lg text-sm font-bold transition ${
                      selectedRoomForAction.status === 'maintenance'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                    }`}
                  >
                    Bảo trì
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDashboardNew;
