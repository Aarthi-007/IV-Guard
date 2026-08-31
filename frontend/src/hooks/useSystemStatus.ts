/**
 * useSystemStatus Hook
 * Periodically polls /api/status to verify camera, model, backend health and FPS.
 */

import { useState, useEffect, useCallback } from 'react';
import { SystemStatusResponse } from '../types/ivguard';
import { ApiService } from '../services/api';

export function useSystemStatus(isDemoMode: boolean = false, pollIntervalMs: number = 3000) {
  const [status, setStatus] = useState<SystemStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (isDemoMode) {
      setIsBackendOnline(true);
      setStatus({
        camera_connected: true,
        stream_url: 'http://192.168.1.9:8080/video',
        model_loaded: true,
        model_path: 'models/trained/ivguard_yolo26n_best.pt',
        tracker_type: 'bytetrack.yaml',
        current_fps: 24.5,
        total_frames_processed: 14820,
        active_tracks_count: 2,
        overall_status: 'STABLE',
      });
      setIsLoading(false);
      return;
    }

    try {
      const data = await ApiService.getStatus();
      setStatus(data);
      setIsBackendOnline(true);
      setError(null);
    } catch (err: any) {
      setIsBackendOnline(false);
      setError(err?.message || 'Failed to connect to IVGuard backend');
    } finally {
      setIsLoading(false);
    }
  }, [isDemoMode]);

  useEffect(() => {
    fetchStatus();
    const timer = setInterval(fetchStatus, pollIntervalMs);
    return () => clearInterval(timer);
  }, [fetchStatus, pollIntervalMs]);

  return {
    status,
    isLoading,
    isBackendOnline,
    error,
    refetch: fetchStatus,
  };
}
