/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MapPin, RotateCcw } from 'lucide-react';
import { CitySearch } from './CitySearch';
import { CityReport } from './CityReport';
import { CityWaterData } from '../types/city';
import { useT } from '../lib/locale';

interface CityCheckerProps {
  initialSearch?: { country: string; city: string };
  onSearchCompleted?: () => void;
}

export const CityChecker: React.FC<CityCheckerProps> = ({ initialSearch, onSearchCompleted }) => {
  const t = useT();

  const [phase, setPhase] = useState<'search' | 'loading' | 'result' | 'notfound' | 'error'>('search');
  const [result, setResult] = useState<{ data: CityWaterData; summary: string } | null>(null);
  const [suggestions, setSuggestions] = useState<{ country: string; city: string }[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto search based on parameters or prop
  useEffect(() => {
    if (initialSearch) {
      handleSearch(initialSearch.country, initialSearch.city);
    } else if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const country = params.get('country');
      const city = params.get('city');
      if (country && city) {
        handleSearch(country, city);
        // Clear params to prevent persistent reload triggering
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [initialSearch]);

  const handleSearch = async (country: string, city: string) => {
    setPhase('loading');
    setErrorMessage('');
    setSuggestions([]);

    try {
      const url = `/api/city?country=${encodeURIComponent(country)}&city=${encodeURIComponent(city)}`;
      const response = await fetch(url);
      const json = await response.json();

      if (response.status === 200 && json.success) {
        setResult({ data: json.data, summary: json.summary });
        setPhase('result');
        if (onSearchCompleted) onSearchCompleted();
      } else if (response.status === 404) {
        setSuggestions(json.suggestions || []);
        setPhase('notfound');
      } else {
        setErrorMessage(json.error || t('errors.genericError'));
        setPhase('error');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(t('errors.genericError'));
      setPhase('error');
    }
  };

  const handleReset = () => {
    setResult(null);
    setSuggestions([]);
    setPhase('search');
  };

  return (
    <div className={`w-full mx-auto transition-all duration-300 ${phase === 'result' ? 'max-w-4xl' : 'max-w-lg'}`} id="city-checker-main">
      {phase === 'search' && (
        <CitySearch onSearch={handleSearch} isLoading={false} />
      )}

      {phase === 'loading' && (
        <div id="city-loading" className="bg-white rounded-3xl border border-slate-100 shadow-xl p-8 text-center flex flex-col items-center justify-center min-h-[220px]">
          <svg className="animate-spin h-8 w-8 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-slate-500 font-semibold text-sm">Looking up water database...</p>
        </div>
      )}

      {phase === 'result' && result && (
        <div id="city-result-view">
          <CityReport data={result.data} summary={result.summary} />
          <button
            id="city-search-another"
            onClick={handleReset}
            className="w-full h-11 bg-slate-900 hover:bg-black text-white font-semibold rounded-2xl transition-all duration-300 text-sm shadow-md mt-4 max-w-lg mx-auto flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t('city.searchAnother')}</span>
          </button>
        </div>
      )}

      {phase === 'notfound' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 text-center animate-fade-in" id="city-notfound-view">
          <div className="h-14 w-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4 text-amber-500">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h4 className="text-slate-800 font-bold text-lg mb-2">{t('city.notAvailableTitle')}</h4>
          
          {suggestions.length > 0 && (
            <div className="my-6" id="city-suggestions-wrapper">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3 font-mono">{t('city.suggestionsText')}</p>
              <div className="flex flex-col gap-2 justify-center max-w-xs mx-auto">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    id={`suggestion-btn-${idx}`}
                    onClick={() => handleSearch(s.country, s.city)}
                    className="px-4 py-2 border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold rounded-2xl transition-all duration-200 cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    <span>{s.city}, {s.country}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            id="city-notfound-reset"
            onClick={handleReset}
            className="w-full h-11 bg-slate-900 hover:bg-black text-white font-semibold rounded-2xl transition-all duration-300 text-sm flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t('city.searchAnother')}</span>
          </button>
        </div>
      )}

      {phase === 'error' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 text-center animate-fade-in" id="city-error-view">
          <div className="h-14 w-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4 text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h4 className="text-slate-800 font-bold text-lg mb-2">Search Failed</h4>
          <p className="text-slate-500 text-sm leading-relaxed mb-6 px-4">{errorMessage}</p>
          <button
            id="city-error-retry"
            onClick={handleReset}
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all duration-300 flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      )}
    </div>
  );
};
