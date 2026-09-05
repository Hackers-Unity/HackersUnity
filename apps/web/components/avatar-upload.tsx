'use client';

import { useState, useCallback, useRef } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { getCroppedImg, readFileAsDataURL } from '@/lib/crop-utils';
import {
  Upload,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Check,
  X,
  ImagePlus,
  Trash2,
} from 'lucide-react';

interface AvatarUploadProps {
  currentAvatar: string | null;
  onAvatarChange: (dataUrl: string) => void;
  onAvatarRemove: () => void;
}

export function AvatarUpload({ currentAvatar, onAvatarChange, onAvatarRemove }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Crop modal state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPG, PNG, GIF, WebP).');
        return;
      }

      // Validate size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be under 5MB.');
        return;
      }

      const dataUrl = await readFileAsDataURL(file);
      setImageSrc(dataUrl);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setShowCropModal(true);
    }
    // Reset input so selecting the same file again works
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCropConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      const croppedDataUrl = await getCroppedImg(imageSrc, croppedAreaPixels, 300);
      onAvatarChange(croppedDataUrl);
      setShowCropModal(false);
      setImageSrc(null);
    } catch (err) {
      console.error('Crop error:', err);
    }
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setImageSrc(null);
  };

  const hasAvatar = currentAvatar && (currentAvatar.startsWith('data:') || currentAvatar.startsWith('http'));

  return (
    <>
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-2">Profile Logo / Photo</label>

        <div className="flex items-center gap-4">
          {/* Current avatar preview */}
          <div className="w-24 h-24 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
            {hasAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentAvatar} alt="Profile logo" className="w-full h-full object-cover" />
            ) : (
              <div className="text-slate-400 flex flex-col items-center gap-1">
                <ImagePlus className="w-6 h-6" />
                <span className="text-[10px] font-bold">No Logo</span>
              </div>
            )}
          </div>

          {/* Upload & remove buttons */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-bold cursor-pointer transition-all shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{hasAvatar ? 'Change Logo' : 'Upload Logo / Photo'}</span>
            </button>

            {hasAvatar && (
              <button
                type="button"
                onClick={onAvatarRemove}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold cursor-pointer transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Logo</span>
              </button>
            )}

            <p className="text-[10px] text-slate-400 font-medium">
              JPG, PNG, WebP — Max 5MB. You can crop & adjust after uploading.
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* ─── Crop & Adjust Modal ──────────────────────────────────── */}
      {showCropModal && imageSrc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">Crop & Adjust Your Logo</h3>
              <button
                type="button"
                onClick={handleCropCancel}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Crop Area */}
            <div className="relative w-full h-[340px] bg-slate-900">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
              />
            </div>

            {/* Controls */}
            <div className="px-6 py-4 space-y-3 border-t border-slate-100">
              {/* Zoom slider */}
              <div className="flex items-center gap-3">
                <ZoomOut className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#0099e6]"
                />
                <ZoomIn className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-[11px] font-mono text-slate-500 w-10 text-right">{zoom.toFixed(1)}x</span>
              </div>

              {/* Rotation slider */}
              <div className="flex items-center gap-3">
                <RotateCw className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={1}
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="flex-1 h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#0099e6]"
                />
                <span className="text-[11px] font-mono text-slate-500 w-10 text-right">{rotation}°</span>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCropCancel}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCropConfirm}
                className="px-5 py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-bold cursor-pointer transition-all shadow-sm flex items-center gap-2"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply Crop</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
