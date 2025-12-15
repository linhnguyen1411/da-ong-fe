import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import {
  adminGetRooms, adminCreateRoom, adminUpdateRoom, adminDeleteRoom,
  adminUploadRoomImages, adminDeleteRoomImage, ApiRoom
} from '../../services/api';
import {
  Plus, Edit2, Trash2, Loader2, X, Save, Upload, DoorOpen,
  Users, Music, Tv, Mic
} from 'lucide-react';

import { API_BASE_ORIGIN } from '../../services/api';

const getImageUrl = (url?: string) => {
  if (!url) return '';
  return url.startsWith('http') ? url : `${API_BASE_ORIGIN}${url}`;
};

const AdminRooms: React.FC = () => {
  const [rooms, setRooms] = useState<ApiRoom[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ApiRoom | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: 10,
    price_per_hour: '',
    status: 'available',
    room_type: 'private' as 'private' | 'outdoor',
    has_sound_system: false,
    has_projector: false,
    has_karaoke: false,
    position: 1,
    active: true
  });
  const [saving, setSaving] = useState(false);

  // Images state
  const [existingImages, setExistingImages] = useState<{ id: number; url: string }[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await adminGetRooms();
      setRooms(data);
    } catch (err) {
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      capacity: 10,
      price_per_hour: '',
      status: 'available',
      room_type: 'private',
      has_sound_system: false,
      has_projector: false,
      has_karaoke: false,
      position: rooms.length + 1,
      active: true
    });
    setExistingImages([]);
    setNewImageFiles([]);
    setNewImagePreviews([]);
    setShowModal(true);
  };

  const openEditModal = (item: ApiRoom) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      capacity: item.capacity,
      price_per_hour: item.price_per_hour,
      status: item.status,
      room_type: item.room_type || 'private',
      has_sound_system: item.has_sound_system || false,
      has_projector: item.has_projector || false,
      has_karaoke: item.has_karaoke || false,
      position: item.position || 1,
      active: item.active
    });

    // Load existing images
    const images = (item as any).images || [];
    setExistingImages(images.map((img: any) => ({
      id: img.id,
      url: getImageUrl(img.url)
    })));
    setNewImageFiles([]);
    setNewImagePreviews([]);
    setShowModal(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray: File[] = [];
      for (let i = 0; i < files.length; i++) {
        fileArray.push(files[i]);
      }
      setNewImageFiles(prev => [...prev, ...fileArray]);

      fileArray.forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
    e.target.value = '';
  };

  const removeNewImage = (index: number) => {
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = async (imageId: number) => {
    if (!editingItem) return;
    if (!confirm('Xóa ảnh này?')) return;

    try {
      await adminDeleteRoomImage(editingItem.id, imageId);
      setExistingImages(prev => prev.filter(img => img.id !== imageId));
    } catch (err: any) {
      alert('Lỗi xóa ảnh: ' + err.message);
    }
  };

  const handleSave = async () => {
    if (!formData.name) {
      alert('Vui lòng nhập tên phòng');
      return;
    }
    if (!formData.price_per_hour) {
      alert('Vui lòng nhập giá phòng');
      return;
    }

    try {
      setSaving(true);
      let roomId: number;

      if (editingItem) {
        await adminUpdateRoom(editingItem.id, formData);
        roomId = editingItem.id;
      } else {
        const newRoom = await adminCreateRoom(formData);
        roomId = newRoom.id;
      }

      // Upload new images if any
      if (newImageFiles.length > 0) {
        setUploadingImages(true);
        await adminUploadRoomImages(roomId, newImageFiles);
        setUploadingImages(false);
      }

      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
      setUploadingImages(false);
    }
  };

  const handleDelete = async (item: ApiRoom) => {
    if (!confirm(`Bạn có chắc muốn xóa phòng "${item.name}"?`)) return;

    try {
      await adminDeleteRoom(item.id);
      fetchData();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const getStatusStyle = (status: string) => {
    const styles: Record<string, string> = {
      available: 'bg-green-100 text-green-600',
      occupied: 'bg-red-100 text-red-600',
      maintenance: 'bg-yellow-100 text-yellow-600'
    };
    return styles[status] || 'bg-gray-100 text-gray-600';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      available: 'Trống',
      occupied: 'Đang sử dụng',
      maintenance: 'Bảo trì'
    };
    return labels[status] || status;
  };

  const formatPrice = (price: string) => {
    return parseInt(price || '0').toLocaleString('vi-VN') + 'đ';
  };

  if (loading) {
    return (
      <AdminLayout title="Quản lý Phòng">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Quản lý Phòng">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <DoorOpen className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-xl font-bold text-dark">{rooms.length}</p>
              <p className="text-gray-500 text-sm">Tổng số phòng</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-full">
              <DoorOpen className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-xl font-bold text-dark">
                {rooms.filter(r => r.status === 'available').length}
              </p>
              <p className="text-gray-500 text-sm">Phòng trống</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-full">
              <DoorOpen className="text-red-600" size={20} />
            </div>
            <div>
              <p className="text-xl font-bold text-dark">
                {rooms.filter(r => r.status === 'occupied').length}
              </p>
              <p className="text-gray-500 text-sm">Đang sử dụng</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-2 rounded-full">
              <DoorOpen className="text-yellow-600" size={20} />
            </div>
            <div>
              <p className="text-xl font-bold text-dark">
                {rooms.filter(r => r.status === 'maintenance').length}
              </p>
              <p className="text-gray-500 text-sm">Bảo trì</p>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex items-center justify-between">
        <p className="text-gray-500">{rooms.length} phòng</p>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-primary text-dark px-4 py-2 rounded-lg font-bold hover:bg-primary/90 transition"
        >
          <Plus size={18} /> Thêm phòng
        </button>
      </div>

      {/* Rooms Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">STT</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Ảnh</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tên phòng</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Sức chứa</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Giá/giờ</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-36">Tiện nghi</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Trạng thái</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rooms
              .sort((a, b) => (a.position || 0) - (b.position || 0))
              .map((room, index) => {
                const thumbnail = getImageUrl((room as any).thumbnail_url);
                return (
                  <tr key={room.id} className="hover:bg-gray-50 transition">
                    {/* Position */}
                    <td className="px-4 py-3">
                      <span className="w-8 h-8 flex items-center justify-center bg-primary/10 text-primary font-bold rounded-lg text-sm">
                        {room.position || index + 1}
                      </span>
                    </td>

                    {/* Thumbnail */}
                    <td className="px-4 py-3">
                      {thumbnail ? (
                        <img src={thumbnail} alt={room.name} className="w-12 h-12 object-cover rounded-lg" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          <DoorOpen size={20} className="text-gray-400" />
                        </div>
                      )}
                    </td>

                    {/* Name & Description */}
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-semibold text-dark">{room.name}</span>
                        <p className="text-gray-400 text-sm line-clamp-1">{room.description || '-'}</p>
                      </div>
                    </td>

                    {/* Capacity */}
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-gray-600">
                        <Users size={14} /> {room.capacity}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3 text-center">
                      <span className="text-primary font-bold">{formatPrice(room.price_per_hour)}</span>
                    </td>

                    {/* Amenities */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {room.has_sound_system && <Music size={16} className="text-blue-500" title="Âm thanh" />}
                        {room.has_projector && <Tv size={16} className="text-green-500" title="Máy chiếu" />}
                        {room.has_karaoke && <Mic size={16} className="text-red-500" title="Karaoke" />}
                        {!room.has_sound_system && !room.has_projector && !room.has_karaoke && (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${getStatusStyle(room.status)}`}>
                        {getStatusLabel(room.status)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditModal(room)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                          title="Chỉnh sửa"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(room)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>

        {rooms.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            Chưa có phòng nào
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-dark">
                {editingItem ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên phòng *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
                  placeholder="VD: Phòng VIP 1"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
                  rows={3}
                  placeholder="Mô tả phòng..."
                />
              </div>

              {/* Capacity & Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sức chứa (người) *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá/giờ (VNĐ) *</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={formData.price_per_hour}
                    onChange={(e) => setFormData({ ...formData, price_per_hour: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
                    placeholder="500000"
                  />
                </div>
              </div>

              {/* Position & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí hiển thị</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="available">Trống</option>
                    <option value="occupied">Đang sử dụng</option>
                    <option value="maintenance">Bảo trì</option>
                  </select>
                </div>
              </div>

              {/* Room Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại phòng *</label>
                <select
                  value={formData.room_type}
                  onChange={(e) => setFormData({ ...formData, room_type: e.target.value as 'private' | 'outdoor' })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
                >
                  <option value="private">Phòng riêng</option>
                  <option value="outdoor">Khu vực ngoài trời</option>
                </select>
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tiện nghi</label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.has_sound_system}
                      onChange={(e) => setFormData({ ...formData, has_sound_system: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Music size={16} className="text-blue-500" />
                    <span className="text-sm text-gray-700">Hệ thống âm thanh</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.has_projector}
                      onChange={(e) => setFormData({ ...formData, has_projector: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Tv size={16} className="text-green-500" />
                    <span className="text-sm text-gray-700">Máy chiếu</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.has_karaoke}
                      onChange={(e) => setFormData({ ...formData, has_karaoke: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Mic size={16} className="text-red-500" />
                    <span className="text-sm text-gray-700">Karaoke</span>
                  </label>
                </div>
              </div>

              {/* Active */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="active" className="text-sm text-gray-700">Hiển thị phòng</label>
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh phòng</label>

                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {existingImages.map((img) => (
                      <div key={img.id} className="relative group">
                        <img src={img.url} alt="" className="w-full h-20 object-cover rounded-lg" />
                        <button
                          onClick={() => removeExistingImage(img.id)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* New Image Previews */}
                {newImagePreviews.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {newImagePreviews.map((preview, idx) => (
                      <div key={idx} className="relative group">
                        <img src={preview} alt="" className="w-full h-20 object-cover rounded-lg border-2 border-primary" />
                        <button
                          onClick={() => removeNewImage(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                        >
                          <X size={12} />
                        </button>
                        <span className="absolute bottom-1 left-1 bg-primary text-dark text-xs px-1 rounded">Mới</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Button */}
                <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <Upload size={20} className="text-gray-400" />
                  <span className="text-gray-500">Chọn ảnh để tải lên</span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end sticky bottom-0 bg-white">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving || uploadingImages}
                className="flex items-center gap-2 bg-primary text-dark px-4 py-2 rounded-lg font-bold hover:bg-primary/90 transition disabled:opacity-50"
              >
                {(saving || uploadingImages) ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {uploadingImages ? 'Đang tải ảnh...' : 'Đang lưu...'}
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    {editingItem ? 'Cập nhật' : 'Tạo mới'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminRooms;
