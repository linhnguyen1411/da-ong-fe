import React, { useEffect, useState, useRef } from 'react';
import AdminLayout from '../../components/AdminLayout';
import {
  adminGetPromotions,
  adminCreatePromotion,
  adminUpdatePromotion,
  adminDeletePromotion,
  ApiPromotion,
} from '../../services/api';
import { Plus, Edit2, Trash2, Loader2, X, Save, Tag, Upload } from 'lucide-react';
import RichTextEditor from '../../components/RichTextEditor';
import { API_BASE_ORIGIN, adminUploadFile } from '../../services/api';

const formatDate = (s: string | null | undefined) => {
  if (!s) return '-';
  try {
    const d = new Date(s);
    return d.toLocaleDateString('vi-VN');
  } catch {
    return s;
  }
};

const AdminPromotions: React.FC = () => {
  const [items, setItems] = useState<ApiPromotion[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ApiPromotion | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageUrlInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '',
    content: '',
    image_url: '',
    highlighted: false,
    position: 0,
    active: true,
    start_at: '',
    end_at: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await adminGetPromotions();
      setItems(data || []);
    } catch (err) {
      console.error('Error fetching promotions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      title: '',
      content: '',
      image_url: '',
      highlighted: false,
      position: Math.max(0, ...items.map((i) => i.position || 0)) + 1,
      active: true,
      start_at: '',
      end_at: '',
    });
    setShowModal(true);
  };

  const openEdit = (it: ApiPromotion) => {
    setEditing(it);
    setForm({
      title: it.title || '',
      content: it.content || '',
      image_url: it.image_url || '',
      highlighted: it.highlighted ?? false,
      position: it.position ?? 0,
      active: it.active ?? true,
      start_at: it.start_at ? it.start_at.slice(0, 16) : '',
      end_at: it.end_at ? it.end_at.slice(0, 16) : '',
    });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.title.trim()) {
      alert('Vui lòng nhập tiêu đề');
      return;
    }

    try {
      setSaving(true);
      const content = form.content.trim();
      const isEmptyContent = !content || content === '<p><br></p>' || content === '<p></p>';
      const payload = {
        title: form.title.trim(),
        content: isEmptyContent ? undefined : content,
        image_url: form.image_url.trim() || undefined,
        highlighted: form.highlighted,
        position: form.position,
        active: form.active,
        start_at: form.start_at ? new Date(form.start_at).toISOString() : undefined,
        end_at: form.end_at ? new Date(form.end_at).toISOString() : undefined,
      };

      if (editing) {
        await adminUpdatePromotion(editing.id, payload);
      } else {
        await adminCreatePromotion(payload);
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const del = async (it: ApiPromotion) => {
    if (!confirm(`Xóa chương trình "${it.title}"?`)) return;
    try {
      await adminDeletePromotion(it.id);
      fetchData();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const sortedItems = [...items].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  if (loading) {
    return (
      <AdminLayout title="Khuyến mãi">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Chương trình ưu đãi">
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Tag size={18} />
            <span className="font-semibold text-dark">Viết bài cho trang Ưu đãi</span>
          </div>
          <p className="text-gray-500 text-sm">{items.length} bài đã đăng · {items.filter((i) => i.highlighted).length} đang nổi bật</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 bg-primary text-dark px-5 py-2.5 rounded-lg font-bold hover:bg-primary/90 transition shrink-0"
        >
          <Plus size={18} /> Viết bài ưu đãi mới
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">Thứ tự</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tiêu đề</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Nổi bật</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Thời gian</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Trạng thái</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedItems.map((it) => (
              <tr key={it.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3">
                  <span className="w-10 h-8 flex items-center justify-center bg-primary/10 text-primary font-bold rounded-lg text-sm">
                    {it.position ?? 0}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-dark">{it.title}</div>
                  {it.content && (() => {
                    const plain = it.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                    return (
                      <div className="text-xs text-gray-400 line-clamp-2 mt-1">
                        {plain.slice(0, 60)}{plain.length > 60 ? '...' : ''}
                      </div>
                    );
                  })()}
                </td>
                <td className="px-4 py-3 text-center">
                  {it.highlighted ? (
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                      Nổi bật
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600 text-sm">
                  {formatDate(it.start_at)} → {formatDate(it.end_at)}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                      it.active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {it.active ? 'Hiển thị' : 'Ẩn'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => openEdit(it)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                      title="Chỉnh sửa"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => del(it)}
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

        {items.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            Chưa có bài nào. Hãy bấm &quot;Viết bài ưu đãi mới&quot; để đăng chương trình ưu đãi lên trang /uu-dai.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-dark">
                {editing ? 'Chỉnh sửa bài ưu đãi' : 'Viết bài ưu đãi mới'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
                  placeholder="VD: Giảm 20% cho set lẩu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh đại diện (tùy chọn)</label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={imageUrlInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      e.target.value = '';
                      setUploadingImage(true);
                      try {
                        const res = await adminUploadFile(file);
                        const fullUrl = res.url.startsWith('http') ? res.url : `${API_BASE_ORIGIN}${res.url}`;
                        setForm((f) => ({ ...f, image_url: fullUrl }));
                      } catch (err: any) {
                        alert('Tải ảnh lỗi: ' + (err.message || 'Thử lại.'));
                      } finally {
                        setUploadingImage(false);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => imageUrlInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    {uploadingImage ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                    Tải ảnh lên
                  </button>
                  <span className="text-gray-500 text-sm">hoặc</span>
                  <input
                    type="text"
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    className="flex-1 min-w-[200px] px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
                    placeholder="Dán URL ảnh..."
                  />
                </div>
                {form.image_url && (
                  <div className="mt-2 flex items-center gap-2">
                    <img
                      src={form.image_url.startsWith('http') ? form.image_url : `${API_BASE_ORIGIN}${form.image_url}`}
                      alt="Preview"
                      className="h-24 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, image_url: '' }))}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Xóa ảnh
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                  <input
                    type="datetime-local"
                    value={form.start_at}
                    onChange={(e) => setForm({ ...form, start_at: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                  <input
                    type="datetime-local"
                    value={form.end_at}
                    onChange={(e) => setForm({ ...form, end_at: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.highlighted}
                    onChange={(e) => setForm({ ...form, highlighted: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    id="promo_highlighted"
                  />
                  <label htmlFor="promo_highlighted" className="text-sm text-gray-700 font-medium">
                    Đang nổi bật (highlight)
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    id="promo_active"
                  />
                  <label htmlFor="promo_active" className="text-sm text-gray-700">
                    Hiển thị trên website
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thứ tự</label>
                  <input
                    type="number"
                    value={form.position}
                    onChange={(e) => setForm({ ...form, position: parseInt(e.target.value) || 0 })}
                    className="w-20 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung chi tiết</label>
                <p className="text-xs text-gray-500 mb-1">Dùng nút ảnh trên thanh công cụ để chèn ảnh vào bài.</p>
                <RichTextEditor
                  value={form.content}
                  onChange={(content) => setForm({ ...form, content })}
                  placeholder="Mô tả ưu đãi, điều kiện áp dụng..."
                  minHeight="200px"
                  onInsertImage={async (file) => {
                    const res = await adminUploadFile(file);
                    return res.url.startsWith('http') ? res.url : `${API_BASE_ORIGIN}${res.url}`;
                  }}
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                Hủy
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex items-center gap-2 bg-primary text-dark px-4 py-2 rounded-lg font-bold hover:bg-primary/90 transition disabled:opacity-50"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminPromotions;
