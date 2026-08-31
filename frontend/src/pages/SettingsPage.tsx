import React, { useState } from 'react';
import { ApiService } from '../services/api';
import { ThresholdModal } from '../components/settings/ThresholdModal';
import { Settings, Sliders, Camera, Save, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [streamUrl, setStreamUrl] = useState('http://192.168.1.9:8080/video');
  const [displacementThreshold, setDisplacementThreshold] = useState(15.0);
  const [consecutiveFrames, setConsecutiveFrames] = useState(10);
  const [confThreshold, setConfThreshold] = useState(0.25);
  const [smoothingWindow, setSmoothingWindow] = useState(5);
  const [initFrames, setInitFrames] = useState(30);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  const handleApplyConfig = async () => {
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
    <div className="p-4 sm:p-6 space-y-6 max-w-[1000px] mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold font-mono text-white tracking-tight">Engineering Configuration</h2>
        <p className="text-xs text-slate-400 font-sans mt-0.5">
          Tune runtime computer vision, tracking thresholds, and video stream sources.
        </p>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-mono ${
            statusMsg.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              : 'bg-red-950/40 border-red-800 text-red-300'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <form onSubmit={handleOpenConfirm} className="space-y-5">
        {/* Camera Source Section */}
        <div className="bg-surface-200 border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
            <Camera className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Video Acquisition Source
            </h3>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5">Camera Stream URL / Index</label>
            <input
              type="text"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              placeholder="e.g. http://192.168.1.9:8080/video or 0 for local webcam"
              className="w-full bg-surface-300 border border-border-subtle focus:border-cyan-500 rounded-lg px-3.5 py-2 text-xs font-mono text-slate-100 outline-none transition-colors"
            />
            <p className="text-[10px] text-slate-500 mt-1 font-mono">
              Accepts IP Webcam MJPEG endpoints (`http://.../video`), RTSP URLs, or local webcam indices (`0`, `1`).
            </p>
          </div>
        </div>

        {/* Spatial & Tracking Thresholds */}
        <div className="bg-surface-200 border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Movement Detection Parameters
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="block text-slate-300 mb-1">
                Displacement Threshold: <span className="text-cyan-400 font-bold">{displacementThreshold} px</span>
              </label>
              <input
                type="range"
                min="5"
                max="50"
                step="1"
                value={displacementThreshold}
                onChange={(e) => setDisplacementThreshold(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">Image-space pixel offset threshold</span>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">
                Consecutive Frames Threshold: <span className="text-cyan-400 font-bold">{consecutiveFrames} frames</span>
              </label>
              <input
                type="range"
                min="3"
                max="30"
                step="1"
                value={consecutiveFrames}
                onChange={(e) => setConsecutiveFrames(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">Duration needed to trigger MOVEMENT DETECTED</span>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">
                YOLO Confidence Threshold: <span className="text-cyan-400 font-bold">{confThreshold}</span>
              </label>
              <input
                type="range"
                min="0.10"
                max="0.80"
                step="0.05"
                value={confThreshold}
                onChange={(e) => setConfThreshold(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">Minimum confidence for PIV/TUBE bounding boxes</span>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">
                Smoothing Window: <span className="text-slate-200 font-bold">{smoothingWindow} frames</span>
              </label>
              <input
                type="number"
                disabled
                value={smoothingWindow}
                className="w-full bg-surface-300/50 border border-border-subtle rounded-lg px-3 py-1.5 text-xs text-slate-400"
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">Moving average for centroid jitter reduction</span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold font-mono text-xs shadow-glow-cyan transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Update Configuration'}</span>
          </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      <ThresholdModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleApplyConfig}
        pendingChanges={{
          'Camera Stream URL': streamUrl,
          'Displacement Threshold': `${displacementThreshold} px`,
          'Consecutive Frames': `${consecutiveFrames} frames`,
          'Confidence Threshold': confThreshold,
        }}
      />
    </div>
  );
};
