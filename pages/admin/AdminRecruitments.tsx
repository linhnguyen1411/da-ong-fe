import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import {
  adminGetRecruitments,
  adminCreateRecruitment,
  adminUpdateRecruitment,
  adminDeleteRecruitment,
  ApiRecruitment,
} from '../../services/api';
import { Plus, Edit2, Trash2, Loader2, X, Save, Briefcase } from 'lucide-react';
import RichTextEditor from '../../components/RichTextEditor';

const AdminRecruitments: React.FC = () => {
  const [items, setItems] = useState<ApiRecruitment[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ApiRecruitment | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    content: '',
    department: '',
    position: 0,
    active: true,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await adminGetRecruitments();
      setItems(data || []);
    } catch (err) {
      console.error('Error fetching recruitments:', err);
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
      department: '',
      position: Math.max(0, ...items.map((i) => i.position || 0)) + 1,
      active: true,
    });
    setShowModal(true);
  };

  const openEdit = (it: ApiRecruitment) => {
    setEditing(it);
    setForm({
      title: it.title || '',
      content: it.content || '',
      department: it.department || '',
      position: it.position || 0,
      active: it.active,
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
        department: form.department.trim() || undefined,
        position: form.position,
        active: form.active,
      };

      if (editing) {
        await adminUpdateRecruitment(editing.id, payload);
      } else {
        await adminCreateRecruitment(payload);
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const del = async (it: ApiRecruitment) => {
    if (!confirm(`Xóa tin tuyển dụng "${it.title}"?`)) return;
    try {
      await adminDeleteRecruitment(it.id);
      fetchData();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Tuyển dụng">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Tuyển dụng">
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-600">
          <Briefcase size={18} />
          <p className="text-gray-500">{items.length} tin tuyển dụng</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary text-dark px-4 py-2 rounded-lg font-bold hover:bg-primary/90 transition"
        >
          <Plus size={18} /> Thêm tin tuyển dụng
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Thứ tự</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tiêu đề</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phòng ban</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Trạng thái</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items
              .slice()
              .sort((a, b) => (a.position || 0) - (b.position || 0))
              .map((it) => (
                <tr key={it.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <span className="w-10 h-8 flex items-center justify-center bg-primary/10 text-primary font-bold rounded-lg text-sm">
                      {it.position || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-dark">{it.title}</div>
                    {it.content && (() => {
                      const plain = it.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                      return (
                        <div className="text-xs text-gray-400 line-clamp-2 mt-1">
                          {plain.slice(0, 80)}{plain.length > 80 ? '...' : ''}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{it.department || '-'}</td>
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
            Chưa có tin tuyển dụng nào. Hãy bấm "Thêm tin tuyển dụng".
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-dark">
                {editing ? 'Chỉnh sửa tin tuyển dụng' : 'Thêm tin tuyển dụng'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
                    placeholder="VD: Tuyển nhân viên phục vụ"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phòng ban / Bộ phận</label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
                    placeholder="VD: Phục vụ, Bếp"
                  />
                </div>
                <div className="flex items-end gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Thứ tự</label>
                    <input
                      type="number"
                      value={form.position}
                      onChange={(e) => setForm({ ...form, position: parseInt(e.target.value) || 0 })}
                      className="w-24 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) => setForm({ ...form, active: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      id="recruitment_active"
                    />
                    <label htmlFor="recruitment_active" className="text-sm text-gray-700">
                      Hiển thị trên website
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung chi tiết</label>
                <RichTextEditor
                  value={form.content}
                  onChange={(content) => setForm({ ...form, content })}
                  placeholder="Mô tả công việc, yêu cầu, quyền lợi..."
                  minHeight="250px"
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

export default AdminRecruitments;
