import React, { useState } from 'react';
import { COMPANY_INFO } from '../data';
import { MapPin, Phone, Clock, Loader2, CheckCircle, Send } from 'lucide-react';
import { submitContact } from '../services/api';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await submitContact(formData);
      setIsSuccess(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
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
          <h1 className="text-4xl font-serif font-bold text-dark mb-4">Liên Hệ</h1>
          <p className="text-gray-600">Chúng tôi luôn sẵn sàng lắng nghe và phục vụ bạn.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Info Section */}
          <div className="p-8 md:p-12 flex flex-col justify-center bg-dark text-white">
            <h2 className="text-3xl font-serif font-bold text-primary mb-8">Thông Tin Nhà Hàng</h2>
            
            <div className="space-y-8">
              <div className="flex items-start gap-4 group">
                <div className="bg-white/10 p-3 rounded-full group-hover:bg-primary transition-colors">
                    <MapPin className="text-white group-hover:text-dark w-6 h-6 transition-colors" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1 text-gray-200">Địa chỉ</h3>
                  <p className="text-gray-400">{COMPANY_INFO.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                 <div className="bg-white/10 p-3 rounded-full group-hover:bg-primary transition-colors">
                    <Phone className="text-white group-hover:text-dark w-6 h-6 transition-colors" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1 text-gray-200">Hotline</h3>
                  <p className="text-gray-400">{COMPANY_INFO.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                 <div className="bg-white/10 p-3 rounded-full group-hover:bg-primary transition-colors">
                    <Clock className="text-white group-hover:text-dark w-6 h-6 transition-colors" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1 text-gray-200">Giờ mở cửa</h3>
                  <p className="text-gray-400">{COMPANY_INFO.hours}</p>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-700">
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
            <h2 className="text-2xl font-serif font-bold text-dark mb-6">Gửi Tin Nhắn</h2>
            
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