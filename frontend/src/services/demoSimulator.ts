/**
 * IVGuard Demo Simulation Engine
 * Generates synthetic frame telemetry for offline demonstrations.
 * STRICT REQUIREMENT: Clearly segregated and labeled as DEMO MODE.
 */

import { FrameTelemetry, TrackingStatusType } from '../types/ivguard';

export class DemoSimulator {
  private isRunning = false;
  private intervalId: any = null;
  private frameCount = 0;
  private currentStatus: TrackingStatusType = 'STABLE';
  private callback: ((telemetry: FrameTelemetry) => void) | null = null;
  
  // Synthetic coordinates
  private pivBase = { x: 310, y: 240 };
  private tubeBase = { x: 420, y: 275 };
  private displacementOffset = 0;

  public setMode(status: TrackingStatusType) {
    this.currentStatus = status;
    if (status === 'MOVEMENT DETECTED') {
      this.displacementOffset = 18.5;
    } else if (status === 'INITIALIZING') {
      this.displacementOffset = 2.1;
    } else if (status === 'STABLE') {
      this.displacementOffset = 4.2;
    } else {
      this.displacementOffset = 0;
    }
  }

  public start(onTelemetry: (telemetry: FrameTelemetry) => void) {
    this.callback = onTelemetry;
    this.isRunning = true;
    this.frameCount = 100;

    this.intervalId = setInterval(() => {
      this.step();
    }, 50); // ~20 FPS simulated
  }

  public stop() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private step() {
    if (!this.callback) return;
    this.frameCount++;
    const now = Date.now() / 1000;

    // Small jitter
    const jitterX = (Math.random() - 0.5) * 1.5;
    const jitterY = (Math.random() - 0.5) * 1.5;

    let pivDisp = 0.0;
    let tubeDisp = 0.0;
    let relDistance: number | null = null;
    let alertMsg: string | null = null;

    if (this.currentStatus === 'STABLE') {
      pivDisp = Number((2.8 + Math.sin(this.frameCount * 0.05) * 1.2 + jitterX).toFixed(2));
      tubeDisp = Number((4.1 + Math.cos(this.frameCount * 0.05) * 1.8 + jitterY).toFixed(2));
      relDistance = Number((124.5 + jitterX * 2).toFixed(2));
    } else if (this.currentStatus === 'INITIALIZING') {
      pivDisp = Number((1.5 + jitterX).toFixed(2));
      tubeDisp = Number((1.8 + jitterY).toFixed(2));
      relDistance = Number((120.0 + jitterX).toFixed(2));
    } else if (this.currentStatus === 'MOVEMENT DETECTED') {
      pivDisp = Number((5.2 + jitterX).toFixed(2));
      tubeDisp = Number((16.8 + Math.sin(this.frameCount * 0.1) * 3.5 + this.displacementOffset).toFixed(2));
      relDistance = Number((148.2 + jitterX * 3).toFixed(2));
      alertMsg = "Abnormal IV-line displacement detected — human assessment recommended.";
    }

    const activeTracks = [];
    if (this.currentStatus !== 'LOST TRACK') {
      activeTracks.push({
        track_id: 1,
        class_id: 0,
        class_name: 'PIV',
        confidence: 0.94,
        bbox: {
          x1: Math.round(this.pivBase.x - 30 + jitterX),
          y1: Math.round(this.pivBase.y - 30 + jitterY),
          x2: Math.round(this.pivBase.x + 30 + jitterX),
          y2: Math.round(this.pivBase.y + 30 + jitterY),
          center_x: this.pivBase.x + jitterX,
          center_y: this.pivBase.y + jitterY,
          width: 60,
          height: 60
        },
        center: [Number((this.pivBase.x + jitterX).toFixed(1)), Number((this.pivBase.y + jitterY).toFixed(1))] as [number, number],
        displacement_px: pivDisp,
        relative_to_piv_px: null,
        status: this.currentStatus
      });

      activeTracks.push({
        track_id: 2,
        class_id: 1,
        class_name: 'TUBE',
        confidence: 0.91,
        bbox: {
          x1: Math.round(this.tubeBase.x - 25 + (this.currentStatus === 'MOVEMENT DETECTED' ? 20 : 0) + jitterX),
          y1: Math.round(this.tubeBase.y - 25 + jitterY),
          x2: Math.round(this.tubeBase.x + 25 + (this.currentStatus === 'MOVEMENT DETECTED' ? 20 : 0) + jitterX),
          y2: Math.round(this.tubeBase.y + 25 + jitterY),
          center_x: this.tubeBase.x + (this.currentStatus === 'MOVEMENT DETECTED' ? 20 : 0) + jitterX,
          center_y: this.tubeBase.y + jitterY,
          width: 50,
          height: 50
        },
        center: [
          Number((this.tubeBase.x + (this.currentStatus === 'MOVEMENT DETECTED' ? 20 : 0) + jitterX).toFixed(1)),
          Number((this.tubeBase.y + jitterY).toFixed(1))
        ] as [number, number],
        displacement_px: tubeDisp,
        relative_to_piv_px: relDistance,
        status: this.currentStatus
      });
    }

    const telemetry: FrameTelemetry = {
      frame_number: this.frameCount,
      timestamp: now,
      fps: 24.2 + (Math.random() - 0.5) * 1.5,
      overall_status: this.currentStatus,
      piv_anchor_id: this.currentStatus === 'LOST TRACK' ? null : 1,
      active_tracks: activeTracks,
      alert_message: alertMsg
    };

    this.callback(telemetry);
  }
}

export const demoSimulator = new DemoSimulator();
