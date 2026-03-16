import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import {
  adminGetBookings, adminConfirmBooking, adminCancelBooking, adminGetRooms, ApiRoom,
  adminGetBooking, adminUpdateBooking, getMenuItems, ApiMenuItem
} from '../../services/api';
import {
  Search, Loader2, CheckCircle, XCircle, Clock, Calendar, Filter, Users, Phone, Edit2, X, Plus, Minus
} from 'lucide-react';
import { formatDateTime } from '../../utils/dateFormat';

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

interface BookingItem {
  menu_item_id: number;
  quantity: number;
  menu_item?: ApiMenuItem;
}

const AdminBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<ApiRoom[]>([]);
  const [menuItems, setMenuItems] = useState<ApiMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [roomFilter, setRoomFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editForm, setEditForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    booking_date: '',
    booking_time: '',
    party_size: 1,
    room_id: '',
    notes: '',
    status: 'pending' as 'pending' | 'confirmed' | 'cancelled' | 'completed',
    booking_items: [] as BookingItem[]
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [statusFilter, dateFilter, roomFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsData, roomsData, menuItemsData] = await Promise.all([
        adminGetBookings({
          status: statusFilter || undefined,
          date: dateFilter || undefined,
          room_id: roomFilter ? parseInt(roomFilter) : undefined
        }),
        adminGetRooms(),
        getMenuItems()
      ]);
      setBookings(bookingsData);
      setRooms(roomsData);
      setMenuItems(menuItemsData);
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

  const handleEdit = async (id: number) => {
    try {
      const booking = await adminGetBooking(id);
      setEditingBooking(booking);
      setEditForm({
        customer_name: booking.customer_name || '',
        customer_phone: booking.customer_phone || '',
        customer_email: booking.customer_email || '',
        booking_date: booking.booking_date || '',
        booking_time: booking.booking_time || '',
        party_size: booking.party_size || 1,
        room_id: booking.room_id ? String(booking.room_id) : '',
        notes: booking.notes || '',
        status: booking.status || 'pending',
        booking_items: booking.booking_items?.map((item: any) => ({
          menu_item_id: item.menu_item_id || item.menu_item?.id,
          quantity: item.quantity || 1,
          menu_item: item.menu_item
        })) || []
      });
      setShowEditModal(true);
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingBooking) return;
    if (!editForm.customer_phone || !editForm.booking_date || !editForm.booking_time) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc (SĐT, Ngày, Giờ)');
      return;
    }

    try {
      setSaving(true);
      await adminUpdateBooking(editingBooking.id, {
        customer_name: editForm.customer_name,
        customer_phone: editForm.customer_phone,
        customer_email: editForm.customer_email,
        booking_date: editForm.booking_date,
        booking_time: editForm.booking_time,
        party_size: editForm.party_size,
        room_id: editForm.room_id ? parseInt(editForm.room_id) : undefined,
        notes: editForm.notes,
        status: editForm.status,
        booking_items_attributes: editForm.booking_items.map(item => ({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity
        }))
      });
      setShowEditModal(false);
      setEditingBooking(null);
      fetchData();
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || 'Không thể cập nhật booking'));
    } finally {
      setSaving(false);
    }
  };

  const handleAddMenuItem = (menuItemId: number) => {
    const existing = editForm.booking_items.find(item => item.menu_item_id === menuItemId);
    if (existing) {
      setEditForm({
        ...editForm,
        booking_items: editForm.booking_items.map(item =>
          item.menu_item_id === menuItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      });
    } else {
      const menuItem = menuItems.find(m => m.id === menuItemId);
      setEditForm({
        ...editForm,
        booking_items: [...editForm.booking_items, { menu_item_id: menuItemId, quantity: 1, menu_item: menuItem }]
      });
    }
  };

  const handleRemoveMenuItem = (menuItemId: number) => {
    setEditForm({
      ...editForm,
      booking_items: editForm.booking_items.filter(item => item.menu_item_id !== menuItemId)
    });
  };

  const handleUpdateMenuItemQuantity = (menuItemId: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveMenuItem(menuItemId);
      return;
    }
    setEditForm({
      ...editForm,
      booking_items: editForm.booking_items.map(item =>
        item.menu_item_id === menuItemId
          ? { ...item, quantity }
          : item
      )
    });
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
      <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Search */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm theo tên, SĐT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
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
              className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
            />

            {/* Room Filter */}
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
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
                className="px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg sm:border-0"
              >
                Xóa lọc
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
              <Calendar className="text-blue-600" size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-bold text-dark">{bookings.length}</p>
              <p className="text-gray-500 text-xs sm:text-sm">Tổng đặt bàn</p>
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
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">Khách hàng</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">Ngày & Giờ</th>
                    <th className="px-3 sm:px-4 py-3 text-center text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">Số khách</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">Phòng</th>
                    <th className="px-3 sm:px-4 py-3 text-center text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-3 sm:px-4 py-3 text-center text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">Thao tác</th>
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
                        <button
                          onClick={() => handleEdit(booking.id)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                          title="Sửa"
                        >
                          <Edit2 size={18} />
                        </button>
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
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-dark">Sửa đặt bàn</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingBooking(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              {/* Customer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên khách hàng *</label>
                  <input
                    type="text"
                    value={editForm.customer_name}
                    onChange={(e) => setEditForm({ ...editForm, customer_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
                  <input
                    type="tel"
                    value={editForm.customer_phone}
                    onChange={(e) => setEditForm({ ...editForm, customer_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.customer_email}
                    onChange={(e) => setEditForm({ ...editForm, customer_email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số khách *</label>
                  <input
                    type="number"
                    min="1"
                    value={editForm.party_size}
                    onChange={(e) => setEditForm({ ...editForm, party_size: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Booking Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày đặt *</label>
                  <input
                    type="date"
                    value={editForm.booking_date}
                    onChange={(e) => setEditForm({ ...editForm, booking_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giờ đặt *</label>
                  <input
                    type="time"
                    value={editForm.booking_time}
                    onChange={(e) => setEditForm({ ...editForm, booking_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Room & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phòng</label>
                  <select
                    value={editForm.room_id}
                    onChange={(e) => setEditForm({ ...editForm, room_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Chưa chọn phòng</option>
                    {rooms.map(room => (
                      <option key={room.id} value={room.id}>{room.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="pending">Chờ xác nhận</option>
                    <option value="confirmed">Đã xác nhận</option>
                    <option value="cancelled">Đã hủy</option>
                    <option value="completed">Hoàn thành</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Menu Items */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Món ăn đã chọn</label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {editForm.booking_items.length > 0 ? (
                    editForm.booking_items.map((item) => {
                      const menuItem = item.menu_item || menuItems.find(m => m.id === item.menu_item_id);
                      return (
                        <div key={item.menu_item_id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{menuItem?.name || `Món #${item.menu_item_id}`}</p>
                            <p className="text-xs text-gray-500">{menuItem?.price ? `${parseInt(menuItem.price).toLocaleString('vi-VN')}đ` : ''}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpdateMenuItemQuantity(item.menu_item_id, item.quantity - 1)}
                              className="p-1 text-gray-500 hover:text-dark"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="w-8 text-center font-bold">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateMenuItemQuantity(item.menu_item_id, item.quantity + 1)}
                              className="p-1 text-gray-500 hover:text-dark"
                            >
                              <Plus size={16} />
                            </button>
                            <button
                              onClick={() => handleRemoveMenuItem(item.menu_item_id)}
                              className="p-1 text-red-500 hover:text-red-700 ml-2"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-400 text-sm text-center py-2">Chưa có món ăn nào</p>
                  )}
                </div>
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thêm món ăn</label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddMenuItem(parseInt(e.target.value));
                        e.target.value = '';
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Chọn món ăn...</option>
                    {menuItems.map(item => (
                      <option key={item.id} value={item.id}>{item.name} - {parseInt(item.price).toLocaleString('vi-VN')}đ</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex-1 bg-primary text-dark font-bold py-2 px-4 rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingBooking(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminBookings;
