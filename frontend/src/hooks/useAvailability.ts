import { useState, useCallback, useEffect } from 'react';
import {
  getMentorAvailabilitySlots,
  getMentorRecurringPatterns,
  createAvailabilitySlot,
  createRecurringPattern,
  updateRecurringPattern,
  deleteRecurringPattern,
  deleteAvailabilitySlot,
} from '../services/availabilityService';
import {
  AvailabilitySlot,
  RecurringPattern,
  CreateAvailabilitySlotInput,
  CreateRecurringPatternInput,
  UpdateRecurringPatternInput,
} from '../types/Availability';

interface UseAvailabilityReturn {
  slots: AvailabilitySlot[];
  patterns: RecurringPattern[];
  isLoading: boolean;
  error: string | null;
  
  // Slot operations
  addSlot: (slot: CreateAvailabilitySlotInput) => Promise<void>;
  removeSlot: (slotId: number) => Promise<void>;
  
  // Pattern operations
  addPattern: (pattern: CreateRecurringPatternInput) => Promise<void>;
  togglePatternActive: (patternId: number, isActive: boolean) => Promise<void>;
  removePattern: (patternId: number) => Promise<void>;
  
  // Refresh
  refetch: () => Promise<void>;
}

export const useAvailability = (): UseAvailabilityReturn => {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [patterns, setPatterns] = useState<RecurringPattern[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch slots and patterns
  const fetchAvailability = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [slotsData, patternsData] = await Promise.all([
        getMentorAvailabilitySlots().catch((err: any) => {
          if (err?.response?.status === 404) return [];
          throw err;
        }),
        getMentorRecurringPatterns().catch((err: any) => {
          if (err?.response?.status === 404) return [];
          throw err;
        }),
      ]);
      setSlots(slotsData);
      setPatterns(patternsData);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      const message = typeof detail === 'string'
        ? detail
        : err?.message ||
        'Failed to load availability';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // Add ad-hoc slot
  const addSlot = useCallback(
    async (slotInput: CreateAvailabilitySlotInput) => {
      try {
        const newSlot = await createAvailabilitySlot(slotInput);
        setSlots((prev) => [...prev, newSlot]);
      } catch (err: any) {
        const message = err?.response?.data?.detail || err?.message || 'Failed to create slot';
        setError(message);
        throw err;
      }
    },[]);

  // Remove slot
  const removeSlot = useCallback(async (slotId: number) => {
    try {
      await deleteAvailabilitySlot(slotId);
      setSlots((prev) => prev.filter((slot) => slot.id !== slotId));
    } catch (err: any) {
      const message = err?.response?.data?.detail || err?.message || 'Failed to delete slot';
      setError(message);
      throw err;
    }
  }, []);

  // Add recurring pattern
  const addPattern = useCallback(
    async (patternInput: CreateRecurringPatternInput) => {
      try {
        const newPattern = await createRecurringPattern(patternInput);
        setPatterns((prev) => [...prev, newPattern]);
        // Also refetch slots since pattern creates new slots
        await fetchAvailability();
      } catch (err: any) {
        const message = err?.response?.data?.detail || err?.message || 'Failed to create pattern';
        setError(message);
        throw err;
      }
    },
    [fetchAvailability]
  );

  // Toggle pattern active/inactive
  const togglePatternActive = useCallback(
    async (patternId: number, isActive: boolean) => {
      try {
        const updated = await updateRecurringPattern(patternId, { is_active: isActive });
        setPatterns((prev) =>
          prev.map((p) => (p.id === patternId ? updated : p))
        );
      } catch (err: any) {
        const message = err?.response?.data?.detail || err?.message || 'Failed to update pattern';
        setError(message);
        throw err;
      }
    },
    []
  );

  // Delete pattern
  const removePattern = useCallback(async (patternId: number) => {
    try {
      await deleteRecurringPattern(patternId);
      setPatterns((prev) => prev.filter((p) => p.id !== patternId));
      // Refetch slots since pattern deletion removes generated slots
      await fetchAvailability();
    } catch (err: any) {
      const message = err?.response?.data?.detail || err?.message || 'Failed to delete pattern';
      setError(message);
      throw err;
    }
  }, [fetchAvailability]);

  return {
    slots,
    patterns,
    isLoading,
    error,
    addSlot,
    removeSlot,
    addPattern,
    togglePatternActive,
    removePattern,
    refetch: fetchAvailability,
  };
};