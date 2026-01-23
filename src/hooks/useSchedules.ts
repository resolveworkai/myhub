import { useState, useCallback } from 'react';
import schedulesData from '@/data/mock/schedules.json';

export interface Schedule {
  id: string;
  userId: string;
  venueId: string;
  venueName: string;
  venueType: 'gym' | 'library' | 'coaching';
  date: string;
  time: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  notes?: string;
}

// In-memory storage that simulates JSON file
let schedules: Schedule[] = [...schedulesData] as Schedule[];

export function useSchedules(userId?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSchedules = useCallback(() => {
    if (userId) {
      return schedules.filter(s => s.userId === userId);
    }
    return schedules;
  }, [userId]);

  const getSchedulesByVenue = useCallback((venueId: string) => {
    return schedules.filter(s => s.venueId === venueId);
  }, []);

  const getSchedulesByDate = useCallback((date: string, venueId?: string) => {
    return schedules.filter(s => {
      const matchesDate = s.date === date;
      const matchesVenue = venueId ? s.venueId === venueId : true;
      return matchesDate && matchesVenue;
    });
  }, []);

  const addSchedule = useCallback((schedule: Omit<Schedule, 'id' | 'createdAt'>) => {
    setLoading(true);
    try {
      const newSchedule: Schedule = {
        ...schedule,
        id: `s${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      schedules = [...schedules, newSchedule];
      setLoading(false);
      return newSchedule;
    } catch (err) {
      setError('Failed to add schedule');
      setLoading(false);
      return null;
    }
  }, []);

  const updateSchedule = useCallback((id: string, updates: Partial<Schedule>) => {
    setLoading(true);
    try {
      schedules = schedules.map(s => 
        s.id === id ? { ...s, ...updates } : s
      );
      setLoading(false);
      return schedules.find(s => s.id === id);
    } catch (err) {
      setError('Failed to update schedule');
      setLoading(false);
      return null;
    }
  }, []);

  const cancelSchedule = useCallback((id: string) => {
    return updateSchedule(id, { status: 'cancelled' });
  }, [updateSchedule]);

  const deleteSchedule = useCallback((id: string) => {
    setLoading(true);
    try {
      schedules = schedules.filter(s => s.id !== id);
      setLoading(false);
      return true;
    } catch (err) {
      setError('Failed to delete schedule');
      setLoading(false);
      return false;
    }
  }, []);

  const getUpcomingSchedules = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const userSchedules = userId ? schedules.filter(s => s.userId === userId) : schedules;
    return userSchedules
      .filter(s => s.date >= today && s.status !== 'cancelled')
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.time.localeCompare(b.time);
      });
  }, [userId]);

  const getPastSchedules = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const userSchedules = userId ? schedules.filter(s => s.userId === userId) : schedules;
    return userSchedules
      .filter(s => s.date < today || s.status === 'completed')
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [userId]);

  return {
    schedules: getSchedules(),
    loading,
    error,
    addSchedule,
    updateSchedule,
    cancelSchedule,
    deleteSchedule,
    getSchedulesByVenue,
    getSchedulesByDate,
    getUpcomingSchedules,
    getPastSchedules,
  };
}

// Export for business dashboard use
export function useBusinessSchedules(venueId?: string) {
  const [loading, setLoading] = useState(false);

  const getVenueSchedules = useCallback(() => {
    if (venueId) {
      return schedules.filter(s => s.venueId === venueId);
    }
    // For demo, return all schedules for business dashboard
    return schedules;
  }, [venueId]);

  const getTodaySchedules = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const venueSchedules = venueId ? schedules.filter(s => s.venueId === venueId) : schedules;
    return venueSchedules.filter(s => s.date === today);
  }, [venueId]);

  const getWeekSchedules = useCallback(() => {
    const today = new Date();
    const weekFromNow = new Date(today);
    weekFromNow.setDate(today.getDate() + 7);
    
    const todayStr = today.toISOString().split('T')[0];
    const weekStr = weekFromNow.toISOString().split('T')[0];
    
    const venueSchedules = venueId ? schedules.filter(s => s.venueId === venueId) : schedules;
    return venueSchedules.filter(s => s.date >= todayStr && s.date <= weekStr);
  }, [venueId]);

  const confirmSchedule = useCallback((id: string) => {
    schedules = schedules.map(s => 
      s.id === id ? { ...s, status: 'confirmed' as const } : s
    );
    return schedules.find(s => s.id === id);
  }, []);

  return {
    schedules: getVenueSchedules(),
    loading,
    getTodaySchedules,
    getWeekSchedules,
    confirmSchedule,
  };
}
