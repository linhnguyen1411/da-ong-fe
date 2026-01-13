import React from 'react';
import { COMPANY_INFO } from '../data';
import { Phone, MapPin, Clock, Facebook } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-dark text-gray-400 py-12 mt-auto border-t border-gray-800">
      <div className="container mx-auto px-4 grid md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white rounded-lg p-2 border-2 border-primary/30 shadow-md">
              <img 
                src="/LOGO-DA-ONG.png" 
                alt="ĐÁ & ONG" 
                className="h-16 w-auto object-contain"
              />
            </div>
            <h3 className="text-white text-xl font-serif font-bold">ĐÁ & ONG</h3>
          </div>
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
          <div className="space-y-3">
            <a 
              href="https://www.facebook.com/yenha99" 
              target="_blank" 
              rel="noreferrer" 
              className="flex items-center gap-3 hover:text-primary transition group"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center group-hover:bg-blue-700 transition-colors">
                <Facebook className="w-5 h-5 text-white" />
              </div>
              <span>Facebook</span>
            </a>
            <a 
              href="https://www.tiktok.com/@nhahangdavaong" 
              target="_blank" 
              rel="noreferrer" 
              className="flex items-center gap-3 hover:text-primary transition group"
            >
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center group-hover:bg-gray-800 transition-colors">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </div>
              <span>TikTok</span>
            </a>
            <a 
              href={COMPANY_INFO.zalo} 
              target="_blank" 
              rel="noreferrer" 
              className="flex items-center gap-3 hover:text-primary transition group"
            >
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.378 2.25c-5.517 0-9.99 3.729-9.99 8.322 0 2.19 1.17 4.16 3.01 5.52l-1.12 3.78 4.11-2.1c.96.27 1.97.42 3 .42 5.517 0 9.99-3.729 9.99-8.322 0-4.593-4.473-8.322-9.99-8.322zm0 14.5c-.83 0-1.64-.2-2.35-.57l-.27-.14-2.93 1.5.78-2.63-.19-.28c-1.4-1.08-2.26-2.65-2.26-4.35 0-3.78 3.68-6.85 8.22-6.85s8.22 3.07 8.22 6.85-3.68 6.85-8.22 6.85z"/>
                </svg>
              </div>
              <span>Zalo Official Account</span>
            </a>
          </div>
        </div>
      </div>
      <div className="text-center pt-8 mt-8 border-t border-gray-800 text-sm">
        © 2024 Đá & Ong. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;