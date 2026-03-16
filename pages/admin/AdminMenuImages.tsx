import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../components/AdminLayout';
import {
  adminGetMenuImages, adminCreateMenuImage, adminUpdateMenuImage,
  adminDeleteMenuImage, adminReorderMenuImages, ApiMenuImage
} from '../../services/api';
import { Plus, Edit2, Trash2, Loader2, X, Save, Upload, ArrowUp, ArrowDown } from 'lucide-react';
import { API_BASE_ORIGIN } from '../../services/api';

const AdminMenuImages: React.FC = () => {
  const [images, setImages] = useState<ApiMenuImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [editingImage, setEditingImage] = useState<ApiMenuImage | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [position, setPosition] = useState(0);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [bulkPreviews, setBulkPreviews] = useState<Array<{ file: File; preview: string }>>([]);
  const [uploadingBulk, setUploadingBulk] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await adminGetMenuImages();
      setImages(data);
    } catch (err) {
      console.error('Error fetching menu images:', err);
      alert('Không thể tải danh sách ảnh menu');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingImage(null);
    setImageFile(null);
    setImagePreview(null);
    setPosition(images.length);
    setActive(true);
    setShowModal(true);
  };

  const openBulkUploadModal = () => {
    setBulkFiles([]);
    setBulkPreviews([]);
    setShowBulkUploadModal(true);
  };

  const openEditModal = (image: ApiMenuImage) => {
    setEditingImage(image);
    setImageFile(null);
    setImagePreview(null);
    setPosition(image.position);
    setActive(image.active);
    setShowModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Chỉ chấp nhận file hình ảnh');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File quá lớn. Tối đa 10MB');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!editingImage && !imageFile) {
      alert('Vui lòng chọn ảnh');
      return;
    }

    try {
      setSaving(true);
      if (editingImage) {
        await adminUpdateMenuImage(editingImage.id, imageFile || undefined, position, active);
      } else {
        if (!imageFile) return;
        await adminCreateMenuImage(imageFile, position);
      }
      await fetchData();
      setShowModal(false);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi lưu ảnh menu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa ảnh menu này?')) return;

    try {
      await adminDeleteMenuImage(id);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa ảnh menu');
    }
  };

  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    files.forEach((file: File) => {
      if (!file.type.startsWith('image/')) {
        invalidFiles.push(`${file.name} - Không phải file ảnh`);
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        invalidFiles.push(`${file.name} - Quá lớn (tối đa 10MB)`);
        return;
      }

      validFiles.push(file);
    });

    if (invalidFiles.length > 0) {
      alert('Một số file không hợp lệ:\n' + invalidFiles.join('\n'));
    }

    if (validFiles.length > 0) {
      setBulkFiles(validFiles);
      const previews = validFiles.map((file) => {
        const reader = new FileReader();
        return new Promise<{ file: File; preview: string }>((resolve) => {
          reader.onloadend = () => {
            resolve({ file, preview: reader.result as string });
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(previews).then((results) => {
        setBulkPreviews(results);
      });
    }
  };

  const removeBulkFile = (index: number) => {
    setBulkFiles((prev) => prev.filter((_, i) => i !== index));
    setBulkPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBulkUpload = async () => {
    if (bulkFiles.length === 0) {
      alert('Vui lòng chọn ít nhất một ảnh');
      return;
    }

    try {
      setUploadingBulk(true);
      let startPosition = images.length;

      // Upload từng ảnh một
      for (let i = 0; i < bulkFiles.length; i++) {
        await adminCreateMenuImage(bulkFiles[i], startPosition + i);
      }

      await fetchData();
      setShowBulkUploadModal(false);
      setBulkFiles([]);
      setBulkPreviews([]);
      alert(`Đã upload thành công ${bulkFiles.length} ảnh!`);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi upload ảnh');
    } finally {
      setUploadingBulk(false);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= images.length) return;

    const newImages = [...images];
    const [moved] = newImages.splice(index, 1);
    newImages.splice(newIndex, 0, moved);

    const positions = newImages.map((img, idx) => ({ id: img.id, position: idx }));
    try {
      await adminReorderMenuImages(positions);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi sắp xếp lại');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-dark">Quản Lý Ảnh Menu</h1>
          <div className="flex gap-3">
            <button
              onClick={openBulkUploadModal}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Upload className="w-5 h-5" />
              Upload Nhiều Ảnh
            </button>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-dark rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Thêm Ảnh Menu
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-600 mb-4">
            Upload 7-10 ảnh chụp menu để hiển thị trên trang /menu. Ảnh sẽ được sắp xếp theo thứ tự position.
          </p>

          {images.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Chưa có ảnh menu nào. Hãy thêm ảnh đầu tiên.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  className={`border-2 rounded-lg overflow-hidden ${
                    image.active ? 'border-gray-200' : 'border-gray-300 opacity-60'
                  }`}
                >
                  <div className="relative aspect-[3/4] bg-gray-100">
                    <img
                      src={image.image_url.startsWith('http') ? image.image_url : `${API_BASE_ORIGIN}${image.image_url}`}
                      alt={`Menu image ${image.position}`}
                      className="w-full h-full object-contain"
                    />
                    {!image.active && (
                      <div className="absolute top-2 right-2 bg-gray-500 text-white px-2 py-1 rounded text-xs">
                        Ẩn
                      </div>
                    )}
                  </div>
                  <div className="p-4 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Vị trí: {image.position}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleMove(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-600 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Lên trên"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMove(index, 'down')}
                          disabled={index === images.length - 1}
                          className="p-1 text-gray-600 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Xuống dưới"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(image)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(image.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bulk Upload Modal */}
        {showBulkUploadModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-dark">Upload Nhiều Ảnh Menu</h2>
                  <button
                    onClick={() => {
                      setShowBulkUploadModal(false);
                      setBulkFiles([]);
                      setBulkPreviews([]);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chọn nhiều ảnh (có thể chọn nhiều file cùng lúc)
                  </label>
                  <input
                    ref={bulkFileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleBulkFileChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Có thể chọn nhiều ảnh cùng lúc. Tối đa 10MB mỗi ảnh. Tỷ lệ khuyến nghị: 3:4 (dọc)
                  </p>
                </div>

                {bulkPreviews.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Đã chọn {bulkPreviews.length} ảnh:
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {bulkPreviews.map((item, index) => (
                        <div key={index} className="relative border border-gray-200 rounded-lg overflow-hidden">
                          <div className="aspect-[3/4] bg-gray-100">
                            <img
                              src={item.preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <button
                            onClick={() => removeBulkFile(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <div className="p-2 bg-white">
                            <p className="text-xs text-gray-600 truncate">{item.file.name}</p>
                            <p className="text-xs text-gray-500">
                              {(item.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleBulkUpload}
                    disabled={uploadingBulk || bulkFiles.length === 0}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingBulk ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang upload...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        Upload {bulkFiles.length > 0 ? `${bulkFiles.length} ảnh` : ''}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowBulkUploadModal(false);
                      setBulkFiles([]);
                      setBulkPreviews([]);
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-dark">
                    {editingImage ? 'Sửa Ảnh Menu' : 'Thêm Ảnh Menu'}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ảnh Menu {!editingImage && '*'}
                  </label>
                  {imagePreview || (editingImage && !imageFile) ? (
                    <div className="relative mb-2">
                      <img
                        src={imagePreview || (editingImage ? `${API_BASE_ORIGIN}${editingImage.image_url}` : '')}
                        alt="Preview"
                        className="w-full max-h-96 object-contain rounded-lg border border-gray-200"
                      />
                      {imageFile && (
                        <button
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ) : null}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
                  />
                  <p className="text-xs text-gray-500 mt-1">Tối đa 10MB. Tỷ lệ khuyến nghị: 3:4 (dọc)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí</label>
                  <input
                    type="number"
                    value={position}
                    onChange={(e) => setPosition(parseInt(e.target.value) || 0)}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50"
                  />
                  <p className="text-xs text-gray-500 mt-1">Thứ tự hiển thị (số nhỏ hơn = hiển thị trước)</p>
                </div>

                {editingImage && (
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={(e) => setActive(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium text-gray-700">Hiển thị</span>
                    </label>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-dark rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Lưu
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminMenuImages;

