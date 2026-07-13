/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CommunityReport } from '../types/report';
import { useT } from '../lib/locale';
import { AlertCircle } from 'lucide-react';

interface CommunityMapProps {
  refreshTrigger: number;
  onSelectCityFilter: (country: string, city: string) => void;
}

export const CommunityMap: React.FC<CommunityMapProps> = ({ refreshTrigger, onSelectCityFilter }) => {
  const t = useT();
  const [clusters, setClusters] = useState<{ country: string; city: string; count: number; minScore: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClusters = async () => {
      try {
        const response = await fetch('/api/reports?limit=100'); // load all recent reports to compute clusters
        const json = await response.json();

        if (json.success) {
          const rawReports = json.data as CommunityReport[];
          const map: Record<string, { country: string; city: string; count: number; scores: number[] }> = {};

          rawReports.forEach((r) => {
            const key = `${r.city}, ${r.country}`;
            if (!map[key]) {
              map[key] = { country: r.country, city: r.city, count: 0, scores: [] };
            }
            map[key].count += 1;
            map[key].scores.push(r.safety_score);
          });

          const compiled = Object.values(map).map((item) => ({
            country: item.country,
            city: item.city,
            count: item.count,
            minScore: Math.min(...item.scores),
          }));

          // Sort by report counts (highest first)
          compiled.sort((a, b) => b.count - a.count);
          setClusters(compiled);
        }
      } catch (err) {
        console.error("Failed to compute reporting clusters:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClusters();
  }, [refreshTrigger]);

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-md animate-pulse h-40 flex items-center justify-center text-slate-400 font-semibold" id="cluster-loading">
        Analyzing reporting clusters...
      </div>
    );
  }

  if (clusters.length === 0) {
    return null; // hide if no community data exists
  }

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-md" id="cluster-dashboard-container">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 font-mono flex items-center gap-1.5">
        <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" />
        <span>Active reporting clusters</span>
      </h3>
      <p className="text-xs text-slate-500 mb-4 font-medium leading-relaxed">
        These municipalities currently have active water-related complaints filed by local communities. Click any city to view its detailed logs.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" id="clusters-list">
        {clusters.slice(0, 4).map((c, idx) => {
          // Determine status color based on worst safety score recorded in community reports
          const isCritical = c.minScore <= 3;
          const statusBg = isCritical ? 'bg-rose-50 hover:bg-rose-100 border-rose-150' : 'bg-amber-50 hover:bg-amber-100 border-amber-150';
          const badgeText = isCritical ? 'CRITICAL SAFETY' : 'CAUTION';

          return (
            <button
              key={idx}
              id={`cluster-item-${idx}`}
              onClick={() => onSelectCityFilter(c.country, c.city)}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-300 flex justify-between items-center cursor-pointer hover:scale-[1.01] ${statusBg}`}
            >
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm leading-tight truncate max-w-[140px]">{c.city}</h4>
                <span className="text-[9px] font-bold uppercase tracking-wider font-mono opacity-60 block mt-0.5">{c.country}</span>
              </div>
              <div className="text-right flex flex-col items-end flex-shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black tracking-wider text-white ${isCritical ? 'bg-rose-500' : 'bg-amber-500'}`}>
                  {badgeText}
                </span>
                <span className="text-[10px] text-slate-500 font-mono font-bold mt-1.5">
                  {c.count} {c.count === 1 ? 'Report' : 'Reports'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
