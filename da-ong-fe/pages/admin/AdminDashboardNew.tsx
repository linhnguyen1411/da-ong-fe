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
  adminGetBookings
} from '../../services/api';
import { 
  Loader2, Calendar, Users, Mail, DoorOpen, 
  CheckCircle, XCircle, Clock, AlertCircle, Eye,
  RefreshCw, Search
} from 'lucide-react';

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

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchDashboard();
    fetchRoomsByDate();
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
    } catch (err) {
      alert('Có lỗi xảy ra');
    }
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
      {/* Refresh Button */}
      <div className="flex justify-end mb-4">
        <button 
          onClick={fetchDashboard}
          className="flex items-center gap-2 text-gray-500 hover:text-dark transition"
        >
          <RefreshCw size={16} /> Làm mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Calendar className="text-blue-600 w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-dark">{data?.stats.total_bookings || 0}</p>
              <p className="text-gray-500 text-sm">Tổng đặt bàn</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-yellow-100 p-3 rounded-full">
              <Clock className="text-yellow-600 w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-dark">{data?.stats.pending || 0}</p>
              <p className="text-gray-500 text-sm">Chờ xác nhận</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="text-green-600 w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-dark">{data?.stats.confirmed || 0}</p>
              <p className="text-gray-500 text-sm">Đã xác nhận</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-primary/20 p-3 rounded-full">
              <Users className="text-primary w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-dark">{data?.stats.today || 0}</p>
              <p className="text-gray-500 text-sm">Hôm nay</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-10 gap-6">
        {/* Room Status - 6 columns */}
        <div className="lg:col-span-6 bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-100">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày:</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm phòng:</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={roomSearchTerm}
                      onChange={(e) => setRoomSearchTerm(e.target.value)}
                      placeholder="Nhập tên phòng..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4">
              {loadingRooms ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : roomsByDate.length > 0 ? (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {(() => {
                    const filteredRooms = roomsByDate.filter((room: any) => 
                      roomSearchTerm === '' || 
                      room.name.toLowerCase().includes(roomSearchTerm.toLowerCase())
                    );
                    if (filteredRooms.length === 0) {
                      return (
                        <p className="text-gray-400 text-center py-4">
                          Không tìm thấy phòng với từ khóa "{roomSearchTerm}"
                        </p>
                      );
                    }
                    return filteredRooms.map((room: any) => {
                    const roomBookings = bookingsByDate.filter((b: any) => b.room_id === room.id);
                    return (
                      <div key={room.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-dark">{room.name}</span>
                          <div className="flex items-center gap-2">
                            {room.booked_for_date ? (
                              <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-bold">
                                Đã đặt ({roomBookings.length})
                              </span>
                            ) : (
                              <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-bold">
                                Trống
                              </span>
                            )}
                            <select
                              value={room.status || 'available'}
                              onChange={(e) => handleUpdateRoomStatus(room.id, e.target.value)}
                              className={`text-xs px-2 py-1 rounded-full font-bold border-0 cursor-pointer ${
                                room.status === 'available' 
                                  ? 'bg-green-100 text-green-600' 
                                  : room.status === 'occupied'
                                  ? 'bg-red-100 text-red-600'
                                  : 'bg-yellow-100 text-yellow-600'
                              }`}
                            >
                              <option value="available">Trống</option>
                              <option value="occupied">Đang sử dụng</option>
                              <option value="maintenance">Bảo trì</option>
                            </select>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          <p>Sức chứa: {room.capacity} người</p>
                          {room.price_per_hour > 0 && (
                            <p>Giá: {parseFloat(room.price_per_hour).toLocaleString('vi-VN')}đ/h</p>
                          )}
                        </div>
                        {roomBookings.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs font-bold text-gray-700 mb-1">Bookings:</p>
                            {roomBookings.map((booking: any) => (
                              <div key={booking.id} className="text-xs bg-gray-50 p-2 rounded mb-1">
                                <p className="font-medium text-dark">{booking.customer_name}</p>
                                <p className="text-gray-600">
                                  {booking.booking_time} • {booking.party_size} khách
                                </p>
                                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold ${
                                  booking.status === 'confirmed' 
                                    ? 'bg-green-100 text-green-600'
                                    : booking.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-600'
                                    : 'bg-red-100 text-red-600'
                                }`}>
                                  {booking.status === 'confirmed' ? 'Đã xác nhận' : booking.status === 'pending' ? 'Chờ xác nhận' : 'Đã hủy'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
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
        <div className="lg:col-span-4 space-y-6">
          {/* Bookings Today */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-dark flex items-center gap-2">
                <Calendar size={20} className="text-primary" />
                Đặt bàn hôm nay
              </h2>
            </div>
            <div className="p-6">
              {data?.today_bookings && data.today_bookings.length > 0 ? (
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {data.today_bookings.map((booking: any) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-bold text-dark">{booking.customer_name}</p>
                        <p className="text-sm text-gray-500">
                          {booking.booking_time} • {booking.party_size} khách • {booking.room?.name || 'Chưa chọn phòng'}
                        </p>
                        <p className="text-sm text-gray-400">{booking.customer_phone}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {booking.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleConfirmBooking(booking.id)}
                              className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition"
                              title="Xác nhận"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition"
                              title="Hủy"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-sm font-bold">
                            Đã xác nhận
                          </span>
                        )}
                        {booking.status === 'cancelled' && (
                          <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-bold">
                            Đã hủy
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">Không có đặt bàn hôm nay</p>
              )}
            </div>
          </div>

          {/* Recent Contacts */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-dark flex items-center gap-2">
                <Mail size={20} className="text-primary" />
                Liên hệ mới
              </h2>
            </div>
            <div className="p-4">
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
      <div className="mt-6 bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-dark flex items-center gap-2">
            <AlertCircle size={20} className="text-primary" />
            Đặt bàn sắp tới
          </h2>
        </div>
        <div className="p-6">
          {data?.upcoming_bookings && data.upcoming_bookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-500 text-sm border-b">
                    <th className="pb-3">Khách hàng</th>
                    <th className="pb-3">Ngày</th>
                    <th className="pb-3">Giờ</th>
                    <th className="pb-3">Số khách</th>
                    <th className="pb-3">Phòng</th>
                    <th className="pb-3">Trạng thái</th>
                    <th className="pb-3">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {data.upcoming_bookings.map((booking: any) => (
                    <tr key={booking.id} className="border-b last:border-0">
                      <td className="py-3">
                        <p className="font-medium text-dark">{booking.customer_name}</p>
                        <p className="text-sm text-gray-400">{booking.customer_phone}</p>
                      </td>
                      <td className="py-3">{booking.booking_date}</td>
                      <td className="py-3">{booking.booking_time}</td>
                      <td className="py-3">{booking.party_size}</td>
                      <td className="py-3">{booking.room?.name || '-'}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          booking.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-600'
                            : booking.status === 'confirmed'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {booking.status === 'pending' ? 'Chờ' : booking.status === 'confirmed' ? 'Xác nhận' : 'Hủy'}
                        </span>
                      </td>
                      <td className="py-3">
                        {booking.status === 'pending' && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleConfirmBooking(booking.id)}
                              className="text-green-500 hover:text-green-600"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <XCircle size={18} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">Không có đặt bàn sắp tới</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardNew;
