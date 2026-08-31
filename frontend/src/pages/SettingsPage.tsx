import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import { Camera, Sliders, Save, CheckCircle2, AlertTriangle, Video, Globe } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [cameraSource, setCameraSource] = useState<'local' | 'ip_camera'>('local');
  const [cameraIndex, setCameraIndex] = useState<number>(0);
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [displacementThreshold, setDisplacementThreshold] = useState<number>(15.0);
  const [consecutiveFrames, setConsecutiveFrames] = useState<number>(10);
  const [confThreshold, setConfThreshold] = useState<number>(0.25);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Fetch current settings on load
    ApiService.getStatus()
      .then((st) => {
        if (st.camera_source) {
          setCameraSource(st.camera_source === 'ip_camera' ? 'ip_camera' : 'local');
        }
        if (st.camera_index !== undefined) {
          setCameraIndex(st.camera_index);
        }
        if (st.stream_url) {
          setStreamUrl(st.stream_url);
        }
      })
      .catch(() => {});
  }, []);

  const handleApplyConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMsg(null);
    try {
      await ApiService.updateConfig({
        camera_source: cameraSource,
        camera_index: cameraIndex,
        stream_url: cameraSource === 'ip_camera' ? streamUrl.trim() : '',
        displacement_threshold_px: Number(displacementThreshold),
        consecutive_frames_threshold: Number(consecutiveFrames),
        conf_threshold: Number(confThreshold),
      });
      setStatusMsg({
        type: 'success',
        text: 'Camera source and monitoring parameters updated successfully.',
      });
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Failed to update backend parameters.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-[1000px] mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Settings & Camera Configuration</h2>
        <p className="text-xs text-slate-500 font-normal mt-0.5">
          Configure video acquisition source (Laptop Webcam vs External Camera) and movement detection thresholds.
        </p>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-xs ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <form onSubmit={handleApplyConfig} className="space-y-6">
        {/* Camera Source Section */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Camera className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">
              Camera Acquisition Source
            </h3>
          </div>

          {/* Camera Type Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label
              onClick={() => {
                setCameraSource('local');
                setCameraIndex(0);
                setStreamUrl('');
              }}
              className={`p-4 rounded-xl border cursor-pointer flex items-start gap-3 transition-all ${
                cameraSource === 'local'
                  ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Video className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Laptop Webcam (Default)</span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Uses OpenCV VideoCapture(0) directly on this machine. No IP address or network configuration needed.
                </span>
              </div>
            </label>

            <label
              onClick={() => {
                setCameraSource('ip_camera');
              }}
              className={`p-4 rounded-xl border cursor-pointer flex items-start gap-3 transition-all ${
                cameraSource === 'ip_camera'
                  ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Globe className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">External / IP Camera (Advanced)</span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Optional network camera stream (MJPEG over HTTP or RTSP URL).
                </span>
              </div>
            </label>
          </div>

          {cameraSource === 'local' ? (
            <div className="pt-2 flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-700">Camera Device Index:</label>
              <input
                type="number"
                min="0"
                max="5"
                value={cameraIndex}
                onChange={(e) => setCameraIndex(Number(e.target.value))}
                className="w-20 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono text-center outline-none"
              />
              <span className="text-[11px] text-slate-400">Default is 0 for the built-in webcam.</span>
            </div>
          ) : (
            <div className="pt-2 animate-in fade-in space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Stream URL</label>
              <input
                type="text"
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                placeholder="http://192.168.1.X:8080/video"
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none transition-colors font-mono"
              />
              <span className="text-[11px] text-slate-400 block">
                Enter the HTTP/RTSP endpoint of the external camera.
              </span>
            </div>
          )}
        </div>

        {/* Spatial & Tracking Thresholds */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">
              Movement Detection Parameters
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Displacement Threshold: <span className="text-blue-600 font-bold">{displacementThreshold} px</span>
              </label>
              <input
                type="range"
                min="5"
                max="50"
                step="1"
                value={displacementThreshold}
                onChange={(e) => setDisplacementThreshold(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <span className="text-xs text-slate-400 block mt-1">Image-space pixel offset threshold</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Consecutive Frames Threshold: <span className="text-blue-600 font-bold">{consecutiveFrames} frames</span>
              </label>
              <input
                type="range"
                min="3"
                max="30"
                step="1"
                value={consecutiveFrames}
                onChange={(e) => setConsecutiveFrames(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <span className="text-xs text-slate-400 block mt-1">Sustained frames needed to trigger MOVEMENT DETECTED</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Confidence Threshold: <span className="text-blue-600 font-bold">{confThreshold}</span>
              </label>
              <input
                type="range"
                min="0.10"
                max="0.80"
                step="0.05"
                value={confThreshold}
                onChange={(e) => setConfThreshold(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <span className="text-xs text-slate-400 block mt-1">Minimum detection confidence for PIV/TUBE</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Update Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
