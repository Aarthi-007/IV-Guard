/**
 * useAlerts Hook
 * Fetches recent backend alerts from GET /api/alerts and listens to incoming telemetry warnings.
 */

import { useState, useEffect, useCallback } from 'react';
import { AlertEvent } from '../types/ivguard';
import { ApiService } from '../services/api';

export function useAlerts(isDemoMode: boolean = false, pollIntervalMs: number = 4000) {
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAlerts = useCallback(async () => {
    if (isDemoMode) {
      setAlerts([
        {
          alert_id: 'a1b2c3d4',
          timestamp: Date.now() / 1000 - 120,
          timestamp_iso: new Date(Date.now() - 120000).toISOString(),
          severity: 'WARNING',
          message: 'Abnormal IV-line displacement detected — human assessment recommended.',
          track_id: 2,
          class_name: 'TUBE',
          displacement_px: 17.4,
        },
      ]);
      setIsLoading(false);
      return;
    }

    try {
      const data = await ApiService.getAlerts(30);
      setAlerts(data);
    } catch (err) {
      // Backend offline or endpoint unreachable
    } finally {
      setIsLoading(false);
    }
  }, [isDemoMode]);

  useEffect(() => {
    fetchAlerts();
    const timer = setInterval(fetchAlerts, pollIntervalMs);
    return () => clearInterval(timer);
  }, [fetchAlerts, pollIntervalMs]);

  return {
    alerts,
    isLoading,
    refetch: fetchAlerts,
  };
}
