'use client';

import React, { useState, useCallback, useRef } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { getCroppedBannerImg, readFileAsDataURL } from '@/lib/crop-utils';
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

interface BannerUploadProps {
  currentBanner: string | null;
  onBannerChange: (bannerValue: string) => void;
  onBannerRemove: () => void;
}

export function BannerUpload({
  currentBanner,
  onBannerChange,
  onBannerRemove,
}: BannerUploadProps) {
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

      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPG, PNG, WebP).');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('Banner image must be under 5MB.');
        return;
      }

      const dataUrl = await readFileAsDataURL(file);
      setImageSrc(dataUrl);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setShowCropModal(true);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      const cropped = await getCroppedBannerImg(imageSrc, croppedAreaPixels, rotation);
      if (cropped) {
        onBannerChange(cropped);
        setShowCropModal(false);
        setImageSrc(null);
      }
    } catch (err) {
      console.error('Failed to crop banner:', err);
    }
  };

  const hasBanner = Boolean(
    currentBanner &&
    (currentBanner.startsWith('data:') || currentBanner.startsWith('http'))
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Banner Preview Box */}
        <div className="w-full sm:w-52 h-24 rounded-2xl bg-slate-900 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0 relative shadow-xs">
          {hasBanner && currentBanner ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={currentBanner}
              alt="Profile Banner Preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full relative flex flex-col items-center justify-center text-slate-400"
              style={{
                background: 'linear-gradient(135deg, #020617 0%, #082f49 50%, #1e1b4b 100%)',
              }}
            >
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#0099e6_1px,transparent_1px)] [background-size:12px_12px]" />
              <ImagePlus className="w-5 h-5 text-sky-400 relative z-10" />
              <span className="text-[10px] font-bold text-slate-300 relative z-10 mt-1">Default Theme</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-bold cursor-pointer transition-all shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{hasBanner ? 'Change Banner' : 'Upload Banner Photo'}</span>
            </button>

            {hasBanner && (
              <button
                type="button"
                onClick={onBannerRemove}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold cursor-pointer transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Banner</span>
              </button>
            )}
          </div>

          <p className="text-[10px] text-slate-400 font-medium">
            JPG, PNG, WebP — Max 5MB. Recommended ratio 3:1. You can crop & adjust after uploading.
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* ─── Crop & Adjust Modal ──────────────────────────────────── */}
      {showCropModal && imageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Adjust & Crop Banner</h3>
                <p className="text-xs text-slate-500">Drag and scale your banner photo (recommended ratio 3:1)</p>
              </div>
              <button
                onClick={() => setShowCropModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cropper Surface */}
            <div className="relative w-full h-60 bg-slate-950">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={3 / 1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            {/* Controls */}
            <div className="px-6 py-4 space-y-4 bg-slate-50 border-t border-slate-100">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <ZoomOut className="w-4 h-4 text-slate-400" />
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.05}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0099e6]"
                  />
                  <ZoomIn className="w-4 h-4 text-slate-400" />
                </div>

                <button
                  type="button"
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Rotate</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCropModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCrop}
                  className="px-5 py-2 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-black shadow-md shadow-sky-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Banner</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
