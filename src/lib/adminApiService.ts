import { api } from '@/api/axios.config';

// ========== ADMIN TYPES ==========

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin';
  accountStatus: 'active' | 'suspended';
  createdAt: string;
  lastLogin: string | null;
}

export interface DashboardStats {
  totalBusinesses: number;
  totalUsers: number;
  totalVenues: number;
  totalBookings: number;
  pendingBusinesses: number;
  activeUsers: number;
  recentBusinesses: Array<{
    id: string;
    businessName: string;
    ownerName: string;
    businessType: string;
    verificationStatus: string;
    createdAt: string;
  }>;
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    accountStatus: string;
    createdAt: string;
  }>;
}

export interface BusinessListItem {
  id: string;
  email: string;
  businessName: string;
  ownerName: string;
  phone: string;
  businessType: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  accountStatus: 'active' | 'suspended' | 'pending_verification';
  subscriptionTier: string;
  createdAt: string;
}

export interface BusinessListResponse {
  businesses: BusinessListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserListItem {
  id: string;
  email: string;
  name: string;
  phone: string;
  accountStatus: 'active' | 'suspended' | 'pending_verification';
  createdAt: string;
  lastLogin: string | null;
}

export interface UserListResponse {
  users: UserListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserDetails extends UserListItem {
  countryCode: string;
  avatar: string | null;
  location: {
    lat: number;
    lng: number;
    address: string;
  } | null;
  preferences: {
    categories: string[];
    priceRange: string;
  };
  emailVerified: boolean;
  phoneVerified: boolean;
  marketingConsent: boolean;
}

export interface PassConfiguration {
  id: string;
  name: string;
  description: string | null;
  passType: 'daily' | 'weekly' | 'monthly' | 'custom';
  durationDays: number;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsData {
  bookingsByType: Array<{
    type: string;
    count: number;
  }>;
  venueDistribution: Array<{
    type: string;
    count: number;
  }>;
  revenueByType: Array<{
    type: string;
    revenue: number;
  }>;
}

export interface PlatformSettings {
  [key: string]: any;
}

// ========== ADMIN AUTH ==========

export const adminLogin = async (
  email: string,
  password: string
): Promise<{ admin: AdminUser; accessToken: string; refreshToken: string }> => {
  const result = await api.post<{
    success: boolean;
    data: {
      admin: AdminUser;
      accessToken: string;
      refreshToken: string;
    };
  }>('/admin/auth/login', { email, password });

  // Store tokens
  if (result.data.accessToken) {
    localStorage.setItem('accessToken', result.data.accessToken);
    localStorage.setItem('refreshToken', result.data.refreshToken);
  }

  return result.data;
};

// ========== DASHBOARD ==========

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const result = await api.get<DashboardStats>('/admin/dashboard/stats');
  return result;
};

// ========== BUSINESS MANAGEMENT ==========

export const getBusinesses = async (filters: {
  search?: string;
  businessType?: string;
  verificationStatus?: string;
  accountStatus?: string;
  page?: number;
  limit?: number;
} = {}): Promise<BusinessListResponse> => {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.businessType) params.append('businessType', filters.businessType);
  if (filters.verificationStatus) params.append('verificationStatus', filters.verificationStatus);
  if (filters.accountStatus) params.append('accountStatus', filters.accountStatus);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());

  const result = await api.get<BusinessListResponse>(`/admin/businesses?${params.toString()}`);
  return result;
};

export const verifyBusiness = async (businessId: string): Promise<void> => {
  await api.post(`/admin/businesses/${businessId}/verify`);
};

export const suspendBusiness = async (businessId: string, suspend: boolean): Promise<void> => {
  await api.post(`/admin/businesses/${businessId}/suspend`, { suspend });
};

export const deleteBusiness = async (businessId: string): Promise<void> => {
  await api.delete(`/admin/businesses/${businessId}`);
};

// ========== USER MANAGEMENT ==========

export const getUsers = async (filters: {
  search?: string;
  accountStatus?: string;
  page?: number;
  limit?: number;
} = {}): Promise<UserListResponse> => {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.accountStatus) params.append('accountStatus', filters.accountStatus);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());

  const result = await api.get<UserListResponse>(`/admin/users?${params.toString()}`);
  return result;
};

export const getUserDetails = async (userId: string): Promise<UserDetails> => {
  const result = await api.get<UserDetails>(`/admin/users/${userId}`);
  return result;
};

export const suspendUser = async (userId: string, suspend: boolean): Promise<void> => {
  await api.post(`/admin/users/${userId}/suspend`, { suspend });
};

// ========== PASS CONFIGURATION ==========

export const getPassConfigurations = async (): Promise<PassConfiguration[]> => {
  const result = await api.get<PassConfiguration[]>('/admin/passes');
  return result;
};

export const createPassConfiguration = async (data: {
  name: string;
  description?: string;
  passType: 'daily' | 'weekly' | 'monthly' | 'custom';
  durationDays: number;
  price: number;
}): Promise<PassConfiguration> => {
  const result = await api.post<PassConfiguration>('/admin/passes', data);
  return result;
};

export const updatePassConfiguration = async (
  id: string,
  data: {
    name?: string;
    description?: string;
    passType?: 'daily' | 'weekly' | 'monthly' | 'custom';
    durationDays?: number;
    price?: number;
    isActive?: boolean;
  }
): Promise<PassConfiguration> => {
  const result = await api.patch<PassConfiguration>(`/admin/passes/${id}`, data);
  return result;
};

export const deletePassConfiguration = async (id: string): Promise<void> => {
  await api.delete(`/admin/passes/${id}`);
};

export interface BusinessPass {
  businessId: string;
  businessName: string;
  ownerName: string;
  businessType: string;
  dailyPass: {
    enabled: boolean;
    price: number;
  };
  weeklyPass: {
    enabled: boolean;
    price: number;
  };
  monthlyPass: {
    enabled: boolean;
    price: number;
  };
  verificationStatus: 'pending' | 'verified' | 'rejected';
  accountStatus: 'active' | 'suspended' | 'pending_verification';
  createdAt: string;
}

export const getBusinessPasses = async (): Promise<BusinessPass[]> => {
  const result = await api.get<BusinessPass[]>('/admin/passes/businesses');
  return result;
};

export const updateBusinessPassPrices = async (data: {
  businessId: string;
  passType: 'daily' | 'weekly' | 'monthly';
  price: number;
  enabled: boolean;
}): Promise<BusinessPass> => {
  const result = await api.patch<BusinessPass>('/admin/passes/businesses', data);
  return result;
};

// ========== ANALYTICS ==========

export const getAnalytics = async (period: 'week' | 'month' | 'year' = 'month'): Promise<AnalyticsData> => {
  const result = await api.get<AnalyticsData>(`/admin/analytics?period=${period}`);
  return result;
};

// ========== PLATFORM SETTINGS ==========

export const getPlatformSettings = async (): Promise<PlatformSettings> => {
  const result = await api.get<PlatformSettings>('/admin/settings');
  return result;
};

export const updatePlatformSetting = async (
  key: string,
  value: any,
  description?: string
): Promise<void> => {
  await api.patch(`/admin/settings/${key}`, { value, description });
};
