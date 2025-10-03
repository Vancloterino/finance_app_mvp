import { useEffect, useRef, useCallback } from 'react';

interface UsePollingOptions {
  interval?: number; // in milliseconds
  enabled?: boolean;
}

/**
 * Custom hook for polling data at regular intervals
 * @param callback - Function to call on each poll
 * @param options - Polling configuration
 */
export const usePolling = (
  callback: () => void | Promise<void>,
  options: UsePollingOptions = {}
) => {
  const { interval = 30000, enabled = true } = options; // Default 30 seconds
  const savedCallback = useRef(callback);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update saved callback if it changes
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const tick = async () => {
      await savedCallback.current();
    };

    // Start polling
    intervalRef.current = setInterval(tick, interval);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [interval, enabled]);

  // Manual trigger function
  const trigger = useCallback(async () => {
    await savedCallback.current();
  }, []);

  return { trigger };
};
