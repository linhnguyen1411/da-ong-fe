import React, { useState } from 'react';
import { ApiRoom, API_BASE_ORIGIN } from '../services/api';

interface RoomCardProps {
  room: ApiRoom;
}

const getImageUrl = (url?: string): string => {
  if (!url) return 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400';
  if (url.startsWith('http')) return url;
  return `${API_BASE_ORIGIN}${url}`;
};

const RoomCard: React.FC<RoomCardProps> = ({ room }) => {
  const [imageError, setImageError] = useState(false);
  // Ưu tiên dùng thumbnail_url_thumb (nhẹ nhất), fallback về thumbnail_url_medium, rồi mới đến thumbnail_url
  const [imageSrc, setImageSrc] = useState(() => {
    const url = room.thumbnail_url_thumb || room.thumbnail_url_medium || room.thumbnail_url || room.images_urls_thumb?.[0] || room.images_urls_medium?.[0] || room.images_urls?.[0];
    return url ? getImageUrl(url) : 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400';
  });

  const handleImageError = () => {
    if (!imageError) {
      // Thử ảnh thumbnail tiếp theo nếu có
      const thumbUrls = room.images_urls_thumb || [];
      const mediumUrls = room.images_urls_medium || [];
      const originalUrls = room.images_urls || [];
      
      if (thumbUrls.length > 1) {
        const nextImage = thumbUrls[1];
        if (nextImage) {
          setImageSrc(getImageUrl(nextImage));
          setImageError(true);
          return;
        }
      } else if (mediumUrls.length > 1) {
        const nextImage = mediumUrls[1];
        if (nextImage) {
          setImageSrc(getImageUrl(nextImage));
          setImageError(true);
          return;
        }
      } else if (originalUrls.length > 1) {
        const nextImage = originalUrls[1];
        if (nextImage) {
          setImageSrc(getImageUrl(nextImage));
          setImageError(true);
          return;
        }
      }
      // Fallback về placeholder
      setImageSrc('https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400');
      setImageError(true);
    }
  };

  return (
    <div className="rounded-lg shadow-lg bg-white p-4 flex flex-col items-center border border-gray-100">
      <img
        src={imageSrc}
        alt={room.name}
        className="w-full h-40 object-cover rounded-md mb-3"
        onError={handleImageError}
        loading="lazy"
      />
      <h3 className="text-xl font-bold mb-1 text-dark text-center">{room.name}</h3>
      <div className="text-gray-600 text-sm mb-2 text-center">{room.description}</div>
      <div className="flex flex-wrap gap-2 justify-center text-xs mb-2">
        <span className="bg-primary/10 text-primary px-2 py-1 rounded">{room.room_type === 'private' ? 'Phòng VIP' : 'Bàn ngoài trời'}</span>
        <span className="bg-gray-100 px-2 py-1 rounded">Sức chứa: {room.capacity}</span>
        {room.has_karaoke && <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Karaoke</span>}
        {room.has_projector && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">Projector</span>}
        {room.has_sound_system && <span className="bg-green-100 text-green-700 px-2 py-1 rounded">Âm thanh</span>}
      </div>
      {room.price_per_hour && parseFloat(room.price_per_hour) > 0 && (
        <div className="font-semibold text-primary text-lg mb-1">
          {Math.floor(parseFloat(room.price_per_hour)).toLocaleString()}đ
        </div>
      )}
      <div className="text-xs text-gray-400">Trạng thái: {room.status === 'available' ? 'Còn trống' : room.status === 'occupied' ? 'Đã đặt' : 'Bảo trì'}</div>
    </div>
  );
};

export default RoomCard;
