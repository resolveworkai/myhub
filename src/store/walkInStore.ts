import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

export interface WalkInBooking {
  id: string;
  persons: number;
  duration: number;
  startTime: Date;
  endTime: Date;
  paymentMethod: string;
  amount: number;
  status: 'active' | 'completed' | 'expired';
}

interface WalkInState {
  bookings: WalkInBooking[];
  capacity: number;
  currentOccupancy: number;
}

interface WalkInActions {
  addBooking: (booking: Omit<WalkInBooking, 'id' | 'endTime' | 'status'>) => void;
  removeBooking: (id: string) => void;
  completeBooking: (id: string) => void;
  setCapacity: (capacity: number) => void;
  checkExpiredBookings: () => void;
}

type WalkInStore = WalkInState & WalkInActions;

const useWalkInStoreBase = create<WalkInStore>((set, get) => ({
  bookings: [],
  capacity: 100,
  currentOccupancy: 45,
  
  addBooking: (booking) => {
    const endTime = new Date(booking.startTime);
    endTime.setMinutes(endTime.getMinutes() + booking.duration);
    
    const newBooking: WalkInBooking = {
      ...booking,
      id: `wi-${Date.now()}`,
      endTime,
      status: 'active',
    };
    
    set((state) => ({
      bookings: [...state.bookings, newBooking],
      currentOccupancy: state.currentOccupancy + booking.persons,
    }));
  },
  
  removeBooking: (id) => {
    const booking = get().bookings.find(b => b.id === id);
    if (booking) {
      set((state) => ({
        bookings: state.bookings.filter(b => b.id !== id),
        currentOccupancy: Math.max(0, state.currentOccupancy - booking.persons),
      }));
    }
  },
  
  completeBooking: (id) => {
    const booking = get().bookings.find(b => b.id === id);
    if (booking && booking.status === 'active') {
      set((state) => ({
        bookings: state.bookings.map(b => 
          b.id === id ? { ...b, status: 'completed' as const } : b
        ),
        currentOccupancy: Math.max(0, state.currentOccupancy - booking.persons),
      }));
    }
  },
  
  setCapacity: (capacity) => set({ capacity }),
  
  checkExpiredBookings: () => {
    const now = new Date();
    set((state) => {
      let occupancyReduction = 0;
      const updatedBookings = state.bookings.map(b => {
        if (b.status === 'active' && b.endTime <= now) {
          occupancyReduction += b.persons;
          return { ...b, status: 'expired' as const };
        }
        return b;
      });
      
      if (occupancyReduction === 0) return state;
      
      return {
        bookings: updatedBookings,
        currentOccupancy: Math.max(0, state.currentOccupancy - occupancyReduction),
      };
    });
  },
}));

// Optimized selectors to prevent unnecessary re-renders
export const useWalkInStore = useWalkInStoreBase;

// Specific selectors for better performance
export const useOccupancy = () => useWalkInStoreBase(useShallow((s) => ({
  currentOccupancy: s.currentOccupancy,
  capacity: s.capacity,
})));

export const useWalkInActions = () => useWalkInStoreBase(useShallow((s) => ({
  addBooking: s.addBooking,
  completeBooking: s.completeBooking,
  checkExpiredBookings: s.checkExpiredBookings,
})));

export const useActiveBookings = () => {
  const bookings = useWalkInStoreBase((s) => s.bookings);
  return bookings.filter(b => b.status === 'active');
};

export const useTodayBookings = () => {
  const bookings = useWalkInStoreBase((s) => s.bookings);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return bookings
    .filter(b => b.startTime >= today && b.startTime < tomorrow)
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
};
