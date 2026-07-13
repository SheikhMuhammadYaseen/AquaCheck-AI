/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DiseaseBreakdown } from './DiseaseBreakdown';
import { RiskProjection } from './RiskProjection';
import { CityWaterData } from '../types/city';
import { RiskProjection as RiskProjectionType } from '../types/health';
import { useT } from '../lib/locale';
import { AlertTriangle } from 'lucide-react';

interface HealthChartsProps {
  cityData: CityWaterData;
}

export const HealthCharts: React.FC<HealthChartsProps> = ({ cityData }) => {
  const t = useT();

  const [projection, setProjection] = useState<RiskProjectionType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setHasError(false);
    setProjection(null);

    const fetchProjection = async () => {
      try {
        const url = `/api/projection?country=${encodeURIComponent(cityData.country)}&city=${encodeURIComponent(cityData.city)}`;
        const res = await fetch(url);
        const json = await res.json();

        if (active) {
          if (json.success) {
            setProjection(json.data);
          } else {
            setHasError(true);
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.error("HealthCharts Fetch Error:", err);
        if (active) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    fetchProjection();

    return () => {
      active = false;
    };
  }, [cityData.city, cityData.country]);

  return (
    <div className="space-y-6 w-full mt-6 pt-6 border-t border-slate-100" id="health-charts-container">
      {/* 1. Disease Burden Breakdown */}
      <DiseaseBreakdown breakdown={cityData.disease_breakdown} cityName={cityData.city} />

      {/* Modern visual divider */}
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 border-t border-slate-100" />
        <span className="text-[10px] text-slate-300 uppercase tracking-widest font-bold font-mono">
          {t('city.outlookLabel')}
        </span>
        <div className="flex-1 border-t border-slate-100" />
      </div>

      {/* 2. 10-Year Public Safety Trend Projection */}
      {hasError ? (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>{t('errors.genericError')}</span>
        </div>
      ) : (
        <RiskProjection cityData={cityData} projection={projection} isLoading={isLoading} />
      )}
    </div>
  );
};
