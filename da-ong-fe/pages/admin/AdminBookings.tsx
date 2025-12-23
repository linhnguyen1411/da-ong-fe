import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import {
  adminGetBookings, adminConfirmBooking, adminCancelBooking, adminGetRooms, ApiRoom
} from '../../services/api';
import {
  Search, Loader2, CheckCircle, XCircle, Clock, Calendar, Filter, Users, Phone
} from 'lucide-react';

interface Booking {
  id: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  party_size: number;
  booking_date: string;
  booking_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes: string;
  room?: { id: number; name: string };
  created_at: string;
}

// Helper function to format date and time
const formatDateTime = (dateStr: string, timeStr?: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  if (timeStr) {
    return `${timeStr} ${day}/${month}/${year}`;
  }
  return `${day}/${month}/${year}`;
};

const AdminBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<ApiRoom[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [roomFilter, setRoomFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, [statusFilter, dateFilter, roomFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsData, roomsData] = await Promise.all([
        adminGetBookings({
          status: statusFilter || undefined,
          date: dateFilter || undefined,
          room_id: roomFilter ? parseInt(roomFilter) : undefined
        }),
        adminGetRooms()
      ]);
      setBookings(bookingsData);
      setRooms(roomsData);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: number) => {
    try {
      await adminConfirmBooking(id);
      fetchData();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Bạn có chắc muốn hủy đặt bàn này?')) return;
    try {
      await adminCancelBooking(id);
      fetchData();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-600',
      confirmed: 'bg-green-100 text-green-600',
      cancelled: 'bg-red-100 text-red-600',
      completed: 'bg-blue-100 text-blue-600'
    };
    const labels: Record<string, string> = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      cancelled: 'Đã hủy',
      completed: 'Hoàn thành'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const filteredBookings = bookings.filter(b => 
    b.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    b.customer_phone.includes(search)
  );

  if (loading) {
    return (
      <AdminLayout title="Quản lý Đặt bàn">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Quản lý Đặt bàn">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1 md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm theo tên, SĐT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="flex gap-3 flex-wrap">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Chờ xác nhận</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="cancelled">Đã hủy</option>
              <option value="completed">Hoàn thành</option>
            </select>

            {/* Date Filter */}
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
            />

            {/* Room Filter */}
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Tất cả phòng</option>
              {rooms.map(room => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>

            {(statusFilter || dateFilter || roomFilter) && (
              <button
                onClick={() => {
                  setStatusFilter('');
                  setDateFilter('');
                  setRoomFilter('');
                }}
                className="px-4 py-2 text-gray-500 hover:text-gray-700"
              >
                Xóa lọc
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <Calendar className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-xl font-bold text-dark">{bookings.length}</p>
              <p className="text-gray-500 text-sm">Tổng đặt bàn</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-2 rounded-full">
              <Clock className="text-yellow-600" size={20} />
            </div>
            <div>
              <p className="text-xl font-bold text-dark">
                {bookings.filter(b => b.status === 'pending').length}
              </p>
              <p className="text-gray-500 text-sm">Chờ xác nhận</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-full">
              <CheckCircle className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-xl font-bold text-dark">
                {bookings.filter(b => b.status === 'confirmed').length}
              </p>
              <p className="text-gray-500 text-sm">Đã xác nhận</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-full">
              <XCircle className="text-red-600" size={20} />
            </div>
            <div>
              <p className="text-xl font-bold text-dark">
                {bookings.filter(b => b.status === 'cancelled').length}
              </p>
              <p className="text-gray-500 text-sm">Đã hủy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Khách hàng</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Ngày & Giờ</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">Số khách</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Phòng</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">Trạng thái</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBookings.length > 0 ? (
                filteredBookings.map(booking => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-dark">{booking.customer_name}</p>
                      <p className="text-sm text-gray-400 flex items-center gap-1">
                        <Phone size={12} /> {booking.customer_phone}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-dark">{formatDateTime(booking.booking_date, booking.booking_time)}</p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="flex items-center justify-center gap-1 text-dark">
                        <Users size={16} /> {booking.party_size}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">
                        {booking.room?.name || 'Chưa chọn'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(booking.status)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        {booking.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleConfirm(booking.id)}
                              className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition"
                              title="Xác nhận"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => handleCancel(booking.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                              title="Hủy"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => handleCancel(booking.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Hủy"
                          >
                            <XCircle size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    Không có đặt bàn nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminBookings;
