import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import {
  adminGetCategories, adminCreateCategory, adminUpdateCategory, adminDeleteCategory,
  ApiCategory
} from '../../services/api';
import {
  Plus, Edit2, Trash2, Loader2, X, Save
} from 'lucide-react';

const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ApiCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    position: 0,
    active: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await adminGetCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({ name: '', description: '', position: categories.length + 1, active: true });
    setShowModal(true);
  };

  const openEditModal = (item: ApiCategory) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      position: item.position || 0,
      active: item.active
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      alert('Vui lòng nhập tên danh mục');
      return;
    }

    try {
      setSaving(true);
      if (editingItem) {
        await adminUpdateCategory(editingItem.id, formData);
      } else {
        await adminCreateCategory(formData);
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: ApiCategory) => {
    if (!confirm(`Bạn có chắc muốn xóa danh mục "${item.name}"?`)) return;

    try {
      await adminDeleteCategory(item.id);
      fetchData();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Quản lý Danh mục">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Quản lý Danh mục">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex items-center justify-between">
        <p className="text-gray-500">{categories.length} danh mục</p>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-primary text-dark px-4 py-2 rounded-lg font-bold hover:bg-primary/90 transition"
        >
          <Plus size={18} /> Thêm danh mục
        </button>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Vị trí</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tên danh mục</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mô tả</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Số món</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Trạng thái</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categories
              .sort((a, b) => (a.position || 0) - (b.position || 0))
              .map((cat, index) => (
              <tr key={cat.id} className="hover:bg-gray-50 transition">
                {/* Position Column */}
                <td className="px-4 py-3">
                  <span className="w-8 h-8 flex items-center justify-center bg-primary/10 text-primary font-bold rounded-lg text-sm">
                    {cat.position || index + 1}
                  </span>
                </td>
                
                {/* Name */}
                <td className="px-4 py-3">
                  <span className="font-semibold text-dark">{cat.name}</span>
                </td>
                
                {/* Description */}
                <td className="px-4 py-3">
                  <span className="text-gray-500 text-sm line-clamp-1">{cat.description || '-'}</span>
                </td>
                
                {/* Menu Items Count */}
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center justify-center px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                    {cat.menu_items?.length || 0}
                  </span>
                </td>
                
                {/* Status */}
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                    cat.active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {cat.active ? 'Hiển thị' : 'Ẩn'}
                  </span>
                </td>
                
                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => openEditModal(cat)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                      title="Chỉnh sửa"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="Xóa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {categories.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            Chưa có danh mục nào
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-dark">
                {editingItem ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên danh mục *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
                  placeholder="VD: Món chính"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
                  rows={3}
                  placeholder="Mô tả danh mục..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí hiển thị</label>
                <input
                  type="number"
                  min="1"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
                  placeholder="1"
                />
                <p className="text-xs text-gray-400 mt-1">Số càng nhỏ hiển thị càng trước</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="active" className="text-sm text-gray-700">Hiển thị danh mục</label>
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

export default AdminCategories;
