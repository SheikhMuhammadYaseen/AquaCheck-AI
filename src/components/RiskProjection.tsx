/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { CityWaterData } from '../types/city';
import { RiskProjection as RiskProjectionType } from '../types/health';
import { useT } from '../lib/locale';
import { TrendingUp } from 'lucide-react';

interface RiskProjectionProps {
  cityData: CityWaterData;
  projection: RiskProjectionType | null;
  isLoading: boolean;
}

export const RiskProjection: React.FC<RiskProjectionProps> = ({
  cityData,
  projection,
  isLoading,
}) => {
  const t = useT();
  const current_year = new Date().getFullYear();

  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) {
    return (
      <div className="w-full" id="projection-loading">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 font-mono flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-blue-500 animate-pulse" />
          <span>{t('city.outlookTitle')}</span>
        </h3>
        <div className="h-48 bg-slate-100 rounded-3xl animate-pulse flex items-center justify-center text-slate-400 font-medium">
          Loading Outlook Data...
        </div>
      </div>
    );
  }

  if (!projection) {
    return (
      <div className="w-full text-center py-6 text-slate-400" id="projection-null">
        {t('errors.genericError')}
      </div>
    );
  }

  // Construct combined chart data smoothly
  const chartData: any[] = [];
  const yearsPushed = new Set<number>();

  // 1. Add historical trends
  if (cityData.historical_trend) {
    cityData.historical_trend.forEach((p) => {
      chartData.push({
        year: p.year,
        historical: p.population_percent_unsafe,
        projected: p.year === current_year ? p.population_percent_unsafe : null,
      });
      yearsPushed.add(p.year);
    });
  }

  // 2. Add future projections
  if (projection.projected_data) {
    projection.projected_data.forEach((p) => {
      if (p.year === current_year) {
        // Ensure connection point merges values
        const existing = chartData.find((item) => item.year === current_year);
        if (existing) {
          existing.projected = p.projected_percent_unsafe;
          existing.historical = p.projected_percent_unsafe;
        } else {
          chartData.push({
            year: p.year,
            historical: p.projected_percent_unsafe,
            projected: p.projected_percent_unsafe,
          });
        }
      } else {
        chartData.push({
          year: p.year,
          historical: null,
          projected: p.projected_percent_unsafe,
        });
      }
    });
  }

  // Sort chronologically
  chartData.sort((a, b) => a.year - b.year);

  // Setup risk level pill styles
  const getRiskStyles = (level: string) => {
    switch (level) {
      case 'IMPROVING':
        return { bg: 'bg-emerald-50 border-emerald-200 text-emerald-700', icon: '↑' };
      case 'WORSENING':
        return { bg: 'bg-rose-50 border-rose-200 text-rose-700', icon: '↓' };
      default:
        return { bg: 'bg-amber-50 border-amber-200 text-amber-700', icon: '→' };
    }
  };

  const riskStyles = getRiskStyles(cityData.future_risk_level);

  return (
    <div className="w-full" id="projection-view-section">
      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 font-mono flex items-center gap-1.5">
        <TrendingUp className="w-4 h-4 text-blue-500" />
        <span>{t('city.outlookTitle')}</span>
      </h3>

      {/* AREA GRADIENT CHART */}
      <div className="w-full bg-slate-50/30 rounded-3xl border border-slate-100 p-2 sm:p-4 h-60" id="projection-chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 15, right: isMobile ? 10 : 20, left: isMobile ? -20 : -10, bottom: 5 }} id="projection-recharts-area">
            <defs>
              <linearGradient id="colorHistorical" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.12}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 4" stroke="#f1f5f9" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: isMobile ? 9 : 10, fill: '#94a3b8', fontWeight: 600, fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: isMobile ? 9 : 10, fill: '#94a3b8', fontWeight: 600, fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
              unit="%"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const year = payload[0].payload.year;
                  const value = payload[0].value;
                  return (
                    <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-xl px-3 py-1.5 text-xs font-mono shadow-xl border border-slate-800">
                      <span className="font-bold">{year}</span>: <span className="text-blue-400 font-extrabold">{value}%</span> unsafe
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
            <ReferenceLine
              x={current_year}
              stroke="#2563eb"
              strokeDasharray="4 4"
              label={{ value: t('city.projectionLabel'), position: 'top', fill: '#2563eb', fontSize: 9, fontWeight: 700, fontFamily: 'monospace' }}
            />
            <Area
              type="monotone"
              dataKey="historical"
              stroke="#EF4444"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorHistorical)"
              dot={{ r: 4, stroke: '#EF4444', strokeWidth: 1.5, fill: '#ffffff' }}
              activeDot={{ r: 6, stroke: '#EF4444', strokeWidth: 2, fill: '#ffffff' }}
              name="Historical"
              connectNulls={false}
            />
            <Area
              type="monotone"
              dataKey="projected"
              stroke="#3B82F6"
              strokeWidth={3}
              strokeDasharray="5 5"
              fillOpacity={1}
              fill="url(#colorProjected)"
              dot={{ r: 3.5, stroke: '#3B82F6', strokeWidth: 1.5, fill: '#ffffff' }}
              activeDot={{ r: 5, stroke: '#3B82F6', strokeWidth: 2, fill: '#ffffff' }}
              name="Projected"
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* RISK LEVEL BADGE */}
      <div className="flex flex-wrap items-center gap-2 mt-4" id="future-risk-level">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
          {t('city.futureRisk')}:
        </span>
        <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 font-title ${riskStyles.bg}`}>
          <span>{riskStyles.icon}</span>
          <span>{cityData.future_risk_level}</span>
        </span>
      </div>

      {/* AI OUTLOOK NARRATIVE BOX */}
      {projection.narrative && (
        <div className="bg-slate-50/70 hover:bg-slate-50 border border-slate-100 rounded-2xl p-4 mt-3 transition-colors duration-300" id="outlook-narrative-box">
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            {projection.narrative}
          </p>
        </div>
      )}

      <p className="text-[10px] text-slate-300 italic text-center mt-3 leading-normal">
        {t('city.projectionDisclaimer')}
      </p>
    </div>
  );
};
