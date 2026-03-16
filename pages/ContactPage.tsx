import React, { useState, useRef } from 'react';
import { COMPANY_INFO } from '../data';
import { MapPin, Phone, Clock, Loader2, CheckCircle, Send, Paperclip, X } from 'lucide-react';
import { submitContact, submitContactWithAttachments } from '../services/api';

const MAX_FILES = 5;
const MAX_FILE_SIZE_MB = 10;
const ACCEPT = 'image/*,.pdf,.doc,.docx,.xls,.xlsx';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const list = Array.from(files);
    const tooMany = attachments.length + list.length > MAX_FILES;
    const tooBig = list.some((f: File) => f.size > MAX_FILE_SIZE_MB * 1024 * 1024);
    if (tooMany) {
      setError(`Tối đa ${MAX_FILES} file.`);
      return;
    }
    if (tooBig) {
      setError(`Mỗi file tối đa ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }
    setError(null);
    setAttachments(prev => [...prev, ...list].slice(0, MAX_FILES));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (attachments.length > 0) {
        const form = new FormData();
        form.append('name', formData.name);
        form.append('email', formData.email);
        form.append('phone', formData.phone);
        form.append('subject', formData.subject);
        form.append('message', formData.message);
        attachments.forEach((file, i) => form.append('attachments[]', file));
        await submitContactWithAttachments(form);
      } else {
        await submitContact(formData);
      }
      setIsSuccess(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      setAttachments([]);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 bg-light">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-sans font-bold text-dark mb-4">Liên Hệ</h1>
          <p className="text-gray-600">Chúng tôi luôn sẵn sàng lắng nghe và phục vụ bạn.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Info Section */}
          <div className="p-8 md:p-12 flex flex-col justify-center bg-gray-800 text-white">
            <h2 className="text-3xl font-sans font-bold text-primary mb-8">Thông Tin Nhà Hàng</h2>
            
            <div className="space-y-8">
              <div className="flex items-start gap-4 group">
                <div className="bg-white/20 p-3 rounded-full group-hover:bg-primary transition-colors">
                    <MapPin className="text-white group-hover:text-dark w-6 h-6 transition-colors" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1 text-white">Địa chỉ</h3>
                  <p className="text-white">{COMPANY_INFO.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                 <div className="bg-white/20 p-3 rounded-full group-hover:bg-primary transition-colors">
                    <Phone className="text-white group-hover:text-dark w-6 h-6 transition-colors" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1 text-white">Hotline</h3>
                  <p className="text-white">{COMPANY_INFO.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                 <div className="bg-white/20 p-3 rounded-full group-hover:bg-primary transition-colors">
                    <Clock className="text-white group-hover:text-dark w-6 h-6 transition-colors" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1 text-white">Giờ mở cửa</h3>
                  <p className="text-white">{COMPANY_INFO.hours}</p>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-600">
                <p className="mb-4 font-bold text-primary">Kết nối với chúng tôi:</p>
                <div className="flex gap-4">
                    <a 
                        href={COMPANY_INFO.zalo} 
                        target="_blank" 
                        rel="noreferrer"
                        className="bg-primary hover:bg-yellow-500 text-dark px-6 py-2 rounded-lg font-bold transition-colors"
                    >
                        Zalo OA
                    </a>
                </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="p-8 md:p-12">
            <h2 className="text-2xl font-sans font-bold text-dark mb-6">Gửi Tin Nhắn</h2>
            
            {isSuccess ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-dark mb-2">Gửi thành công!</h3>
                <p className="text-gray-600 mb-6">Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi sớm nhất.</p>
                <button 
                  onClick={() => setIsSuccess(false)}
                  className="bg-primary text-dark font-bold px-6 py-2 rounded-lg hover:bg-yellow-500 transition"
                >
                  Gửi tin nhắn khác
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Họ tên *</label>
                    <input 
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Email *</label>
                    <input 
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Số điện thoại</label>
                    <input 
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      placeholder="0901234567"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Tiêu đề</label>
                    <input 
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      placeholder="Hỏi về dịch vụ"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Nội dung *</label>
                  <textarea 
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                    placeholder="Nhập nội dung tin nhắn..."
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Đính kèm ảnh / file (tùy chọn)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPT}
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    id="contact-attachments"
                  />
                  <label
                    htmlFor="contact-attachments"
                    className="inline-flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition text-gray-600"
                  >
                    <Paperclip className="w-5 h-5" />
                    Chọn ảnh hoặc file (tối đa {MAX_FILES} file, mỗi file {MAX_FILE_SIZE_MB}MB)
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Chấp nhận: ảnh, PDF, Word, Excel</p>
                  {attachments.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {attachments.map((file, i) => (
                        <li key={i} className="flex items-center justify-between text-sm bg-gray-50 px-3 py-2 rounded">
                          <span className="truncate">{file.name}</span>
                          <button type="button" onClick={() => removeFile(i)} className="text-red-500 hover:text-red-700 p-1">
                            <X className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary text-dark font-bold py-3 rounded-lg hover:bg-yellow-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Gửi tin nhắn
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-12 h-[400px] rounded-2xl overflow-hidden shadow-xl">
          <iframe 
            src="https://maps.google.com/maps?q=136%20T%C3%B4n%20%C4%90%E1%BB%A9c%20Th%E1%BA%AFng%2C%20Li%C3%AAn%20Chi%E1%BB%83u%2C%20%C4%90%C3%A0%20N%E1%BA%B5ng&t=&z=17&ie=UTF8&iwloc=&output=embed"
            width="100%" 
            height="100%" 
            style={{border:0}} 
            allowFullScreen={true} 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;