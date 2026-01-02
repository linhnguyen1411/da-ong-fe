// API Service for Đá & Ong Restaurant


export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000/api/v1';
export const API_BASE_ORIGIN = API_BASE_URL.replace(/\/api\/v1$/, '');
// Types from API
export interface ApiCategory {
  id: number;
  name: string;
  description: string;
  position: number;
  active: boolean;
  menu_items?: ApiMenuItem[];
}

export interface ApiMenuItem {
  id: number;
  category_id: number;
  name: string;
  description: string;
  price: string;
  image_url: string;
  thumbnail_url?: string;
  images_urls?: string[];
  images?: { id: number; url: string }[];
  active: boolean;
  position: number;
  category?: { id: number; name: string };
  is_market_price?: boolean;
  product_code?: string;
  unit?: string;
}

export interface ApiBestSeller {
  id: number;
  menu_item_id: number;
  title: string;
  content: string;
  image_url: string;
  pinned: boolean;
  highlighted: boolean;
  position: number;
  active: boolean;
  menu_item?: ApiMenuItem;
  images_urls?: string[];
  thumbnail_url?: string;
}

export interface ApiDailySpecial {
  id: number;
  menu_item_id: number;
  title: string;
  content: string;
  image_url: string;
  special_date: string;
  pinned: boolean;
  highlighted: boolean;
  active: boolean;
  menu_item?: ApiMenuItem;
  images_urls?: string[];
  thumbnail_url?: string;
}

export interface ApiRoom {
  id: number;
  name: string;
  description: string;
  capacity: number;
  has_sound_system: boolean;
  has_projector: boolean;
  has_karaoke: boolean;
  price_per_hour: string;
  status: 'available' | 'maintenance'; // Chỉ 2 loại: available và maintenance
  in_use?: boolean; // Đang sử dụng (tính từ room_schedules)
  room_type: 'private' | 'outdoor';
  position: number;
  active: boolean;
  room_images?: ApiRoomImage[];
  images_urls?: string[];
  thumbnail_url?: string;
  images?: { id: number; url: string }[];
  booked_for_date?: boolean; // true if room has booking on the requested date
  bookings?: Array<{
    id: number;
    customer_name: string;
    booking_time: string; // Format: "HH:MM"
    party_size: number;
  }>;
}

export interface ApiRoomImage {
  id: number;
  image_url: string;
  caption: string;
  position: number;
}

export interface ApiContact {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}

export interface ApiBooking {
  room_id?: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  party_size: number;
  booking_date: string;
  booking_time: string;
  duration_hours?: number;
  notes?: string;
  booking_items_attributes?: Array<{
    menu_item_id: number;
    quantity: number;
    notes?: string;
  }>;
}

