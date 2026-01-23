import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SavedSearchFilters {
  activeCategory?: string;
  searchQuery?: string;
  priceRange?: [number, number];
  minRating?: number;
  radiusKm?: number;
  availability?: string;
  selectedAmenities?: string[];
  gymEquipment?: string[];
  gymClassTypes?: string[];
  coachingSubjects?: string[];
  libraryFacilities?: string[];
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: SavedSearchFilters;
  createdAt: string;
}

interface SavedSearchState {
  savedSearches: SavedSearch[];
  
  // Actions
  saveSearch: (name: string, filters: SavedSearchFilters) => SavedSearch;
  deleteSearch: (id: string) => void;
  updateSearch: (id: string, updates: Partial<SavedSearch>) => void;
  getSavedSearches: () => SavedSearch[];
}

export const useSavedSearchStore = create<SavedSearchState>()(
  persist(
    (set, get) => ({
      savedSearches: [],

      saveSearch: (name, filters) => {
        const newSearch: SavedSearch = {
          id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name,
          filters: {
            activeCategory: filters.activeCategory,
            searchQuery: filters.searchQuery,
            priceRange: filters.priceRange,
            minRating: filters.minRating,
            radiusKm: filters.radiusKm,
            availability: filters.availability,
            selectedAmenities: filters.selectedAmenities,
            gymEquipment: filters.gymEquipment,
            gymClassTypes: filters.gymClassTypes,
            coachingSubjects: filters.coachingSubjects,
            libraryFacilities: filters.libraryFacilities,
          },
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          savedSearches: [newSearch, ...state.savedSearches].slice(0, 10),
        }));

        return newSearch;
      },

      deleteSearch: (id) => {
        set((state) => ({
          savedSearches: state.savedSearches.filter((s) => s.id !== id),
        }));
      },

      updateSearch: (id, updates) => {
        set((state) => ({
          savedSearches: state.savedSearches.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        }));
      },

      getSavedSearches: () => get().savedSearches,
    }),
    {
      name: 'portal_saved_searches',
    }
  )
);
