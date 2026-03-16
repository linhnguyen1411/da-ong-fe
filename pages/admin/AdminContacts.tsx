import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { adminGetContacts, adminMarkContactRead } from '../../services/api';
import {
  Loader2, Mail, MailOpen, Phone, Clock, Eye, Search
} from 'lucide-react';

interface Contact {
  id: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  read: boolean;
  created_at: string;
}

const AdminContacts: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'read' | 'unread' | ''>('');
  const [search, setSearch] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await adminGetContacts(statusFilter || undefined);
      setContacts(data);
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (contact: Contact) => {
    try {
      await adminMarkContactRead(contact.id);
      fetchData();
      if (selectedContact?.id === contact.id) {
        setSelectedContact({ ...contact, read: true });
      }
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const openContact = (contact: Contact) => {
    setSelectedContact(contact);
    if (!contact.read) {
      handleMarkRead(contact);
    }
  };

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.message.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <AdminLayout title="Quản lý Liên hệ">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Quản lý Liên hệ">
      <div className="flex gap-6 h-[calc(100vh-160px)]">
        {/* Left Panel - Contact List */}
        <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex gap-3 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 text-sm"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 text-sm"
              >
                <option value="">Tất cả</option>
                <option value="unread">Chưa đọc</option>
                <option value="read">Đã đọc</option>
              </select>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{filteredContacts.length} liên hệ</span>
              <span>{contacts.filter(c => !c.read).length} chưa đọc</span>
            </div>
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto">
            {filteredContacts.length > 0 ? (
              filteredContacts.map(contact => (
                <div
                  key={contact.id}
                  onClick={() => openContact(contact)}
                  className={`p-4 border-b border-gray-50 cursor-pointer transition hover:bg-gray-50 ${
                    selectedContact?.id === contact.id ? 'bg-primary/10' : ''
                  } ${!contact.read ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${!contact.read ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      {contact.read ? (
                        <MailOpen size={16} className="text-gray-400" />
                      ) : (
                        <Mail size={16} className="text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className={`font-medium truncate ${!contact.read ? 'text-dark' : 'text-gray-600'}`}>
                          {contact.name}
                        </p>
                        <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                          {formatDate(contact.created_at).split(' ')[0]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{contact.subject || 'Không có tiêu đề'}</p>
                      <p className="text-sm text-gray-400 truncate">{contact.message}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-400">
                Không có liên hệ nào
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Contact Detail */}
        <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-white rounded-xl shadow-sm overflow-hidden">
          {selectedContact ? (
            <div className="flex flex-col w-full">
              {/* Contact Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-dark">
                    {selectedContact.subject || 'Không có tiêu đề'}
                  </h3>
                  {!selectedContact.read && (
                    <button
                      onClick={() => handleMarkRead(selectedContact)}
                      className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600"
                    >
                      <Eye size={16} /> Đánh dấu đã đọc
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Mail size={14} /> {selectedContact.email}
                  </span>
                  {selectedContact.phone && (
                    <span className="flex items-center gap-1">
                      <Phone size={14} /> {selectedContact.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock size={14} /> {formatDate(selectedContact.created_at)}
                  </span>
                </div>
              </div>

              {/* Contact Body */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-dark whitespace-pre-wrap">{selectedContact.message}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-gray-100">
                <a
                  href={`mailto:${selectedContact.email}?subject=Re: ${selectedContact.subject || 'Liên hệ từ website'}`}
                  className="inline-flex items-center gap-2 bg-primary text-dark px-4 py-2 rounded-lg font-bold hover:bg-primary/90 transition"
                >
                  <Mail size={18} /> Trả lời email
                </a>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full text-gray-400">
              <div className="text-center">
                <Mail size={48} className="mx-auto mb-4 opacity-50" />
                <p>Chọn một liên hệ để xem chi tiết</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminContacts;
