import React, { useState } from 'react';
import { ApiService } from '../services/api';
import { Camera, Sliders, Save, CheckCircle2, AlertTriangle } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [streamUrl, setStreamUrl] = useState('http://192.168.1.9:8080/video');
  const [displacementThreshold, setDisplacementThreshold] = useState(15.0);
  const [consecutiveFrames, setConsecutiveFrames] = useState(10);
  const [confThreshold, setConfThreshold] = useState(0.25);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleApplyConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMsg(null);
    try {
      await ApiService.updateConfig({
        stream_url: streamUrl,
        displacement_threshold_px: Number(displacementThreshold),
        consecutive_frames_threshold: Number(consecutiveFrames),
        conf_threshold: Number(confThreshold),
      });
      setStatusMsg({
        type: 'success',
        text: 'Engineering configuration parameters successfully updated on backend.',
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
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Engineering Configuration</h2>
        <p className="text-xs text-slate-500 font-normal mt-0.5">
          Tune runtime computer vision, tracking thresholds, and video stream sources.
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
              Video Acquisition Source
            </h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Camera Stream URL / Index</label>
            <input
              type="text"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              placeholder="e.g. http://192.168.1.9:8080/video or 0 for local webcam"
              className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none transition-colors"
            />
            <p className="text-xs text-slate-400 mt-1.5">
              Accepts IP Webcam MJPEG endpoints (`http://.../video`), RTSP URLs, or local webcam indices (`0`, `1`).
            </p>
          </div>
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
