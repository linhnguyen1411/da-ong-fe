import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import {
  adminGetChatbotFaqs,
  adminCreateChatbotFaq,
  adminUpdateChatbotFaq,
  adminDeleteChatbotFaq,
  ApiChatbotFaq,
} from '../../services/api';
import { Plus, Edit2, Trash2, Loader2, X, Save, MessageCircle } from 'lucide-react';

const AdminChatbotFaqs: React.FC = () => {
  const [items, setItems] = useState<ApiChatbotFaq[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ApiChatbotFaq | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    answer: '',
    patternsText: '',
    active: true,
    priority: 0,
    locale: 'vi',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await adminGetChatbotFaqs();
      setItems(data || []);
    } catch (err) {
      console.error('Error fetching chatbot faqs:', err);
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
      answer: '',
      patternsText: '',
      active: true,
      priority: Math.max(0, ...items.map((i) => i.priority || 0)) + 1,
      locale: 'vi',
    });
    setShowModal(true);
  };

  const openEdit = (it: ApiChatbotFaq) => {
    setEditing(it);
    setForm({
      title: it.title || '',
      answer: it.answer || '',
      patternsText: (it.patterns || []).join('\n'),
      active: it.active,
      priority: it.priority || 0,
      locale: it.locale || 'vi',
    });
    setShowModal(true);
  };

  const patterns = useMemo(() => {
    return form.patternsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  }, [form.patternsText]);

  const save = async () => {
    if (!form.answer.trim()) {
      alert('Vui lòng nhập câu trả lời');
      return;
    }
    if (patterns.length === 0) {
      alert('Vui lòng nhập ít nhất 1 pattern (regex/keyword)');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: form.title || undefined,
        answer: form.answer,
        patterns,
        active: form.active,
        priority: form.priority,
        locale: form.locale,
      };

      if (editing) {
        await adminUpdateChatbotFaq(editing.id, payload);
      } else {
        await adminCreateChatbotFaq(payload);
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const del = async (it: ApiChatbotFaq) => {
    if (!confirm(`Xóa FAQ "${it.title || it.id}"?`)) return;
    try {
      await adminDeleteChatbotFaq(it.id);
      fetchData();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Chatbot - Câu hỏi & Trả lời">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Chatbot - Câu hỏi & Trả lời">
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-600">
          <MessageCircle size={18} />
          <p className="text-gray-500">{items.length} FAQ</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary text-dark px-4 py-2 rounded-lg font-bold hover:bg-primary/90 transition"
        >
          <Plus size={18} /> Thêm FAQ
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Ưu tiên</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tiêu đề</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patterns</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Trạng thái</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items
              .slice()
              .sort((a, b) => (b.priority || 0) - (a.priority || 0))
              .map((it) => (
                <tr key={it.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <span className="w-10 h-8 flex items-center justify-center bg-primary/10 text-primary font-bold rounded-lg text-sm">
                      {it.priority || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-dark">{it.title || '(Không tiêu đề)'}</div>
                    <div className="text-xs text-gray-400 line-clamp-1">{it.answer}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-gray-500 whitespace-pre-wrap line-clamp-2">
                      {(it.patterns || []).slice(0, 4).join('\n')}
                      {(it.patterns || []).length > 4 ? '\n...' : ''}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                      it.active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {it.active ? 'Bật' : 'Tắt'}
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
            Chưa có FAQ nào. Hãy bấm “Thêm FAQ”.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-dark">
                {editing ? 'Chỉnh sửa FAQ' : 'Thêm FAQ'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
                    placeholder="VD: Giờ mở cửa"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ưu tiên</label>
                    <input
                      type="number"
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) => setForm({ ...form, active: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      id="faq_active"
                    />
                    <label htmlFor="faq_active" className="text-sm text-gray-700">Bật</label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patterns (mỗi dòng 1 regex/keyword) *</label>
                <textarea
                  value={form.patternsText}
                  onChange={(e) => setForm({ ...form, patternsText: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
                  rows={6}
                  placeholder={"VD:\n(gi[oờ]|mở cửa|đóng cửa)\nđịa chỉ\nmap"}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Bot match theo regex (không phân biệt hoa thường). Ưu tiên lớn hơn sẽ match trước.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Câu trả lời *</label>
                <textarea
                  value={form.answer}
                  onChange={(e) => setForm({ ...form, answer: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
                  rows={6}
                  placeholder="Nhập câu trả lời..."
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

export default AdminChatbotFaqs;


