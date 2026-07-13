/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { useT } from '../lib/locale';

export interface UploadZoneProps {
  onImageSelected: (base64: string, mimeType: string, previewUrl: string) => void;
  isLoading: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onImageSelected, isLoading }) => {
  const t = useT();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triggerFileSelect = () => {
    if (!isLoading) {
      fileInputRef.current?.click();
    }
  };

  const handleFile = (file: File) => {
    setError(null);

    // Validations
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError(t('errors.imageRequired'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(t('errors.imageSizeError'));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).replace(/^data:image\/[a-z]+;base64,/, '');
      const previewUrl = URL.createObjectURL(file);
      onImageSelected(base64String, file.type, previewUrl);
    };
    reader.onerror = () => {
      setError(t('errors.genericError'));
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isLoading) {
      setIsDragging(true);
    }
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (!isLoading && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto" id="upload-zone-container">
      <div
        id="drag-drop-area"
        onClick={triggerFileSelect}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`w-full min-h-[220px] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-8 text-center transition-all duration-300 ${
          isLoading
            ? 'border-blue-200 bg-blue-50/10 cursor-not-allowed'
            : isDragging
            ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
            : 'border-slate-300 hover:border-blue-400 bg-white hover:bg-slate-50/40 cursor-pointer'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleInputChange}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          disabled={isLoading}
          id="hidden-file-input"
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-4 animate-pulse">
            <svg
              className="animate-spin h-10 w-10 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-slate-600 font-medium text-sm">{t('upload.analyzingText')}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {/* Elegant teardrop icon */}
            <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4 text-blue-500 group-hover:scale-110 transition-transform duration-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-7 h-7 animate-bounce"
                style={{ animationDuration: '2s' }}
              >
                <path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z" />
              </svg>
            </div>

            <p className="text-slate-700 font-semibold text-lg">{t('upload.dropText')}</p>
            <p className="text-blue-600 font-medium text-sm mt-1">{t('upload.clickText')}</p>
            <p className="text-slate-400 text-xs mt-3 bg-slate-100 px-3 py-1 rounded-full font-mono">
              {t('upload.limitsText')}
            </p>
          </div>
        )}
      </div>

      {error && (
        <div id="upload-error" className="mt-3 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs text-center font-medium animate-fade-in">
          {error}
        </div>
      )}
    </div>
  );
};
