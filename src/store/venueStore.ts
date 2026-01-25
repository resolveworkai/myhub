import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BusinessUser } from './authStore';
import { listVenues, type Venue as ApiVenue } from '@/lib/apiService';

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
  apiVenues: Venue[];
  loading: boolean;
  error: string | null;
  
  // Actions
  publishVenue: (business: BusinessUser) => void;
  unpublishVenue: (businessId: string) => void;
  updateVenue: (businessId: string, updates: Partial<Venue>) => void;
  fetchVenues: (filters?: any) => Promise<void>;
  
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

// Transform API venue to store venue
const transformApiVenue = (apiVenue: ApiVenue): Venue => ({
  id: apiVenue.id,
  name: apiVenue.name,
  type: apiVenue.category as 'gym' | 'coaching' | 'library',
  category: apiVenue.category,
  description: apiVenue.description || '',
  image: apiVenue.image || '/placeholder.svg',
  rating: apiVenue.rating || 0,
  reviews: apiVenue.reviews || 0,
  price: apiVenue.price || 0,
  priceLabel: apiVenue.priceLabel || `₹${apiVenue.price}`,
  location: apiVenue.location,
  amenities: apiVenue.amenities || [],
  status: apiVenue.status,
  occupancy: apiVenue.occupancy || 0,
  capacity: apiVenue.capacity || 100,
  verified: apiVenue.verified || false,
  openNow: apiVenue.openNow || false,
  distance: apiVenue.distance,
  isRegistered: false,
});

export const useVenueStore = create<VenueStore>()(
  persist(
    (set, get) => ({
      registeredVenues: [],
      apiVenues: [],
      loading: false,
      error: null,

      fetchVenues: async (filters = {}) => {
        set({ loading: true, error: null });
        try {
          const result = await listVenues(filters);
          const transformed = result.venues.map(transformApiVenue);
          set({ apiVenues: transformed, loading: false });
        } catch (error: any) {
          set({ error: error.message || 'Failed to fetch venues', loading: false });
        }
      },

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
        const { registeredVenues, apiVenues } = get();
        
        // Merge API venues with registered venues (registered venues take precedence by ID)
        const registeredIds = new Set(registeredVenues.map((v) => v.id));
        const filteredApi = apiVenues.filter((v) => !registeredIds.has(v.id));
        
        return [...filteredApi, ...registeredVenues];
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
