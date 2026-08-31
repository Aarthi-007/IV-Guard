/**
 * IVGuard Core TypeScript Interfaces
 * Strictly conforms to backend schema (backend/schemas/detection.py)
 */

export type TrackingStatusType = 
  | 'STABLE'
  | 'INITIALIZING'
  | 'MOVEMENT DETECTED'
  | 'LOST TRACK'
  | 'DISCONNECTED';

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  center_x: number;
  center_y: number;
  width: number;
  height: number;
}

export interface TrackedObjectPayload {
  track_id: number;
  class_id: number;
  class_name: 'PIV' | 'TUBE' | string;
  confidence: number;
  bbox: BoundingBox;
  center: [number, number];
  displacement_px: number;
  relative_to_piv_px: number | null;
  status: TrackingStatusType | string;
}

export interface FrameTelemetry {
  frame_number: number;
  timestamp: number;
  fps: number;
  overall_status: TrackingStatusType;
  piv_anchor_id: number | null;
  active_tracks: TrackedObjectPayload[];
  alert_message: string | null;
}

export interface SystemStatusResponse {
  camera_connected: boolean;
  stream_url: string;
  model_loaded: boolean;
  model_path: string;
  tracker_type: string;
  current_fps: number;
  total_frames_processed: number;
  active_tracks_count: number;
  overall_status: TrackingStatusType;
}

export interface AlertEvent {
  alert_id: string;
  timestamp: number;
  timestamp_iso: string;
  severity: 'WARNING' | 'ALERT' | 'STABLE';
  message: string;
  track_id: number | null;
  class_name: string | null;
  displacement_px: number | null;
}

export interface UpdateConfigRequest {
  stream_url?: string;
  conf_threshold?: number;
  displacement_threshold_px?: number;
  consecutive_frames_threshold?: number;
  inference_imgsz?: number;
}

export interface ConfigResponse {
  status: string;
  updated_parameters: Partial<UpdateConfigRequest>;
}

export interface TelemetryPoint {
  time: string;
  frame: number;
  pivDisplacement: number;
  tubeDisplacement: number;
  relativeDistance: number | null;
  threshold: number;
}
