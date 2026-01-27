import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { chatRespond } from '../services/api';
import { useLocation } from 'react-router-dom';

type ChatMsg = { role: 'user' | 'bot'; text: string; ts: number };

const initialBot = `Dạ em là trợ lý của Đá & Ong.\nAnh/chị cần em tư vấn món, đặt bàn hoặc check phòng trống không ạ?`;

const ChatWidget: React.FC = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'bot', text: initialBot, ts: Date.now() },
  ]);

  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    }, 50);
    return () => clearTimeout(t);
  }, [open, messages]);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text, ts: Date.now() }]);

    try {
      setLoading(true);
      const res = await chatRespond(text);
      const reply = res?.reply || 'Dạ anh/chị cho em xin thêm thông tin để em hỗ trợ ạ.';
      setMessages((prev) => [...prev, { role: 'bot', text: reply, ts: Date.now() }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: `Dạ hệ thống đang bận, anh/chị thử lại giúp em ạ. (${err.message || 'error'})`, ts: Date.now() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (canSend) send();
    }
  };

  if (isAdmin) return null;

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          className="fixed bottom-6 left-6 z-[200] bg-primary text-dark rounded-full shadow-xl w-16 h-16 flex items-center justify-center hover:bg-yellow-500 transition-all border-4 border-white"
          onClick={() => setOpen(true)}
          aria-label="Chat tư vấn"
        >
          <MessageCircle size={30} />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed inset-0 z-[201] flex items-end justify-start p-4 bg-black/40" onClick={() => setOpen(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-dark">Tư vấn Đá & Ong</p>
                <p className="text-xs text-gray-500">Check phòng trống • Đặt bàn • Gợi ý món</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div ref={listRef} className="p-4 space-y-3 max-h-[55vh] overflow-y-auto">
              {messages.map((m) => (
                <div key={m.ts} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap max-w-[85%] ${
                      m.role === 'user'
                        ? 'bg-primary text-dark font-medium'
                        : 'bg-gray-100 text-dark'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="px-3 py-2 rounded-2xl text-sm bg-gray-100 text-gray-600 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang trả lời...
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-gray-100 flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Nhập câu hỏi... (VD: phòng trống 28/01 18h30)"
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 text-sm"
              />
              <button
                onClick={send}
                disabled={!canSend}
                className="bg-primary text-dark rounded-xl w-11 h-11 flex items-center justify-center font-bold hover:bg-yellow-500 transition disabled:opacity-50"
                aria-label="Gửi"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;


