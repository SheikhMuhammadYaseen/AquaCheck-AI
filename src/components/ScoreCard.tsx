/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WaterAnalysis } from '../types/analysis';
import { getScoreColors, getScoreLabel } from '../lib/scoring';
import { useT } from '../lib/locale';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  FlaskConical, 
  Lightbulb, 
  Award, 
  Info,
  Droplets,
  CloudLightning,
  Sparkles
} from 'lucide-react';

interface ScoreCardProps {
  analysis: WaterAnalysis;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ analysis }) => {
  const t = useT();
  const colors = getScoreColors(analysis.score);
  const label = getScoreLabel(analysis.score);

  // Score circle animation parameters
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius; // ~314.16
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    // Stagger animation slightly for a premium feel
    const timer = setTimeout(() => {
      const calculatedOffset = circumference - (analysis.score / 10) * circumference;
      setOffset(calculatedOffset);
    }, 150);
    return () => clearTimeout(timer);
  }, [analysis.score, circumference]);

  // Determine verdict icon
  const getVerdictIcon = (verdict: string) => {
    const vUpper = verdict.toUpperCase();
    if (vUpper.includes('SAFE')) {
      return <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />;
    }
    if (vUpper.includes('CAUTION') || vUpper.includes('BOIL')) {
      return <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />;
    }
    return <XCircle className="w-6 h-6 text-red-500 shrink-0" />;
  };

  return (
    <div className="bg-white rounded-[40px] border-4 border-white shadow-2xl shadow-blue-200/40 p-6 sm:p-8 max-w-lg mx-auto animate-fade-in" id="score-card-view">
      
      {/* SCORE CIRCLE GAUGE */}
      <div className="flex flex-col items-center justify-center mb-6" id="score-radial-gauge">
        <div className="relative h-32 w-32 flex items-center justify-center">
          <svg className="absolute transform -rotate-90 h-full w-full" viewBox="0 0 120 120">
            {/* Background track circle */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              className="stroke-blue-50/50"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Animated gauge circle */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              stroke={colors.hex}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="text-center z-10">
            <span className="text-4xl font-black font-title tracking-tight" style={{ color: colors.hex }}>
              {analysis.score}
            </span>
            <span className="text-blue-950/40 font-bold font-mono text-xs block mt-0.5">/ 10</span>
          </div>
        </div>
        <p className="text-[10px] text-blue-900/50 uppercase tracking-widest font-black mt-3 font-mono">
          {t('score.scoreLabel')} ({label})
        </p>
      </div>

      {/* VERDICT BOX */}
      <div
        id="verdict-banner"
        className={`w-full rounded-2xl p-4 text-center mb-6 font-extrabold text-base flex items-center justify-center gap-2.5 border-2 shadow-md shadow-blue-100/35 transition-all duration-300 ${colors.badge} ${colors.border}`}
      >
        {getVerdictIcon(analysis.verdict)}
        <span className="tracking-tight font-title text-blue-950">{analysis.verdict}</span>
      </div>

      {/* PARAMETERS DETAILS GRID */}
      <div className="grid grid-cols-2 gap-3 mb-6" id="water-parameters-grid">
        <div className="bg-blue-50/40 rounded-2xl p-3.5 border border-blue-100/50 hover:bg-blue-50/80 transition-colors duration-300">
          <span className="text-[9px] text-blue-900/50 uppercase tracking-wider font-extrabold block">{t('score.color')}</span>
          <span className="text-sm font-black text-blue-950 mt-1 block truncate capitalize">{analysis.color_detected}</span>
        </div>
        <div className="bg-blue-50/40 rounded-2xl p-3.5 border border-blue-100/50 hover:bg-blue-50/80 transition-colors duration-300">
          <span className="text-[9px] text-blue-900/50 uppercase tracking-wider font-extrabold block">{t('score.turbidity')}</span>
          <span className="text-sm font-black text-blue-950 mt-1 block truncate capitalize">{analysis.turbidity.toLowerCase()}</span>
        </div>
        <div className="bg-blue-50/40 rounded-2xl p-3.5 border border-blue-100/50 hover:bg-blue-50/80 transition-colors duration-300">
          <span className="text-[9px] text-blue-900/50 uppercase tracking-wider font-extrabold block">{t('score.sediment')}</span>
          <span className="text-sm font-black text-blue-950 mt-1 block truncate capitalize">{analysis.sediment.toLowerCase()}</span>
        </div>
        <div className="bg-blue-50/40 rounded-2xl p-3.5 border border-blue-100/50 hover:bg-blue-50/80 transition-colors duration-300">
          <span className="text-[9px] text-blue-900/50 uppercase tracking-wider font-extrabold block">{t('score.foam')}</span>
          <span className="text-sm font-black text-blue-950 mt-1 block truncate capitalize">{analysis.foam.toLowerCase()}</span>
        </div>
      </div>

      {/* CONTAMINANTS PILLS */}
      <div className="mb-6" id="contaminants-section">
        <h4 className="text-[10px] font-black text-blue-900/50 uppercase tracking-wider mb-2.5 font-mono flex items-center gap-1.5">
          <FlaskConical className="w-4 h-4 text-blue-600" />
          <span>{t('score.contaminants')}</span>
        </h4>
        {analysis.likely_contaminants.length === 0 ? (
          <p className="text-xs text-blue-900/40 italic font-medium">{t('score.noneDetected')}</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {analysis.likely_contaminants.map((cont, i) => (
              <span
                key={i}
                className="bg-blue-50 text-blue-700 border border-blue-100 text-[11px] px-3 py-1 rounded-full font-extrabold transition-colors cursor-default"
              >
                {cont}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* HEALTH RISKS */}
      <div className="mb-6" id="health-risks-section">
        <h4 className="text-[10px] font-black text-red-500 uppercase tracking-wider mb-2.5 font-mono flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
          <span>{t('score.healthRisks')}</span>
        </h4>
        {analysis.health_risks.length === 0 ? (
          <p className="text-xs text-blue-900/40 italic font-medium">{t('score.noRisks')}</p>
        ) : (
          <ul className="space-y-1.5">
            {analysis.health_risks.map((risk, i) => (
              <li key={i} className="text-xs text-red-700 flex items-start gap-2 font-semibold">
                <span className="text-red-400 mt-1.5 h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0 animate-ping" />
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* RECOMMENDATION ACTION BOX */}
      <div className="border-l-4 border-blue-500 bg-blue-50/50 hover:bg-blue-50/80 rounded-r-2xl p-4 mb-6 transition-colors duration-300 shadow-sm" id="recommendation-box">
        <h4 className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1 font-mono flex items-center gap-1.5">
          <Lightbulb className="w-4 h-4 text-blue-500 animate-pulse" />
          <span>{t('score.whatToDo')}</span>
        </h4>
        <p className="text-xs sm:text-sm text-blue-950 leading-relaxed font-black">
          {analysis.recommendation}
        </p>
      </div>

      {/* CONFIDENCE & SYSTEM DISCLAIMER */}
      <div className="pt-4 border-t border-blue-100/50 text-center" id="confidence-and-disclaimer">
        <div className="flex items-center justify-center gap-1.5 text-xs text-blue-900/60 font-semibold">
          <span>{t('score.confidence')}:</span>
          <span
            className={`font-extrabold uppercase tracking-wide ${
              analysis.analysis_confidence === 'HIGH'
                ? 'text-emerald-500'
                : analysis.analysis_confidence === 'MEDIUM'
                ? 'text-amber-500'
                : 'text-red-500'
            }`}
          >
            {analysis.analysis_confidence}
          </span>
        </div>
        <p className="text-[9px] text-blue-900/40 italic mt-3 leading-relaxed font-semibold">
          <strong>{t('score.disclaimerTitle')}:</strong> {t('score.disclaimerText')}
        </p>
      </div>

    </div>
  );
};
