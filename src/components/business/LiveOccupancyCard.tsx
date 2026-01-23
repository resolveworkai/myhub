import { memo, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useOccupancy, useActiveBookings } from "@/store/walkInStore";
import { Users, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveOccupancyCardProps {
  onWalkInClick: () => void;
}

export const LiveOccupancyCard = memo(function LiveOccupancyCard({ onWalkInClick }: LiveOccupancyCardProps) {
  const { currentOccupancy, capacity } = useOccupancy();
  const activeBookings = useActiveBookings();
  const [prevOccupancy, setPrevOccupancy] = useState(currentOccupancy);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');
  
  const occupancyPercent = Math.min(100, Math.round((currentOccupancy / capacity) * 100));
  
  const getStatusColor = useCallback(() => {
    if (occupancyPercent < 50) return "bg-success";
    if (occupancyPercent < 75) return "bg-warning";
    if (occupancyPercent < 90) return "bg-accent";
    return "bg-destructive";
  }, [occupancyPercent]);

  const getStatusText = useCallback(() => {
    if (occupancyPercent < 50) return "Low";
    if (occupancyPercent < 75) return "Moderate";
    if (occupancyPercent < 90) return "High";
    return "Full";
  }, [occupancyPercent]);

  useEffect(() => {
    if (currentOccupancy > prevOccupancy) {
      setTrend('up');
    } else if (currentOccupancy < prevOccupancy) {
      setTrend('down');
    }
    setPrevOccupancy(currentOccupancy);
    
    const timer = setTimeout(() => setTrend('stable'), 3000);
    return () => clearTimeout(timer);
  }, [currentOccupancy, prevOccupancy]);

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground';
  const statusColor = getStatusColor();

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold flex items-center gap-2">
          <span className={cn("w-2 h-2 rounded-full animate-pulse", statusColor)} />
          Live Occupancy
        </h2>
        <Button size="sm" variant="gradient" onClick={onWalkInClick}>
          <Users className="h-4 w-4 mr-1" />
          Walk-in
        </Button>
      </div>
      
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
      
      <div className="h-4 bg-muted rounded-full overflow-hidden mb-4 relative">
        <div 
          className={cn("h-full rounded-full transition-all duration-500", statusColor)}
          style={{ width: `${occupancyPercent}%` }} 
        />
        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-foreground">
          {occupancyPercent}%
        </span>
      </div>
      
      <div className="flex items-center justify-between text-sm mb-4">
        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", 
          occupancyPercent < 50 ? "bg-success/10 text-success" :
          occupancyPercent < 75 ? "bg-warning/10 text-warning" :
          occupancyPercent < 90 ? "bg-accent/10 text-accent" :
          "bg-destructive/10 text-destructive"
        )}>
          {getStatusText()}
        </span>
        {activeBookings.length > 0 && (
          <span className="text-muted-foreground">
            {activeBookings.length} active walk-in{activeBookings.length > 1 ? 's' : ''}
          </span>
        )}
      </div>
      
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
});
