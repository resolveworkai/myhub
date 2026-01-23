import { useState, useEffect, useCallback } from 'react';

interface DebouncedValue<T> {
  value: T;
  debouncedValue: T;
  setValue: (value: T) => void;
  isPending: boolean;
}

export function useDebouncedValue<T>(initialValue: T, delay: number = 300): DebouncedValue<T> {
  const [value, setValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    setIsPending(true);
    const timer = setTimeout(() => {
      setDebouncedValue(value);
      setIsPending(false);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return { value, debouncedValue, setValue, isPending };
}

export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const newTimeoutId = setTimeout(() => {
        callback(...args);
      }, delay);

      setTimeoutId(newTimeoutId);
    },
    [callback, delay, timeoutId]
  );

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return debouncedCallback;
}

// Hook for debouncing filter state changes
export function useFilterDebounce<T>(
  filterState: T,
  delay: number = 300
): { debouncedFilters: T; isPending: boolean } {
  const [debouncedFilters, setDebouncedFilters] = useState<T>(filterState);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    setIsPending(true);
    const timer = setTimeout(() => {
      setDebouncedFilters(filterState);
      setIsPending(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [filterState, delay]);

  return { debouncedFilters, isPending };
}
