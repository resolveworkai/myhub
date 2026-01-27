import { useFilterStore, VenueCategory } from '@/store/filterStore';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { isCategoryEnabled } from '@/config/businessCategories';

import {
  universalAmenities,
  gymEquipment,
  gymClassTypes,
  gymMembershipTypes,
  coachingSubjects,
  coachingLevels,
  coachingModes,
  coachingBatchSizes,
  libraryFacilities,
  libraryCollections,
  librarySpaceTypes,
  libraryMembershipOptions,
  ratingOptions,
  availabilityOptions,
  radiusOptions,
} from '@/lib/filterDefinitions';

interface FilterSectionProps {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function FilterSection({ title, count = 0, defaultOpen = false, children }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-left hover:bg-muted/50 rounded-lg px-2 -mx-2">
        <span className="font-semibold text-foreground flex items-center gap-2">
          {title}
          {count > 0 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              {count}
            </Badge>
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3 space-y-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

interface CheckboxFilterProps {
  items: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}

function CheckboxFilter({ items, selected, onToggle }: CheckboxFilterProps) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <label
          key={item.id}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
        >
          <Checkbox
            checked={selected.includes(item.id)}
            onCheckedChange={() => onToggle(item.id)}
          />
          <span className="text-sm">{item.label}</span>
        </label>
      ))}
    </div>
  );
}

interface FilterPanelProps {
  activeCategory: VenueCategory;
}

