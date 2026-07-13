/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MapPin, Lightbulb, FlaskConical, Info } from 'lucide-react';
import { CityWaterData } from '../types/city';
import { WaterColorSwatch } from './WaterColorSwatch';
import { getScoreColors, getScoreLabel } from '../lib/scoring';
import { HealthCharts } from './HealthCharts';
import { useT } from '../lib/locale';

interface CityReportProps {
  data: CityWaterData;
  summary: string;
}

export const CityReport: React.FC<CityReportProps> = ({ data, summary }) => {
  const t = useT();
  const colors = getScoreColors(data.safety_score);
  const label = getScoreLabel(data.safety_score);

  // Score circle animation parameters
  const radius = 30;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius; // ~188.5
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => {
      const calculatedOffset = circumference - (data.safety_score / 10) * circumference;
      setOffset(calculatedOffset);
    }, 150);
    return () => clearTimeout(timer);
  }, [data.safety_score, circumference]);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 sm:p-8 max-w-4xl mx-auto animate-fade-in" id="city-report-view">
      
      {/* 1. HEADER: City + Country name */}
      <div className="text-center sm:text-left mb-6" id="report-header">
        <h2 className="text-3xl font-extrabold font-title tracking-tight text-slate-900 leading-tight">
          {data.city}
        </h2>
        <p className="text-sm font-semibold text-slate-400 mt-1 uppercase tracking-wider font-mono flex items-center justify-center sm:justify-start gap-1">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span>{data.country}</span>
        </p>
      </div>

      {/* Responsive Grid Layout for PC */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start" id="report-bento-grid-wrapper">
        
        {/* LEFT COLUMN: Summary, Color Swatch, Contaminants, Notes */}
        <div className="space-y-6">
          {/* 2. SCORE + SWATCH ROW */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5 p-4 rounded-3xl border border-slate-100/50 bg-slate-50/20" id="score-swatch-panel">
            {/* Score gauge container */}
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 flex items-center justify-center">
                <svg className="absolute transform -rotate-90 h-full w-full" viewBox="0 0 80 80">
                  <defs>
                    <linearGradient id="score-radial-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={colors.hex} />
                      <stop offset="100%" stopColor={colors.hex} stopOpacity="0.6" />
                    </linearGradient>
                  </defs>
                  <circle cx="40" cy="40" r={radius} className="stroke-slate-100" strokeWidth={strokeWidth} fill="none" />
                  <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    stroke="url(#score-radial-gradient)"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                  {/* Scientific nested notched guide line */}
                  <circle
                    cx="40"
                    cy="40"
                    r={radius - 5}
                    className="stroke-slate-200/50"
                    strokeWidth="0.5"
                    strokeDasharray="2 3"
                    fill="none"
                  />
                </svg>
                <div className="text-center z-10 flex flex-col items-center">
                  <span className="text-xl font-black font-title tracking-tighter leading-none" style={{ color: colors.hex }}>
                    {data.safety_score}
                  </span>
                  <span className="text-slate-400 text-[9px] font-bold font-mono tracking-widest mt-0.5">/10</span>
                </div>
              </div>
              <div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-black border uppercase tracking-wider font-mono ${colors.badge} ${colors.border}`}>
                  {data.safety_label}
                </span>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 font-mono">
                  {label}
                </p>
              </div>
            </div>

            {/* Swatch rendering */}
            <WaterColorSwatch hex={data.typical_color_hex} label={data.typical_color} />
          </div>

          {/* 3. AI SUMMARY BOX */}
          <div className="border-l-4 border-blue-500 bg-blue-50/40 hover:bg-blue-50/60 rounded-r-2xl p-4 transition-colors duration-300" id="ai-summary-card">
            <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1.5 font-mono flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-blue-500 animate-pulse" />
              <span>{t('score.whatToDo')}</span>
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed font-semibold">
              {summary}
            </p>
          </div>

          {/* 5. CONTAMINANTS */}
          <div id="city-contaminants" className="bg-slate-50/30 p-5 rounded-3xl border border-slate-100/50">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 font-mono flex items-center gap-1.5">
              <FlaskConical className="w-4 h-4 text-slate-500" />
              <span>{t('score.contaminants')}</span>
            </h4>
            {data.common_contaminants.length === 0 ? (
              <p className="text-sm text-slate-400 italic">{t('city.notAvailableTitle')}</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {data.common_contaminants.map((cont, i) => (
                  <span
                    key={i}
                    className="bg-white hover:bg-slate-50 border border-slate-200/60 text-slate-600 text-xs px-2.5 py-0.5 rounded-full font-medium transition-colors shadow-sm"
                  >
                    {cont}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 6. GENERAL NOTES */}
          {data.notes && (
            <div className="bg-amber-50/40 border border-amber-100/60 rounded-2xl p-3.5 text-xs text-amber-800 leading-relaxed flex items-start gap-2" id="city-notes">
              <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>{data.notes}</span>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Statistics Bento & Health Projections */}
        <div className="space-y-6">
          {/* 4. STATS BENTO GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5" id="stats-bento-grid">
            <div className="bg-slate-50/60 rounded-2xl p-3.5 border border-slate-100/50 flex flex-col justify-between">
              <div>
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold block font-mono leading-tight">{t('city.popUnsafe')}</span>
                <span className="text-2xl font-black font-title text-slate-800 mt-1 block">
                  {data.population_percent_unsafe}%
                </span>
              </div>
              {/* Custom Mini Progress Track Graphic */}
              <div className="w-full bg-slate-200/50 rounded-full h-1.5 mt-2.5 overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000 ease-out bg-amber-500" 
                  style={{ width: `${data.population_percent_unsafe}%` }} 
                />
              </div>
            </div>

            <div className="bg-slate-50/60 rounded-2xl p-3.5 border border-slate-100/50 flex flex-col justify-between">
              <div>
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold block font-mono leading-tight">{t('city.estimatedDeaths')}</span>
                <span className="text-2xl font-black font-title text-slate-800 mt-1 block">
                  {data.estimated_yearly_deaths ? data.estimated_yearly_deaths.toLocaleString() : 'N/A'}
                </span>
              </div>
              {/* Custom Mini Dot Severity Graphic */}
              <div className="flex items-center gap-1 mt-2.5">
                {Array.from({ length: 5 }).map((_, i) => {
                  const severity = data.estimated_yearly_deaths ? (data.estimated_yearly_deaths > 10000 ? 5 : data.estimated_yearly_deaths > 5000 ? 4 : data.estimated_yearly_deaths > 2000 ? 3 : 2) : 1;
                  const isActive = i < severity;
                  return (
                    <span 
                      key={i} 
                      className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-rose-500 animate-pulse' : 'bg-slate-200'}`} 
                    />
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-50/60 rounded-2xl p-3.5 border border-slate-100/50 flex flex-col justify-between">
              <div>
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold block font-mono leading-tight">{t('city.economicLoss')}</span>
                <span className="text-2xl font-black font-title text-slate-800 mt-1 block">
                  {data.economic_loss_usd_millions ? `$${data.economic_loss_usd_millions}M` : 'N/A'}
                </span>
              </div>
              {/* Custom economic bar graphic */}
              <div className="w-full bg-slate-200/50 rounded-full h-1.5 mt-2.5 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-blue-500" 
                  style={{ width: `${Math.min(100, (data.economic_loss_usd_millions || 0) * 1.5)}%` }} 
                />
              </div>
            </div>

            <div className="bg-slate-50/60 rounded-2xl p-3.5 border border-slate-100/50 flex flex-col justify-between">
              <div>
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold block font-mono leading-tight">{t('city.childrenDeaths')}</span>
                <span className="text-2xl font-black font-title text-slate-800 mt-1 block">
                  {data.children_under5_deaths ? data.children_under5_deaths.toLocaleString() : 'N/A'}
                </span>
              </div>
              {/* Custom graphic badge */}
              <div className="mt-2 text-[8px] font-mono font-bold text-rose-500 bg-rose-50 border border-rose-100/60 rounded-lg px-1.5 py-0.5 w-max">
                UNDER-5 BURDEN
              </div>
            </div>

            <div className="bg-slate-50/60 rounded-2xl p-3 border border-slate-100/50 col-span-1 sm:col-span-2 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold block font-mono">{t('city.primarySource')}</span>
                <span className="text-xs font-bold text-slate-700 mt-1 block leading-normal">{data.primary_source_type}</span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-1 bg-slate-200/50 text-slate-600 rounded-lg">
                TAP WATER
              </span>
            </div>
          </div>

          {/* 7. HEALTH CHARTS */}
          <div className="bg-slate-50/30 p-4 rounded-3xl border border-slate-100/50">
            <HealthCharts cityData={data} />
          </div>
        </div>
      </div>

      {/* 8. DATA SOURCE CITATION */}
      <div className="pt-4 mt-6 border-t border-slate-100 text-center text-[10px] text-slate-300 font-mono" id="city-source-citation">
        {t('city.sourceCitation')}: {data.data_source} ({data.last_updated})
      </div>

    </div>
  );
};
