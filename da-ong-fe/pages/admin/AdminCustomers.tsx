import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import {
  adminGetCustomers,
  adminGetCustomer,
  adminCreateCustomer,
  adminUpdateCustomer,
  adminDeleteCustomer,
  adminAdjustCustomerPoints,
  adminRecordCustomerVisit,
  adminUpdateCustomerVisit,
  ApiCustomer,
  ApiCustomerVisit,
  ApiLoyaltyTransaction,
} from '../../services/api';
import {
  Loader2,
  Search,
  Users,
  Phone,
  Mail,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  Star,
  CalendarCheck,
} from 'lucide-react';

const formatDateTime = (dateStr?: string | null) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatMoneyVnd = (amount?: number | null) => {
  const n = typeof amount === 'number' ? amount : 0;
  return n.toLocaleString('vi-VN') + 'đ';
};

const normalizePhone = (s: string) => s.replace(/\s+/g, '').trim();

const txKindLabel = (kind?: string) => {
  switch (kind) {
    case 'earn':
      return 'Cộng điểm';
    case 'redeem':
      return 'Trừ điểm';
    case 'adjust':
      return 'Điều chỉnh';
    default:
      return kind || '-';
  }
};

const visitSourceLabel = (source?: string) => {
  switch (source) {
    case 'manual':
      return 'Thủ công';
    case 'booking_completed':
      return 'Từ booking';
    default:
      return source || '-';
  }
};

