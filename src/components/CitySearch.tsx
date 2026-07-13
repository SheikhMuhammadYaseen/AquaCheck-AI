/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { listCountries, getCitiesInCountry } from '../lib/cityData';
import { useT } from '../lib/locale';
import { Globe, MapPin, Search, Lightbulb, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface CitySearchProps {
  onSearch: (country: string, city: string) => void;
  isLoading: boolean;
}

interface SearchableSelectProps {
  id: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder: string;
  disabled?: boolean;
  searchPlaceholder?: string;
  icon?: React.ReactNode;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  id,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  searchPlaceholder = 'Search...',
  icon,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full" id={`${id}-custom-dropdown`}>
      {/* Selector Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-12 border border-slate-200 hover:border-slate-300 rounded-2xl px-4 flex items-center justify-between text-left bg-slate-50/50 hover:bg-slate-50/80 transition-all duration-300 focus:border-blue-500 focus:bg-white outline-none font-semibold text-sm ${
          disabled ? 'opacity-50 cursor-not-allowed bg-slate-100/60' : 'cursor-pointer'
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          {icon && <span className="text-slate-400">{icon}</span>}
          <span className={`truncate ${value ? 'text-slate-700 font-bold' : 'text-slate-400 font-semibold'}`}>
            {value || placeholder}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-50 w-full bg-white border border-slate-100 rounded-2xl shadow-2xl p-2 flex flex-col gap-1.5"
          >
            {/* Search Input Box */}
            <div className="relative flex items-center px-2.5 py-1.5 bg-slate-50/80 rounded-xl border border-slate-100/80 focus-within:border-blue-200 focus-within:bg-white transition-colors">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent px-2 py-0.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none font-semibold"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 hover:bg-slate-200/50 rounded-full shrink-0"
                >
                  <X className="w-3 h-3 text-slate-400 hover:text-slate-600" />
                </button>
              )}
            </div>

            {/* List of Options */}
            <div className="max-h-48 overflow-y-auto flex flex-col gap-0.5 pr-1 scrollbar-thin">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => {
                  const isSelected = option === value;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleSelect(option)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-600 hover:bg-slate-50/80 hover:text-slate-950'
                      }`}
                    >
                      <span className="truncate">{option}</span>
                      {isSelected && (
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-4 text-xs text-slate-400 italic font-medium">
                  No results found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const CitySearch: React.FC<CitySearchProps> = ({ onSearch, isLoading }) => {
  const t = useT();

  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  const countries = listCountries();
  const cities = selectedCountry ? getCitiesInCountry(selectedCountry) : [];

  const handleCountryChange = (val: string) => {
    setSelectedCountry(val);
    setSelectedCity('');
  };

  const handleCityChange = (val: string) => {
    setSelectedCity(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCountry && selectedCity && !isLoading) {
      onSearch(selectedCountry, selectedCity);
    }
  };

  const isFormValid = selectedCountry && selectedCity;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 sm:p-8 max-w-lg mx-auto" id="city-search-card">
      <form onSubmit={handleSubmit} className="space-y-4" id="city-search-form">
        
        {/* Country Selector */}
        <div id="country-select-wrapper">
          <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-mono">
            <Globe className="w-4 h-4 text-slate-400" />
            <span>{t('city.countryLabel')}</span>
          </label>
          <SearchableSelect
            id="country-select"
            value={selectedCountry}
            onChange={handleCountryChange}
            options={countries}
            placeholder={`-- ${t('city.selectCountry')} --`}
            disabled={isLoading}
            searchPlaceholder="Search country..."
          />
        </div>

        {/* City Selector */}
        <div id="city-select-wrapper">
          <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-mono">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>{t('city.cityLabel')}</span>
          </label>
          <SearchableSelect
            id="city-select"
            value={selectedCity}
            onChange={handleCityChange}
            options={cities}
            placeholder={!selectedCountry ? `-- ${t('city.selectCountryFirst')} --` : `-- ${t('city.selectCity')} --`}
            disabled={!selectedCountry || isLoading}
            searchPlaceholder="Search city..."
          />
        </div>

        {/* Search button */}
        <button
          type="submit"
          id="city-search-submit"
          disabled={!isFormValid || isLoading}
          className={`w-full h-12 rounded-2xl font-bold transition-all duration-300 text-sm flex items-center justify-center gap-2 shadow-lg mt-6 ${
            isFormValid && !isLoading
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100 hover:scale-[1.01] cursor-pointer'
              : 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed border border-slate-100'
          }`}
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-slate-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>{t('city.checkingButton')}</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4 text-white" />
              <span>{t('city.checkButton')}</span>
            </>
          )}
        </button>

      </form>

      {/* Suggestion hint */}
      <div className="flex items-start gap-2 mt-4 px-4 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
        <p className="text-[11px] text-slate-500 italic text-left leading-relaxed font-semibold">
          {t('city.dontSeeCity')}
        </p>
      </div>
    </div>
  );
};
