import React, { useState } from 'react';
import { Room } from '../types';
import { Users, Volume2, X, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';

interface FloorPlanViewProps {
  rooms: Room[];
  selectedRoom: Room | null;
  onSelectRoom: (room: Room) => void;
  locationType: 'private' | 'outdoor';
  bookingDate: string;
}

// Position configuration for private rooms (can be customized)
const PRIVATE_ROOM_POSITIONS: { [key: string]: { x: number; y: number; width: number; height: number } } = {
  // Row 1 - Top
  '1': { x: 10, y: 10, width: 18, height: 20 },
  '2': { x: 32, y: 10, width: 18, height: 20 },
  '3': { x: 54, y: 10, width: 18, height: 20 },
  '4': { x: 76, y: 10, width: 18, height: 20 },
  // Row 2 - Middle
  '5': { x: 10, y: 40, width: 18, height: 20 },
  '6': { x: 32, y: 40, width: 18, height: 20 },
  '7': { x: 54, y: 40, width: 18, height: 20 },
  '8': { x: 76, y: 40, width: 18, height: 20 },
  // Row 3 - Bottom
  '9': { x: 10, y: 70, width: 18, height: 20 },
  '10': { x: 32, y: 70, width: 18, height: 20 },
  '11': { x: 54, y: 70, width: 18, height: 20 },
  '12': { x: 76, y: 70, width: 18, height: 20 },
};

// Grid layout for outdoor tables (5 columns x 5 rows = 25 tables)
const getOutdoorTablePosition = (index: number) => {
  const cols = 5;
  const row = Math.floor(index / cols);
  const col = index % cols;
  const spacing = 18;
  const startX = 8;
  const startY = 10;
  
  return {
    x: startX + col * spacing,
    y: startY + row * spacing,
    radius: 7
  };
};

export const FloorPlanView: React.FC<FloorPlanViewProps> = ({
  rooms,
  selectedRoom,
  onSelectRoom,
  locationType,
  bookingDate
}) => {
  const [hoveredRoom, setHoveredRoom] = useState<Room | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<Room | null>(null);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const renderPrivateRoomsPlan = () => (
    <svg viewBox="0 0 100 95" className="w-full h-auto max-h-[500px]" style={{ transform: 'rotate(180deg)' }}>
      {/* Background */}
      <rect x="0" y="0" width="100" height="95" fill="#fef9e7" rx="2" />
      
      {/* Title */}
      <text x="50" y="6" textAnchor="middle" className="text-[3px] font-bold fill-gray-700">
        SƠ ĐỒ PHÒNG VIP - NHÀ HÀNG ĐÁ & ONG
      </text>
      
      {/* Corridor/Hallway */}
      <rect x="5" y="32" width="90" height="6" fill="#e5e7eb" rx="1" />
      <text x="50" y="36" textAnchor="middle" className="text-[2px] fill-gray-500">HÀNH LANG</text>
      
      <rect x="5" y="62" width="90" height="6" fill="#e5e7eb" rx="1" />
      <text x="50" y="66" textAnchor="middle" className="text-[2px] fill-gray-500">HÀNH LANG</text>

      {/* Rooms */}
      {rooms.map((room, index) => {
        const pos = PRIVATE_ROOM_POSITIONS[room.id] || PRIVATE_ROOM_POSITIONS[String(index + 1)] || {
          x: 10 + (index % 4) * 22,
          y: 10 + Math.floor(index / 4) * 30,
          width: 18,
          height: 20
        };
        
        const isSelected = selectedRoom?.id === room.id;
        const isBooked = room.bookedForDate;
        const isHovered = hoveredRoom?.id === room.id;
        
        let fillColor = '#86efac'; // green-300 - available
        let strokeColor = '#22c55e'; // green-500
        
        if (isBooked) {
          fillColor = '#fca5a5'; // red-300
          strokeColor = '#ef4444'; // red-500
        } else if (isSelected) {
          fillColor = '#fde047'; // yellow-300
          strokeColor = '#eab308'; // yellow-500
        } else if (isHovered && !isBooked) {
          fillColor = '#bbf7d0'; // green-200
        }

        return (
          <g 
            key={room.id}
            className={`transition-all duration-200 ${isBooked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            onMouseEnter={() => setHoveredRoom(room)}
            onMouseLeave={() => setHoveredRoom(null)}
            onClick={() => {
              if (!isBooked) {
                setShowDetailModal(room);
                setModalImageIndex(0);
              }
            }}
          >
            {/* Room box */}
            <rect
              x={pos.x}
              y={pos.y}
              width={pos.width}
              height={pos.height}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={isSelected || isHovered ? 0.8 : 0.4}
              rx="1"
              className="transition-all duration-200"
            />
            
            {/* Room name */}
            <text
              x={pos.x + pos.width / 2}
              y={pos.y + pos.height / 2 - 2}
              textAnchor="middle"
              className="text-[2.5px] font-bold fill-gray-800 pointer-events-none"
            >
              {room.name.replace('Phòng ', '').replace('VIP ', 'VIP')}
            </text>
            
            {/* Capacity */}
            <text
              x={pos.x + pos.width / 2}
              y={pos.y + pos.height / 2 + 2}
              textAnchor="middle"
              className="text-[2px] fill-gray-600 pointer-events-none"
            >
              {room.capacity} khách
            </text>
            
            {/* Status badge */}
            {isBooked && (
              <text
                x={pos.x + pos.width / 2}
                y={pos.y + pos.height / 2 + 5}
                textAnchor="middle"
                className="text-[1.8px] font-bold fill-red-700 pointer-events-none"
              >
                ĐÃ ĐẶT
              </text>
            )}
            
            {/* Audio icon */}
            {room.hasAudio && !isBooked && (
              <circle
                cx={pos.x + pos.width - 2}
                cy={pos.y + 2}
                r="1.5"
                fill="#8b5cf6"
                className="pointer-events-none"
              />
            )}
          </g>
        );
      })}
      
      {/* Legend */}
      <g transform="translate(5, 92)">
        <rect x="0" y="-2" width="3" height="3" fill="#86efac" stroke="#22c55e" strokeWidth="0.3" rx="0.5" />
        <text x="4" y="0.5" className="text-[2px] fill-gray-600">Còn trống</text>
        
        <rect x="20" y="-2" width="3" height="3" fill="#fca5a5" stroke="#ef4444" strokeWidth="0.3" rx="0.5" />
        <text x="24" y="0.5" className="text-[2px] fill-gray-600">Đã đặt</text>
        
        <rect x="42" y="-2" width="3" height="3" fill="#fde047" stroke="#eab308" strokeWidth="0.3" rx="0.5" />
        <text x="46" y="0.5" className="text-[2px] fill-gray-600">Đang chọn</text>
        
        <circle cx="62" cy="-0.5" r="1.5" fill="#8b5cf6" />
        <text x="65" y="0.5" className="text-[2px] fill-gray-600">Có Karaoke</text>
      </g>
    </svg>
  );

  const renderOutdoorTablesPlan = () => (
    <svg viewBox="0 0 100 100" className="w-full h-auto max-h-[500px]" style={{ transform: 'rotate(180deg)' }}>
      {/* Garden background with gradient */}
      <defs>
        <linearGradient id="gardenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#dcfce7" />
          <stop offset="100%" stopColor="#bbf7d0" />
        </linearGradient>
        <pattern id="grassPattern" patternUnits="userSpaceOnUse" width="4" height="4">
          <rect width="4" height="4" fill="url(#gardenGradient)" />
          <circle cx="1" cy="1" r="0.3" fill="#86efac" opacity="0.5" />
          <circle cx="3" cy="3" r="0.2" fill="#86efac" opacity="0.5" />
        </pattern>
      </defs>
      
      <rect x="0" y="0" width="100" height="100" fill="url(#grassPattern)" rx="2" />
      
      {/* Title */}
      <text x="50" y="6" textAnchor="middle" className="text-[3px] font-bold fill-gray-700">
        SƠ ĐỒ SÂN VƯỜN - KHU NGOÀI TRỜI
      </text>
      
      {/* Decorative trees */}
      {[
        { x: 3, y: 15 }, { x: 97, y: 15 }, { x: 3, y: 50 }, { x: 97, y: 50 }, { x: 3, y: 85 }, { x: 97, y: 85 }
      ].map((tree, i) => (
        <g key={`tree-${i}`}>
          <circle cx={tree.x} cy={tree.y} r="3" fill="#22c55e" opacity="0.6" />
          <circle cx={tree.x} cy={tree.y} r="2" fill="#16a34a" opacity="0.8" />
        </g>
      ))}
      
      {/* Tables */}
      {rooms.map((room, index) => {
        const pos = getOutdoorTablePosition(index);
        const isSelected = selectedRoom?.id === room.id;
        const isBooked = room.bookedForDate;
        const isHovered = hoveredRoom?.id === room.id;
        
        let fillColor = '#86efac'; // green-300
        let strokeColor = '#22c55e'; // green-500
        
        if (isBooked) {
          fillColor = '#fca5a5'; // red-300
          strokeColor = '#ef4444'; // red-500
        } else if (isSelected) {
          fillColor = '#fde047'; // yellow-300
          strokeColor = '#eab308'; // yellow-500
        } else if (isHovered && !isBooked) {
          fillColor = '#bbf7d0'; // green-200
        }

        return (
          <g 
            key={room.id}
            className={`transition-all duration-200 ${isBooked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            onMouseEnter={() => setHoveredRoom(room)}
            onMouseLeave={() => setHoveredRoom(null)}
            onClick={() => {
              if (!isBooked) {
                setShowDetailModal(room);
                setModalImageIndex(0);
              }
            }}
          >
            {/* Table circle */}
            <circle
              cx={pos.x}
              cy={pos.y}
              r={pos.radius}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={isSelected || isHovered ? 0.8 : 0.4}
              className="transition-all duration-200"
            />
            
            {/* Chairs around table */}
            {[0, 90, 180, 270].map((angle, i) => {
              const chairRadius = pos.radius + 2;
              const rad = (angle * Math.PI) / 180;
              return (
                <circle
                  key={i}
                  cx={pos.x + Math.cos(rad) * chairRadius}
                  cy={pos.y + Math.sin(rad) * chairRadius}
                  r="1"
                  fill={isBooked ? '#fca5a5' : '#d1d5db'}
                  stroke={isBooked ? '#ef4444' : '#9ca3af'}
                  strokeWidth="0.2"
                  className="pointer-events-none"
                />
              );
            })}
            
            {/* Table number */}
            <text
              x={pos.x}
              y={pos.y - 1}
              textAnchor="middle"
              className="text-[2.5px] font-bold fill-gray-800 pointer-events-none"
            >
              {index + 1}
            </text>
            
            {/* Capacity */}
            <text
              x={pos.x}
              y={pos.y + 2}
              textAnchor="middle"
              className="text-[1.8px] fill-gray-600 pointer-events-none"
            >
              {room.capacity}ng
            </text>
          </g>
        );
      })}
      
      {/* Legend */}
      <g transform="translate(10, 96)">
        <circle cx="2" cy="0" r="2" fill="#86efac" stroke="#22c55e" strokeWidth="0.3" />
        <text x="6" y="1" className="text-[2px] fill-gray-600">Còn trống</text>
        
        <circle cx="27" cy="0" r="2" fill="#fca5a5" stroke="#ef4444" strokeWidth="0.3" />
        <text x="31" y="1" className="text-[2px] fill-gray-600">Đã đặt</text>
        
        <circle cx="52" cy="0" r="2" fill="#fde047" stroke="#eab308" strokeWidth="0.3" />
        <text x="56" y="1" className="text-[2px] fill-gray-600">Đang chọn</text>
      </g>
    </svg>
  );

  // Tooltip for hovered room
  const renderTooltip = () => {
    if (!hoveredRoom) return null;
    
    return (
      <div className="fixed z-50 bg-white shadow-xl rounded-lg p-3 border border-gray-200 pointer-events-none"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        <div className="font-bold text-gray-800">{hoveredRoom.name}</div>
        <div className="text-sm text-gray-600">Sức chứa: {hoveredRoom.capacity} khách</div>
        {hoveredRoom.pricePerHour > 0 && (
          <div className="text-sm text-primary font-medium">{hoveredRoom.pricePerHour.toLocaleString()}đ/h</div>
        )}
        {hoveredRoom.bookedForDate && (
          <div className="text-sm text-red-600 font-medium mt-1">Đã có người đặt ngày {formatDate(bookingDate)}</div>
        )}
      </div>
    );
  };

  // Detail Modal
  const renderDetailModal = () => {
    if (!showDetailModal) return null;
    const room = showDetailModal;
    const images = room.images && room.images.length > 0 ? room.images : [room.image];
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowDetailModal(null)}>
        <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          {/* Image Gallery */}
          <div className="relative h-64">
            <img 
              src={images[modalImageIndex]} 
              alt={room.name} 
              className="w-full h-full object-cover rounded-t-2xl"
            />
            <button 
              onClick={() => setShowDetailModal(null)}
              className="absolute top-3 right-3 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
            >
              <X size={20} />
            </button>
            
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setModalImageIndex(prev => prev > 0 ? prev - 1 : images.length - 1); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setModalImageIndex(prev => prev < images.length - 1 ? prev + 1 : 0); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                >
                  <ChevronRight size={20} />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                  {images.map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-2 h-2 rounded-full ${i === modalImageIndex ? 'bg-white' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              </>
            )}
            
            {room.bookedForDate && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-t-2xl">
                <span className="text-white font-bold text-lg uppercase border-2 border-red-500 bg-red-500/80 px-4 py-2 rounded">
                  Đã có người đặt ngày {formatDate(bookingDate)}
                </span>
              </div>
            )}
          </div>
          
          {/* Room Info */}
          <div className="p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-gray-800">{room.name}</h3>
              {room.bookedForDate && (
                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-medium">Đã đặt</span>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-gray-600 mb-4">
              <span className="flex items-center gap-1">
                <Users size={16} /> {room.capacity} khách
              </span>
              {room.hasAudio && (
                <span className="flex items-center gap-1 text-purple-600">
                  <Volume2 size={16} /> Karaoke
                </span>
              )}
              {room.pricePerHour > 0 ? (
                <span className="text-primary font-bold">{room.pricePerHour.toLocaleString()}đ/h</span>
              ) : (
                <span className="text-green-600 font-bold">Miễn phí</span>
              )}
            </div>
            
            <p className="text-gray-600 mb-4">{room.description}</p>
            
            {room.amenities && room.amenities.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {room.amenities.map((amenity, i) => (
                  <span key={i} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                    {amenity}
                  </span>
                ))}
              </div>
            )}
            
            <button
              disabled={room.bookedForDate}
              onClick={() => {
                if (!room.bookedForDate) {
                  onSelectRoom(room);
                  setShowDetailModal(null);
                }
              }}
              className={`w-full py-3 rounded-xl font-bold text-lg transition-all ${
                room.bookedForDate 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-primary text-dark hover:bg-yellow-500'
              }`}
            >
              {room.bookedForDate ? 'Không khả dụng' : 'CHỌN PHÒNG NÀY'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Booking date info */}
      {bookingDate && (
        <div className="mb-4 flex items-center gap-2 text-gray-600 bg-blue-50 px-4 py-2 rounded-lg">
          <MapPin size={18} className="text-blue-500" />
          <span>Xem trạng thái phòng cho ngày: <strong className="text-blue-700">{formatDate(bookingDate)}</strong></span>
        </div>
      )}
      
      {/* Floor Plan */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm">
        {locationType === 'private' ? renderPrivateRoomsPlan() : renderOutdoorTablesPlan()}
      </div>
      
      {/* Selected room indicator */}
      {selectedRoom && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-gray-600">Đã chọn: </span>
            <span className="font-bold text-gray-800">{selectedRoom.name}</span>
            <span className="text-gray-500 ml-2">({selectedRoom.capacity} khách)</span>
          </div>
          <button
            onClick={() => {
              setShowDetailModal(selectedRoom);
              setModalImageIndex(0);
            }}
            className="text-primary font-medium hover:underline"
          >
            Xem chi tiết
          </button>
        </div>
      )}
      
      {/* Modals */}
      {renderDetailModal()}
    </div>
  );
};

export default FloorPlanView;

