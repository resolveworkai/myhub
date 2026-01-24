import usersData from '@/data/mock/users.json';
import businessUsersData from '@/data/mock/businessUsers.json';
import type { User, BusinessUser, AuthUser } from '@/store/authStore';

// In-memory storage for new users (simulates database)
let users: User[] = (usersData as any[]).map(u => ({
  ...u,
  accountType: 'normal' as const,
  emailVerified: true,
  phoneVerified: true,
  marketingConsent: false,
  lastLogin: null,
  accountStatus: 'active' as const,
  failedLoginAttempts: 0,
  lockedUntil: null,
  password: 'Password123!', // Mock password for existing users
}));

let businessUsers: BusinessUser[] = (businessUsersData as any[]).map(bu => ({
  ...bu,
  address: {
    street: '123 Business St',
    city: 'Dubai',
    state: 'Dubai',
    postalCode: '00000',
    country: 'UAE',
    lat: 25.2048,
    lng: 55.2708,
  },
  yearsInOperation: '3-5 years',
  numberOfLocations: '1 location',
  totalCapacity: 100,
  operatingHours: {},
  serviceAreas: '',
  specialties: [], // Business-type specific specialties
  avatar: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150&h=150&fit=crop',
  accountType: 'business' as const,
  subscriptionStatus: 'active' as const,
  emailVerified: true,
  phoneVerified: true,
  businessVerified: bu.verified,
  lastLogin: null,
  accountStatus: bu.verified ? 'active' as const : 'pending_verification' as const,
  staffMembers: [],
  totalRevenue: 0,
  failedLoginAttempts: 0,
  lockedUntil: null,
  password: 'Password123!', // Mock password for existing users
}));

// Store OTPs in memory
const otpStore: Map<string, { otp: string; expiresAt: number; attempts: number }> = new Map();

// Generate unique ID
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Generate OTP
const generateOTP = (): string => {
  // For testing, always return 000000
  return '000000';
};

// Check if email exists
export const checkEmailExists = async (email: string): Promise<boolean> => {
  await simulateDelay();
  const normalizedEmail = email.toLowerCase();
  const existsInUsers = users.some(u => u.email.toLowerCase() === normalizedEmail);
  const existsInBusiness = businessUsers.some(bu => bu.email.toLowerCase() === normalizedEmail);
  return existsInUsers || existsInBusiness;
};

