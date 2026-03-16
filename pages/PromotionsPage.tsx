import React, { useEffect, useState } from 'react';
import { Tag, Loader2, Calendar, Sparkles } from 'lucide-react';
import { getPromotions, ApiPromotion } from '../services/api';
import { API_BASE_ORIGIN } from '../services/api';

const isHtml = (str: string) => /<[a-z][\s\S]*>/i.test(str);
const ALLOWED_TAGS = /^(p|br|strong|b|em|i|u|s|ul|ol|li|a|h1|h2|h3|span|div|img)$/i;
const sanitizeHtml = (html: string): string => {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<(\w+)(\s[^>]*)?>/g, (_, tagName, attrs) => {
      if (!ALLOWED_TAGS.test(tagName)) return '';
      if (tagName.toLowerCase() === 'a' && attrs) {
        const href = attrs.match(/href\s*=\s*["']([^"']*)["']/i);
        return href ? `<a href="${href[1].replace(/javascript:/gi, '')}" rel="noopener noreferrer">` : '<a>';
      }
      if (tagName.toLowerCase() === 'img' && attrs) {
        const src = attrs.match(/src\s*=\s*["']([^"']*)["']/i);
        if (src && !/javascript:/i.test(src[1])) return `<img src="${src[1]}" alt="" loading="lazy" class="max-w-full h-auto rounded">`;
        return '';
      }
      return `<${tagName}>`;
    });
};

const PromotionContent: React.FC<{ content: string }> = ({ content }) => {
  if (!isHtml(content)) {
    return <div className="text-white whitespace-pre-wrap leading-relaxed">{content}</div>;
  }
  const safe = sanitizeHtml(content);
  return (
    <div
      className="text-white leading-relaxed prose prose-sm max-w-none prose-invert prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-a:text-primary hover:prose-a:text-yellow-400"
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
};

const formatDate = (s: string | null | undefined) => {
  if (!s) return '';
  try {
    return new Date(s).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
};

const getImageUrl = (url: string | null | undefined) => {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_BASE_ORIGIN}${url}`;
};

const PromotionsPage: React.FC = () => {
  const [promotions, setPromotions] = useState<ApiPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getPromotions();
        setPromotions(data || []);
      } catch (err) {
        console.error('Error fetching promotions:', err);
        setError('Không thể tải chương trình khuyến mãi.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const highlighted = promotions.find((p) => p.highlighted);
  const others = promotions.filter((p) => !p.highlighted);
  const sortedOthers = [...others].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero */}
      <section className="relative pt-28 pb-16 md:pt-32 md:pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-800 via-gray-800/95 to-gray-900" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23facc15\' fill-opacity=\'0.06\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-80" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block text-primary font-sans font-semibold tracking-widest uppercase text-sm mb-4">
              Ưu đãi hấp dẫn
            </span>
            <h1 className="text-4xl md:text-5xl font-sans font-bold text-white mb-5 tracking-tight">
              Ưu đãi & Khuyến mãi
            </h1>
            <p className="text-white font-sans text-lg leading-relaxed">
              Các chương trình ưu đãi đang diễn ra và sắp tới. Đừng bỏ lỡ cơ hội thưởng thức với giá tốt nhất.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-20 md:pb-28">
        <div className="container mx-auto px-4 max-w-5xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-14 h-14 rounded-full border-2 border-primary border-t-transparent animate-spin mb-6" />
              <p className="text-white font-medium">Đang tải ưu đãi...</p>
            </div>
          ) : error ? (
            <div className="max-w-xl mx-auto bg-red-950/40 border border-red-500/30 text-red-200 rounded-2xl px-8 py-10 text-center">
              <p className="font-medium">{error}</p>
            </div>
          ) : promotions.length === 0 ? (
            <div className="max-w-2xl mx-auto bg-gray-800/80 border border-gray-600 rounded-2xl p-12 text-center">
              <Tag className="w-16 h-16 text-white mx-auto mb-4" />
              <h2 className="text-xl font-sans font-bold text-white mb-2">Chưa có chương trình nào</h2>
              <p className="text-white">Theo dõi trang để cập nhật ưu đãi sớm nhất.</p>
            </div>
          ) : (
            <>
              {/* Highlighted card */}
              {highlighted && (
                <div className="mb-8">
                  <span className="inline-flex items-center gap-1.5 text-primary font-bold text-sm mb-3">
                    <Sparkles className="w-4 h-4" /> Đang nổi bật
                  </span>
                  <article className="bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/50 rounded-2xl overflow-hidden">
                    <div className="flex flex-col">
                      {getImageUrl(highlighted.image_url) && (
                        <div className="w-full aspect-[21/9] min-h-[180px] flex-shrink-0 bg-gray-800">
                          <img
                            src={getImageUrl(highlighted.image_url)!}
                            alt={highlighted.title}
                            className="w-full h-full object-contain object-center"
                          />
                        </div>
                      )}
                      <div className="flex-1 p-6 md:p-8">
                        <h2 className="text-2xl md:text-3xl font-sans font-bold text-white mb-3">
                          {highlighted.title}
                        </h2>
                        {(highlighted.start_at || highlighted.end_at) && (
                          <div className="flex items-center gap-2 text-white text-sm mb-4">
                            <Calendar className="w-4 h-4" />
                            {formatDate(highlighted.start_at)} → {formatDate(highlighted.end_at)}
                          </div>
                        )}
                        {highlighted.content && (
                          <div className="text-[15px]">
                            <PromotionContent content={highlighted.content} />
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                </div>
              )}

              {/* Other promotions */}
              {sortedOthers.length > 0 && (
                <div>
                  {highlighted && (
                    <h3 className="text-lg font-semibold text-white mb-4">Các ưu đãi khác</h3>
                  )}
                  <div className="space-y-5">
                    {sortedOthers.map((promo) => (
                      <article
                        key={promo.id}
                        className="bg-gray-800/80 border border-gray-600 rounded-2xl overflow-hidden hover:border-primary/40 transition-all flex flex-col"
                      >
                        {getImageUrl(promo.image_url) && (
                          <div className="w-full aspect-[21/9] min-h-[140px] flex-shrink-0 bg-gray-700">
                            <img
                              src={getImageUrl(promo.image_url)!}
                              alt={promo.title}
                              className="w-full h-full object-contain object-center"
                            />
                          </div>
                        )}
                        <div className="flex-1 p-6">
                          <h3 className="text-xl font-sans font-bold text-white mb-2">{promo.title}</h3>
                          {(promo.start_at || promo.end_at) && (
                            <p className="text-white text-sm mb-3">
                              {formatDate(promo.start_at)} → {formatDate(promo.end_at)}
                            </p>
                          )}
                          {promo.content && (
                            <div className="text-sm">
                              <PromotionContent content={promo.content} />
                            </div>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default PromotionsPage;
