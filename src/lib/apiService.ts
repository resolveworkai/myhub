import type { User, BusinessUser, AuthUser } from '@/store/authStore';
import { api } from '@/api/axios.config';

class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public requiresVerification?: boolean
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Check if email exists
export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    const result = await api.get<{ exists: boolean }>(
      `/auth/check-email?email=${encodeURIComponent(email)}`
    );
    return result.exists;
  } catch (error) {
    console.error('Check email error:', error);
    return false;
  }
};

// Check if phone exists
export const checkPhoneExists = async (phone: string): Promise<boolean> => {
  try {
    const result = await api.get<{ exists: boolean }>(
      `/auth/check-phone?phone=${encodeURIComponent(phone)}`
    );
    return result.exists;
  } catch (error) {
    console.error('Check phone error:', error);
    return false;
  }
};

// Register normal user
export const registerUser = async (userData: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  location?: { lat: number; lng: number; address: string };
  categories: string[];
  marketingConsent: boolean;
}): Promise<{ success: boolean; user?: User; error?: string }> => {
  try {
    const result = await api.post<{ userId: string; email: string }>(
      '/auth/member/signup',
      {
        fullName: userData.fullName,
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
        confirmPassword: userData.password,
        location: userData.location,
        categories: userData.categories,
        marketingConsent: userData.marketingConsent,
        acceptTerms: true,
        acceptPrivacy: true,
      }
    );

    // Transform backend response to frontend User type
    const user: User = {
      id: result.userId,
      email: result.email,
      name: userData.fullName,
      phone: userData.phone,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.fullName)}&background=random`,
      joinDate: new Date().toISOString().split('T')[0],
      location: userData.location || { lat: 25.2048, lng: 55.2708, address: 'Dubai, UAE' },
      favorites: [],
      bookings: [],
      preferences: {
        categories: userData.categories,
        priceRange: '$$',
      },
      accountType: 'normal',
      emailVerified: false,
      phoneVerified: false,
      marketingConsent: userData.marketingConsent,
      lastLogin: null,
      accountStatus: 'active',
      failedLoginAttempts: 0,
      lockedUntil: null,
    };

    return { success: true, user };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Failed to create account' 
    };
  }
};

// Register business user
export const registerBusinessUser = async (userData: {
  businessName: string;
  businessType: 'gym' | 'coaching' | 'library';
  registrationNumber: string;
  yearsInOperation: string;
  ownerName: string;
  email: string;
  phone: string;
  website?: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    lat?: number;
    lng?: number;
  };
  numberOfLocations: string;
  totalCapacity: number;
  serviceAreas: string;
  specialties: string[];
  password: string;
  accountManagerEmail?: string;
  subscriptionTier: 'starter' | 'growth' | 'enterprise';
}): Promise<{ success: boolean; user?: BusinessUser; error?: string }> => {
  try {
    const result = await api.post<{ userId: string; email: string }>(
      '/auth/business/signup',
      {
        businessName: userData.businessName,
        businessType: userData.businessType,
        registrationNumber: userData.registrationNumber,
        yearsInOperation: userData.yearsInOperation,
        ownerName: userData.ownerName,
        email: userData.email,
        phone: userData.phone,
        website: userData.website,
        address: userData.address,
        numberOfLocations: userData.numberOfLocations,
        totalCapacity: userData.totalCapacity,
        specialties: userData.specialties,
        serviceAreas: userData.serviceAreas,
        password: userData.password,
        confirmPassword: userData.password,
        accountManagerEmail: userData.accountManagerEmail,
        subscriptionTier: userData.subscriptionTier,
        acceptTerms: true,
        acceptPrivacy: true,
        verificationConsent: true,
      }
    );

    // Transform backend response to frontend BusinessUser type
    const businessUser: BusinessUser = {
      id: result.userId,
      email: result.email,
      businessName: userData.businessName,
      ownerName: userData.ownerName,
      phone: userData.phone,
      businessType: userData.businessType,
      registrationNumber: userData.registrationNumber,
      yearsInOperation: userData.yearsInOperation,
      numberOfLocations: userData.numberOfLocations,
      totalCapacity: userData.totalCapacity,
      serviceAreas: userData.serviceAreas,
      specialties: userData.specialties,
      address: {
        street: userData.address.street,
        city: userData.address.city,
        state: userData.address.state,
        postalCode: userData.address.postalCode,
        country: userData.address.country,
        lat: userData.address.lat,
        lng: userData.address.lng,
      },
      website: userData.website,
      accountManagerEmail: userData.accountManagerEmail,
      subscriptionTier: userData.subscriptionTier,
      subscriptionStatus: 'active',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.businessName)}&background=random`,
      accountType: 'business',
      emailVerified: false,
      phoneVerified: false,
      businessVerified: false,
      verificationStatus: 'pending',
      accountStatus: 'pending_verification',
      lastLogin: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      locations: [],
      staffMembers: [],
      totalRevenue: 0,
      isPublished: false,
      dailyPackagePrice: 299,
      weeklyPackagePrice: 1499,
      monthlyPackagePrice: 4999,
    };

    return { success: true, user: businessUser };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Failed to create account' 
    };
  }
};

// Password Reset
export const requestPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
  try {
    await api.post('/auth/forgot-password', { email });
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error?.message || 'Failed to send reset code',
    };
  }
};

export const verifyResetOTP = async (email: string, otp: string): Promise<{ success: boolean; error?: string }> => {
  try {
    await api.post('/auth/verify-reset-otp', { email, otp });
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error?.message || 'Invalid verification code',
    };
  }
};

export const resetPassword = async (email: string, otp: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
  try {
    await api.post('/auth/reset-password', {
      email,
      otp,
      newPassword,
      confirmPassword: newPassword,
    });
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error?.message || 'Failed to reset password',
    };
  }
};

// Login
export const login = async (
  identifier: string,
  password: string
): Promise<{ success: boolean; user?: AuthUser; error?: string; requiresVerification?: boolean }> => {
  try {
    const result = await api.post<{
      user: any;
      tokens: { accessToken: string; refreshToken: string };
    }>(
      '/auth/login',
      {
        identifier,
        password,
        rememberMe: false,
      }
    );

    // Transform backend user to frontend AuthUser type
    let user: AuthUser;
    
    if (result.user.account_type === 'admin') {
      // Admin user - minimal structure
      user = {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        accountType: 'admin',
        emailVerified: true,
        phoneVerified: false,
        marketingConsent: false,
        lastLogin: result.user.last_login,
        accountStatus: result.user.account_status,
        failedLoginAttempts: 0,
        lockedUntil: null,
        // Required fields for AuthUser type
        phone: '',
        avatar: '',
        joinDate: result.user.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        location: { lat: 0, lng: 0, address: '' },
        favorites: [],
        bookings: [],
        preferences: { categories: [], priceRange: '$$' },
      };
    } else if (result.user.account_type === 'user') {
      user = {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        phone: result.user.phone,
        avatar: result.user.avatar,
        joinDate: result.user.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        location: {
          lat: result.user.location_lat || 25.2048,
          lng: result.user.location_lng || 55.2708,
          address: result.user.location_address || '',
        },
        favorites: [],
        bookings: [],
        preferences: {
          categories: result.user.preferences_categories || [],
          priceRange: result.user.preferences_price_range || '$$',
        },
        accountType: 'normal',
        emailVerified: result.user.email_verified,
        phoneVerified: result.user.phone_verified,
        marketingConsent: result.user.marketing_consent,
        lastLogin: result.user.last_login,
        accountStatus: result.user.account_status,
        failedLoginAttempts: result.user.failed_login_attempts,
        lockedUntil: result.user.locked_until,
      };
    } else {
      user = {
        id: result.user.id,
        email: result.user.email,
        businessName: result.user.business_name,
        ownerName: result.user.owner_name,
        phone: result.user.phone,
        businessType: result.user.business_type,
        registrationNumber: result.user.registration_number,
        yearsInOperation: result.user.years_in_operation,
        numberOfLocations: result.user.number_of_locations,
        totalCapacity: result.user.total_capacity,
        serviceAreas: result.user.service_areas,
        specialties: result.user.specialties || [],
        address: {
          street: result.user.address_street,
          city: result.user.address_city,
          state: result.user.address_state,
          postalCode: result.user.address_postal_code,
          country: result.user.address_country,
          lat: result.user.address_lat,
          lng: result.user.address_lng,
        },
        website: result.user.website,
        accountManagerEmail: result.user.account_manager_email,
        subscriptionTier: result.user.subscription_tier,
        subscriptionStatus: result.user.subscription_status,
        avatar: result.user.avatar,
        accountType: 'business',
        emailVerified: result.user.email_verified,
        phoneVerified: result.user.phone_verified,
        businessVerified: result.user.business_verified,
        verificationStatus: result.user.verification_status,
        accountStatus: result.user.account_status,
        lastLogin: result.user.last_login,
        failedLoginAttempts: result.user.failed_login_attempts,
        lockedUntil: result.user.locked_until,
        locations: [],
        staffMembers: [],
        totalRevenue: result.user.total_revenue || 0,
        isPublished: result.user.is_published,
        dailyPackagePrice: result.user.daily_package_price || 299,
        weeklyPackagePrice: result.user.weekly_package_price || 1499,
        monthlyPackagePrice: result.user.monthly_package_price || 4999,
      };
    }

    // Store tokens
    if (result.tokens) {
      localStorage.setItem('accessToken', result.tokens.accessToken);
      localStorage.setItem('refreshToken', result.tokens.refreshToken);
    }

    return { success: true, user };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Login failed',
      requiresVerification: error.requiresVerification,
    };
  }
};

// Verify OTP
export const verifyOTP = async (
  email: string,
  otp: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await api.post('/auth/verify-email', { email, otp });
    return { success: true };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Verification failed' 
    };
  }
};

// Resend OTP
export const resendOTP = async (email: string): Promise<{ success: boolean; error?: string }> => {
  try {
    await api.post('/auth/resend-otp', { email });
    return { success: true };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Failed to resend code' 
    };
  }
};

// ========== VENUE API ==========

export interface Venue {
  id: string;
  name: string;
  category: 'gym' | 'coaching' | 'library';
  description: string;
  image: string;
  rating: number;
  reviews: number;
  price: number;
  priceLabel: string;
  location: {
    lat: number;
    lng: number;
    address: string;
    city: string;
  };
  amenities: string[];
  status: 'available' | 'filling' | 'full';
  occupancy: number;
  capacity: number;
  verified: boolean;
  openNow: boolean;
  distance?: number;
}

export interface VenueFilters {
  category?: 'gym' | 'coaching' | 'library' | 'all';
  city?: string;
  minRating?: number;
  priceRange?: '$' | '$$' | '$$$';
  radius?: number;
  userLat?: number;
  userLng?: number;
  search?: string;
  amenities?: string[];
  status?: string;
  page?: number;
  limit?: number;
}

// List venues
export const listVenues = async (filters: VenueFilters = {}): Promise<{
  venues: Venue[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> => {
  const params = new URLSearchParams();
  if (filters.category) params.append('category', filters.category);
  if (filters.city) params.append('city', filters.city);
  if (filters.minRating) params.append('minRating', filters.minRating.toString());
  if (filters.priceRange) params.append('priceRange', filters.priceRange);
  if (filters.radius) params.append('radius', filters.radius.toString());
  if (filters.userLat) params.append('userLat', filters.userLat.toString());
  if (filters.userLng) params.append('userLng', filters.userLng.toString());
  if (filters.search) params.append('search', filters.search);
  if (filters.amenities) params.append('amenities', filters.amenities.join(','));
  if (filters.status) params.append('status', filters.status);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());

  const result = await api.get<{ venues: Venue[]; pagination: any }>(
    `/venues?${params.toString()}`
  );
  return result;
};

// Get venue by ID
export const getVenueById = async (id: string): Promise<Venue> => {
  const result = await api.get<Venue>(`/venues/${id}`);
  return result;
};

// Get venue schedule
export const getVenueSchedule = async (venueId: string, date?: string): Promise<{ date: string; timeSlot: string; totalSlots: number; bookedSlots: number; availableSlots: number }[]> => {
  const params = date ? `?date=${date}` : '';
  const result = await api.get<{ date: string; timeSlot: string; totalSlots: number; bookedSlots: number; availableSlots: number }[]>(`/venues/${venueId}/schedule${params}`);
  return result;
};

// Get venue reviews
export const getVenueReviews = async (
  venueId: string,
  page: number = 1,
  limit: number = 10
): Promise<{ reviews: { id: string; userId: string; venueId: string; rating: number; comment: string; createdAt: string; userName?: string; userAvatar?: string }[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
  const result = await api.get<{ reviews: { id: string; userId: string; venueId: string; rating: number; comment: string; createdAt: string; userName?: string; userAvatar?: string }[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
    `/venues/${venueId}/reviews?page=${page}&limit=${limit}`
  );
  return result;
};

// Check venue availability
export const checkVenueAvailability = async (
  venueId: string,
  date: string,
  time: string
): Promise<{ available: boolean; availableSlots: number; totalSlots: number; status: string }> => {
  const result = await api.get<{ available: boolean; availableSlots: number; totalSlots: number; status: string }>(
    `/venues/${venueId}/availability?date=${date}&time=${time}`
  );
  return result;
};

// ========== BOOKING API ==========

export interface Booking {
  id: string;
  userId: string;
  venueId: string;
  venueType: 'gym' | 'coaching' | 'library';
  date: string;
  time: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  totalPrice: number;
  attendees: number;
  specialRequests?: string;
  venueName?: string;
  venueImage?: string;
}

// Create booking
export const createBooking = async (bookingData: {
  venueId: string;
  date: string;
  time: string;
  duration?: number;
  attendees?: number;
  specialRequests?: string;
  bookingType?: 'one_time' | 'monthly' | 'membership';
}): Promise<Booking> => {
  const result = await api.post<Booking>('/bookings', bookingData);
  return result;
};

// Get user bookings
// ========== USER DASHBOARD ==========

export interface UserDashboardData {
  todaySchedule: Array<{
    id: string;
    businessName: string;
    businessId: string;
    venueName: string;
    venueImage: string;
    date: string;
    time: string;
    duration: number;
    status: string;
    type: string;
    address: string;
  }>;
  pendingFees: Array<{
    id: string;
    businessName: string;
    businessId: string;
    venueName: string;
    amount: number;
    status: string;
    dueDate: string;
    feeType: string;
    createdAt: string;
  }>;
  enrollments: Array<{
    id: string;
    businessId: string;
    businessName: string;
    businessType: string;
    venueId: string;
    venueName: string;
    venueImage: string;
    category: string;
    membershipType: string;
    startDate: string;
    endDate: string;
    price: number;
    status: string;
    autoRenew: boolean;
    expiresIn: number;
  }>;
  stats: {
    totalVisits: number;
    upcomingToday: number;
    pendingFees: number;
    activeEnrollments: number;
  };
}

export const getUserDashboard = async (): Promise<UserDashboardData> => {
  const result = await api.get<UserDashboardData>('/users/me/dashboard');
  return result;
};

export const getUserBookings = async (filters: {
  status?: string;
  page?: number;
  limit?: number;
} = {}): Promise<{ bookings: Booking[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());

  const result = await api.get<{ bookings: Booking[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
    `/bookings?${params.toString()}`
  );
  return result;
};

// Get business bookings
export const getBusinessBookings = async (filters: {
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'all';
  date?: string;
  page?: number;
  limit?: number;
} = {}): Promise<{ bookings: Booking[]; pagination: any }> => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.date) params.append('date', filters.date);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());

  const result = await api.get<{ bookings: Booking[]; pagination: { page: number; limit: number; total: number; totalPages: number }}>(
    `/bookings/business/all?${params.toString()}`
  );
  return result || { bookings: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
};

// Update booking status (for business users)
export const updateBookingStatus = async (bookingId: string, status: string): Promise<Booking> => {
  const result = await api.patch<{ success: boolean; data: Booking }>(`/bookings/business/${bookingId}/status`, { status });
  return result.data;
};

// Create business appointment
export const createBusinessAppointment = async (data: {
  userName: string;
  userEmail?: string;
  userPhone?: string;
  venueId: string;
  date: string;
  time: string;
  duration: number;
  attendees?: number;
  specialRequests?: string;
}): Promise<Booking> => {
  const result = await api.post<{ success: boolean; data: Booking }>('/bookings/business', data);
  return result.data;
};

// Get booking by ID
export const getBookingById = async (bookingId: string): Promise<Booking> => {
  const result = await api.get<Booking>(`/bookings/${bookingId}`);
  return result;
};

// Update booking
export const updateBooking = async (
  bookingId: string,
  updates: {
    date?: string;
    time?: string;
    duration?: number;
    attendees?: number;
    specialRequests?: string;
  }
): Promise<Booking> => {
  const result = await api.patch<Booking>(`/bookings/${bookingId}`, updates);
  return result;
};

// Cancel booking
export const cancelBooking = async (bookingId: string, reason?: string): Promise<void> => {
  await api.delete(`/bookings/${bookingId}`, { data: { reason } });
};

// ========== REVIEW API ==========

export interface Review {
  id: string;
  userId: string;
  venueId: string;
  rating: number;
  comment: string;
  helpfulCount: number;
  businessReply?: string;
  businessReplyDate?: string;
  date: string;
  userName?: string;
  userAvatar?: string;
}

// Create review
export const createReview = async (reviewData: {
  venueId: string;
  bookingId?: string;
  rating: number;
  comment: string;
}): Promise<Review> => {
  const result = await api.post<Review>('/reviews', reviewData);
  return result;
};

// Update review
export const updateReview = async (
  reviewId: string,
  updates: { rating?: number; comment?: string }
): Promise<Review> => {
  const result = await api.patch<Review>(`/reviews/${reviewId}`, updates);
  return result;
};

// Delete review
export const deleteReview = async (reviewId: string): Promise<void> => {
  await api.delete(`/reviews/${reviewId}`);
};

// Add business reply
export const addBusinessReply = async (
  reviewId: string,
  reply: string
): Promise<Review> => {
  const result = await api.post<Review>(`/reviews/${reviewId}/reply`, { reply });
  return result;
};

// ========== USER API ==========

// Get current user
export const getCurrentUser = async (): Promise<User> => {
  const result = await api.get<User>('/users/me');
  return result;
};

// Update user profile
export const updateUserProfile = async (updates: {
  name?: string;
  phone?: string;
  location?: { lat: number; lng: number; address: string };
  preferences?: { categories?: string[]; priceRange?: string };
  marketingConsent?: boolean;
  avatar?: string;
}): Promise<User> => {
  const result = await api.patch<User>('/users/me', updates);
  return result;
};

// Get user favorites
export const getUserFavorites = async (): Promise<Venue[]> => {
  const result = await api.get<Venue[]>('/users/me/favorites');
  return result;
};

// Add favorite
export const addFavorite = async (venueId: string): Promise<void> => {
  await api.post(`/users/me/favorites/${venueId}`);
};

// Remove favorite
export const removeFavorite = async (venueId: string): Promise<void> => {
  await api.delete(`/users/me/favorites/${venueId}`);
};

// Get user payments
export const getUserPayments = async (page: number = 1, limit: number = 20): Promise<{
  payments: any[];
  pagination: any;
}> => {
  const result = await api.get<{ payments: any[]; pagination: any }>(
    `/users/me/payments?page=${page}&limit=${limit}`
  );
  return result;
};

// Change password
export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  await api.post('/users/me/change-password', { currentPassword, newPassword });
};

// ========== BUSINESS API ==========

// Get business profile
export const getBusinessProfile = async (): Promise<BusinessUser> => {
  const result = await api.get<BusinessUser>('/business/me');
  return result;
};

// Update business profile
export const updateBusinessProfile = async (updates: {
  businessName?: string;
  ownerName?: string;
  phone?: string;
  website?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    lat?: number;
    lng?: number;
  };
  specialties?: string[];
  serviceAreas?: string;
  dailyPackagePrice?: number;
  weeklyPackagePrice?: number;
  monthlyPackagePrice?: number;
}): Promise<BusinessUser> => {
  const result = await api.patch<BusinessUser>('/business/me', updates);
  return result;
};

// Business Member Types
export type MembershipStatus = 'active' | 'expired' | 'cancelled' | 'overdue';
export type MembershipType = 'daily' | 'weekly' | 'monthly';

export interface BusinessMember {
  id: string;
  userId: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  assignedAt: string;
  membershipStatus: MembershipStatus;
  membershipEndDate: string;
  membershipType: MembershipType;
  price: number;
  startDate: string;
  status: MembershipStatus;
  notes: string | null;
}

export interface BusinessMembersPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BusinessMembersResponse {
  members: BusinessMember[];
  pagination: BusinessMembersPagination;
}

export interface BusinessMembersFilters {
  search?: string;
  status?: MembershipStatus;
  type?: MembershipType;
}

// Get business members
export const getBusinessMembers = async (
  page: number = 1,
  limit: number = 20,
  filters?: BusinessMembersFilters
): Promise<BusinessMembersResponse> => {
  const query = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(filters?.search && { search: filters.search }),
    ...(filters?.status && { status: filters.status }),
    ...(filters?.type && { type: filters.type }),
  });

  const result = await api.get<BusinessMembersResponse>(
    `/business/members?${query}`
  );
  return result;
};

// Add business member with membership
export const addBusinessMember = async (data: {
  userName: string;
  userEmail?: string;
  userPhone?: string;
  membershipType: 'daily' | 'weekly' | 'monthly';
  price: number;
  notes?: string;
}): Promise<{ userId: string; membershipId: string }> => {
  const result = await api.post<{ userId: string; membershipId: string }>('/business/members', data);
  return result;
};

// Cancel membership
export const cancelMembership = async (membershipId: string, reason?: string): Promise<void> => {
  await api.delete(`/business/memberships/${membershipId}`, { data: { reason } });
};

// Renew membership
export const renewMembership = async (
  memberId: string,
  renewalPrice: number,
  membershipType: MembershipType
): Promise<{
  memberId: string;
  newEndDate: string;
  newStatus: string;
  paymentId: string;
  paymentAmount: number;
  membershipType: MembershipType;
  membershipPrice: number;
}> => {
  const result = await api.post<{
    success: boolean;
    message: string;
    data: {
      memberId: string;
      newEndDate: string;
      newStatus: string;
      paymentId: string;
      paymentAmount: number;
      membershipType: MembershipType;
      membershipPrice: number;
    };
  }>(`/business/memberships/${memberId}/renew`, {
    renewalPrice,
    membershipType,
  });
  return result.data;
};

// Get dashboard stats
export const getBusinessDashboardStats = async (): Promise<{
  totalMembers: number;
  revenueThisMonth: number;
  appointmentsToday: number;
  pendingPayments: number;
}> => {
  const result = await api.get<any>('/business/dashboard/stats');
  return result;
};

// Get business analytics
export const getBusinessAnalytics = async (period: 'week' | 'month' | 'year' = 'month'): Promise<{
  bookings: { total: number; revenue: number };
  members: { total: number };
  venues: { total: number };
  reviews: { averageRating: number; total: number };
  occupancy: { average: number };
}> => {
  const result = await api.get<any>(`/business/analytics?period=${period}`);
  return result;
};

// Send announcement
export const sendAnnouncement = async (data: {
  title: string;
  message: string;
  memberIds?: string[];
}): Promise<void> => {
  await api.post('/business/announcements', data);
};

// Business Settings API
export const updateBusinessInfo = async (data: {
  businessName?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  description?: string;
}): Promise<BusinessUser> => {
  const result = await api.patch<BusinessUser>('/business/settings/business-info', data);
  return result;
};

export const updateLocationAndMedia = async (data: {
  lat?: number;
  lng?: number;
  logo?: string;
  coverImage?: string;
  galleryImages?: string[];
}): Promise<BusinessUser> => {
  const result = await api.patch< BusinessUser>('/business/settings/location-media', data);
  return result;
};

export const updateBusinessAttributes = async (attributes: Record<string, any>): Promise<BusinessUser> => {
  const result = await api.patch<BusinessUser>('/business/settings/attributes', attributes);
  return result;
};

export const updatePricing = async (data: {
  dailyPackagePrice?: number;
  weeklyPackagePrice?: number;
  monthlyPackagePrice?: number;
}): Promise<BusinessUser> => {
  const result = await api.patch<BusinessUser>('/business/settings/pricing', data);
  return result;
};