// Helper function for API calls
async function apiCall<T>(endpoint: string, options?: RequestInit, retryCount = 0): Promise<T> {
  const { headers, ...restOptions } = options || {};
  const isAdminApi = endpoint.startsWith('/admin') || endpoint.startsWith('/auth/me');
  // Nếu là API admin mà không có token thì redirect luôn
  if (isAdminApi) {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      window.location.href = '/admin/login';
      throw new Error('Unauthorized');
    }
  }

  const maxRetries = 3;
  const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...restOptions,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });

    if (response.status === 401 && isAdminApi) {
      window.location.href = '/admin/login';
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      // Handle rate limiting
      if (response.status === 429 && retryCount < maxRetries) {
        console.warn(`Rate limited, retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return apiCall(endpoint, options, retryCount + 1);
      }

      // Handle server errors with retry
      if (response.status >= 500 && retryCount < maxRetries) {
        console.warn(`Server error ${response.status}, retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return apiCall(endpoint, options, retryCount + 1);
      }

      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || error.errors?.join(', ') || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    // Retry network errors
    if ((error instanceof TypeError || error.message.includes('fetch')) && retryCount < maxRetries) {
      console.warn(`Network error, retrying in ${retryDelay}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return apiCall(endpoint, options, retryCount + 1);
    }

    throw error;
  }
}

// Helper function for file upload API calls (multipart/form-data)
async function apiUpload<T>(endpoint: string, formData: FormData, method: string = 'POST'): Promise<T> {
  const token = localStorage.getItem('admin_token');
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || error.errors?.join(', ') || 'API Error');
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// ============ PUBLIC APIs ============

// Categories
export const getCategories = () => apiCall<ApiCategory[]>('/categories');
export const getCategory = (id: number) => apiCall<ApiCategory>(`/categories/${id}`);

// Menu Items
export const getMenuItems = (categoryId?: number) => {
  const query = categoryId ? `?category_id=${categoryId}` : '';
  return apiCall<ApiMenuItem[]>(`/menu_items${query}`);
};
export const getMenuItem = (id: number) => apiCall<ApiMenuItem>(`/menu_items/${id}`);

// Best Sellers
export const getBestSellers = () => apiCall<ApiBestSeller[]>('/best_sellers');
export const getBestSeller = (id: number) => apiCall<ApiBestSeller>(`/best_sellers/${id}`);

// Daily Specials
export const getDailySpecials = (today?: boolean) => {
  const query = today ? '?today=true' : '';
  return apiCall<ApiDailySpecial[]>(`/daily_specials${query}`);
};
export const getDailySpecial = (id: number) => apiCall<ApiDailySpecial>(`/daily_specials/${id}`);

// Rooms
export const getRooms = (date?: string, time?: string) => {
  const params = new URLSearchParams();
  if (date) params.append('date', date);
  if (time) params.append('time', time);
  const query = params.toString();
  return apiCall<ApiRoom[]>(`/rooms${query ? `?${query}` : ''}`);
};
export const getRoom = (id: number) => apiCall<ApiRoom>(`/rooms/${id}`);

// Contacts
export const submitContact = (data: ApiContact) => 
  apiCall<{ message: string; contact: ApiContact }>('/contacts', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// Bookings
export const createBookingApi = (data: ApiBooking) =>
  apiCall<{ message: string; booking: any }>('/bookings', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const checkAvailability = (roomId: number, date: string, time: string) =>
  apiCall<{ available: boolean; existing_bookings_count: number }>(
    `/bookings/check_availability?room_id=${roomId}&date=${date}&time=${time}`
  );

// ============ ADMIN APIs ============

const getAuthHeader = () => {
  const token = localStorage.getItem('admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Admin Auth
export const adminLogin = (email: string, password: string) =>
  apiCall<{ token: string; admin: { id: number; email: string; name: string; role: string } }>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }
  );

export const getAdminMe = () =>
  apiCall<{ id: number; email: string; name: string; role: string }>('/auth/me', {
    headers: getAuthHeader(),
  });

// Admin Categories
export const adminGetCategories = () =>
  apiCall<ApiCategory[]>('/admin/categories', { headers: getAuthHeader() });

export const adminCreateCategory = (data: Partial<ApiCategory>) =>
  apiCall<ApiCategory>('/admin/categories', {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify(data),
  });

export const adminUpdateCategory = (id: number, data: Partial<ApiCategory>) =>
  apiCall<ApiCategory>(`/admin/categories/${id}`, {
    method: 'PATCH',
    headers: getAuthHeader(),
    body: JSON.stringify(data),
  });

export const adminDeleteCategory = (id: number) =>
  apiCall<void>(`/admin/categories/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });

// Admin Menu Items
export const adminGetMenuItems = (categoryId?: number) => {
  const query = categoryId ? `?category_id=${categoryId}` : '';
  return apiCall<ApiMenuItem[]>(`/admin/menu_items${query}`, { headers: getAuthHeader() });
};

export const adminCreateMenuItem = (data: Partial<ApiMenuItem>) =>
  apiCall<ApiMenuItem>('/admin/menu_items', {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify(data),
  });

export const adminUpdateMenuItem = (id: number, data: Partial<ApiMenuItem>) =>
  apiCall<ApiMenuItem>(`/admin/menu_items/${id}`, {
    method: 'PATCH',
    headers: getAuthHeader(),
    body: JSON.stringify(data),
  });

export const adminDeleteMenuItem = (id: number) =>
  apiCall<void>(`/admin/menu_items/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });

export const adminExportMenuItems = async () => {
  const token = localStorage.getItem('admin_token');
  if (!token) throw new Error('Unauthorized');
  
  const response = await fetch(`${API_BASE_ORIGIN}/api/v1/admin/menu_items/export`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Export failed');
  }
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mon_an_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export const adminImportMenuItems = async (file: File) => {
  const token = localStorage.getItem('admin_token');
  if (!token) throw new Error('Unauthorized');
  
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE_ORIGIN}/api/v1/admin/menu_items/import`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Import failed');
  }
  
  return await response.json();
};

// Admin Bookings Dashboard
export const adminGetBookings = (filters?: { status?: string; date?: string; room_id?: number }) => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.date) params.append('date', filters.date);
  if (filters?.room_id) params.append('room_id', String(filters.room_id));
  const query = params.toString() ? `?${params}` : '';
  return apiCall<any[]>(`/admin/bookings${query}`, { headers: getAuthHeader() });
};

