import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../components/AdminLayout';
import {
  adminGetMenuItems, adminGetCategories, adminDeleteMenuItem,
  ApiMenuItem, ApiCategory
} from '../../services/api';
import {
  Plus, Edit2, Trash2, Search, Loader2, X, Save, Image, Upload, Images
} from 'lucide-react';

import { API_BASE_ORIGIN } from '../../services/api';

const AdminMenuItems: React.FC = () => {
  const [items, setItems] = useState<ApiMenuItem[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ApiMenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: 0,
    image_url: '',
    active: true,
    is_market_price: false
  });
  
  // Multiple images support
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<{ id: number; url: string }[]>([]);
  
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsData, catsData] = await Promise.all([
        adminGetMenuItems(),
        adminGetCategories()
      ]);
      setItems(itemsData);
      setCategories(catsData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category_id: categories[0]?.id || 0,
      image_url: '',
      active: true,
      is_market_price: false
    });
    setImageFiles([]);
    setImagePreviews([]);
    setExistingImages([]);
    setShowModal(true);
  };

  const openEditModal = (item: ApiMenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price,
      category_id: item.category_id,
      image_url: item.image_url || '',
      active: item.active,
      is_market_price: item.is_market_price || false
    });
    setImageFiles([]);
    setImagePreviews([]);
    // Load existing images from API
    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
      setExistingImages(item.images.map(img => ({
        id: img.id,
  url: img.url.startsWith('http') ? img.url : `${API_BASE_ORIGIN}${img.url}`
      })));
    } else if (item.images_urls && item.images_urls.length > 0) {
      // Fallback to images_urls if images not available (no delete support)
      setExistingImages(item.images_urls.map((url, index) => ({
        id: index,
  url: url.startsWith('http') ? url : `${API_BASE_ORIGIN}${url}`
      })));
    } else {
      setExistingImages([]);
    }
    setShowModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Chỉ chấp nhận file hình ảnh');
        continue;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File quá lớn. Tối đa 5MB');
        continue;
      }
      
      // Add to files list
      setImageFiles(prev => [...prev, file]);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
    
    // Reset input
    if (e.target) e.target.value = '';
  };

  const removeNewImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = async (imageId: number) => {
    if (!editingItem || !confirm('Xóa ảnh này?')) return;
    
    try {
      const token = localStorage.getItem('admin_token');
  const res = await fetch(`${API_BASE_ORIGIN}/api/v1/admin/menu_items/${editingItem.id}/delete_image/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) throw new Error('Failed to delete image');
      
      setExistingImages(prev => prev.filter(img => img.id !== imageId));
    } catch (err: any) {
      alert('Lỗi xóa ảnh: ' + err.message);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.category_id) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }
    // Nếu không phải thời giá thì phải có giá
    if (!formData.is_market_price && !formData.price) {
      alert('Vui lòng nhập giá hoặc chọn "Thời giá"');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('admin_token');
      
      const form = new FormData();
      form.append('name', formData.name);
      form.append('description', formData.description);
      form.append('price', formData.is_market_price ? '0' : formData.price);
      form.append('category_id', String(formData.category_id));
      form.append('active', String(formData.active));
      form.append('is_market_price', String(formData.is_market_price));
      
      // Append all new images
      imageFiles.forEach(file => {
        form.append('images[]', file);
      });
      
      const url = editingItem 
  ? `${API_BASE_ORIGIN}/api/v1/admin/menu_items/${editingItem.id}`
  : `${API_BASE_ORIGIN}/api/v1/admin/menu_items`;
        
      const res = await fetch(url, {
        method: editingItem ? 'PATCH' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: form
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.errors?.join(', ') || 'Failed to save');
      }
      
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: ApiMenuItem) => {
    if (!confirm(`Bạn có chắc muốn xóa "${item.name}"?`)) return;

    try {
      await adminDeleteMenuItem(item.id);
      fetchData();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const filteredItems = items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === '' || item.category_id === categoryFilter;
    return matchSearch && matchCategory;
  });

  const formatPrice = (item: ApiMenuItem) => {
    if (item.is_market_price) {
      return 'Thời giá';
    }
    return parseInt(item.price).toLocaleString('vi-VN') + 'đ';
  };

  const getThumbnailUrl = (item: ApiMenuItem) => {
    if (item.thumbnail_url) {
  return item.thumbnail_url.startsWith('http') ? item.thumbnail_url : `${API_BASE_ORIGIN}${item.thumbnail_url}`;
    }
    if (item.image_url) {
  return item.image_url.startsWith('http') ? item.image_url : `${API_BASE_ORIGIN}${item.image_url}`;
    }
    return '';
  };

  if (loading) {
    return (
      <AdminLayout title="Quản lý Món ăn">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Quản lý Món ăn">
      {/* Header Actions */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-4 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Tìm món ăn..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>
            
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value ? parseInt(e.target.value) : '')}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-primary text-dark px-4 py-2 rounded-lg font-bold hover:bg-primary/90 transition w-full md:w-auto justify-center"
          >
            <Plus size={18} /> Thêm món mới
          </button>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Hình</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Tên món</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Danh mục</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">Giá</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">Ảnh</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">Trạng thái</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.length > 0 ? (
                filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {getThumbnailUrl(item) ? (
                        <img
                          src={getThumbnailUrl(item)}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                          <Image size={20} className="text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-dark">{item.name}</p>
                      <p className="text-sm text-gray-400 line-clamp-1">{item.description}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">
                        {item.category?.name || categories.find(c => c.id === item.category_id)?.name || '-'}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-right font-bold ${item.is_market_price ? 'text-orange-500 italic' : 'text-primary'}`}>
                      {formatPrice(item)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="flex items-center justify-center gap-1 text-gray-500">
                        <Images size={16} />
                        {item.images_urls?.length || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        item.active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {item.active ? 'Hiển thị' : 'Ẩn'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                          title="Chỉnh sửa"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Xóa"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Không có món ăn nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-dark">
                {editingItem ? 'Chỉnh sửa món ăn' : 'Thêm món ăn mới'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên món *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
                  placeholder="VD: Gà rán sốt mật ong"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
                  rows={3}
                  placeholder="Mô tả món ăn..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giá (VNĐ) {!formData.is_market_price && '*'}
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 disabled:bg-gray-100 disabled:text-gray-400"
                    placeholder="VD: 150000"
                    disabled={formData.is_market_price}
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_market_price"
                      checked={formData.is_market_price}
                      onChange={(e) => setFormData({ ...formData, is_market_price: e.target.checked, price: e.target.checked ? '' : formData.price })}
                      className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                    <label htmlFor="is_market_price" className="text-sm text-orange-600 font-medium cursor-pointer">
                      Thời giá (giá liên hệ)
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục *</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hình ảnh ({existingImages.length + imagePreviews.length} ảnh)
                </label>
                
                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-2">Ảnh hiện có:</p>
                    <div className="flex flex-wrap gap-2">
                      {existingImages.map((img) => (
                        <div key={img.id} className="relative">
                          <img
                            src={img.url}
                            alt="Existing"
                            className="w-20 h-20 rounded-lg object-cover border-2 border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingImage(img.id)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-2">Ảnh mới:</p>
                    <div className="flex flex-wrap gap-2">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-20 h-20 rounded-lg object-cover border-2 border-primary"
                          />
                          <button
                            type="button"
                            onClick={() => removeNewImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                <div className="flex gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary hover:text-primary transition"
                  >
                    <Upload size={18} />
                    Tải thêm hình
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">Có thể chọn nhiều ảnh. Chấp nhận: JPEG, PNG, GIF, WebP. Tối đa 5MB/ảnh</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="active" className="text-sm text-gray-700">Hiển thị món ăn</label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-primary text-dark px-4 py-2 rounded-lg font-bold hover:bg-primary/90 transition disabled:opacity-50"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {editingItem ? 'Cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminMenuItems;
