/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { DiseaseBreakdownItem } from '../types/city';
import { useT } from '../lib/locale';
import { Leaf, Activity } from 'lucide-react';

interface DiseaseBreakdownProps {
  breakdown: DiseaseBreakdownItem[];
  cityName: string;
}

const BAR_COLORS = ['#EF4444', '#F59E0B', '#8B5CF6', '#3B82F6', '#10B981'];

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as DiseaseBreakdownItem;
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xl max-w-xs animate-fade-in" id="disease-tooltip">
        <p className="text-sm font-bold text-slate-800 leading-snug">{data.disease}</p>
        <p className="text-xs font-semibold text-rose-600 mt-1">
          ~{data.estimated_percent}% of water-related cases
        </p>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed border-t border-slate-50 pt-2">
          {data.description}
        </p>
      </div>
    );
  }
  return null;
};

export const DiseaseBreakdown: React.FC<DiseaseBreakdownProps> = ({ breakdown, cityName }) => {
  const t = useT();
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!breakdown || breakdown.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 text-center flex flex-col items-center justify-center" id="no-disease-data">
        <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 mb-2">
          <Leaf className="w-6 h-6" />
        </div>
        <p className="text-sm text-slate-500 font-medium">
          {t('city.noSignificantDisease')}
        </p>
      </div>
    );
  }

  const chartHeight = breakdown.length * 52 + 50;

  return (
    <div className="w-full" id="disease-breakdown-card">
      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 font-mono flex items-center gap-1.5">
        <Activity className="w-4 h-4 text-rose-500 animate-pulse" />
        <span>{t('city.diseaseBurdenTitle')}</span>
      </h3>
      
      <div className="w-full bg-slate-50/30 rounded-3xl border border-slate-100 p-2 sm:p-4" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={breakdown}
            layout="vertical"
            margin={{ top: 15, right: 15, left: isMobile ? -20 : -10, bottom: 5 }}
            id="disease-chart-recharts"
          >
            <defs>
              <linearGradient id="disease-grad-0" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f87171" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
              <linearGradient id="disease-grad-1" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
              <linearGradient id="disease-grad-2" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
              <linearGradient id="disease-grad-3" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
              <linearGradient id="disease-grad-4" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 4" horizontal={false} stroke="#f1f5f9" />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600, fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
              unit="%"
            />
            <YAxis
              dataKey="disease"
              type="category"
              width={isMobile ? 85 : 130}
              tick={{ fontSize: isMobile ? 9 : 11, fill: '#475569', fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', opacity: 0.5 }} />
            <Bar
              dataKey="estimated_percent"
              radius={[0, 8, 8, 0]}
              barSize={15}
              background={{ fill: '#f1f5f9', radius: 8 }}
            >
              {breakdown.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={`url(#disease-grad-${index % 5})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[10px] text-slate-300 italic text-center mt-3 leading-normal">
        {t('city.diseaseDisclaimer')}
      </p>
    </div>
  );
};
