import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFilterStore } from '@/store/filterStore';
import { getActiveFilterChips, FilterChip } from '@/lib/filterEngine';

export function ActiveFilters() {
  const store = useFilterStore();
  
  const chips = getActiveFilterChips(
    {
      priceRange: store.priceRange,
      minRating: store.minRating,
      radiusKm: store.radiusKm,
      availability: store.availability,
      selectedAmenities: store.selectedAmenities,
      gymEquipment: store.gymEquipment,
      gymClassTypes: store.gymClassTypes,
      coachingSubjects: store.coachingSubjects,
      libraryFacilities: store.libraryFacilities,
    },
    {
      setPriceRange: store.setPriceRange,
      setMinRating: store.setMinRating,
      setRadiusKm: store.setRadiusKm,
      setAvailability: store.setAvailability,
      toggleAmenity: store.toggleAmenity,
      toggleGymEquipment: store.toggleGymEquipment,
      toggleGymClassType: store.toggleGymClassType,
      toggleCoachingSubject: store.toggleCoachingSubject,
      toggleLibraryFacility: store.toggleLibraryFacility,
    }
  );

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-sm text-muted-foreground">Active filters:</span>
      {chips.map((chip) => (
        <button
          key={chip.id}
          onClick={chip.onRemove}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium hover:bg-primary/20 transition-colors group"
        >
          <span className="text-muted-foreground text-xs">{chip.label}:</span>
          <span>{chip.value}</span>
          <X className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
        </button>
      ))}
      {chips.length >= 2 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={store.clearAllFilters}
          className="text-muted-foreground hover:text-foreground"
        >
          Clear all
        </Button>
      )}
    </div>
  );
}
