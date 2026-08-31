/**
 * useTelemetry Hook
 * Ingests live telemetry from WebSocket (or DemoSimulator), maintains bounded history buffer for charts.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { FrameTelemetry, TelemetryPoint, TrackingStatusType } from '../types/ivguard';
import { wsService, ConnectionState } from '../services/websocket';
import { demoSimulator } from '../services/demoSimulator';

const MAX_CHART_POINTS = 80;

export function useTelemetry(isDemoMode: boolean = false, demoStatus: TrackingStatusType = 'STABLE') {
  const [telemetry, setTelemetry] = useState<FrameTelemetry | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('DISCONNECTED');
  const [chartHistory, setChartHistory] = useState<TelemetryPoint[]>([]);
  const [lastMessageTime, setLastMessageTime] = useState<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Sync demo mode status
  useEffect(() => {
    if (isDemoMode) {
      demoSimulator.setMode(demoStatus);
    }
  }, [isDemoMode, demoStatus]);

  const handleTelemetry = useCallback((data: FrameTelemetry) => {
    setTelemetry(data);
    const now = Date.now();
    setLastMessageTime(now);
    lastTimeRef.current = now;

    // Extract PIV and TUBE tracks
    let pivDisp = 0.0;
    let tubeDisp = 0.0;
    let relDist: number | null = null;

    for (const track of data.active_tracks) {
      if (track.class_name === 'PIV') {
        pivDisp = track.displacement_px;
      } else if (track.class_name === 'TUBE') {
        tubeDisp = track.displacement_px;
        if (track.relative_to_piv_px !== null) {
          relDist = track.relative_to_piv_px;
        }
      }
    }

    const timeLabel = new Date(data.timestamp * 1000).toLocaleTimeString([], {
      minute: '2-digit',
      second: '2-digit',
    });

    const newPoint: TelemetryPoint = {
      time: timeLabel,
      frame: data.frame_number,
      pivDisplacement: pivDisp,
      tubeDisplacement: tubeDisp,
      relativeDistance: relDist,
      threshold: 15.0, // Standard engineering threshold
    };

    setChartHistory((prev) => {
      const updated = [...prev, newPoint];
      if (updated.length > MAX_CHART_POINTS) {
        return updated.slice(updated.length - MAX_CHART_POINTS);
      }
      return updated;
    });
  }, []);

  useEffect(() => {
    if (isDemoMode) {
      setConnectionState('CONNECTED');
      demoSimulator.start(handleTelemetry);
      return () => {
        demoSimulator.stop();
      };
    } else {
      wsService.connect();
      const unsubState = wsService.onStateChange(setConnectionState);
      const unsubTel = wsService.onTelemetry(handleTelemetry);

      return () => {
        unsubState();
        unsubTel();
      };
    }
  }, [isDemoMode, handleTelemetry]);

  // Is actively receiving frames (within last 2 seconds)
  const isLive = connectionState === 'CONNECTED' && Date.now() - lastMessageTime < 2500;

  return {
    telemetry,
    connectionState,
    chartHistory,
    isLive,
    lastMessageTime,
  };
}