// Check if phone exists
export const checkPhoneExists = async (phone: string): Promise<boolean> => {
  await simulateDelay();
  const normalizedPhone = phone.replace(/\D/g, '');
  const existsInUsers = users.some(u => u.phone.replace(/\D/g, '').includes(normalizedPhone));
  const existsInBusiness = businessUsers.some(bu => bu.phone.replace(/\D/g, '').includes(normalizedPhone));
  return existsInUsers || existsInBusiness;
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
  await simulateDelay(1000);
  
  // Check for duplicates
  if (await checkEmailExists(userData.email)) {
    return { success: false, error: 'An account with this email already exists. Please sign in instead.' };
  }
  
  if (await checkPhoneExists(userData.phone)) {
    return { success: false, error: 'An account with this phone number already exists.' };
  }
  
  const newUser: User & { password: string } = {
    id: `u${generateId()}`,
    email: userData.email.toLowerCase(),
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
    password: userData.password,
  };
  
  users.push(newUser);
  
  // Generate OTP for email verification
  const otp = generateOTP();
  otpStore.set(userData.email.toLowerCase(), {
    otp,
    expiresAt: Date.now() + 15 * 60 * 1000,
    attempts: 0,
  });
  
  console.log(`[Mock Email] Verification OTP for ${userData.email}: ${otp}`);
  
  const { password, ...userWithoutPassword } = newUser;
  return { success: true, user: userWithoutPassword };
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
  specialties: string[]; // Business-type specific specialties
  password: string;
  accountManagerEmail?: string;
  subscriptionTier: 'starter' | 'growth' | 'enterprise';
}): Promise<{ success: boolean; user?: BusinessUser; error?: string }> => {
  await simulateDelay(1000);
  
  if (await checkEmailExists(userData.email)) {
    return { success: false, error: 'An account with this email already exists.' };
  }
  
  const newBusinessUser: BusinessUser & { password: string } = {
    id: `bu${generateId()}`,
    email: userData.email.toLowerCase(),
    businessName: userData.businessName,
    ownerName: userData.ownerName,
    phone: userData.phone,
    website: userData.website,
    businessType: userData.businessType,
    registrationNumber: userData.registrationNumber,
    address: {
      ...userData.address,
      lat: userData.address.lat || 25.2048,
      lng: userData.address.lng || 55.2708,
    },
    yearsInOperation: userData.yearsInOperation,
    numberOfLocations: userData.numberOfLocations,
    totalCapacity: userData.totalCapacity,
    operatingHours: {},
    serviceAreas: userData.serviceAreas,
    specialties: userData.specialties,
    accountManagerEmail: userData.accountManagerEmail,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.businessName)}&background=random`,
    accountType: 'business',
    subscriptionTier: userData.subscriptionTier,
    subscriptionStatus: 'active',
    joinDate: new Date().toISOString().split('T')[0],
    emailVerified: false,
    phoneVerified: false,
    businessVerified: false,
    lastLogin: null,
    accountStatus: 'pending_verification',
    locations: [],
    staffMembers: [],
    totalRevenue: 0,
    failedLoginAttempts: 0,
    lockedUntil: null,
    password: userData.password,
    
    // New media fields
    logo: '',
    coverImage: '',
    galleryImages: [],
    
    // Filter-relevant attributes
    amenities: [],
    equipment: userData.businessType === 'gym' ? [] : undefined,
    classTypes: userData.businessType === 'gym' ? [] : undefined,
    membershipOptions: [],
    subjects: userData.businessType === 'coaching' ? [] : undefined,
    levels: userData.businessType === 'coaching' ? [] : undefined,
    teachingModes: userData.businessType === 'coaching' ? [] : undefined,
    batchSizes: userData.businessType === 'coaching' ? [] : undefined,
    facilities: userData.businessType === 'library' ? [] : undefined,
    collections: userData.businessType === 'library' ? [] : undefined,
    spaceTypes: userData.businessType === 'library' ? [] : undefined,
    
    // Listing status - not published until they add location/images
    isPublished: false,
    publishedAt: undefined,
  };
  
  businessUsers.push(newBusinessUser);
  
  // Generate OTP
  const otp = generateOTP();
  otpStore.set(userData.email.toLowerCase(), {
    otp,
    expiresAt: Date.now() + 15 * 60 * 1000,
    attempts: 0,
  });
  
  console.log(`[Mock Email] Business verification OTP for ${userData.email}: ${otp}`);
  console.log(`[Mock Admin Notification] New business registration: ${userData.businessName}`);
  
  const { password, ...userWithoutPassword } = newBusinessUser;
  return { success: true, user: userWithoutPassword };
};

// Login
export const login = async (
  identifier: string,
  password: string
): Promise<{ success: boolean; user?: AuthUser; error?: string; requiresVerification?: boolean }> => {
  await simulateDelay(800);
  
  const normalizedIdentifier = identifier.toLowerCase();
  const isEmail = identifier.includes('@');
  
  // Find user
  let user: (User & { password: string }) | undefined;
  let businessUser: (BusinessUser & { password: string }) | undefined;
  
  if (isEmail) {
    user = users.find(u => u.email.toLowerCase() === normalizedIdentifier) as User & { password: string };
    businessUser = businessUsers.find(bu => bu.email.toLowerCase() === normalizedIdentifier) as BusinessUser & { password: string };
  } else {
    const normalizedPhone = identifier.replace(/\D/g, '');
    user = users.find(u => u.phone.replace(/\D/g, '').includes(normalizedPhone)) as User & { password: string };
    businessUser = businessUsers.find(bu => bu.phone.replace(/\D/g, '').includes(normalizedPhone)) as BusinessUser & { password: string };
  }
  
  const foundUser = user || businessUser;
  
  if (!foundUser) {
    return { success: false, error: 'No account found with these credentials. Please check your email/phone or sign up.' };
  }
  
  // Check account lock
  if (foundUser.lockedUntil) {
    const lockTime = new Date(foundUser.lockedUntil).getTime();
    if (Date.now() < lockTime) {
      const remainingMinutes = Math.ceil((lockTime - Date.now()) / 60000);
      return { success: false, error: `Too many failed attempts. Account locked for ${remainingMinutes} minutes.` };
    } else {
      foundUser.lockedUntil = null;
      foundUser.failedLoginAttempts = 0;
    }
  }
  
  // Check account status
  if (foundUser.accountStatus === 'suspended') {
    return { success: false, error: 'Your account has been suspended. Please contact support.' };
  }
  
  if (foundUser.accountType === 'business' && foundUser.accountStatus === 'pending_verification') {
    return { success: false, error: 'Your business account is pending verification. Please wait for admin approval.' };
  }
  
  // Verify password
  if (foundUser.password !== password) {
    foundUser.failedLoginAttempts++;
    
    if (foundUser.failedLoginAttempts >= 5) {
      foundUser.lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      return { success: false, error: 'Too many failed attempts. Account locked for 15 minutes.' };
    }
    
    if (foundUser.failedLoginAttempts >= 3) {
      return { success: false, error: `Incorrect password. ${5 - foundUser.failedLoginAttempts} attempts remaining before account lockout.` };
    }
    
    return { success: false, error: 'Incorrect password. Please try again.' };
  }
  
  // Check email verification for normal users
  if (foundUser.accountType === 'normal' && !foundUser.emailVerified) {
    // Generate new OTP
    const otp = generateOTP();
    otpStore.set(foundUser.email.toLowerCase(), {
      otp,
      expiresAt: Date.now() + 15 * 60 * 1000,
      attempts: 0,
    });
    console.log(`[Mock Email] Verification OTP for ${foundUser.email}: ${otp}`);
    
    return { 
      success: false, 
      error: 'Please verify your email before signing in. We\'ve sent a new verification code.',
      requiresVerification: true,
    };
  }
  
  // Success - reset failed attempts and update last login
  foundUser.failedLoginAttempts = 0;
  foundUser.lastLogin = new Date().toISOString();
  
  const { password: _, ...userWithoutPassword } = foundUser;
  return { success: true, user: userWithoutPassword as AuthUser };
};

// Verify OTP - Always accepts "000000" for demo purposes
export const verifyOTP = async (
  email: string,
  otp: string
): Promise<{ success: boolean; error?: string }> => {
  await simulateDelay(500);
  
  // Always accept 000000 as valid OTP for demo
  if (otp === '000000') {
    // Mark email as verified
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    const businessUser = businessUsers.find(bu => bu.email.toLowerCase() === email.toLowerCase());
    
    if (user) {
      user.emailVerified = true;
    }
    if (businessUser) {
      businessUser.emailVerified = true;
    }
    
    otpStore.delete(email.toLowerCase());
    return { success: true };
  }
  
  const stored = otpStore.get(email.toLowerCase());
  
  if (!stored) {
    // For demo: if no stored OTP, still accept 000000 (handled above)
    return { success: false, error: 'Invalid verification code. Use 000000 for demo.' };
  }
  
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(email.toLowerCase());
    return { success: false, error: 'Verification code has expired. Use 000000 for demo.' };
  }
  
  stored.attempts++;
  
  if (stored.attempts > 3) {
    otpStore.delete(email.toLowerCase());
    return { success: false, error: 'Too many failed attempts. Use 000000 for demo.' };
  }
  
  if (stored.otp !== otp) {
    return { success: false, error: `Invalid verification code. Use 000000 for demo. ${3 - stored.attempts} attempts remaining.` };
  }
  
  // Mark email as verified
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  const businessUser = businessUsers.find(bu => bu.email.toLowerCase() === email.toLowerCase());
  
  if (user) {
    user.emailVerified = true;
  }
  if (businessUser) {
    businessUser.emailVerified = true;
  }
  
  otpStore.delete(email.toLowerCase());
  return { success: true };
};

// Resend OTP
export const resendOTP = async (email: string): Promise<{ success: boolean; error?: string }> => {
  await simulateDelay(500);
  
  const otp = generateOTP();
  otpStore.set(email.toLowerCase(), {
    otp,
    expiresAt: Date.now() + 15 * 60 * 1000,
    attempts: 0,
  });
  
  console.log(`[Mock Email] New verification OTP for ${email}: ${otp}`);
  return { success: true };
};

// Request password reset
export const requestPasswordReset = async (
  email: string
): Promise<{ success: boolean; error?: string }> => {
  await simulateDelay(800);
  
  const normalizedEmail = email.toLowerCase();
  const user = users.find(u => u.email.toLowerCase() === normalizedEmail);
  const businessUser = businessUsers.find(bu => bu.email.toLowerCase() === normalizedEmail);
  
  if (!user && !businessUser) {
    return { success: false, error: 'No account found with this email address.' };
  }
  
  const otp = generateOTP();
  otpStore.set(`reset_${normalizedEmail}`, {
    otp,
    expiresAt: Date.now() + 15 * 60 * 1000,
    attempts: 0,
  });
  
  console.log(`[Mock Email] Password reset OTP for ${email}: ${otp}`);
  return { success: true };
};

// Verify reset OTP
export const verifyResetOTP = async (
  email: string,
  otp: string
): Promise<{ success: boolean; error?: string }> => {
  await simulateDelay(500);
  
  const stored = otpStore.get(`reset_${email.toLowerCase()}`);
  
  if (!stored) {
    return { success: false, error: 'No reset code found. Please request a new one.' };
  }
  
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(`reset_${email.toLowerCase()}`);
    return { success: false, error: 'Reset code has expired. Please request a new one.' };
  }
  
  stored.attempts++;
  
  if (stored.attempts > 3) {
    otpStore.delete(`reset_${email.toLowerCase()}`);
    return { success: false, error: 'Too many failed attempts. Please request a new code.' };
  }
  
  if (stored.otp !== otp) {
    return { success: false, error: `Invalid code. ${3 - stored.attempts} attempts remaining.` };
  }
  
  return { success: true };
};

// Reset password
export const resetPassword = async (
  email: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> => {
  await simulateDelay(800);
  
  const normalizedEmail = email.toLowerCase();
  const user = users.find(u => u.email.toLowerCase() === normalizedEmail) as User & { password: string };
  const businessUser = businessUsers.find(bu => bu.email.toLowerCase() === normalizedEmail) as BusinessUser & { password: string };
  
  const foundUser = user || businessUser;
  
  if (!foundUser) {
    return { success: false, error: 'Account not found.' };
  }
  
  foundUser.password = newPassword;
  otpStore.delete(`reset_${normalizedEmail}`);
  
  console.log(`[Mock Email] Password changed confirmation for ${email}`);
  return { success: true };
};

// Get user by ID
export const getUserById = (userId: string): AuthUser | null => {
  const user = users.find(u => u.id === userId);
  if (user) {
    const { password, ...userWithoutPassword } = user as User & { password: string };
    return userWithoutPassword;
  }
  
  const businessUser = businessUsers.find(bu => bu.id === userId);
  if (businessUser) {
    const { password, ...userWithoutPassword } = businessUser as BusinessUser & { password: string };
    return userWithoutPassword;
  }
  
  return null;
};

// Simulate network delay
const simulateDelay = (ms: number = 300): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Auto-verify business after 5 seconds (for demo)
export const simulateBusinessVerification = (email: string): void => {
  setTimeout(() => {
    const businessUser = businessUsers.find(bu => bu.email.toLowerCase() === email.toLowerCase());
    if (businessUser) {
      businessUser.businessVerified = true;
      businessUser.accountStatus = 'active';
      console.log(`[Mock Admin] Business verified: ${businessUser.businessName}`);
    }
  }, 5000);
};
