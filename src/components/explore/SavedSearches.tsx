import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSavedSearchStore, SavedSearchFilters } from "@/store/savedSearchStore";
import { useFilterStore } from "@/store/filterStore";
import { toast } from "@/hooks/use-toast";
import { Bookmark, ChevronDown, Trash2, Check, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface SavedSearchesProps {
  currentFilters: SavedSearchFilters;
}

export function SavedSearches({ currentFilters }: SavedSearchesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  const { savedSearches, saveSearch, deleteSearch } = useSavedSearchStore();
  const filterStore = useFilterStore();

  const handleSave = async () => {
    if (!searchName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for this search.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    saveSearch(searchName.trim(), currentFilters);
    
    toast({
      title: "Search Saved! 🔖",
      description: `"${searchName}" has been saved to your searches.`,
    });
    
    setSearchName("");
    setIsOpen(false);
    setIsSaving(false);
  };

  const handleApply = (filters: SavedSearchFilters) => {
    if (filters.activeCategory) {
      filterStore.setActiveCategory(filters.activeCategory as any);
    }
    if (filters.searchQuery !== undefined) {
      filterStore.setSearchQuery(filters.searchQuery);
    }
    if (filters.priceRange) {
      filterStore.setPriceRange(filters.priceRange);
    }
    if (filters.minRating !== undefined) {
      filterStore.setMinRating(filters.minRating);
    }
    if (filters.radiusKm !== undefined) {
      filterStore.setRadiusKm(filters.radiusKm);
    }
    if (filters.availability) {
      filterStore.setAvailability(filters.availability as any);
    }
    if (filters.selectedAmenities) {
      filterStore.setSelectedAmenities(filters.selectedAmenities);
    }
    
    toast({
      title: "Filters Applied",
      description: "Your saved search filters have been applied.",
    });
  };

  const handleDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSearch(id);
    toast({
      title: "Search Deleted",
      description: `"${name}" has been removed.`,
    });
  };

  const hasActiveFilters = () => {
    return (
      currentFilters.searchQuery ||
      (currentFilters.priceRange && (currentFilters.priceRange[0] > 0 || currentFilters.priceRange[1] < 50000)) ||
      (currentFilters.minRating && currentFilters.minRating > 0) ||
      (currentFilters.radiusKm && currentFilters.radiusKm < 50) ||
      (currentFilters.selectedAmenities && currentFilters.selectedAmenities.length > 0) ||
      (currentFilters.gymEquipment && currentFilters.gymEquipment.length > 0) ||
      (currentFilters.coachingSubjects && currentFilters.coachingSubjects.length > 0) ||
      (currentFilters.libraryFacilities && currentFilters.libraryFacilities.length > 0)
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Bookmark className="h-4 w-4" />
            <span className="hidden sm:inline">Saved</span>
            {savedSearches.length > 0 && (
              <span className="bg-primary text-primary-foreground text-xs px-1.5 rounded-full">
                {savedSearches.length}
              </span>
            )}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {savedSearches.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              <Bookmark className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No saved searches yet</p>
              <p className="text-xs mt-1">Save your current filters to quickly apply them later</p>
            </div>
          ) : (
            <>
              {savedSearches.map((search) => (
                <DropdownMenuItem
                  key={search.id}
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => handleApply(search.filters)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{search.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(search.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 text-destructive hover:text-destructive"
                    onClick={(e) => handleDelete(search.id, search.name, e)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </DropdownMenuItem>
              ))}
            </>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => setIsOpen(true)}
            disabled={!hasActiveFilters()}
            className={cn(
              "cursor-pointer",
              !hasActiveFilters() && "opacity-50"
            )}
          >
            <Plus className="h-4 w-4 mr-2" />
            Save Current Search
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Save Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Save Search</DialogTitle>
            <DialogDescription>
              Give your search a name to easily find it later.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Input
              placeholder="e.g., Nearby Gyms with Pool"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="gradient" 
                className="flex-1" 
                onClick={handleSave}
                disabled={isSaving || !searchName.trim()}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
