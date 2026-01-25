import { useState, useCallback } from 'react';
import { getVenueSchedule } from '@/lib/apiService';

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

export function useSchedules(userId?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const getSchedules = useCallback(() => {
    if (userId) {
      return schedules.filter(s => s.userId === userId);
    }
    return schedules;
  }, [userId, schedules]);

  const getSchedulesByVenue = useCallback(async (venueId: string, date?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getVenueSchedule(venueId, date);
      const transformed = result.map((s: any) => ({
        id: s.id || `s${Date.now()}`,
        userId: s.user_id || userId || '',
        venueId: s.venue_id || venueId,
        venueName: s.venue_name || '',
        venueType: s.venue_type || 'gym',
        date: s.date,
        time: s.time_slot,
        duration: s.duration || 60,
        status: 'confirmed' as const,
        createdAt: s.created_at || new Date().toISOString(),
        notes: s.notes,
      }));
      setSchedules(transformed);
      setLoading(false);
      return transformed;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch schedules');
      setLoading(false);
      return [];
    }
  }, [userId]);

  const getSchedulesByDate = useCallback((date: string, venueId?: string) => {
    return schedules.filter(s => {
      const matchesDate = s.date === date;
      const matchesVenue = venueId ? s.venueId === venueId : true;
      return matchesDate && matchesVenue;
    });
  }, [schedules]);

  const addSchedule = useCallback((schedule: Omit<Schedule, 'id' | 'createdAt'>) => {
    setLoading(true);
    try {
      const newSchedule: Schedule = {
        ...schedule,
        id: `s${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setSchedules(prev => [...prev, newSchedule]);
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
      setSchedules(prev => prev.map(s => 
        s.id === id ? { ...s, ...updates } : s
      ));
      setLoading(false);
      return schedules.find(s => s.id === id);
    } catch (err) {
      setError('Failed to update schedule');
      setLoading(false);
      return null;
    }
  }, [schedules]);

  const cancelSchedule = useCallback((id: string) => {
    return updateSchedule(id, { status: 'cancelled' });
  }, [updateSchedule]);

  const deleteSchedule = useCallback((id: string) => {
    setLoading(true);
    try {
      setSchedules(prev => prev.filter(s => s.id !== id));
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
  }, [userId, schedules]);

  const getPastSchedules = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const userSchedules = userId ? schedules.filter(s => s.userId === userId) : schedules;
    return userSchedules
      .filter(s => s.date < today || s.status === 'completed')
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [userId, schedules]);

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
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const getVenueSchedules = useCallback(async () => {
    if (!venueId) return [];
    setLoading(true);
    try {
      const result = await getVenueSchedule(venueId);
      const transformed = result.map((s: any) => ({
        id: s.id || `s${Date.now()}`,
        userId: s.user_id || '',
        venueId: s.venue_id || venueId,
        venueName: s.venue_name || '',
        venueType: s.venue_type || 'gym',
        date: s.date,
        time: s.time_slot,
        duration: s.duration || 60,
        status: 'confirmed' as const,
        createdAt: s.created_at || new Date().toISOString(),
        notes: s.notes,
      }));
      setSchedules(transformed);
      setLoading(false);
      return transformed;
    } catch (error) {
      setLoading(false);
      return [];
    }
  }, [venueId]);

  const getTodaySchedules = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const venueSchedules = venueId ? schedules.filter(s => s.venueId === venueId) : schedules;
    return venueSchedules.filter(s => s.date === today);
  }, [venueId, schedules]);

  const getWeekSchedules = useCallback(() => {
    const today = new Date();
    const weekFromNow = new Date(today);
    weekFromNow.setDate(today.getDate() + 7);
    
    const todayStr = today.toISOString().split('T')[0];
    const weekStr = weekFromNow.toISOString().split('T')[0];
    
    const venueSchedules = venueId ? schedules.filter(s => s.venueId === venueId) : schedules;
    return venueSchedules.filter(s => s.date >= todayStr && s.date <= weekStr);
  }, [venueId, schedules]);

  const confirmSchedule = useCallback((id: string) => {
    setSchedules(prev => prev.map(s => 
      s.id === id ? { ...s, status: 'confirmed' as const } : s
    ));
    return schedules.find(s => s.id === id);
  }, [schedules]);

  return {
    schedules,
    loading,
    getVenueSchedules,
    getTodaySchedules,
    getWeekSchedules,
    confirmSchedule,
  };
}
