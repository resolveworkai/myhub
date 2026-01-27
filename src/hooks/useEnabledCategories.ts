import { useMemo } from 'react';
import {
  getEnabledCategories,
  isCategoryEnabled,
  isVenueTypeEnabled,
  BusinessCategoryId,
  BusinessCategoryConfig,
} from '@/config/businessCategories';

/**
 * Hook to access enabled business categories throughout the app.
 * This ensures all components reactively respect the category configuration.
 */
export function useEnabledCategories() {
  const enabledCategories = useMemo(() => getEnabledCategories(), []);
  const enabledIds = useMemo(() => enabledCategories.map((c) => c.id), [enabledCategories]);

  return {
    /** List of all enabled category configs */
    categories: enabledCategories,
    
    /** List of enabled category IDs */
    enabledIds,
    
    /** Check if a specific category is enabled */
    isEnabled: (categoryId: BusinessCategoryId) => isCategoryEnabled(categoryId),
    
    /** Check if a venue type (e.g., 'gym', 'library') is enabled */
    isVenueEnabled: (venueType: string) => isVenueTypeEnabled(venueType),
    
    /** Filter an array of venues to only include enabled types */
    filterEnabledVenues: <T extends { type: string }>(venues: T[]): T[] => {
      return venues.filter((v) => isVenueTypeEnabled(v.type));
    },
    
    /** Get navigation items for enabled categories */
    getNavItems: () => enabledCategories.map((cat) => ({
      nameKey: cat.navKey,
      href: cat.route,
      icon: cat.icon,
    })),
  };
}
