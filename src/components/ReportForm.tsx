/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Camera, Droplets, Globe, MapPin, User, Building, FileText, Send, AlertTriangle, RotateCcw } from 'lucide-react';
import { listCountries, getCitiesInCountry } from '../lib/cityData';
import { useT, useLocale } from '../lib/locale';
import { CommunityReport } from '../types/report';

interface ReportFormProps {
  onSuccess: (report: CommunityReport) => void;
  onCancel: () => void;
}

export const ReportForm: React.FC<ReportFormProps> = ({ onSuccess, onCancel }) => {
  const t = useT();
  const { locale } = useLocale();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<'form' | 'submitting' | 'success' | 'error'>('form');
  const [displayName, setDisplayName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [locationDescription, setLocationDescription] = useState('');
  const [description, setDescription] = useState('');
  
  const [imageData, setImageData] = useState<{ base64: string; mimeType: string; previewUrl: string } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [apiErrorMessage, setApiErrorMessage] = useState('');

  const countries = listCountries();
  const cities = selectedCountry ? getCitiesInCountry(selectedCountry) : [];

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCountry(e.target.value);
    setSelectedCity('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setUploadError(t('errors.imageRequired'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError(t('errors.imageSizeError'));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).replace(/^data:image\/[a-z]+;base64,/, '');
      const previewUrl = URL.createObjectURL(file);
      setImageData({ base64, mimeType: file.type, previewUrl });
    };
    reader.onerror = () => {
      setUploadError(t('errors.genericError'));
    };
    reader.readAsDataURL(file);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (imageData?.previewUrl) {
      URL.revokeObjectURL(imageData.previewUrl);
    }
    setImageData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCountry || !selectedCity || phase === 'submitting') return;

    setPhase('submitting');
    setApiErrorMessage('');

    try {
      const payload = {
        country: selectedCountry,
        city: selectedCity,
        location_description: locationDescription || null,
        display_name: displayName.trim() || t('community.namePlaceholder'),
        description: description.trim() || null,
        imageBase64: imageData?.base64 || null,
        mimeType: imageData?.mimeType || null,
        language: locale,
      };

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (response.status === 201 && json.success) {
        setPhase('success');
        setTimeout(() => {
          onSuccess(json.data);
        }, 1800);
      } else {
        setApiErrorMessage(json.error || t('errors.genericError'));
        setPhase('error');
      }
    } catch (err) {
      console.error(err);
      setApiErrorMessage(t('errors.genericError'));
      setPhase('error');
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 max-w-lg mx-auto animate-fade-in" id="report-form-view">
      {phase === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-4" id="community-report-form">
          {/* Photo upload section (Optional, but useful!) */}
          <div id="form-photo-upload">
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-mono">
              <Camera className="w-4 h-4 text-slate-400" />
              <span>{t('community.photoLabel')}</span>
            </label>
            <div
              onClick={triggerFileSelect}
              className={`w-full min-h-[110px] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-center p-4 cursor-pointer relative transition-all duration-300 ${
                imageData ? 'border-blue-400 bg-blue-50/10' : ''
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                id="form-hidden-input"
              />
              {imageData ? (
                <div className="flex items-center gap-3 w-full" id="thumbnail-preview-bar">
                  <img
                    src={imageData.previewUrl}
                    alt="Sample Thumbnail"
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-xs font-bold text-slate-700 truncate">Photo selected ✓</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase tracking-wide">{imageData.mimeType}</p>
                    <button
                      type="button"
                      id="remove-thumbnail-btn"
                      onClick={handleRemoveImage}
                      className="text-[10px] text-red-500 hover:text-red-700 font-bold underline mt-1 block"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center flex flex-col items-center">
                  <Droplets className="w-7 h-7 text-blue-400 mb-1 animate-pulse" />
                  <p className="text-xs text-blue-600 font-semibold">{t('upload.clickText')}</p>
                  <p className="text-[9px] text-slate-400 font-mono mt-0.5">{t('upload.limitsText')}</p>
                </div>
              )}
            </div>
            {uploadError && (
              <p className="text-red-500 text-[10px] font-bold mt-1 text-center font-mono">{uploadError}</p>
            )}
          </div>

          {/* Location fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="form-location-selectors">
            <div>
              <label htmlFor="form-country" className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5 font-mono">
                <Globe className="w-4 h-4 text-slate-400" />
                <span>{t('city.countryLabel')}</span>
              </label>
              <select
                id="form-country"
                required
                value={selectedCountry}
                onChange={handleCountryChange}
                className="w-full h-11 border border-slate-200 rounded-xl px-3 text-slate-700 bg-slate-50/50 hover:bg-slate-50 transition-all font-semibold outline-none text-sm"
              >
                <option value="">-- Country --</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="form-city" className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5 font-mono">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{t('city.cityLabel')}</span>
              </label>
              <select
                id="form-city"
                required
                disabled={!selectedCountry}
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full h-11 border border-slate-200 rounded-xl px-3 text-slate-700 bg-slate-50/50 hover:bg-slate-50 transition-all font-semibold outline-none text-sm"
              >
                <option value="">-- City --</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Name field */}
          <div id="form-name-wrapper">
            <label htmlFor="form-name" className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5 font-mono">
              <User className="w-4 h-4 text-slate-400" />
              <span>{t('community.nameLabel')}</span>
            </label>
            <input
              type="text"
              id="form-name"
              placeholder={t('community.namePlaceholder')}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full h-11 border border-slate-200 rounded-xl px-4 text-slate-700 bg-slate-50/50 hover:bg-slate-50 transition-all font-medium outline-none text-sm"
            />
          </div>

          {/* Location Description */}
          <div id="form-location-desc-wrapper">
            <label htmlFor="form-location-desc" className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5 font-mono">
              <Building className="w-4 h-4 text-slate-400" />
              <span>{t('community.locationLabel')}</span>
            </label>
            <input
              type="text"
              id="form-location-desc"
              placeholder={t('community.locationPlaceholder')}
              value={locationDescription}
              onChange={(e) => setLocationDescription(e.target.value)}
              className="w-full h-11 border border-slate-200 rounded-xl px-4 text-slate-700 bg-slate-50/50 hover:bg-slate-50 transition-all font-medium outline-none text-sm"
            />
          </div>

          {/* Additional Notes */}
          <div id="form-notes-wrapper">
            <label htmlFor="form-notes" className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5 font-mono">
              <FileText className="w-4 h-4 text-slate-400" />
              <span>{t('community.descriptionLabel')}</span>
            </label>
            <textarea
              id="form-notes"
              rows={2}
              placeholder={t('community.descriptionPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-3 text-slate-700 bg-slate-50/50 hover:bg-slate-50 transition-all font-medium outline-none text-sm"
            />
          </div>

          {/* CTA Buttons */}
          <div className="pt-2 flex flex-col gap-2" id="form-ctas">
            <button
              type="submit"
              id="form-submit"
              disabled={!selectedCountry || !selectedCity}
              className={`w-full h-11 rounded-xl font-bold transition-all duration-300 text-sm flex items-center justify-center gap-2 ${
                selectedCountry && selectedCity
                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>{t('community.submitButton')}</span>
            </button>
            <button
              type="button"
              id="form-cancel"
              onClick={onCancel}
              className="w-full py-2.5 text-center text-slate-400 hover:text-slate-700 text-xs font-semibold font-mono"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {phase === 'submitting' && (
        <div id="form-submitting-state" className="flex flex-col items-center justify-center py-12 text-center">
          <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-slate-700 font-bold text-base leading-tight">{t('community.submitting')}</p>
          <p className="text-slate-400 text-xs mt-1">Analyzing water elements with Gemini AI...</p>
        </div>
      )}

      {phase === 'success' && (
        <div id="form-success-state" className="flex flex-col items-center justify-center py-10 text-center animate-fade-in">
          <div className="h-16 w-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-500 flex items-center justify-center text-2xl font-bold mb-4 shadow-md shadow-emerald-100">
            ✓
          </div>
          <h4 className="text-slate-900 font-black text-xl mb-1">{t('community.successTitle')}</h4>
          <p className="text-slate-500 text-sm max-w-xs mx-auto leading-relaxed">{t('community.successMessage')}</p>
        </div>
      )}

      {phase === 'error' && (
        <div id="form-error-state" className="text-center py-8 animate-fade-in">
          <div className="h-14 w-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4 text-red-500">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h4 className="text-slate-800 font-bold text-lg mb-2">Upload Failed</h4>
          <p className="text-slate-500 text-sm leading-relaxed mb-6 px-4">{apiErrorMessage}</p>
          <div className="space-y-2">
            <button
              id="form-retry-btn"
              onClick={() => setPhase('form')}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry Submission</span>
            </button>
            <button
              id="form-error-cancel"
              onClick={onCancel}
              className="w-full py-2.5 text-slate-400 hover:text-slate-600 text-xs font-semibold font-mono"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
