import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type VenueCategory = 'gym' | 'library' | 'coaching' | 'all';
export type AvailabilityFilter = 'all' | 'open-now' | 'available-today' | 'available-tomorrow';
export type SortOption = 'relevance' | 'distance' | 'price-low' | 'price-high' | 'rating' | 'popularity' | 'newest';

export interface UserLocation {
  lat: number;
  lng: number;
  city: string;
  source: 'gps' | 'manual' | 'default';
}

export interface FilterState {
  // User location
  userLocation: UserLocation | null;
  
  // Universal filters
  activeCategory: VenueCategory;
  searchQuery: string;
  priceRange: [number, number];
  minRating: number;
  radiusKm: number;
  availability: AvailabilityFilter;
  sortBy: SortOption;
  selectedAmenities: string[];
  
  // Gym-specific filters
  gymEquipment: string[];
  gymClassTypes: string[];
  gymOperatingHours: string[];
  gymMembershipTypes: string[];
  
  // Coaching-specific filters
  coachingSubjects: string[];
  coachingLevels: string[];
  coachingMode: string;
  coachingBatchSize: string[];
  coachingAgeGroups: string[];
  coachingTimings: string[];
  coachingQualifications: string[];
  
  // Library-specific filters
  libraryFacilities: string[];
  libraryCollections: string[];
  librarySpaceTypes: string[];
  libraryMembership: string;
  libraryServices: string[];
  libraryHours: string[];
  
  // UI state
  isFilterPanelOpen: boolean;
  isLoading: boolean;
  
  // Actions
  setUserLocation: (location: UserLocation | null) => void;
  setActiveCategory: (category: VenueCategory) => void;
  setSearchQuery: (query: string) => void;
  setPriceRange: (range: [number, number]) => void;
  setMinRating: (rating: number) => void;
  setRadiusKm: (radius: number) => void;
  setAvailability: (availability: AvailabilityFilter) => void;
  setSortBy: (sort: SortOption) => void;
  toggleAmenity: (amenity: string) => void;
  setSelectedAmenities: (amenities: string[]) => void;
  
  // Gym filter actions
  toggleGymEquipment: (equipment: string) => void;
  toggleGymClassType: (classType: string) => void;
  toggleGymOperatingHours: (hours: string) => void;
  toggleGymMembershipType: (type: string) => void;
  
  // Coaching filter actions
  toggleCoachingSubject: (subject: string) => void;
  toggleCoachingLevel: (level: string) => void;
  setCoachingMode: (mode: string) => void;
  toggleCoachingBatchSize: (size: string) => void;
  toggleCoachingAgeGroup: (group: string) => void;
  toggleCoachingTiming: (timing: string) => void;
  toggleCoachingQualification: (qualification: string) => void;
  
  // Library filter actions
  toggleLibraryFacility: (facility: string) => void;
  toggleLibraryCollection: (collection: string) => void;
  toggleLibrarySpaceType: (type: string) => void;
  setLibraryMembership: (membership: string) => void;
  toggleLibraryService: (service: string) => void;
  toggleLibraryHours: (hours: string) => void;
  
  // UI actions
  setFilterPanelOpen: (open: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  
  // Reset actions
  clearAllFilters: () => void;
  clearCategoryFilters: (category: VenueCategory) => void;
  
  // Computed
  getActiveFilterCount: () => number;
}

const initialState = {
  userLocation: null,
  activeCategory: 'all' as VenueCategory,
  searchQuery: '',
  priceRange: [0, 50000] as [number, number],
  minRating: 0,
  radiusKm: 50,
  availability: 'all' as AvailabilityFilter,
  sortBy: 'relevance' as SortOption,
  selectedAmenities: [] as string[],
  
  gymEquipment: [] as string[],
  gymClassTypes: [] as string[],
  gymOperatingHours: [] as string[],
  gymMembershipTypes: [] as string[],
  
  coachingSubjects: [] as string[],
  coachingLevels: [] as string[],
  coachingMode: '',
  coachingBatchSize: [] as string[],
  coachingAgeGroups: [] as string[],
  coachingTimings: [] as string[],
  coachingQualifications: [] as string[],
  
  libraryFacilities: [] as string[],
  libraryCollections: [] as string[],
  librarySpaceTypes: [] as string[],
  libraryMembership: '',
  libraryServices: [] as string[],
  libraryHours: [] as string[],
  
  isFilterPanelOpen: false,
  isLoading: false,
};

const toggleArrayItem = <T>(array: T[], item: T): T[] => {
  return array.includes(item) 
    ? array.filter(i => i !== item) 
    : [...array, item];
};

export const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Location
      setUserLocation: (location) => set({ userLocation: location }),
      