export const adminGetBookingStats = () =>
  apiCall<any>('/admin/bookings/stats', { headers: getAuthHeader() });

export const adminGetDashboard = () =>
  apiCall<any>('/admin/bookings/dashboard', { headers: getAuthHeader() });

export const adminConfirmBooking = (id: number) =>
  apiCall<any>(`/admin/bookings/${id}/confirm`, {
    method: 'PATCH',
    headers: getAuthHeader(),
  });

export const adminCancelBooking = (id: number) =>
  apiCall<any>(`/admin/bookings/${id}/cancel`, {
    method: 'PATCH',
    headers: getAuthHeader(),
  });

export const adminGetBooking = (id: number) =>
  apiCall<any>(`/admin/bookings/${id}`, { headers: getAuthHeader() });

export const adminUpdateBooking = (id: number, data: Partial<ApiBooking>) =>
  apiCall<any>(`/admin/bookings/${id}`, {
    method: 'PATCH',
    headers: getAuthHeader(),
    body: JSON.stringify(data),
  });

// Admin Contacts
export const adminGetContacts = (status?: 'read' | 'unread') => {
  const query = status ? `?status=${status}` : '';
  return apiCall<any[]>(`/admin/contacts${query}`, { headers: getAuthHeader() });
};

export const adminMarkContactRead = (id: number) =>
  apiCall<any>(`/admin/contacts/${id}/mark_read`, {
    method: 'PATCH',
    headers: getAuthHeader(),
  });

export const adminGetContactStats = () =>
  apiCall<any>('/admin/contacts/stats', { headers: getAuthHeader() });

// Admin Rooms
export const adminGetRooms = () =>
  apiCall<ApiRoom[]>('/admin/rooms', { headers: getAuthHeader() });

export const adminCreateRoom = (data: Partial<ApiRoom>) =>
  apiCall<ApiRoom>('/admin/rooms', {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify(data),
  });

export const adminUpdateRoom = (id: number, data: Partial<ApiRoom>) =>
  apiCall<ApiRoom>(`/admin/rooms/${id}`, {
    method: 'PATCH',
    headers: getAuthHeader(),
    body: JSON.stringify(data),
  });

export const adminDeleteRoom = (id: number) =>
  apiCall<void>(`/admin/rooms/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });

export const adminUpdateRoomStatus = (id: number, status: string) =>
  apiCall<ApiRoom>(`/admin/rooms/${id}/update_status`, {
    method: 'PATCH',
    headers: getAuthHeader(),
    body: JSON.stringify({ status }),
  });

export const adminGetRoomStats = () =>
  apiCall<any>('/admin/rooms/stats', { headers: getAuthHeader() });

// Upload images to room
export const adminUploadRoomImages = (roomId: number, files: File[]) => {
  const formData = new FormData();
  files.forEach(file => formData.append('images[]', file));
  return apiUpload<ApiRoom>(`/admin/rooms/${roomId}/upload_images`, formData, 'POST');
};

export const adminDeleteRoomImage = (roomId: number, imageId: number) =>
  apiCall<void>(`/admin/rooms/${roomId}/delete_image/${imageId}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });

// ============ UPLOAD APIs ============

// Upload file and get URL
export const adminUploadFile = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiUpload<{ url: string; signed_id: string; filename: string }>('/admin/uploads', formData);
};

// Upload image for menu item
export const adminUploadMenuItemImage = (id: number, file: File) => {
  const formData = new FormData();
  formData.append('image', file);
  return apiUpload<{ image_url: string; message: string }>(`/admin/menu_items/${id}/upload_image`, formData);
};

// Create menu item with image
export const adminCreateMenuItemWithImage = (data: Partial<ApiMenuItem>, image?: File) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });
  if (image) {
    formData.append('image', image);
  }
  return apiUpload<ApiMenuItem>('/admin/menu_items', formData);
};

