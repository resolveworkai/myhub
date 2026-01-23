import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useWalkInStore } from "@/store/walkInStore";
import { Users, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveOccupancyCardProps {
  onWalkInClick: () => void;
}

export function LiveOccupancyCard({ onWalkInClick }: LiveOccupancyCardProps) {
  const { currentOccupancy, capacity, getActiveBookings } = useWalkInStore();
  const [prevOccupancy, setPrevOccupancy] = useState(currentOccupancy);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');
  
  const activeBookings = getActiveBookings();
  const occupancyPercent = Math.min(100, Math.round((currentOccupancy / capacity) * 100));
  
  // Determine status color based on occupancy
  const getStatusColor = () => {
    if (occupancyPercent < 50) return "bg-success";
    if (occupancyPercent < 75) return "bg-warning";
    if (occupancyPercent < 90) return "bg-orange-500";
    return "bg-destructive";
  };

  const getStatusText = () => {
    if (occupancyPercent < 50) return "Low";
    if (occupancyPercent < 75) return "Moderate";
    if (occupancyPercent < 90) return "High";
    return "Full";
  };

  // Track occupancy changes for trend indicator
  useEffect(() => {
    if (currentOccupancy > prevOccupancy) {
      setTrend('up');
    } else if (currentOccupancy < prevOccupancy) {
      setTrend('down');
    } else {
      setTrend('stable');
    }
    setPrevOccupancy(currentOccupancy);
    
    // Reset trend after 3 seconds
    const timer = setTimeout(() => setTrend('stable'), 3000);
    return () => clearTimeout(timer);
  }, [currentOccupancy, prevOccupancy]);

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground';

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold flex items-center gap-2">
          <span className={cn("w-2 h-2 rounded-full animate-pulse", getStatusColor())} />
          Live Occupancy
        </h2>
        <Button 
          size="sm" 
          variant="gradient"
          onClick={onWalkInClick}
        >
          <Users className="h-4 w-4 mr-1" />
          Walk-in
        </Button>
      </div>
      
      {/* Main Counter */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2">
          <span className={cn(
            "text-5xl font-bold transition-all duration-300",
            trend === 'up' && "text-success scale-105",
            trend === 'down' && "text-destructive",
            trend === 'stable' && "text-primary"
          )}>
            {currentOccupancy}
          </span>
          <TrendIcon className={cn("h-5 w-5 transition-opacity", trendColor, trend === 'stable' && "opacity-0")} />
        </div>
        <div className="text-muted-foreground">of {capacity} capacity</div>
      </div>
      
      {/* Progress Bar */}
      <div className="h-4 bg-muted rounded-full overflow-hidden mb-4 relative">
        <div 
          className={cn("h-full rounded-full transition-all duration-500", getStatusColor())}
          style={{ width: `${occupancyPercent}%` }} 
        />
        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-foreground">
          {occupancyPercent}%
        </span>
      </div>
      
      {/* Status and Active Walk-ins */}
      <div className="flex items-center justify-between text-sm mb-4">
        <div className="flex items-center gap-2">
          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", 
            occupancyPercent < 50 ? "bg-success/10 text-success" :
            occupancyPercent < 75 ? "bg-warning/10 text-warning" :
            occupancyPercent < 90 ? "bg-orange-500/10 text-orange-500" :
            "bg-destructive/10 text-destructive"
          )}>
            {getStatusText()}
          </span>
        </div>
        {activeBookings.length > 0 && (
          <span className="text-muted-foreground">
            {activeBookings.length} active walk-in{activeBookings.length > 1 ? 's' : ''}
          </span>
        )}
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-3 text-center text-sm border-t border-border pt-4">
        <div>
          <div className="font-semibold">Peak</div>
          <div className="text-muted-foreground">6-8 PM</div>
        </div>
        <div>
          <div className="font-semibold">Avg Today</div>
          <div className="text-muted-foreground">{Math.round(currentOccupancy * 0.85)}</div>
        </div>
        <div>
          <div className="font-semibold">Available</div>
          <div className="text-muted-foreground">{capacity - currentOccupancy}</div>
        </div>
      </div>
    </div>
  );
}
