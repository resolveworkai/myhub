import { create } from 'zustand';

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
  
  // Actions
  addBooking: (booking: Omit<WalkInBooking, 'id' | 'endTime' | 'status'>) => void;
  removeBooking: (id: string) => void;
  completeBooking: (id: string) => void;
  setCapacity: (capacity: number) => void;
  getCurrentOccupancy: () => number;
  getActiveBookings: () => WalkInBooking[];
  getTodayBookings: () => WalkInBooking[];
  checkExpiredBookings: () => void;
}

export const useWalkInStore = create<WalkInState>((set, get) => ({
  bookings: [],
  capacity: 100,
  currentOccupancy: 45, // Starting occupancy
  
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
  
  getCurrentOccupancy: () => get().currentOccupancy,
  
  getActiveBookings: () => {
    return get().bookings.filter(b => b.status === 'active');
  },
  
  getTodayBookings: () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return get().bookings.filter(b => 
      b.startTime >= today && b.startTime < tomorrow
    ).sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  },
  
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
      
      return {
        bookings: updatedBookings,
        currentOccupancy: Math.max(0, state.currentOccupancy - occupancyReduction),
      };
    });
  },
}));
