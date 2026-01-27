import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BusinessUser } from './authStore';
import { isVenueTypeEnabled } from '@/config/businessCategories';
import gymsData from '@/data/mock/gyms.json';
import coachingData from '@/data/mock/coaching.json';
import librariesData from '@/data/mock/libraries.json';

export interface Venue {
  id: string;
  name: string;
  type: 'gym' | 'coaching' | 'library';
  category: string;
  description: string;
  image: string;
  galleryImages?: string[];
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
  equipment?: string[];
  classTypes?: string[];
  subjects?: string[];
  facilities?: string[];
  collections?: string[];
  spaceTypes?: string[];
  status: 'available' | 'filling' | 'full';
  occupancy: number;
  capacity: number;
  verified: boolean;
  openNow: boolean;
  distance?: number;
  isRegistered?: boolean; // Flag for registered businesses
}

interface VenueStore {
  registeredVenues: Venue[];
  
  // Actions
  publishVenue: (business: BusinessUser) => void;
  unpublishVenue: (businessId: string) => void;
  updateVenue: (businessId: string, updates: Partial<Venue>) => void;
  
  // Getters
  getAllVenues: () => Venue[];
  getVenueById: (id: string) => Venue | null;
  isVenuePublished: (businessId: string) => boolean;
}

// Transform BusinessUser to Venue
const createVenueFromBusiness = (business: BusinessUser): Venue => ({
  id: business.id,
  name: business.businessName,
  type: business.businessType,
  category: business.businessType,
  description: business.serviceAreas || `Welcome to ${business.businessName}`,
  image: business.coverImage || business.logo || '/placeholder.svg',
  galleryImages: business.galleryImages || [],
  rating: 0,
  reviews: 0,
  price: 0,
  priceLabel: 'Contact for pricing',
  location: {
    lat: business.address?.lat || 0,
    lng: business.address?.lng || 0,
    address: `${business.address?.street || ''}, ${business.address?.city || ''}`,
    city: business.address?.city || '',
  },
  amenities: business.amenities || [],
  equipment: business.equipment,
  classTypes: business.classTypes,
  subjects: business.subjects,
  facilities: business.facilities,
  collections: business.collections,
  spaceTypes: business.spaceTypes,
  status: 'available',
  occupancy: 0,
  capacity: business.totalCapacity || 50,
  verified: business.businessVerified || false,
  openNow: true,
  isRegistered: true,
});

// Get mock venues
const getMockVenues = (): Venue[] => [
  ...gymsData.map((g) => ({ 
    ...g, 
    type: 'gym' as const, 
    status: g.status as 'available' | 'filling' | 'full',
    isRegistered: false 
  })),
  ...coachingData.map((c) => ({ 
    ...c, 
    type: 'coaching' as const, 
    status: c.status as 'available' | 'filling' | 'full',
    isRegistered: false 
  })),
  ...librariesData.map((l) => ({ 
    ...l, 
    type: 'library' as const, 
    status: l.status as 'available' | 'filling' | 'full',
    isRegistered: false 
  })),
];

export const useVenueStore = create<VenueStore>()(
  persist(
    (set, get) => ({
      registeredVenues: [],

      publishVenue: (business: BusinessUser) => {
        const venue = createVenueFromBusiness(business);
        set((state) => {
          // Check if already exists
          const exists = state.registeredVenues.some((v) => v.id === business.id);
          if (exists) {
            // Update existing
            return {
              registeredVenues: state.registeredVenues.map((v) =>
                v.id === business.id ? venue : v
              ),
            };
          }
          // Add new
          return {
            registeredVenues: [...state.registeredVenues, venue],
          };
        });
      },

      unpublishVenue: (businessId: string) => {
        set((state) => ({
          registeredVenues: state.registeredVenues.filter((v) => v.id !== businessId),
        }));
      },

      updateVenue: (businessId: string, updates: Partial<Venue>) => {
        set((state) => ({
          registeredVenues: state.registeredVenues.map((v) =>
            v.id === businessId ? { ...v, ...updates } : v
          ),
        }));
      },

      getAllVenues: () => {
        const { registeredVenues } = get();
        const mockVenues = getMockVenues();
        
        // Merge registered venues with mock (registered venues take precedence by ID)
        const registeredIds = new Set(registeredVenues.map((v) => v.id));
        const filteredMock = mockVenues.filter((v) => !registeredIds.has(v.id));
        
        // Filter by enabled categories
        const allVenues = [...filteredMock, ...registeredVenues];
        return allVenues.filter((v) => isVenueTypeEnabled(v.type));
      },

      getVenueById: (id: string) => {
        const allVenues = get().getAllVenues();
        return allVenues.find((v) => v.id === id) || null;
      },

      isVenuePublished: (businessId: string) => {
        return get().registeredVenues.some((v) => v.id === businessId);
      },
    }),
    {
      name: 'venue-store',
      partialize: (state) => ({
        registeredVenues: state.registeredVenues,
      }),
    }
  )
);
