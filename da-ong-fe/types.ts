export enum DishCategory {
  APPETIZER = 'Khai vị',
  MAIN = 'Món chính',
  HOTPOT = 'Món lẩu',
  DESSERT = 'Tráng miệng',
  DRINK = 'Đồ uống'
}

export interface Dish {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  images?: string[];  // Multiple images
  category: DishCategory;
  isBestSeller?: boolean;
  isRecommended?: boolean;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  hasAudio: boolean;
  type: 'private' | 'outdoor';
  isAvailable: boolean;
  bookedForDate?: boolean; // true if room has booking on selected date
  image: string;
  images?: string[];  // Multiple images for gallery
  description: string;
  amenities: string[];
  surcharge: number;
}

export interface BookingState {
  step: number;
  guestCount: number;
  date: string;
  time: string;
  locationType: 'private' | 'outdoor';
  audioNeeded: boolean;
  selectedRoom: Room | null;
  selectedDishes: { [dishId: string]: number }; // ID -> Quantity
  customerName: string;
  customerPhone: string;
  note: string;
}