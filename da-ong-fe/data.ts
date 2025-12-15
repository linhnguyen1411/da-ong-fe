import { Dish, DishCategory, Room } from './types';

export const MENU_ITEMS: Dish[] = [
  // Appetizers
  {
    id: 'a1',
    name: 'Gỏi Ngó Sen Tôm Thịt',
    price: 120000,
    description: 'Ngó sen giòn, tôm tươi và thịt ba chỉ thái mỏng.',
    image: 'https://picsum.photos/400/300?random=1',
    category: DishCategory.APPETIZER,
    isBestSeller: true
  },
  {
    id: 'a2',
    name: 'Chả Giò Hải Sản',
    price: 95000,
    description: 'Vỏ giòn rụm, nhân hải sản tươi ngon.',
    image: 'https://picsum.photos/400/300?random=2',
    category: DishCategory.APPETIZER
  },
  // Main
  {
    id: 'm1',
    name: 'Bò Wagyu Nướng Đá',
    price: 890000,
    description: 'Thịt bò Wagyu thượng hạng nướng trên đá nóng.',
    image: 'https://picsum.photos/400/300?random=3',
    category: DishCategory.MAIN,
    isBestSeller: true,
    isRecommended: true
  },
  {
    id: 'm2',
    name: 'Cá Tuyết Hấp Hồng Kông',
    price: 450000,
    description: 'Cá tuyết tươi hấp xì dầu thượng hạng.',
    image: 'https://picsum.photos/400/300?random=4',
    category: DishCategory.MAIN
  },
  // Hotpot
  {
    id: 'h1',
    name: 'Lẩu Cua Đồng Đặc Biệt',
    price: 550000,
    description: 'Nước dùng đậm đà, riêu cua vàng óng.',
    image: 'https://picsum.photos/400/300?random=5',
    category: DishCategory.HOTPOT,
    isRecommended: true
  },
  // Dessert
  {
    id: 'd1',
    name: 'Chè Khúc Bạch',
    price: 45000,
    description: 'Thanh mát, giải nhiệt với hạnh nhân.',
    image: 'https://picsum.photos/400/300?random=6',
    category: DishCategory.DESSERT
  },
  // Drinks
  {
    id: 'dr1',
    name: 'Vang Đỏ Chile',
    price: 850000,
    description: 'Hương vị nồng nàn, phù hợp thịt đỏ.',
    image: 'https://picsum.photos/400/300?random=7',
    category: DishCategory.DRINK
  },
  {
    id: 'dr2',
    name: 'Bia Heineken (Lon)',
    price: 35000,
    description: 'Bia Lager thượng hạng, hương vị đậm đà.',
    image: 'https://picsum.photos/400/300?random=14',
    category: DishCategory.DRINK
  },
  {
    id: 'dr3',
    name: 'Bia Tiger Crystal',
    price: 32000,
    description: 'Công nghệ làm lạnh sâu, sảng khoái.',
    image: 'https://picsum.photos/400/300?random=15',
    category: DishCategory.DRINK
  },
  {
    id: 'dr4',
    name: 'Nước Ép Cam Tươi',
    price: 55000,
    description: 'Cam sành tươi nguyên chất, nhiều vitamin C.',
    image: 'https://picsum.photos/400/300?random=16',
    category: DishCategory.DRINK
  },
  {
    id: 'dr5',
    name: 'Coca Cola',
    price: 25000,
    description: 'Nước ngọt có gas giải khát.',
    image: 'https://picsum.photos/400/300?random=17',
    category: DishCategory.DRINK
  },
  {
    id: 'dr6',
    name: 'Nước Suối Lavie',
    price: 15000,
    description: 'Nước khoáng thiên nhiên.',
    image: 'https://picsum.photos/400/300?random=18',
    category: DishCategory.DRINK
  }
];

export const ROOMS: Room[] = [
  {
    id: 'r1',
    name: 'Phòng VIP Hoàng Gia',
    capacity: 20,
    hasAudio: true,
    type: 'private',
    isAvailable: true,
    image: 'https://picsum.photos/600/400?random=10',
    description: 'Không gian sang trọng bậc nhất, phù hợp tiệc quan trọng.',
    amenities: ['Karaoke', 'Ghế Sofa da', 'View thành phố'],
    surcharge: 500000
  },
  {
    id: 'r2',
    name: 'Phòng Gia Đình Ấm Cúng',
    capacity: 10,
    hasAudio: false,
    type: 'private',
    isAvailable: true,
    image: 'https://picsum.photos/600/400?random=11',
    description: 'Riêng tư, yên tĩnh cho bữa ăn gia đình.',
    amenities: ['TV', 'Ghế trẻ em'],
    surcharge: 200000
  },
  {
    id: 'r3',
    name: 'Sân Vườn Hoa Hồng',
    capacity: 50,
    hasAudio: false,
    type: 'outdoor',
    isAvailable: true,
    image: 'https://picsum.photos/600/400?random=12',
    description: 'Thoáng mát, hòa mình với thiên nhiên.',
    amenities: ['Quạt điều hòa', 'Mái che tự động'],
    surcharge: 0
  },
  {
    id: 'r4',
    name: 'Phòng Hội Nghị Nhỏ',
    capacity: 30,
    hasAudio: true,
    type: 'private',
    isAvailable: false, // Fully booked example
    image: 'https://picsum.photos/600/400?random=13',
    description: 'Phù hợp hội họp kết hợp ăn uống.',
    amenities: ['Máy chiếu', 'Âm thanh hội thảo'],
    surcharge: 300000
  }
];

export const COMPANY_INFO = {
  address: "136 Tôn Đức Thắng - Hoà Khánh - Đà Nẵng",
  phone: "076 751 8750",
  hours: "10:00 - 22:00 (Hàng ngày)",
  zalo: "https://zalo.me/0767518750"
};