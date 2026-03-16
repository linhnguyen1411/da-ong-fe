import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import {
  adminGetBestSellers, adminCreateBestSeller, adminUpdateBestSeller, adminDeleteBestSeller,
  adminToggleBestSellerPin, adminToggleBestSellerHighlight, adminUploadBestSellerImages,
  adminDeleteBestSellerImage,
  adminGetMenuItems,
  ApiBestSeller, ApiMenuItem
} from '../../services/api';
import {
  Plus, Edit2, Trash2, Loader2, X, Save, Pin, Sparkles, Star, Upload, Image, ChevronLeft, ChevronRight
} from 'lucide-react';

import { API_BASE_ORIGIN } from '../../services/api';

const getImageUrl = (url?: string) => {
  if (!url) return 'https://via.placeholder.com/100?text=No+Image';
  return url.startsWith('http') ? url : `${API_BASE_ORIGIN}${url}`;
};

const AdminBestSellers: React.FC = () => {
  const [items, setItems] = useState<ApiBestSeller[]>([]);
  const [menuItems, setMenuItems] = useState<ApiMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ApiBestSeller | null>(null);
  const [formData, setFormData] = useState({
    menu_item_id: 0,
    title: '',
    content: '',
    position: 1,
    pinned: false,
    highlighted: false,
    active: true
  });
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Image gallery modal
  const [showGallery, setShowGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  // Lưu id ảnh BestSeller (nếu có) để xoá
  const [galleryImageIds, setGalleryImageIds] = useState<number[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bestSellersData, menuItemsData] = await Promise.all([
        adminGetBestSellers(),
        adminGetMenuItems()
      ]);
      setItems(bestSellersData);
      setMenuItems(menuItemsData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      menu_item_id: 0,
      title: '',
      content: '',
      position: items.length + 1,
      pinned: false,
      highlighted: false,
      active: true
    });
    setShowModal(true);
  };

  const openEditModal = async (item: ApiBestSeller) => {
    // Luôn fetch chi tiết từ API admin để lấy đủ trường images
    try {
      const detail = await adminGetBestSellers().then(list => list.find(i => i.id === item.id));
      if (detail) {
        setEditingItem(detail);
        setFormData({
          menu_item_id: detail.menu_item_id || 0,
          title: detail.title || '',
          content: detail.content || '',
          position: detail.position || 1,
          pinned: detail.pinned || false,
          highlighted: detail.highlighted || false,
          active: detail.active
        });
      } else {
        setEditingItem(item);
        setFormData({
          menu_item_id: item.menu_item_id || 0,
          title: item.title || '',
          content: item.content || '',
          position: item.position || 1,
          pinned: item.pinned || false,
          highlighted: item.highlighted || false,
          active: item.active
        });
      }
      setShowModal(true);
    } catch {
      setEditingItem(item);
      setFormData({
        menu_item_id: item.menu_item_id || 0,
        title: item.title || '',
        content: item.content || '',
        position: item.position || 1,
        pinned: item.pinned || false,
        highlighted: item.highlighted || false,
        active: item.active
      });
      setShowModal(true);
    }
  };

  const handleSave = async () => {
    if (!formData.title && !formData.menu_item_id) {
      alert('Vui lòng nhập tiêu đề hoặc chọn món ăn');
      return;
    }

    try {
      setSaving(true);
      const dataToSend = {
        ...formData,
        menu_item_id: formData.menu_item_id || undefined
      };
      
      if (editingItem) {
        await adminUpdateBestSeller(editingItem.id, dataToSend);
      } else {
        await adminCreateBestSeller(dataToSend as any);
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: ApiBestSeller) => {
    const menuName = item.title || item.menu_item?.name || 'món này';
    if (!confirm(`Bạn có chắc muốn xóa "${menuName}" khỏi Best Sellers?`)) return;

    try {
      await adminDeleteBestSeller(item.id);
      fetchData();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleTogglePin = async (item: ApiBestSeller) => {
    try {
      await adminToggleBestSellerPin(item.id);
      fetchData();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleToggleHighlight = async (item: ApiBestSeller) => {
    try {
      await adminToggleBestSellerHighlight(item.id);
      fetchData();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleUploadImages = async (item: ApiBestSeller, files: FileList) => {
    try {
      setUploadingImages(true);
      await adminUploadBestSellerImages(item.id, Array.from(files));
      fetchData();
    } catch (err: any) {
      alert('Lỗi upload: ' + err.message);
    } finally {
      setUploadingImages(false);
    }
  };

  // Truyền thêm ids: chỉ id ảnh thuộc best seller (không phải menu_item)
  const openGallery = (images: string[], startIndex = 0, imageIds?: number[]) => {
    setGalleryImages(images);
    setGalleryIndex(startIndex);
    setGalleryImageIds(imageIds || []);
    setShowGallery(true);
  };

  // Xoá ảnh best seller
  const handleDeleteImage = async (item: ApiBestSeller, imageIdx: number) => {
    const imageId = galleryImageIds[imageIdx];
    if (!imageId) return;
    if (!window.confirm('Xoá ảnh này?')) return;
    try {
      await adminDeleteBestSellerImage(item.id, imageId);
      fetchData();
      // Cập nhật gallery
      const newImages = [...galleryImages];
      newImages.splice(imageIdx, 1);
      setGalleryImages(newImages);
      const newIds = [...galleryImageIds];
      newIds.splice(imageIdx, 1);
      setGalleryImageIds(newIds);
      if (galleryIndex >= newImages.length) setGalleryIndex(Math.max(0, newImages.length - 1));
    } catch (err: any) {
      alert('Lỗi xoá ảnh: ' + err.message);
    }
  };

  const getItemImages = (item: ApiBestSeller): string[] => {
    const images: string[] = [];
    if ((item as any).images_urls?.length > 0) {
      images.push(...(item as any).images_urls.map(getImageUrl));
    }
    if (item.menu_item?.images_urls?.length) {
      images.push(...item.menu_item.images_urls.map(getImageUrl));
    }
    return images;
  };

  const getDisplayImage = (item: ApiBestSeller): string => {
    if ((item as any).thumbnail_url) return getImageUrl((item as any).thumbnail_url);
    if ((item as any).images_urls?.[0]) return getImageUrl((item as any).images_urls[0]);
    if (item.menu_item?.thumbnail_url) return getImageUrl(item.menu_item.thumbnail_url);
    if (item.menu_item?.image_url) return getImageUrl(item.menu_item.image_url);
    return 'https://via.placeholder.com/200?text=No+Image';
  };

  if (loading) {
    return (
      <AdminLayout title="Quản lý Best Sellers">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Quản lý Best Sellers">
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex items-center justify-between">
        <p className="text-gray-500">{items.length} món best seller</p>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-primary text-dark px-4 py-2 rounded-lg font-bold hover:bg-primary/90 transition"
        >
          <Plus size={18} /> Thêm Best Seller
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items
          .sort((a, b) => (a.position || 0) - (b.position || 0))
          .map((item) => {
            const name = item.title || item.menu_item?.name || 'Không tên';
            const price = item.menu_item?.price ? parseFloat(item.menu_item.price) : 0;
            const displayImage = getDisplayImage(item);
            const allImages = getItemImages(item);
            const ownImagesCount = (item as any).images_urls?.length || 0;

            return (
              <div key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="relative aspect-square bg-gray-100 group">
                  <img 
                    src={displayImage} 
                    alt={name} 
                    className="w-full h-full object-cover aspect-square rounded-t-xl cursor-pointer"
                    onClick={() => {
                      const ids = ((item as any).images || []).map((img: any) => img.id);
                      openGallery(allImages, 0, [
                        ...ids,
                        ...Array(allImages.length - ids.length).fill(undefined)
                      ]);
                    }}
                  />
                  {/* Thumbnail list */}
                  {allImages.length > 1 && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 bg-black/30 rounded px-2 py-1">
                      {allImages.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt="thumb"
                          className={`w-10 h-10 object-cover rounded cursor-pointer border-2 ${img === displayImage ? 'border-primary' : 'border-white/40'}`}
                          onClick={e => {
                            e.stopPropagation();
                            const ids = ((item as any).images || []).map((img: any) => img.id);
                            openGallery(allImages, idx, [
                              ...ids,
                              ...Array(allImages.length - ids.length).fill(undefined)
                            ]);
                          }}
                        />
                      ))}
                    </div>
                  )}
                  
                  {allImages.length > 1 && (
                    <div 
                      className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 cursor-pointer"
                      onClick={() => openGallery(allImages)}
                    >
                      <Image size={12} /> {allImages.length} ảnh
                    </div>
                  )}
                  
                  {/* Đã ẩn action upload ảnh khỏi card, chỉ cho phép xem ảnh */}
                  
                  <div className="absolute top-2 left-2 flex gap-2">
                    {item.pinned && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Pin size={12} /> Ghim
                      </span>
                    )}
                    {item.highlighted && (
                      <span className="bg-primary text-dark text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Sparkles size={12} /> Hot
                      </span>
                    )}
                  </div>

                  <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                    #{item.position || '-'}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-dark mb-1">{name}</h3>
                  {price > 0 && (
                    <p className="text-primary font-bold">{price.toLocaleString('vi-VN')}đ</p>
                  )}
                  {item.content && (
                    <p className="text-gray-500 text-sm mt-2 line-clamp-2">{item.content}</p>
                  )}
                  
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-1 rounded-full ${item.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {item.active ? 'Hiển thị' : 'Ẩn'}
                    </span>
                    {ownImagesCount > 0 && (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                        {ownImagesCount} ảnh
                      </span>
                    )}
                  </div>
                </div>

                <div className="px-4 pb-4 flex gap-2">
                  <button
                    onClick={() => handleTogglePin(item)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                      item.pinned ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Pin size={14} className="inline mr-1" />
                    {item.pinned ? 'Bỏ ghim' : 'Ghim'}
                  </button>
                  <button
                    onClick={() => handleToggleHighlight(item)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                      item.highlighted ? 'bg-primary/20 text-primary' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Sparkles size={14} className="inline mr-1" />
                    {item.highlighted ? 'Bỏ Hot' : 'Hot'}
                  </button>
                </div>
                
                <div className="px-4 pb-4 flex gap-2 border-t border-gray-100 pt-3">
                  <button
                    onClick={() => openEditModal(item)}
                    className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition"
                  >
                    <Edit2 size={14} className="inline mr-1" /> Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition"
                  >
                    <Trash2 size={14} className="inline mr-1" /> Xóa
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {items.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Star size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Chưa có món Best Seller nào.</p>
          <button
            onClick={openCreateModal}
            className="mt-4 text-primary font-medium hover:underline"
          >
            Thêm món đầu tiên
          </button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-dark">
                {editingItem ? 'Sửa Best Seller' : 'Thêm Best Seller'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Nhập tiêu đề"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Bắt buộc nếu không chọn món ăn</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Liên kết với món ăn (tùy chọn)</label>
                <select
                  value={formData.menu_item_id}
                  onChange={(e) => setFormData({ ...formData, menu_item_id: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value={0}>-- Không liên kết --</option>
                  {menuItems.map(mi => (
                    <option key={mi.id} value={mi.id}>
                      {mi.name} - {parseFloat(mi.price).toLocaleString('vi-VN')}đ
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả ngắn</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={3}
                  placeholder="Mô tả món..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí</label>
                <input
                  type="number"
                  min={1}
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Ảnh và thao tác ảnh */}
              {editingItem && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh món Best Seller</label>
                  <div className="flex flex-wrap gap-3 mb-2">
                    {(editingItem.images || []).map((img: any, idx: number) => (
                      <div key={img.id} className="relative group">
                        <img
                          src={getImageUrl(img.url)}
                          alt="Ảnh món"
                          className="w-24 h-24 object-cover rounded border"
                        />
                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-80 hover:opacity-100"
                          title="Xoá ảnh này"
                          onClick={async () => {
                            if (!window.confirm('Xoá ảnh này?')) return;
                            await handleDeleteImage(editingItem, idx);
                            // Cập nhật lại editingItem sau khi xoá
                            const updated = await adminGetBestSellers();
                            const found = updated.find(i => i.id === editingItem.id);
                            if (found) setEditingItem(found);
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {/* Upload ảnh mới */}
                    <label className="w-24 h-24 flex items-center justify-center border-2 border-dashed rounded cursor-pointer hover:border-primary text-gray-400 hover:text-primary">
                      <Upload size={28} />
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          if (e.target.files) {
                            setUploadingImages(true);
                            await handleUploadImages(editingItem, e.target.files);
                            const updated = await adminGetBestSellers();
                            const found = updated.find(i => i.id === editingItem.id);
                            if (found) setEditingItem(found);
                            setUploadingImages(false);
                          }
                        }}
                        disabled={uploadingImages}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">Có thể tải lên nhiều ảnh. Ảnh đầu tiên sẽ là ảnh đại diện.</p>
                </div>
              )}
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.pinned}
                    onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="text-sm text-gray-700">Ghim lên đầu</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.highlighted}
                    onChange={(e) => setFormData({ ...formData, highlighted: e.target.checked })}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="text-sm text-gray-700">Đánh dấu Hot</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="text-sm text-gray-700">Hiển thị</span>
                </label>
              </div>

              {!editingItem && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    💡 Sau khi tạo, bạn có thể upload ảnh bằng cách hover vào card và nhấn "Tải ảnh"
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2 bg-primary text-dark rounded-lg font-bold hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showGallery && galleryImages.length > 0 && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" onClick={() => setShowGallery(false)}>
          <button onClick={() => setShowGallery(false)} className="absolute top-4 right-4 text-white hover:text-gray-300">
            <X size={32} />
          </button>
          {galleryImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setGalleryIndex((galleryIndex - 1 + galleryImages.length) % galleryImages.length); }}
                className="absolute left-4 text-white hover:text-gray-300 bg-black/50 p-2 rounded-full"
              >
                <ChevronLeft size={32} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setGalleryIndex((galleryIndex + 1) % galleryImages.length); }}
                className="absolute right-4 text-white hover:text-gray-300 bg-black/50 p-2 rounded-full"
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}
          <div className="relative">
            <img
              src={galleryImages[galleryIndex]}
              alt=""
              className="max-h-[80vh] max-w-[90vw] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            {galleryImageIds[galleryIndex] && (
              <button
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 shadow hover:bg-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  // Tìm item chứa ảnh này
                  const item = items.find(i => (i.images as any)?.some((img: any) => getImageUrl(img.url) === galleryImages[galleryIndex]));
                  if (item) handleDeleteImage(item, galleryIndex);
                }}
                title="Xoá ảnh này"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black/50 px-4 py-2 rounded-full">
            {galleryIndex + 1} / {galleryImages.length}
          </div>
          {galleryImages.length > 1 && (
            <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2">
              {galleryImages.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt=""
                  className={`w-16 h-16 object-cover rounded cursor-pointer border-2 ${idx === galleryIndex ? 'border-primary' : 'border-transparent opacity-60'}`}
                  onClick={(e) => { e.stopPropagation(); setGalleryIndex(idx); }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminBestSellers;
