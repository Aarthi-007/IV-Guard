/**
 * IVGuard REST API Client
 * Interfaces with FastAPI Backend:
 * - GET /api/status
 * - GET /api/telemetry/latest
 * - GET /api/alerts
 * - POST /api/config
 */

import { SystemStatusResponse, FrameTelemetry, AlertEvent, UpdateConfigRequest, ConfigResponse } from '../types/ivguard';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

export class ApiService {
  /** Fetch current health, camera connection, and operational status */
  static async getStatus(): Promise<SystemStatusResponse> {
    const res = await fetch(`${API_BASE_URL}/api/status`);
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
    }
    return res.json();
  }

  /** Fetch most recent frame telemetry snapshot */
  static async getLatestTelemetry(): Promise<FrameTelemetry | null> {
    const res = await fetch(`${API_BASE_URL}/api/telemetry/latest`);
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
    }
    return res.json();
  }

  /** Fetch recent movement warning alerts */
  static async getAlerts(limit: number = 20): Promise<AlertEvent[]> {
    const res = await fetch(`${API_BASE_URL}/api/alerts?limit=${limit}`);
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
    }
    return res.json();
  }

  /** Update stream URL or detection/displacement thresholds */
  static async updateConfig(config: UpdateConfigRequest): Promise<ConfigResponse> {
    const res = await fetch(`${API_BASE_URL}/api/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
    }
    return res.json();
  }

  /** Get live MJPEG video stream URL */
  static getVideoFeedUrl(): string {
    return `${API_BASE_URL}/api/video-feed`;
  }
}
