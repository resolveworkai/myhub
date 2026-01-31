import type { FilterState, UserLocation, VenueCategory, SortOption } from '@/store/filterStore';

export interface Venue {
  id: string;
  name: string;
  category: string;
  type?: 'gym' | 'coaching' | 'library';
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
  isRegistered?: boolean;
}

// Haversine formula for distance calculation
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Fuzzy match for amenities (since mock data uses simple strings)
function fuzzyMatchAmenity(venueAmenity: string, filterAmenity: string): boolean {
  const venueNorm = venueAmenity.toLowerCase().replace(/[^a-z0-9]/g, '');
  const filterNorm = filterAmenity.toLowerCase().replace(/[^a-z0-9]/g, '');
  return venueNorm.includes(filterNorm) || filterNorm.includes(venueNorm);
}

// Check if venue has all selected amenities
function hasAllAmenities(venueAmenities: string[], selectedAmenities: string[]): boolean {
  if (selectedAmenities.length === 0) return true;
  return selectedAmenities.every((selected) =>
    venueAmenities.some((venueAmenity) => fuzzyMatchAmenity(venueAmenity, selected))
  );
}

// Calculate popularity score (derived from rating and reviews)
export function calculatePopularity(venue: Venue): number {
  // Weighted score: rating importance + log of reviews for fairness
  return venue.rating * 10 + Math.log10(venue.reviews + 1) * 5;
}

// Get a pseudo "created at" timestamp for sorting (based on ID for mock data)
export function getCreatedAtTimestamp(venue: Venue): number {
  // Extract number from ID and use it to create a pseudo timestamp
  const idNum = parseInt(venue.id.replace(/\D/g, ''), 10) || 0;
  // Higher ID = newer
  return idNum;
}