      // Universal filters
      setActiveCategory: (category) => set({ activeCategory: category }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setPriceRange: (range) => set({ priceRange: range }),
      setMinRating: (rating) => set({ minRating: rating }),
      setRadiusKm: (radius) => set({ radiusKm: radius }),
      setAvailability: (availability) => set({ availability: availability }),
      setSortBy: (sort) => set({ sortBy: sort }),
      toggleAmenity: (amenity) => set((state) => ({ 
        selectedAmenities: toggleArrayItem(state.selectedAmenities, amenity) 
      })),
      setSelectedAmenities: (amenities) => set({ selectedAmenities: amenities }),
      
      // Gym filters
      toggleGymEquipment: (equipment) => set((state) => ({ 
        gymEquipment: toggleArrayItem(state.gymEquipment, equipment) 
      })),
      toggleGymClassType: (classType) => set((state) => ({ 
        gymClassTypes: toggleArrayItem(state.gymClassTypes, classType) 
      })),
      toggleGymOperatingHours: (hours) => set((state) => ({ 
        gymOperatingHours: toggleArrayItem(state.gymOperatingHours, hours) 
      })),
      toggleGymMembershipType: (type) => set((state) => ({ 
        gymMembershipTypes: toggleArrayItem(state.gymMembershipTypes, type) 
      })),
      
      // Coaching filters
      toggleCoachingSubject: (subject) => set((state) => ({ 
        coachingSubjects: toggleArrayItem(state.coachingSubjects, subject) 
      })),
      toggleCoachingLevel: (level) => set((state) => ({ 
        coachingLevels: toggleArrayItem(state.coachingLevels, level) 
      })),
      setCoachingMode: (mode) => set({ coachingMode: mode }),
      toggleCoachingBatchSize: (size) => set((state) => ({ 
        coachingBatchSize: toggleArrayItem(state.coachingBatchSize, size) 
      })),
      toggleCoachingAgeGroup: (group) => set((state) => ({ 
        coachingAgeGroups: toggleArrayItem(state.coachingAgeGroups, group) 
      })),
      toggleCoachingTiming: (timing) => set((state) => ({ 
        coachingTimings: toggleArrayItem(state.coachingTimings, timing) 
      })),
      toggleCoachingQualification: (qualification) => set((state) => ({ 
        coachingQualifications: toggleArrayItem(state.coachingQualifications, qualification) 
      })),
      
      // Library filters
      toggleLibraryFacility: (facility) => set((state) => ({ 
        libraryFacilities: toggleArrayItem(state.libraryFacilities, facility) 
      })),
      toggleLibraryCollection: (collection) => set((state) => ({ 
        libraryCollections: toggleArrayItem(state.libraryCollections, collection) 
      })),
      toggleLibrarySpaceType: (type) => set((state) => ({ 
        librarySpaceTypes: toggleArrayItem(state.librarySpaceTypes, type) 
      })),
      setLibraryMembership: (membership) => set({ libraryMembership: membership }),
      toggleLibraryService: (service) => set((state) => ({ 
        libraryServices: toggleArrayItem(state.libraryServices, service) 
      })),
      toggleLibraryHours: (hours) => set((state) => ({ 
        libraryHours: toggleArrayItem(state.libraryHours, hours) 
      })),
      
      // UI
      setFilterPanelOpen: (open) => set({ isFilterPanelOpen: open }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      
      // Reset
      clearAllFilters: () => set({
        ...initialState,
        userLocation: get().userLocation, // Keep location
        activeCategory: get().activeCategory, // Keep category
      }),
      
      clearCategoryFilters: (category) => {
        switch (category) {
          case 'gym':
            set({
              gymEquipment: [],
              gymClassTypes: [],
              gymOperatingHours: [],
              gymMembershipTypes: [],
            });
            break;
          case 'coaching':
            set({
              coachingSubjects: [],
              coachingLevels: [],
              coachingMode: '',
              coachingBatchSize: [],
              coachingAgeGroups: [],
              coachingTimings: [],
              coachingQualifications: [],
            });
            break;
          case 'library':
            set({
              libraryFacilities: [],
              libraryCollections: [],
              librarySpaceTypes: [],
              libraryMembership: '',
              libraryServices: [],
              libraryHours: [],
            });
            break;
          default:
            break;
        }
      },
      
      // Computed
      getActiveFilterCount: () => {
        const state = get();
        let count = 0;
        
        // Universal
        if (state.priceRange[0] > 0 || state.priceRange[1] < 50000) count++;
        if (state.minRating > 0) count++;
        if (state.radiusKm < 50) count++;
        if (state.availability !== 'all') count++;
        if (state.selectedAmenities.length > 0) count += state.selectedAmenities.length;
        
        // Gym
        count += state.gymEquipment.length;
        count += state.gymClassTypes.length;
        count += state.gymOperatingHours.length;
        count += state.gymMembershipTypes.length;
        
        // Coaching
        count += state.coachingSubjects.length;
        count += state.coachingLevels.length;
        if (state.coachingMode) count++;
        count += state.coachingBatchSize.length;
        count += state.coachingAgeGroups.length;
        count += state.coachingTimings.length;
        count += state.coachingQualifications.length;
        
        // Library
        count += state.libraryFacilities.length;
        count += state.libraryCollections.length;
        count += state.librarySpaceTypes.length;
        if (state.libraryMembership) count++;
        count += state.libraryServices.length;
        count += state.libraryHours.length;
        
        return count;
      },
    }),
    {
      name: 'filter-store',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        activeCategory: state.activeCategory,
        priceRange: state.priceRange,
        minRating: state.minRating,
        radiusKm: state.radiusKm,
        availability: state.availability,
        sortBy: state.sortBy,
        selectedAmenities: state.selectedAmenities,
        gymEquipment: state.gymEquipment,
        gymClassTypes: state.gymClassTypes,
        coachingSubjects: state.coachingSubjects,
        libraryFacilities: state.libraryFacilities,
      }),
    }
  )
);