export function FilterPanel({ activeCategory }: FilterPanelProps) {
  const {
    priceRange,
    setPriceRange,
    minRating,
    setMinRating,
    radiusKm,
    setRadiusKm,
    availability,
    setAvailability,
    selectedAmenities,
    toggleAmenity,
    // Gym filters
    gymEquipment: selectedGymEquipment,
    toggleGymEquipment,
    gymClassTypes: selectedGymClassTypes,
    toggleGymClassType,
    gymMembershipTypes: selectedGymMembershipTypes,
    toggleGymMembershipType,
    // Coaching filters
    coachingSubjects: selectedCoachingSubjects,
    toggleCoachingSubject,
    coachingLevels: selectedCoachingLevels,
    toggleCoachingLevel,
    coachingMode,
    setCoachingMode,
    coachingBatchSize: selectedCoachingBatchSize,
    toggleCoachingBatchSize,
    // Library filters
    libraryFacilities: selectedLibraryFacilities,
    toggleLibraryFacility,
    libraryCollections: selectedLibraryCollections,
    toggleLibraryCollection,
    librarySpaceTypes: selectedLibrarySpaceTypes,
    toggleLibrarySpaceType,
    libraryMembership,
    setLibraryMembership,
    // Actions
    clearAllFilters,
    getActiveFilterCount,
  } = useFilterStore();

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Filters</h3>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            Clear All
          </Button>
        )}
      </div>

      {/* Distance/Radius Filter */}
      <FilterSection title="Distance" count={radiusKm < 50 ? 1 : 0} defaultOpen>
        <div className="px-2">
          <Slider
            value={[radiusKm]}
            onValueChange={(value) => setRadiusKm(value[0])}
            min={1}
            max={50}
            step={1}
            className="mb-2"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>1 km</span>
            <span className="font-medium text-foreground">{radiusKm} km</span>
            <span>50 km</span>
          </div>
        </div>
      </FilterSection>

      {/* Price Range Filter */}
      <FilterSection
        title="Price Range"
        count={priceRange[0] > 0 || priceRange[1] < 50000 ? 1 : 0}
        defaultOpen
      >
        <div className="px-2">
          <Slider
            value={priceRange}
            onValueChange={(value) => setPriceRange(value as [number, number])}
            min={0}
            max={50000}
            step={500}
            className="mb-2"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>₹{priceRange[0].toLocaleString()}</span>
            <span>₹{priceRange[1].toLocaleString()}</span>
          </div>
        </div>
      </FilterSection>

      {/* Rating Filter */}
      <FilterSection title="Minimum Rating" count={minRating > 0 ? 1 : 0} defaultOpen>
        <div className="flex flex-wrap gap-2">
          {ratingOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setMinRating(option.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                minRating === option.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Availability Filter */}
      <FilterSection title="Availability" count={availability !== 'all' ? 1 : 0}>
        <RadioGroup value={availability} onValueChange={(v) => setAvailability(v as any)}>
          {availabilityOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted">
              <RadioGroupItem value={option.value} id={`avail-${option.value}`} />
              <Label htmlFor={`avail-${option.value}`} className="cursor-pointer">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </FilterSection>

      {/* Universal Amenities */}
      <FilterSection title="Amenities" count={selectedAmenities.length}>
        <CheckboxFilter
          items={universalAmenities}
          selected={selectedAmenities}
          onToggle={toggleAmenity}
        />
      </FilterSection>

      {/* Gym-specific filters */}
      {isCategoryEnabled('gym') && (activeCategory === 'gym' || activeCategory === 'all') && (
        <>
          <div className="pt-2 border-t border-border">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Gym Filters
            </span>
          </div>

          <FilterSection title="Equipment" count={selectedGymEquipment.length}>
            <CheckboxFilter
              items={gymEquipment}
              selected={selectedGymEquipment}
              onToggle={toggleGymEquipment}
            />
          </FilterSection>

          <FilterSection title="Class Types" count={selectedGymClassTypes.length}>
            <CheckboxFilter
              items={gymClassTypes}
              selected={selectedGymClassTypes}
              onToggle={toggleGymClassType}
            />
          </FilterSection>

          <FilterSection title="Membership" count={selectedGymMembershipTypes.length}>
            <CheckboxFilter
              items={gymMembershipTypes}
              selected={selectedGymMembershipTypes}
              onToggle={toggleGymMembershipType}
            />
          </FilterSection>
        </>
      )}

      {/* Coaching-specific filters */}
      {isCategoryEnabled('coaching') && (activeCategory === 'coaching' || activeCategory === 'all') && (
        <>
          <div className="pt-2 border-t border-border">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Coaching Filters
            </span>
          </div>

          <FilterSection title="Subjects" count={selectedCoachingSubjects.length}>
            <CheckboxFilter
              items={coachingSubjects}
              selected={selectedCoachingSubjects}
              onToggle={toggleCoachingSubject}
            />
          </FilterSection>

          <FilterSection title="Education Level" count={selectedCoachingLevels.length}>
            <CheckboxFilter
              items={coachingLevels}
              selected={selectedCoachingLevels}
              onToggle={toggleCoachingLevel}
            />
          </FilterSection>

          <FilterSection title="Teaching Mode" count={coachingMode ? 1 : 0}>
            <RadioGroup value={coachingMode} onValueChange={setCoachingMode}>
              {coachingModes.map((mode) => (
                <div key={mode.id} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted">
                  <RadioGroupItem value={mode.id} id={`mode-${mode.id}`} />
                  <Label htmlFor={`mode-${mode.id}`} className="cursor-pointer">
                    {mode.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </FilterSection>

          <FilterSection title="Batch Size" count={selectedCoachingBatchSize.length}>
            <CheckboxFilter
              items={coachingBatchSizes}
              selected={selectedCoachingBatchSize}
              onToggle={toggleCoachingBatchSize}
            />
          </FilterSection>
        </>
      )}

      {/* Library-specific filters */}
      {isCategoryEnabled('library') && (activeCategory === 'library' || activeCategory === 'all') && (
        <>
          <div className="pt-2 border-t border-border">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Library Filters
            </span>
          </div>

          <FilterSection title="Facilities" count={selectedLibraryFacilities.length}>
            <CheckboxFilter
              items={libraryFacilities}
              selected={selectedLibraryFacilities}
              onToggle={toggleLibraryFacility}
            />
          </FilterSection>

          <FilterSection title="Collections" count={selectedLibraryCollections.length}>
            <CheckboxFilter
              items={libraryCollections}
              selected={selectedLibraryCollections}
              onToggle={toggleLibraryCollection}
            />
          </FilterSection>

          <FilterSection title="Study Spaces" count={selectedLibrarySpaceTypes.length}>
            <CheckboxFilter
              items={librarySpaceTypes}
              selected={selectedLibrarySpaceTypes}
              onToggle={toggleLibrarySpaceType}
            />
          </FilterSection>

          <FilterSection title="Membership" count={libraryMembership ? 1 : 0}>
            <RadioGroup value={libraryMembership} onValueChange={setLibraryMembership}>
              {libraryMembershipOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted">
                  <RadioGroupItem value={option.id} id={`lib-mem-${option.id}`} />
                  <Label htmlFor={`lib-mem-${option.id}`} className="cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </FilterSection>
        </>
      )}

      {/* Reset Button */}
      {activeFilterCount > 0 && (
        <Button variant="outline" className="w-full" onClick={clearAllFilters}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset All Filters
        </Button>
      )}
    </div>
  );
}