// Main filter function
export function filterVenues(
  venues: Venue[],
  filters: Partial<FilterState>
): Venue[] {
  let result = [...venues];

  // Stage 1: Category filter
  if (filters.activeCategory && filters.activeCategory !== 'all') {
    result = result.filter((v) => {
      const venueType = v.type || v.category;
      return venueType === filters.activeCategory;
    });
  }

  // Stage 2: Search query filter
  if (filters.searchQuery && filters.searchQuery.trim()) {
    const query = filters.searchQuery.toLowerCase().trim();
    result = result.filter(
      (v) =>
        v.name.toLowerCase().includes(query) ||
        v.description?.toLowerCase().includes(query) ||
        v.location?.city?.toLowerCase().includes(query) ||
        v.location?.address?.toLowerCase().includes(query)
    );
  }

  // Stage 3: Location/distance filter
  if (filters.userLocation && filters.radiusKm && filters.radiusKm < 50) {
    result = result
      .map((v) => ({
        ...v,
        distance: calculateDistance(
          filters.userLocation!.lat,
          filters.userLocation!.lng,
          v.location.lat,
          v.location.lng
        ),
      }))
      .filter((v) => v.distance! <= filters.radiusKm!);
  } else if (filters.userLocation) {
    // Add distance even without radius filter for sorting
    result = result.map((v) => ({
      ...v,
      distance: calculateDistance(
        filters.userLocation!.lat,
        filters.userLocation!.lng,
        v.location.lat,
        v.location.lng
      ),
    }));
  }

  // Stage 4: Price range filter
  if (filters.priceRange) {
    const [minPrice, maxPrice] = filters.priceRange;
    if (minPrice > 0 || maxPrice < 50000) {
      result = result.filter((v) => v.price >= minPrice && v.price <= maxPrice);
    }
  }

  // Stage 5: Rating filter
  if (filters.minRating && filters.minRating > 0) {
    result = result.filter((v) => v.rating >= filters.minRating!);
  }

  // Stage 6: Availability filter
  if (filters.availability && filters.availability !== 'all') {
    switch (filters.availability) {
      case 'open-now':
        result = result.filter((v) => v.openNow === true);
        break;
      case 'available-today':
        result = result.filter((v) => v.status === 'available' || v.status === 'filling');
        break;
      case 'available-tomorrow':
        // For mock data, assume all non-full venues are available
        result = result.filter((v) => v.status !== 'full');
        break;
    }
  }

  // Stage 7: Universal amenities filter
  if (filters.selectedAmenities && filters.selectedAmenities.length > 0) {
    result = result.filter((v) => hasAllAmenities(v.amenities || [], filters.selectedAmenities!));
  }

  // Stage 8: Category-specific filters
  const activeCategory = filters.activeCategory || 'all';

  // Gym-specific filters
  if (activeCategory === 'gym' || activeCategory === 'all') {
    // Gym equipment
    if (filters.gymEquipment && filters.gymEquipment.length > 0) {
      result = result.filter((v) => {
        if (v.type !== 'gym' && v.category !== 'gym') return activeCategory === 'all';
        // Check description for equipment keywords
        const desc = (v.description || '').toLowerCase();
        const name = v.name.toLowerCase();
        return filters.gymEquipment!.some(
          (eq) => desc.includes(eq.toLowerCase()) || name.includes(eq.toLowerCase())
        );
      });
    }

    // Gym class types
    if (filters.gymClassTypes && filters.gymClassTypes.length > 0) {
      result = result.filter((v) => {
        if (v.type !== 'gym' && v.category !== 'gym') return activeCategory === 'all';
        const desc = (v.description || '').toLowerCase();
        const name = v.name.toLowerCase();
        return filters.gymClassTypes!.some(
          (ct) => desc.includes(ct.toLowerCase()) || name.includes(ct.toLowerCase())
        );
      });
    }
  }

  // Coaching-specific filters
  if (activeCategory === 'coaching' || activeCategory === 'all') {
    // Subjects
    if (filters.coachingSubjects && filters.coachingSubjects.length > 0) {
      result = result.filter((v) => {
        if (v.type !== 'coaching' && v.category !== 'coaching') return activeCategory === 'all';
        const subjects = v.subjects || [];
        const desc = (v.description || '').toLowerCase();
        const name = v.name.toLowerCase();
        return filters.coachingSubjects!.some(
          (sub) =>
            subjects.some((s) => s.toLowerCase().includes(sub.toLowerCase())) ||
            desc.includes(sub.toLowerCase()) ||
            name.includes(sub.toLowerCase())
        );
      });
    }
  }

  // Library-specific filters
  if (activeCategory === 'library' || activeCategory === 'all') {
    // Facilities
    if (filters.libraryFacilities && filters.libraryFacilities.length > 0) {
      result = result.filter((v) => {
        if (v.type !== 'library' && v.category !== 'library') return activeCategory === 'all';
        return hasAllAmenities(v.amenities || [], filters.libraryFacilities!);
      });
    }
  }

  return result;
}

// Sorting function
export function sortVenues(
  venues: Venue[],
  sortBy: SortOption,
  userLocation?: UserLocation | null
): Venue[] {
  const sorted = [...venues];

  switch (sortBy) {
    case 'distance':
      if (userLocation) {
        return sorted.sort((a, b) => (a.distance || 999) - (b.distance || 999));
      }
      return sorted;

    case 'price-low':
      return sorted.sort((a, b) => a.price - b.price);

    case 'price-high':
      return sorted.sort((a, b) => b.price - a.price);

    case 'rating':
      return sorted.sort((a, b) => {
        if (b.rating === a.rating) {
          return b.reviews - a.reviews; // Tiebreaker
        }
        return b.rating - a.rating;
      });

    case 'popularity':
      return sorted.sort((a, b) => calculatePopularity(b) - calculatePopularity(a));

    case 'newest':
      return sorted.sort((a, b) => getCreatedAtTimestamp(b) - getCreatedAtTimestamp(a));

    case 'relevance':
    default:
      // Relevance: combination of rating, reviews, and verified status
      return sorted.sort((a, b) => {
        const scoreA = a.rating * 10 + Math.log10(a.reviews + 1) * 3 + (a.verified ? 5 : 0);
        const scoreB = b.rating * 10 + Math.log10(b.reviews + 1) * 3 + (b.verified ? 5 : 0);
        return scoreB - scoreA;
      });
  }
}

