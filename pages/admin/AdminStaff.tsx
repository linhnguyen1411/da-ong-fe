import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import {
  adminCreateAdmin,
  adminDeactivateAdmin,
  adminGetAdmins,
  adminUpdateAdmin,
  type AdminRole,
  type ApiAdminUser,
} from '../../services/api';

const roleLabel: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  manager: 'Quản lý',
  receptionist: 'Lễ tân',
  staff: 'Lễ tân',
};

function effectiveRole(role?: string) {
  return role === 'staff' ? 'receptionist' : role;
}

const AdminStaff: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ApiAdminUser[]>([]);
  const [query, setQuery] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ApiAdminUser | null>(null);
  const [saving, setSaving] = useState(false);

  const me = useMemo(() => {
    try {
      const raw = localStorage.getItem('admin_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);
  const meRole = effectiveRole(me?.role);

  const canManageAll = meRole === 'admin' || meRole === 'super_admin';
  const canManageReceptionist = canManageAll || meRole === 'manager';

  const allowedRoles: AdminRole[] = useMemo(() => {
    if (canManageAll) return ['admin', 'manager', 'receptionist'];
    return ['receptionist'];
  }, [canManageAll]);

  const [form, setForm] = useState({
    email: '',
    name: '',
    role: 'receptionist' as AdminRole,
    active: true,
    password: '',
    password_confirmation: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminGetAdmins();
      setItems(data);
    } catch (e: any) {
      alert(e?.message || 'Không tải được danh sách nhân sự');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((u) => {
      return (
        u.email.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q) ||
        (roleLabel[u.role] || u.role).toLowerCase().includes(q)
      );
    });
  }, [items, query]);

  const openCreate = () => {
    if (!canManageReceptionist) {
      alert('Bạn không có quyền thao tác Nhân sự');
      return;
    }
    setEditing(null);
    setForm({
      email: '',
      name: '',
      role: allowedRoles[0] || 'receptionist',
      active: true,
      password: '',
      password_confirmation: '',
    });
    setShowForm(true);
  };

  const openEdit = (u: ApiAdminUser) => {
    if (!canManageReceptionist) {
      alert('Bạn không có quyền thao tác Nhân sự');
      return;
    }
    setEditing(u);
    setForm({
      email: u.email,
      name: u.name,
      role: (effectiveRole(u.role) as AdminRole) || 'receptionist',
      active: u.active,
      password: '',
      password_confirmation: '',
    });
    setShowForm(true);
  };

  const submit = async () => {
    if (!form.email || !form.name || !form.role) {
      alert('Vui lòng nhập Email, Tên và Vai trò');
      return;
    }
    if (!allowedRoles.includes(form.role)) {
      alert('Vai trò không hợp lệ');
      return;
    }

    setSaving(true);
    try {
      if (!editing) {
        if (!form.password) {
          alert('Vui lòng nhập mật khẩu');
          return;
        }
        await adminCreateAdmin({
          email: form.email,
          name: form.name,
          role: form.role,
          active: form.active,
          password: form.password,
          password_confirmation: form.password_confirmation || undefined,
        });
      } else {
        await adminUpdateAdmin(editing.id, {
          email: form.email,
          name: form.name,
          role: form.role,
          active: form.active,
          ...(form.password
            ? {
                password: form.password,
                password_confirmation: form.password_confirmation,
              }
            : {}),
        });
      }
      setShowForm(false);
      await load();
    } catch (e: any) {
      alert(e?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (u: ApiAdminUser) => {
    if (!canManageReceptionist) {
      alert('Bạn không có quyền thao tác Nhân sự');
      return;
    }
    if (!confirm(`Vô hiệu hoá tài khoản ${u.email}?`)) return;
    try {
      await adminDeactivateAdmin(u.id);
      await load();
    } catch (e: any) {
      alert(e?.message || 'Không thể vô hiệu hoá');
    }
  };

  return (
    <AdminLayout title="Nhân sự">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">Quản lý nhân sự</h1>
            <span className="text-xs text-gray-500">
              (Bạn: <strong>{me?.name || me?.email || '—'}</strong> • {roleLabel[meRole] || meRole})
            </span>
          </div>
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo email/tên/vai trò..."
              className="w-full sm:w-80 px-3 py-2 border rounded-lg bg-white"
            />
            <button
              onClick={openCreate}
              className="px-4 py-2 rounded-lg bg-primary text-dark font-bold hover:bg-yellow-500"
            >
              Thêm
            </button>
          </div>
        </div>

        {!canManageReceptionist && (
          <div className="mb-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
            Bạn đang đăng nhập với vai trò <strong>{roleLabel[meRole] || meRole}</strong> nên không có quyền quản lý nhân sự.
          </div>
        )}

        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="text-left px-4 py-3">Tên</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Vai trò</th>
                  <th className="text-left px-4 py-3">Trạng thái</th>
                  <th className="text-right px-4 py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-4 py-4 text-gray-500" colSpan={5}>
                      Đang tải...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-gray-500" colSpan={5}>
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => (
                    <tr key={u.id} className="border-t">
                      <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                      <td className="px-4 py-3 text-gray-700">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                          {roleLabel[effectiveRole(u.role)] || u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.active ? (
                          <span className="px-2 py-1 rounded-full bg-green-100 text-green-700">Đang hoạt động</span>
                        ) : (
                          <span className="px-2 py-1 rounded-full bg-red-100 text-red-700">Bị khoá</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => openEdit(u)}
                            className="px-3 py-1.5 rounded-lg border hover:bg-gray-50"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => deactivate(u)}
                            className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
                          >
                            Khoá
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full max-w-lg rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">{editing ? 'Cập nhật nhân sự' : 'Thêm nhân sự'}</h2>
                <button className="text-gray-500" onClick={() => setShowForm(false)}>
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-sm text-gray-600">Tên</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Email</label>
                  <input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-600">Vai trò</label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value as AdminRole })}
                      className="w-full px-3 py-2 border rounded-lg bg-white"
                    >
                      {allowedRoles.map((r) => (
                        <option key={r} value={r}>
                          {roleLabel[r] || r}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Trạng thái</label>
                    <select
                      value={form.active ? '1' : '0'}
                      onChange={(e) => setForm({ ...form, active: e.target.value === '1' })}
                      className="w-full px-3 py-2 border rounded-lg bg-white"
                    >
                      <option value="1">Hoạt động</option>
                      <option value="0">Khoá</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-600">
                      Mật khẩu {editing ? '(để trống nếu không đổi)' : ''}
                    </label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Xác nhận</label>
                    <input
                      type="password"
                      value={form.password_confirmation}
                      onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-5">
                <button className="px-4 py-2 rounded-lg border" onClick={() => setShowForm(false)}>
                  Huỷ
                </button>
                <button
                  disabled={saving}
                  onClick={submit}
                  className="px-4 py-2 rounded-lg bg-primary text-dark font-bold hover:bg-yellow-500 disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminStaff;


