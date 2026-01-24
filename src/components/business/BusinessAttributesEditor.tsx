import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
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
} from '@/lib/filterDefinitions';

interface BusinessAttributesEditorProps {
  businessType: 'gym' | 'coaching' | 'library';
  amenities: string[];
  equipment?: string[];
  classTypes?: string[];
  subjects?: string[];
  levels?: string[];
  teachingModes?: string[];
  batchSizes?: string[];
  facilities?: string[];
  collections?: string[];
  spaceTypes?: string[];
  membershipOptions?: string[];
  onAmenitiesChange: (amenities: string[]) => void;
  onEquipmentChange?: (equipment: string[]) => void;
  onClassTypesChange?: (classTypes: string[]) => void;
  onSubjectsChange?: (subjects: string[]) => void;
  onLevelsChange?: (levels: string[]) => void;
  onTeachingModesChange?: (modes: string[]) => void;
  onBatchSizesChange?: (sizes: string[]) => void;
  onFacilitiesChange?: (facilities: string[]) => void;
  onCollectionsChange?: (collections: string[]) => void;
  onSpaceTypesChange?: (spaces: string[]) => void;
  onMembershipOptionsChange?: (options: string[]) => void;
  className?: string;
}

interface AttributeSectionProps {
  title: string;
  description?: string;
  items: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}

function AttributeSection({ title, description, items, selected, onToggle }: AttributeSectionProps) {
  const toggleItem = (id: string) => {
    if (selected.includes(id)) {
      onToggle(id);
    } else {
      onToggle(id);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <h4 className="font-medium text-sm">{title}</h4>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const isSelected = selected.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggleItem(item.id)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all',
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              )}
            >
              {isSelected && <Check className="h-3 w-3" />}
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function toggleInArray(arr: string[], item: string): string[] {
  return arr.includes(item)
    ? arr.filter((i) => i !== item)
    : [...arr, item];
}

export function BusinessAttributesEditor({
  businessType,
  amenities,
  equipment = [],
  classTypes = [],
  subjects = [],
  levels = [],
  teachingModes = [],
  batchSizes = [],
  facilities = [],
  collections = [],
  spaceTypes = [],
  membershipOptions = [],
  onAmenitiesChange,
  onEquipmentChange,
  onClassTypesChange,
  onSubjectsChange,
  onLevelsChange,
  onTeachingModesChange,
  onBatchSizesChange,
  onFacilitiesChange,
  onCollectionsChange,
  onSpaceTypesChange,
  onMembershipOptionsChange,
  className,
}: BusinessAttributesEditorProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Universal Amenities - All business types */}
      <AttributeSection
        title="Amenities & Facilities"
        description="Select the amenities available at your location"
        items={universalAmenities}
        selected={amenities}
        onToggle={(id) => onAmenitiesChange(toggleInArray(amenities, id))}
      />

      {/* Gym-specific attributes */}
      {businessType === 'gym' && (
        <>
          <AttributeSection
            title="Equipment & Training Areas"
            description="What equipment and training zones do you offer?"
            items={gymEquipment}
            selected={equipment}
            onToggle={(id) => onEquipmentChange?.(toggleInArray(equipment, id))}
          />
          <AttributeSection
            title="Classes & Programs"
            description="What group classes or programs do you offer?"
            items={gymClassTypes}
            selected={classTypes}
            onToggle={(id) => onClassTypesChange?.(toggleInArray(classTypes, id))}
          />
          <AttributeSection
            title="Membership Options"
            description="What membership plans are available?"
            items={gymMembershipTypes}
            selected={membershipOptions}
            onToggle={(id) => onMembershipOptionsChange?.(toggleInArray(membershipOptions, id))}
          />
        </>
      )}

      {/* Coaching-specific attributes */}
      {businessType === 'coaching' && (
        <>
          <AttributeSection
            title="Subjects & Skills"
            description="What subjects or skills do you teach?"
            items={coachingSubjects}
            selected={subjects}
            onToggle={(id) => onSubjectsChange?.(toggleInArray(subjects, id))}
          />
          <AttributeSection
            title="Education Levels"
            description="What levels do you cater to?"
            items={coachingLevels}
            selected={levels}
            onToggle={(id) => onLevelsChange?.(toggleInArray(levels, id))}
          />
          <AttributeSection
            title="Teaching Mode"
            description="How do you deliver your classes?"
            items={coachingModes}
            selected={teachingModes}
            onToggle={(id) => onTeachingModesChange?.(toggleInArray(teachingModes, id))}
          />
          <AttributeSection
            title="Batch Sizes"
            description="What class sizes do you offer?"
            items={coachingBatchSizes}
            selected={batchSizes}
            onToggle={(id) => onBatchSizesChange?.(toggleInArray(batchSizes, id))}
          />
        </>
      )}

      {/* Library-specific attributes */}
      {businessType === 'library' && (
        <>
          <AttributeSection
            title="Facilities"
            description="What facilities are available?"
            items={libraryFacilities}
            selected={facilities}
            onToggle={(id) => onFacilitiesChange?.(toggleInArray(facilities, id))}
          />
          <AttributeSection
            title="Collections"
            description="What types of materials do you have?"
            items={libraryCollections}
            selected={collections}
            onToggle={(id) => onCollectionsChange?.(toggleInArray(collections, id))}
          />
          <AttributeSection
            title="Study Spaces"
            description="What types of study spaces are available?"
            items={librarySpaceTypes}
            selected={spaceTypes}
            onToggle={(id) => onSpaceTypesChange?.(toggleInArray(spaceTypes, id))}
          />
          <AttributeSection
            title="Membership Options"
            description="What membership options are available?"
            items={libraryMembershipOptions}
            selected={membershipOptions}
            onToggle={(id) => onMembershipOptionsChange?.(toggleInArray(membershipOptions, id))}
          />
        </>
      )}
    </div>
  );
}