// Get active filter chips for display
export interface FilterChip {
  id: string;
  label: string;
  value: string;
  onRemove: () => void;
}

export function getActiveFilterChips(
  filters: Partial<FilterState>,
  actions: {
    setPriceRange: (range: [number, number]) => void;
    setMinRating: (rating: number) => void;
    setRadiusKm: (radius: number) => void;
    setAvailability: (availability: 'all') => void;
    toggleAmenity: (amenity: string) => void;
    toggleGymEquipment: (equipment: string) => void;
    toggleGymClassType: (classType: string) => void;
    toggleCoachingSubject: (subject: string) => void;
    toggleLibraryFacility: (facility: string) => void;
  }
): FilterChip[] {
  const chips: FilterChip[] = [];

  // Price range
  if (filters.priceRange && (filters.priceRange[0] > 0 || filters.priceRange[1] < 50000)) {
    chips.push({
      id: 'price',
      label: 'Price',
      value: `₹${filters.priceRange[0].toLocaleString()} - ₹${filters.priceRange[1].toLocaleString()}`,
      onRemove: () => actions.setPriceRange([0, 50000]),
    });
  }

  // Rating
  if (filters.minRating && filters.minRating > 0) {
    chips.push({
      id: 'rating',
      label: 'Rating',
      value: `${filters.minRating}+ stars`,
      onRemove: () => actions.setMinRating(0),
    });
  }

  // Radius
  if (filters.radiusKm && filters.radiusKm < 50) {
    chips.push({
      id: 'radius',
      label: 'Distance',
      value: `Within ${filters.radiusKm} km`,
      onRemove: () => actions.setRadiusKm(50),
    });
  }

  // Availability
  if (filters.availability && filters.availability !== 'all') {
    const labels: Record<string, string> = {
      'open-now': 'Open Now',
      'available-today': 'Available Today',
      'available-tomorrow': 'Available Tomorrow',
    };
    chips.push({
      id: 'availability',
      label: 'Availability',
      value: labels[filters.availability] || filters.availability,
      onRemove: () => actions.setAvailability('all'),
    });
  }

  // Amenities
  filters.selectedAmenities?.forEach((amenity) => {
    chips.push({
      id: `amenity-${amenity}`,
      label: 'Amenity',
      value: amenity.charAt(0).toUpperCase() + amenity.slice(1),
      onRemove: () => actions.toggleAmenity(amenity),
    });
  });

  // Gym equipment
  filters.gymEquipment?.forEach((equipment) => {
    chips.push({
      id: `gym-equipment-${equipment}`,
      label: 'Equipment',
      value: equipment,
      onRemove: () => actions.toggleGymEquipment(equipment),
    });
  });

  // Gym class types
  filters.gymClassTypes?.forEach((classType) => {
    chips.push({
      id: `gym-class-${classType}`,
      label: 'Class',
      value: classType,
      onRemove: () => actions.toggleGymClassType(classType),
    });
  });

  // Coaching subjects
  filters.coachingSubjects?.forEach((subject) => {
    chips.push({
      id: `coaching-subject-${subject}`,
      label: 'Subject',
      value: subject,
      onRemove: () => actions.toggleCoachingSubject(subject),
    });
  });

  // Library facilities
  filters.libraryFacilities?.forEach((facility) => {
    chips.push({
      id: `library-facility-${facility}`,
      label: 'Facility',
      value: facility,
      onRemove: () => actions.toggleLibraryFacility(facility),
    });
  });

  return chips;
}
