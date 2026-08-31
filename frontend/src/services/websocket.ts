/**
 * IVGuard WebSocket Telemetry Service
 * Connects to ws://<backend>/ws/telemetry with auto-reconnection and typed events.
 */

import { FrameTelemetry } from '../types/ivguard';
import { API_BASE_URL } from './api';

export type ConnectionState = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';

export type TelemetryCallback = (data: FrameTelemetry) => void;
export type StateChangeCallback = (state: ConnectionState) => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private telemetryListeners: Set<TelemetryCallback> = new Set();
  private stateListeners: Set<StateChangeCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectDelay = 10000;
  private reconnectTimer: any = null;
  private isExplicitlyClosed = false;
  private currentState: ConnectionState = 'DISCONNECTED';

  constructor() {
    const wsProto = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
    const host = API_BASE_URL.replace(/^https?:\/\//, '');
    this.url = `${wsProto}://${host}/ws/telemetry`;
  }

  public connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isExplicitlyClosed = false;
    this.updateState('CONNECTING');

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.updateState('CONNECTED');
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const telemetry: FrameTelemetry = JSON.parse(event.data);
          this.notifyTelemetry(telemetry);
        } catch (err) {
          console.warn('[WebSocket] Malformed telemetry frame:', err);
        }
      };

      this.ws.onerror = () => {
        this.updateState('ERROR');
      };

      this.ws.onclose = () => {
        this.updateState('DISCONNECTED');
        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
      };
    } catch (e) {
      this.updateState('ERROR');
      this.scheduleReconnect();
    }
  }

  public disconnect(): void {
    this.isExplicitlyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.updateState('DISCONNECTED');
  }

  public onTelemetry(callback: TelemetryCallback): () => void {
    this.telemetryListeners.add(callback);
    return () => this.telemetryListeners.delete(callback);
  }

  public onStateChange(callback: StateChangeCallback): () => void {
    this.stateListeners.add(callback);
    callback(this.currentState);
    return () => this.stateListeners.delete(callback);
  }

  public getState(): ConnectionState {
    return this.currentState;
  }

  private updateState(newState: ConnectionState) {
    this.currentState = newState;
    this.stateListeners.forEach((fn) => fn(newState));
  }

  private notifyTelemetry(telemetry: FrameTelemetry) {
    this.telemetryListeners.forEach((fn) => fn(telemetry));
  }

  private scheduleReconnect() {
    if (this.reconnectTimer || this.isExplicitlyClosed) return;
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts - 1), this.maxReconnectDelay);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }
}

export const wsService = new WebSocketService();