const AdminCustomers: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<ApiCustomer[]>([]);

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<ApiCustomer | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Modal create/edit
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ApiCustomer | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
    active: true,
  });

  // Actions forms
  const [pointsKind, setPointsKind] = useState<'earn' | 'redeem' | 'adjust'>('earn');
  const [pointsValue, setPointsValue] = useState<number>(0);
  const [pointsNote, setPointsNote] = useState<string>('');

  const [visitNote, setVisitNote] = useState<string>('');
  const [visitAtLocal, setVisitAtLocal] = useState<string>(''); // datetime-local
  const [visitAmountVnd, setVisitAmountVnd] = useState<number>(0);

  // Edit visit modal
  const [showEditVisit, setShowEditVisit] = useState(false);
  const [editingVisit, setEditingVisit] = useState<ApiCustomerVisit | null>(null);
  const [editVisitAtLocal, setEditVisitAtLocal] = useState<string>('');
  const [editVisitNote, setEditVisitNote] = useState<string>('');
  const [editVisitAmountVnd, setEditVisitAmountVnd] = useState<number>(0);
  const [savingVisit, setSavingVisit] = useState(false);

  const fetchList = async (opts?: { keepSelection?: boolean }) => {
    try {
      setLoading(true);
      const active =
        activeFilter === 'all' ? undefined : activeFilter === 'active' ? true : false;
      const data = await adminGetCustomers({
        q: search.trim() || undefined,
        active,
        limit: 100,
      });
      setCustomers(data || []);

      if (!opts?.keepSelection) {
        setSelectedId(null);
        setSelectedCustomer(null);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetail = async (id: number) => {
    try {
      setLoadingDetail(true);
      const detail = await adminGetCustomer(id);
      setSelectedCustomer(detail);
    } catch (err) {
      console.error('Error fetching customer detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchList({ keepSelection: true });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const counts = useMemo(() => {
    const total = customers.length;
    const active = customers.filter((c) => c.active).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [customers]);

  const sortedVisits = useMemo(() => {
    const visits = selectedCustomer?.customer_visits || [];
    return [...visits].sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
  }, [selectedCustomer]);

  const sortedTxs = useMemo(() => {
    const txs = selectedCustomer?.loyalty_transactions || [];
    return [...txs].sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
  }, [selectedCustomer]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({ name: '', phone: '', email: '', notes: '', active: true });
    setShowModal(true);
  };

  const openEditModal = (item: ApiCustomer) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      phone: item.phone || '',
      email: item.email || '',
      notes: (item as any).notes || '',
      active: item.active,
    });
    setShowModal(true);
  };

  const handleSaveCustomer = async () => {
    const phone = normalizePhone(formData.phone);
    if (!phone) {
      alert('Vui lòng nhập SĐT');
      return;
    }

    try {
      setSaving(true);
      if (editingItem) {
        await adminUpdateCustomer(editingItem.id, { ...formData, phone });
      } else {
        await adminCreateCustomer({ ...formData, phone });
      }
      setShowModal(false);
      await fetchList({ keepSelection: true });
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomer = async (item: ApiCustomer) => {
    if (!confirm(`Bạn có chắc muốn xóa khách hàng "${item.name || item.phone}"?`)) return;
    try {
      await adminDeleteCustomer(item.id);
      if (selectedId === item.id) {
        setSelectedId(null);
        setSelectedCustomer(null);
      }
      await fetchList({ keepSelection: true });
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleSelect = async (item: ApiCustomer) => {
    setSelectedId(item.id);
    await fetchDetail(item.id);
  };

  const applyAdjustPoints = async () => {
    if (!selectedCustomer) return;
    if (!pointsValue || pointsValue === 0) {
      alert('Vui lòng nhập số điểm (khác 0)');
      return;
    }
    try {
      await adminAdjustCustomerPoints(selectedCustomer.id, {
        kind: pointsKind,
        // For adjust, backend interprets "points" as NEW balance (set)
        points: pointsKind === 'adjust' ? pointsValue : Math.abs(pointsValue),
        note: pointsNote || undefined,
      });
      setPointsValue(0);
      setPointsNote('');
      await fetchDetail(selectedCustomer.id);
      await fetchList({ keepSelection: true });
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const applyRecordVisit = async () => {
    if (!selectedCustomer) return;
    try {
      const occurred_at = visitAtLocal
        ? new Date(visitAtLocal).toISOString()
        : undefined;
      await adminRecordCustomerVisit(selectedCustomer.id, {
        occurred_at,
        note: visitNote || undefined,
        amount_vnd: visitAmountVnd > 0 ? visitAmountVnd : undefined,
      });
      setVisitNote('');
      setVisitAtLocal('');
      setVisitAmountVnd(0);
      await fetchDetail(selectedCustomer.id);
      await fetchList({ keepSelection: true });
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const openEditVisitModal = (v: ApiCustomerVisit) => {
    setEditingVisit(v);
    // datetime-local expects "YYYY-MM-DDTHH:mm"
    const d = new Date(v.occurred_at);
    const pad = (n: number) => String(n).padStart(2, '0');
    const localStr = !isNaN(d.getTime())
      ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
      : '';
    setEditVisitAtLocal(localStr);
    setEditVisitNote(v.note || '');
    setEditVisitAmountVnd(typeof v.amount_vnd === 'number' ? v.amount_vnd : 0);
    setShowEditVisit(true);
  };

  const saveVisitEdit = async () => {
    if (!selectedCustomer || !editingVisit) return;
    try {
      setSavingVisit(true);
      const occurred_at = editVisitAtLocal ? new Date(editVisitAtLocal).toISOString() : undefined;
      await adminUpdateCustomerVisit(selectedCustomer.id, editingVisit.id, {
        occurred_at,
        note: editVisitNote || undefined,
        amount_vnd: editVisitAmountVnd > 0 ? editVisitAmountVnd : 0,
      });
      setShowEditVisit(false);
      setEditingVisit(null);
      await fetchDetail(selectedCustomer.id);
      await fetchList({ keepSelection: true });
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSavingVisit(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Khách hàng / Hội viên">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Khách hàng / Hội viên">
      <div className="flex gap-6 h-[calc(100vh-160px)]">
        {/* Left Panel - List */}
        <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-gray-600">
                <Users size={18} />
                <span className="text-sm">{counts.total} khách</span>
              </div>
              <button
                onClick={openCreateModal}
                className="flex items-center gap-2 bg-primary text-dark px-3 py-2 rounded-lg font-bold hover:bg-primary/90 transition text-sm"
              >
                <Plus size={16} /> Thêm
              </button>
            </div>

            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Tìm theo SĐT / tên..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 text-sm"
                />
              </div>
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 text-sm"
              >
                <option value="all">Tất cả</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Ngưng</option>
              </select>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500 mt-3">
              <span>{counts.active} active</span>
              <span>{counts.inactive} inactive</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {customers.length > 0 ? (
              customers.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleSelect(c)}
                  className={`p-4 border-b border-gray-50 cursor-pointer transition hover:bg-gray-50 ${
                    selectedId === c.id ? 'bg-primary/10' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${c.active ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <Users size={16} className={c.active ? 'text-green-600' : 'text-gray-400'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium truncate text-dark">{c.name || '(Chưa đặt tên)'}</p>
                        <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                          {c.last_visit_at ? formatDateTime(c.last_visit_at).split(' ')[0] : '-'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Phone size={14} /> {c.phone}
                        </span>
                        {!!c.email && (
                          <span className="flex items-center gap-1">
                            <Mail size={14} /> {c.email}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-3 mt-2 text-xs">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-700 rounded-full">
                          <Star size={12} /> {c.points_balance} điểm
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                          <CalendarCheck size={12} /> {c.total_visits} lượt
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-400">Chưa có khách hàng</div>
            )}
          </div>
        </div>

        {/* Right Panel - Detail */}
        <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-white rounded-xl shadow-sm overflow-hidden">
          {selectedCustomer ? (
            <div className="flex flex-col w-full">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-dark">
                      {selectedCustomer.name || 'Khách hàng'}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-2">
                      <span className="flex items-center gap-1">
                        <Phone size={14} /> {selectedCustomer.phone}
                      </span>
                      {!!selectedCustomer.email && (
                        <span className="flex items-center gap-1">
                          <Mail size={14} /> {selectedCustomer.email}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        Lần ghé gần nhất: {formatDateTime(selectedCustomer.last_visit_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(selectedCustomer)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                      title="Chỉnh sửa"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteCustomer(selectedCustomer)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="Xóa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-5">
                  <div className="bg-yellow-50 rounded-xl p-4">
                    <p className="text-xs text-yellow-700 mb-1">Điểm</p>
                    <p className="text-xl font-bold text-dark">{selectedCustomer.points_balance}</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-xs text-blue-700 mb-1">Lượt ghé</p>
                    <p className="text-xl font-bold text-dark">{selectedCustomer.total_visits}</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4">
                    <p className="text-xs text-green-700 mb-1">Tổng chi (VND)</p>
                    <p className="text-xl font-bold text-dark">{formatMoneyVnd(selectedCustomer.total_spent_vnd)}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Actions */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-gray-100 rounded-xl p-4">
                    <h4 className="font-semibold text-dark mb-3 flex items-center gap-2">
                      <Star size={16} /> Cộng / Trừ điểm
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <select
                        value={pointsKind}
                        onChange={(e) => setPointsKind(e.target.value as any)}
                        className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 text-sm"
                      >
                        <option value="earn">Cộng</option>
                        <option value="redeem">Trừ</option>
                        <option value="adjust">Điều chỉnh</option>
                      </select>
                      <input
                        type="number"
                        value={pointsValue}
                        onChange={(e) => setPointsValue(parseInt(e.target.value) || 0)}
                        className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 text-sm"
                        placeholder={pointsKind === 'adjust' ? 'Điểm sau điều chỉnh' : 'Điểm'}
                      />
                      <button
                        onClick={applyAdjustPoints}
                        className="flex items-center justify-center gap-2 bg-primary text-dark px-3 py-2 rounded-lg font-bold hover:bg-primary/90 transition text-sm"
                      >
                        Lưu
                      </button>
                    </div>
                    <input
                      type="text"
                      value={pointsNote}
                      onChange={(e) => setPointsNote(e.target.value)}
                      className="mt-3 w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 text-sm"
                      placeholder="Ghi chú (tuỳ chọn)"
                    />
                  </div>

                  <div className="border border-gray-100 rounded-xl p-4">
                    <h4 className="font-semibold text-dark mb-3 flex items-center gap-2">
                      <CalendarCheck size={16} /> Ghi nhận lượt ghé
                    </h4>
                    <input
                      type="datetime-local"
                      value={visitAtLocal}
                      onChange={(e) => setVisitAtLocal(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                    <input
                      type="number"
                      min={0}
                      value={visitAmountVnd}
                      onChange={(e) => setVisitAmountVnd(parseInt(e.target.value) || 0)}
                      className="mt-3 w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 text-sm"
                      placeholder="Số tiền chi (VND)"
                    />
                    <input
                      type="text"
                      value={visitNote}
                      onChange={(e) => setVisitNote(e.target.value)}
                      className="mt-3 w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 text-sm"
                      placeholder="Ghi chú (tuỳ chọn)"
                    />
                    <button
                      onClick={applyRecordVisit}
                      className="mt-3 w-full flex items-center justify-center gap-2 bg-primary text-dark px-3 py-2 rounded-lg font-bold hover:bg-primary/90 transition text-sm"
                    >
                      <CalendarCheck size={14} /> Tạo lượt ghé
                    </button>
                  </div>
                </div>

                {/* Transactions */}
                <div>
                  <h4 className="font-semibold text-dark mb-3">Lịch sử điểm</h4>
                  {loadingDetail ? (
                    <div className="text-gray-400 text-sm flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang tải...
                    </div>
                  ) : sortedTxs.length > 0 ? (
                    <div className="border border-gray-100 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Thời gian</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Loại</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Trước</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Sau</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Điểm</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ghi chú</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {sortedTxs.slice(0, 20).map((t: ApiLoyaltyTransaction) => (
                            <tr key={t.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-gray-500">{formatDateTime(t.occurred_at)}</td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                                  {txKindLabel(t.kind)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right text-gray-500">
                                {typeof t.balance_before === 'number' ? t.balance_before : '-'}
                              </td>
                              <td className="px-4 py-3 text-right text-gray-500">
                                {typeof t.balance_after === 'number' ? t.balance_after : '-'}
                              </td>
                              <td className={`px-4 py-3 text-right font-bold ${t.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {t.points}
                              </td>
                              <td className="px-4 py-3 text-gray-500">{t.note || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm">Chưa có giao dịch điểm</div>
                  )}
                </div>

                {/* Visits */}
                <div>
                  <h4 className="font-semibold text-dark mb-3">Lịch sử lượt ghé</h4>
                  {loadingDetail ? (
                    <div className="text-gray-400 text-sm flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang tải...
                    </div>
                  ) : sortedVisits.length > 0 ? (
                    <div className="border border-gray-100 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Thời gian</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nguồn</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Chi (VND)</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ghi chú</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Sửa</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {sortedVisits.slice(0, 20).map((v: ApiCustomerVisit) => (
                            <tr key={v.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-gray-500">{formatDateTime(v.occurred_at)}</td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                                  {visitSourceLabel(v.source)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right text-gray-500">{formatMoneyVnd(v.amount_vnd || 0)}</td>
                              <td className="px-4 py-3 text-gray-500">{v.note || '-'}</td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  disabled={v.source === 'booking_completed'}
                                  onClick={() => openEditVisitModal(v)}
                                  className={`p-2 rounded-lg transition ${
                                    v.source === 'booking_completed'
                                      ? 'text-gray-300 cursor-not-allowed'
                                      : 'text-blue-500 hover:bg-blue-50'
                                  }`}
                                  title={v.source === 'booking_completed' ? 'Lượt ghé từ booking (không sửa)' : 'Sửa'}
                                >
                                  <Edit2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm">Chưa có lượt ghé</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full text-gray-400">
              <div className="text-center">
                <Users size={48} className="mx-auto mb-4 opacity-50" />
                <p>Chọn một khách hàng để xem chi tiết</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-dark">
                {editingItem ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
                  placeholder="VD: Anh A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SĐT *</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
                  placeholder="VD: 090..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
                  placeholder="VD: a@b.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
                  rows={3}
                  placeholder="Ghi chú..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active_customer"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="active_customer" className="text-sm text-gray-700">Kích hoạt</label>
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
                onClick={handleSaveCustomer}
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

      {/* Edit Visit Modal */}
      {showEditVisit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-dark">Sửa lượt ghé</h3>
              <button onClick={() => setShowEditVisit(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian</label>
                <input
                  type="datetime-local"
                  value={editVisitAtLocal}
                  onChange={(e) => setEditVisitAtLocal(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền chi (VND)</label>
                <input
                  type="number"
                  min={0}
                  value={editVisitAmountVnd}
                  onChange={(e) => setEditVisitAmountVnd(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <input
                  type="text"
                  value={editVisitNote}
                  onChange={(e) => setEditVisitNote(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              <button
                onClick={() => setShowEditVisit(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                Hủy
              </button>
              <button
                onClick={saveVisitEdit}
                disabled={savingVisit}
                className="flex items-center gap-2 bg-primary text-dark px-4 py-2 rounded-lg font-bold hover:bg-primary/90 transition disabled:opacity-50"
              >
                {savingVisit ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCustomers;