// Update menu item with image
export const adminUpdateMenuItemWithImage = (id: number, data: Partial<ApiMenuItem>, image?: File) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });
  if (image) {
    formData.append('image', image);
  }
  return apiUpload<ApiMenuItem>(`/admin/menu_items/${id}`, formData, 'PATCH');
};

// ============ ADMIN BEST SELLERS ============
export const adminGetBestSellers = () =>
  apiCall<ApiBestSeller[]>('/admin/best_sellers', { headers: getAuthHeader() });

export const adminCreateBestSeller = (data: { menu_item_id: number; title?: string; content?: string; position?: number; pinned?: boolean; highlighted?: boolean; active?: boolean }) =>
  apiCall<ApiBestSeller>('/admin/best_sellers', {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify(data),
  });

export const adminUpdateBestSeller = (id: number, data: Partial<{ menu_item_id: number; title?: string; content?: string; position?: number; pinned?: boolean; highlighted?: boolean; active?: boolean }>) =>
  apiCall<ApiBestSeller>(`/admin/best_sellers/${id}`, {
    method: 'PATCH',
    headers: getAuthHeader(),
    body: JSON.stringify(data),
  });

export const adminDeleteBestSeller = (id: number) =>
  apiCall<void>(`/admin/best_sellers/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });

export const adminToggleBestSellerPin = (id: number) =>
  apiCall<ApiBestSeller>(`/admin/best_sellers/${id}/toggle_pin`, {
    method: 'PATCH',
    headers: getAuthHeader(),
  });

export const adminToggleBestSellerHighlight = (id: number) =>
  apiCall<ApiBestSeller>(`/admin/best_sellers/${id}/toggle_highlight`, {
    method: 'PATCH',
    headers: getAuthHeader(),
  });

export const adminUploadBestSellerImages = (id: number, files: File[]) => {
  const formData = new FormData();
  files.forEach(file => formData.append('images[]', file));
  return apiUpload<ApiBestSeller>(`/admin/best_sellers/${id}/upload_images`, formData, 'POST');
};

export const adminDeleteBestSellerImage = (id: number, imageId: number) =>
  apiCall<ApiBestSeller>(`/admin/best_sellers/${id}/delete_image/${imageId}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });

// ============ ADMIN DAILY SPECIALS ============
export const adminGetDailySpecials = (date?: string) => {
  const query = date ? `?date=${date}` : '';
  return apiCall<ApiDailySpecial[]>(`/admin/daily_specials${query}`, { headers: getAuthHeader() });
};

export const adminCreateDailySpecial = (data: { menu_item_id: number; title?: string; content?: string; special_date?: string; pinned?: boolean; highlighted?: boolean; active?: boolean }) =>
  apiCall<ApiDailySpecial>('/admin/daily_specials', {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify(data),
  });

export const adminUpdateDailySpecial = (id: number, data: Partial<{ menu_item_id: number; title?: string; content?: string; special_date?: string; pinned?: boolean; highlighted?: boolean; active?: boolean }>) =>
  apiCall<ApiDailySpecial>(`/admin/daily_specials/${id}`, {
    method: 'PATCH',
    headers: getAuthHeader(),
    body: JSON.stringify(data),
  });

export const adminDeleteDailySpecial = (id: number) =>
  apiCall<void>(`/admin/daily_specials/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });

export const adminToggleDailySpecialPin = (id: number) =>
  apiCall<ApiDailySpecial>(`/admin/daily_specials/${id}/toggle_pin`, {
    method: 'PATCH',
    headers: getAuthHeader(),
  });

export const adminToggleDailySpecialHighlight = (id: number) =>
  apiCall<ApiDailySpecial>(`/admin/daily_specials/${id}/toggle_highlight`, {
    method: 'PATCH',
    headers: getAuthHeader(),
  });

export const adminUploadDailySpecialImages = (id: number, files: File[]) => {
  const formData = new FormData();
  files.forEach(file => formData.append('images[]', file));
  return apiUpload<ApiDailySpecial>(`/admin/daily_specials/${id}/upload_images`, formData, 'POST');
};

export const adminDeleteDailySpecialImage = (id: number, imageId: number) =>
  apiCall<ApiDailySpecial>(`/admin/daily_specials/${id}/delete_image/${imageId}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });
