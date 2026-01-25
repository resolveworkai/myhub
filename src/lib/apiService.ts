import type { User, BusinessUser, AuthUser } from '@/store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
  requiresVerification?: boolean;
}

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

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data: ApiResponse<T> = await response.json();

  if (!data.success) {
    throw new ApiError(
      data.error?.message || 'An error occurred',
      data.error?.code,
      data.requiresVerification
    );
  }

  return data.data as T;
}

// Check if email exists
export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    const result = await apiRequest<{ exists: boolean }>(
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
    const result = await apiRequest<{ exists: boolean }>(
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
    const result = await apiRequest<{ userId: string; email: string }>(
      '/auth/member/signup',
      {
        method: 'POST',
        body: JSON.stringify({
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
        }),
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
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to create account' };
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
    const result = await apiRequest<{ userId: string; email: string }>(
      '/auth/business/signup',
      {
        method: 'POST',
        body: JSON.stringify({
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
        }),
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
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to create account' };
  }
};

// Login
export const login = async (
  identifier: string,
  password: string
): Promise<{ success: boolean; user?: AuthUser; error?: string; requiresVerification?: boolean }> => {
  try {
    const result = await apiRequest<{
      user: any;
      tokens: { accessToken: string; refreshToken: string };
    }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({
          identifier,
          password,
          rememberMe: false,
        }),
      }
    );

    // Transform backend user to frontend AuthUser type
    const user: AuthUser = result.user.account_type === 'user'
      ? {
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
        }
      : {
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

    return { success: true, user };
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        success: false,
        error: error.message,
        requiresVerification: error.requiresVerification,
      };
    }
    return { success: false, error: 'Login failed' };
  }
};

// Verify OTP
export const verifyOTP = async (
  email: string,
  otp: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await apiRequest(
      '/auth/verify-email',
      {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      }
    );
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Verification failed' };
  }
};

// Resend OTP
export const resendOTP = async (email: string): Promise<{ success: boolean; error?: string }> => {
  try {
    await apiRequest(
      '/auth/resend-otp',
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      }
    );
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to resend code' };
  }
};

// Request password reset
export const requestPasswordReset = async (
  email: string
): Promise<{ success: boolean; error?: string }> => {
  // TODO: Implement when password reset endpoint is added
  return { success: false, error: 'Not implemented yet' };
};

// Verify reset OTP
export const verifyResetOTP = async (
  email: string,
  otp: string
): Promise<{ success: boolean; error?: string }> => {
  // TODO: Implement when password reset endpoint is added
  return { success: false, error: 'Not implemented yet' };
};

// Reset password
export const resetPassword = async (
  email: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> => {
  // TODO: Implement when password reset endpoint is added
  return { success: false, error: 'Not implemented yet' };
};

// Get user by ID
export const getUserById = (userId: string): AuthUser | null => {
  // TODO: Implement when user endpoint is added
  return null;
};
