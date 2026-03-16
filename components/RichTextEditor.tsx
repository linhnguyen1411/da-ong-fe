import React, { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Link, RemoveFormatting, Image } from 'lucide-react';

/** Rich text editor dùng contentEditable + execCommand, không dùng react-quill */
interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
  /** Upload ảnh rồi chèn vào bài. Trả về URL đầy đủ của ảnh. */
  onInsertImage?: (file: File) => Promise<string>;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Nhập nội dung...',
  minHeight = '200px',
  className = '',
  onInsertImage,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const isInternalRef = useRef(false);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (isInternalRef.current) {
      isInternalRef.current = false;
      return;
    }
    if (el.innerHTML !== value) {
      el.innerHTML = value || '';
    }
  }, [value]);

  const emitChange = () => {
    const el = editorRef.current;
    if (!el) return;
    const html = el.innerHTML;
    if (html !== value) {
      isInternalRef.current = true;
      onChange(html === '<br>' || el.innerText.trim() === '' ? '' : html);
    }
  };

  const exec = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
    emitChange();
  };

  const addLink = () => {
    const url = window.prompt('Nhập URL:', 'https://');
    if (url) exec('createLink', url);
  };

  const handleInsertImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onInsertImage) return;
    e.target.value = '';
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh (JPEG, PNG, GIF, WebP).');
      return;
    }
    try {
      const url = await onInsertImage(file);
      exec('insertImage', url);
    } catch (err: any) {
      alert('Tải ảnh lỗi: ' + (err.message || 'Thử lại sau.'));
    }
  };

  return (
    <div className={`rich-text-editor border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-1.5 bg-gray-50 border-b border-gray-200">
        <button
          type="button"
          onClick={() => exec('bold')}
          className="p-2 rounded hover:bg-gray-200"
          title="In đậm"
        >
          <Bold size={18} className="text-gray-700" />
        </button>
        <button
          type="button"
          onClick={() => exec('italic')}
          className="p-2 rounded hover:bg-gray-200"
          title="In nghiêng"
        >
          <Italic size={18} className="text-gray-700" />
        </button>
        <button
          type="button"
          onClick={() => exec('underline')}
          className="p-2 rounded hover:bg-gray-200"
          title="Gạch chân"
        >
          <Underline size={18} className="text-gray-700" />
        </button>
        <span className="w-px h-6 bg-gray-300 mx-0.5" />
        <button
          type="button"
          onClick={() => exec('insertUnorderedList')}
          className="p-2 rounded hover:bg-gray-200"
          title="Danh sách bullet"
        >
          <List size={18} className="text-gray-700" />
        </button>
        <button
          type="button"
          onClick={() => exec('insertOrderedList')}
          className="p-2 rounded hover:bg-gray-200"
          title="Danh sách số"
        >
          <ListOrdered size={18} className="text-gray-700" />
        </button>
        <span className="w-px h-6 bg-gray-300 mx-0.5" />
        <button
          type="button"
          onClick={addLink}
          className="p-2 rounded hover:bg-gray-200"
          title="Chèn link"
        >
          <Link size={18} className="text-gray-700" />
        </button>
        {onInsertImage && (
          <>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleInsertImage}
            />
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="p-2 rounded hover:bg-gray-200"
              title="Chèn ảnh"
            >
              <Image size={18} className="text-gray-700" />
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => exec('removeFormat')}
          className="p-2 rounded hover:bg-gray-200"
          title="Xóa định dạng"
        >
          <RemoveFormatting size={18} className="text-gray-700" />
        </button>
      </div>
      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[200px] px-4 py-3 text-gray-800 outline-none overflow-auto prose prose-sm max-w-none"
        style={{ minHeight }}
        data-placeholder={placeholder}
        onInput={emitChange}
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData('text/plain');
          document.execCommand('insertText', false, text);
          emitChange();
        }}
        suppressContentEditableWarning
      />
      <style>{`
        [contenteditable][data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: #9ca3af;
        }
        .rich-text-editor [contenteditable] ul { list-style-type: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
        .rich-text-editor [contenteditable] ol { list-style-type: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
        .rich-text-editor [contenteditable] li { margin: 0.25rem 0; }
        .rich-text-editor [contenteditable] a { color: #2563eb; text-decoration: underline; }
        .rich-text-editor [contenteditable] img { max-width: 100%; height: auto; border-radius: 0.25rem; }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
