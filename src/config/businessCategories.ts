import { Dumbbell, BookOpen, GraduationCap, LucideIcon } from "lucide-react";

/**
 * Business Categories Configuration
 *
 * Toggle business categories on/off here.
 * When a category is disabled (false), all related touchpoints will be hidden:
 * - Navigation links
 * - Hero section quick links
 * - Explore page category filters
 * - Category-specific routes
 * - Filter options
 * - Venue cards of that type
 */

export type BusinessCategoryId = "gym" | "library" | "coaching";

export interface BusinessCategoryConfig {
  id: BusinessCategoryId;
  enabled: boolean;
  name: string;
  namePlural: string;
  icon: LucideIcon;
  emoji: string;
  route: string;
  navKey: string;
  color: string;
  heroColor: string;
  filterColor: string;
}

/**
 * MAIN CONFIGURATION
 * Set enabled: true/false to show/hide each business type
 */
export const businessCategoryConfig: Record<BusinessCategoryId, BusinessCategoryConfig> = {
  gym: {
    id: "gym",
    enabled: true, // Toggle gym visibility
    name: "Gym",
    namePlural: "Gyms",
    icon: Dumbbell,
    emoji: "🏋️",
    route: "/gyms",
    navKey: "nav.gyms",
    color: "bg-info/10 text-info",
    heroColor: "bg-blue-500/20 text-blue-400",
    filterColor: "bg-info/10 text-info border-info/30",
  },
  coaching: {
    id: "coaching",
    enabled: true, // Toggle coaching visibility
    name: "Coaching",
    namePlural: "Coaching",
    icon: GraduationCap,
    emoji: "📖",
    route: "/coaching",
    navKey: "nav.coaching",
    color: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
    heroColor: "bg-purple-500/20 text-purple-400",
    filterColor: "bg-purple-100 text-purple-700 border-purple-200",
  },
  library: {
    id: "library",
    enabled: true, // Toggle library visibility
    name: "Library",
    namePlural: "Libraries",
    icon: BookOpen,
    emoji: "📚",
    route: "/libraries",
    navKey: "nav.libraries",
    color: "bg-success/10 text-success",
    heroColor: "bg-green-500/20 text-green-400",
    filterColor: "bg-success/10 text-success border-success/30",
  },
};

/**
 * Get all enabled business categories
 */
export function getEnabledCategories(): BusinessCategoryConfig[] {
  return Object.values(businessCategoryConfig).filter((cat) => cat.enabled);
}

/**
 * Check if a specific category is enabled
 */
export function isCategoryEnabled(categoryId: BusinessCategoryId): boolean {
  return businessCategoryConfig[categoryId]?.enabled ?? false;
}

/**
 * Get enabled category IDs
 */
export function getEnabledCategoryIds(): BusinessCategoryId[] {
  return getEnabledCategories().map((cat) => cat.id);
}

/**
 * Map venue type to category ID (handles 'gym' vs 'gyms' etc.)
 */
export function normalizeVenueType(type: string): BusinessCategoryId | null {
  const normalized = type.toLowerCase();
  if (normalized === "gym" || normalized === "gyms") return "gym";
  if (normalized === "library" || normalized === "libraries") return "library";
  if (normalized === "coaching") return "coaching";
  return null;
}

/**
 * Check if a venue type is enabled
 */
export function isVenueTypeEnabled(type: string): boolean {
  const categoryId = normalizeVenueType(type);
  if (!categoryId) return false;
  return isCategoryEnabled(categoryId);
}
