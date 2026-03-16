import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Loader2, MapPin } from 'lucide-react';
import { getRecruitments, ApiRecruitment } from '../services/api';

const isHtml = (str: string) => /<[a-z][\s\S]*>/i.test(str);

/** Cho phép chỉ các thẻ an toàn (không dùng dompurify) */
const ALLOWED_TAGS = /^(p|br|strong|b|em|i|u|s|ul|ol|li|a|h1|h2|h3|span|div)$/i;
const sanitizeHtml = (html: string): string => {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '')
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
    .replace(/<(\w+)(\s[^>]*)?>/g, (_, tagName, attrs) => {
      if (!ALLOWED_TAGS.test(tagName)) return '';
      if (tagName.toLowerCase() === 'a' && attrs) {
        const href = attrs.match(/href\s*=\s*["']([^"']*)["']/i);
        return href ? `<a href="${href[1].replace(/javascript:/gi, '')}" rel="noopener noreferrer">` : '<a>';
      }
      return `<${tagName}>`;
    });
};

const RecruitmentContent: React.FC<{ content: string; dark?: boolean }> = ({ content, dark }) => {
  const baseClass = dark ? 'text-white' : 'text-gray-600';
  if (!isHtml(content)) {
    return (
      <div className={`${baseClass} whitespace-pre-wrap leading-relaxed`}>
        {content}
      </div>
    );
  }
  const safeHtml = sanitizeHtml(content);
  return (
    <div
      className={`${baseClass} leading-relaxed prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 ${dark ? 'prose-invert prose-a:text-primary hover:prose-a:text-yellow-400' : ''}`}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
};

const RecruitmentPage: React.FC = () => {
  const [recruitments, setRecruitments] = useState<ApiRecruitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getRecruitments();
        setRecruitments(data || []);
      } catch (err) {
        console.error('Error fetching recruitments:', err);
        setError('Không thể tải thông tin tuyển dụng.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero */}
      <section className="relative pt-28 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-800 via-gray-800/95 to-gray-900" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23facc15\' fill-opacity=\'0.04\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-60" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block text-primary font-semibold tracking-widest uppercase text-sm mb-4">
              Cơ hội nghề nghiệp
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-sans font-bold text-white leading-tight mb-6">
              Tuyển dụng
            </h1>
            <p className="text-lg md:text-xl text-white leading-relaxed">
              Cùng chúng tôi xây dựng trải nghiệm ẩm thực tuyệt vời. Chúng tôi đang tìm kiếm những thành viên tài năng và nhiệt huyết.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="pb-20 md:pb-28">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-14 h-14 rounded-full border-2 border-primary border-t-transparent animate-spin mb-6" />
              <p className="text-white font-medium">Đang tải tin tuyển dụng...</p>
            </div>
          ) : error ? (
            <div className="max-w-xl mx-auto bg-red-950/40 border border-red-500/30 text-red-200 rounded-2xl px-8 py-10 text-center">
              <p className="font-medium">{error}</p>
              <p className="text-sm text-red-300/80 mt-2">Vui lòng thử lại sau hoặc liên hệ với chúng tôi.</p>
            </div>
          ) : recruitments.length === 0 ? (
            <div className="max-w-2xl mx-auto bg-gray-800/80 border border-gray-600 rounded-2xl p-10 md:p-14 text-center">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Briefcase className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-sans font-bold text-white mb-3">Hiện chưa có vị trí tuyển dụng</h2>
              <p className="text-white mb-8 max-w-md mx-auto">
                Bạn vẫn có thể gửi hồ sơ qua trang Liên hệ. Chúng tôi sẽ lưu lại và liên hệ khi có vị trí phù hợp.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 bg-primary hover:bg-yellow-500 text-dark font-bold py-3.5 px-8 rounded-xl transition shadow-lg shadow-primary/20"
              >
                Gửi hồ sơ / Liên hệ
              </Link>
            </div>
          ) : (
            <div className="space-y-5 max-w-5xl mx-auto">
              {recruitments.map((job) => (
                <article
                  key={job.id}
                  className="group bg-gray-800/80 border border-gray-600 rounded-2xl overflow-hidden hover:border-primary/50 hover:bg-gray-800 transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row">
                    <div className="flex-1 p-6 md:p-8 border-l-4 border-primary">
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/15 text-primary">
                          <Briefcase className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-sans font-bold text-white">
                          {job.title}
                        </h2>
                      </div>
                      {(job.department || job.position) && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {job.department && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-700 text-white text-sm">
                              <MapPin className="w-4 h-4 text-primary/80" />
                              {job.department}
                            </span>
                          )}
                          {job.position && (
                            <span className="inline-flex px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-sm font-medium">
                              {job.position}
                            </span>
                          )}
                        </div>
                      )}
                      {job.content && (
                        <div className="text-[15px] leading-relaxed">
                          <RecruitmentContent content={job.content} dark />
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 p-6 md:p-8 flex items-center md:border-l border-gray-600">
                      <Link
                        to="/contact"
                        className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-yellow-500 text-dark font-bold py-3.5 px-8 rounded-xl transition shadow-lg shadow-primary/20"
                      >
                        Ứng tuyển ngay
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="mt-20 max-w-5xl mx-auto bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/30 rounded-2xl p-8 md:p-12 text-center">
            <h3 className="text-2xl md:text-3xl font-sans font-bold text-white mb-3">
              Bạn có đam mê với ẩm thực?
            </h3>
            <p className="text-white mb-8 max-w-xl mx-auto">
              Gửi hồ sơ qua trang Liên hệ hoặc đến trực tiếp nhà hàng. Chúng tôi luôn chào đón ứng viên tài năng.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-primary hover:bg-yellow-500 text-dark font-bold py-3.5 px-10 rounded-xl transition shadow-lg shadow-primary/20"
            >
              Liên hệ ngay
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RecruitmentPage;