export const updateOperatingHours = async (operatingHours: Record<string, any>): Promise<BusinessUser> => {
  const result = await api.patch<BusinessUser >('/business/settings/operating-hours', operatingHours);
  return result;
};

export const updateNotificationPreferences = async (preferences: {
  emailBookings?: boolean;
  emailPayments?: boolean;
  emailReminders?: boolean;
  smsBookings?: boolean;
  smsPayments?: boolean;
  pushNotifications?: boolean;
}): Promise<BusinessUser> => {
  const result = await api.patch<BusinessUser>('/business/settings/notifications', preferences);
  return result;
};

export const updateSecuritySettings = async (settings: {
  twoFactor?: boolean;
  sessionTimeout?: string;
}): Promise<BusinessUser> => {
  const result = await api.patch<BusinessUser>('/business/settings/security', settings);
  return result;
};

export const togglePublishStatus = async (isPublished: boolean): Promise<BusinessUser> => {
  const result = await api.patch<{ data: BusinessUser }>('/business/settings/publish', { isPublished });
  return result.data;
};

export const changeBusinessPassword = async (
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  await api.post('/business/change-password', { currentPassword, newPassword });
};

// Get business venue ID
export const getBusinessVenueId = async (): Promise<string | null> => {
  const result = await api.get<{ success: boolean; data: { venueId: string | null } }>('/business/venue-id');
  return result.data?.venueId || null;
};

// Get business payments
export const getBusinessPayments = async (filters: {
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
} = {}): Promise<{ payments: any[]; pagination: any }> => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.type) params.append('type', filters.type);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());

  const result = await api.get<{ payments: any[]; pagination: any }>(
    `/payments/business?${params.toString()}`
  );
  return result;
};

// Create payment
export const createPayment = async (data: {
  userId?: string;
  amount: number;
  type: string;
  paymentMethod?: string;
  dueDate?: string;
  notes?: string;
  memberName?: string;
  memberEmail?: string;
  memberPhone?: string;
}): Promise<any> => {
  const result = await api.post<{ success: boolean; data: any }>('/payments/business', data);
  return result.data;
};

// Update payment status
export const updatePaymentStatus = async (paymentId: string, status: string, paymentMethod?: string): Promise<any> => {
  const result = await api.patch<{ data: any }>(`/payments/business/${paymentId}/status`, { status, paymentMethod });  
  return result.data;
};

// Get business payment stats
export const getBusinessPaymentStats = async (): Promise<{
  totalRevenue: number;
  pendingDues: number;
  paidThisMonth: number;
  overdue: number;
}> => {
  const result = await api.get<{
  totalRevenue: number;
  pendingDues: number;
  paidThisMonth: number;
  overdue: number;
}>('/payments/business/stats');
  return result;
};

// ========== NOTIFICATION API ==========

export interface Notification {
  id: string;
  userId: string;
  userType: 'normal' | 'business';
  type: string;
  title: string;
  message: string;
  relatedEntity: any;
  actionUrl: string;
  actionLabel: string;
  priority: 'high' | 'medium' | 'low';
  read: boolean;
  deliveryChannels: string[];
  deliveryStatus: any;
  createdAt: string;
  readAt?: string;
}

// Get notifications
export const getNotifications = async (filters: {
  read?: boolean;
  page?: number;
  limit?: number;
} = {}): Promise<{
  notifications: Notification[];
  pagination: any;
  unreadCount?: number;
}> => {
  const params = new URLSearchParams();
  if (filters.read !== undefined) params.append('read', filters.read.toString());
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());

  const result = await api.get<{
    notifications: Notification[];
    pagination: any;
    unreadCount?: number;
  }>(`/notifications?${params.toString()}`);
  return result;
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<Notification> => {
  const result = await api.patch<Notification>(`/notifications/${notificationId}/read`);
  return result;
};

// Mark all as read
export const markAllNotificationsAsRead = async (): Promise<void> => {
  await api.patch('/notifications/read-all');
};

// Delete notification
export const deleteNotification = async (notificationId: string): Promise<void> => {
  await api.delete(`/notifications/${notificationId}`);
};
