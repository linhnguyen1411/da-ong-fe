import React from 'react';
import { COMPANY_INFO } from '../data';
import { Phone, MapPin, Clock } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-dark text-gray-400 py-12 mt-auto border-t border-gray-800">
      <div className="container mx-auto px-4 grid md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-white text-xl font-serif font-bold mb-4">ĐÁ & ONG</h3>
          <p className="mb-4">Trải nghiệm ẩm thực đẳng cấp với không gian sang trọng và hương vị tuyệt hảo.</p>
        </div>
        <div>
          <h3 className="text-white text-lg font-bold mb-4">Liên Hệ</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <MapPin className="text-primary w-5 h-5 mt-1" />
              <span>{COMPANY_INFO.address}</span>
            </li>
            <li className="flex items-start gap-3">
              <MapPin className="text-primary w-5 h-5 mt-1" />
              <span>25 Nguyễn Thái Bình - Hoà Khánh - Đà Nẵng</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="text-primary w-5 h-5" />
              <span>{COMPANY_INFO.phone}</span>
            </li>
            <li className="flex items-center gap-3">
              <Clock className="text-primary w-5 h-5" />
              <span>{COMPANY_INFO.hours}</span>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-white text-lg font-bold mb-4">Mạng Xã Hội</h3>
          <a href="https://www.facebook.com/yenha99" target="_blank" rel="noreferrer" className="block mb-2 hover:text-primary transition">Facebook</a>
          <a href="https://www.tiktok.com/@nhahangdavaong" target="_blank" rel="noreferrer" className="block mb-2 hover:text-primary transition">TikTok</a>
          <a href={COMPANY_INFO.zalo} target="_blank" rel="noreferrer" className="block hover:text-primary transition">Zalo Official Account</a>
        </div>
      </div>
      <div className="text-center pt-8 mt-8 border-t border-gray-800 text-sm">
        © 2024 Đá & Ong. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;