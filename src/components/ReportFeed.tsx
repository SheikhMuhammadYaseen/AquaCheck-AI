/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ReportCard } from './ReportCard';
import { CommunityReport } from '../types/report';
import { useT } from '../lib/locale';
import { Newspaper, RotateCcw, Inbox } from 'lucide-react';

interface ReportFeedProps {
  onReportsCountChanged?: (count: number) => void;
  refreshTrigger: number;
}

export const ReportFeed: React.FC<ReportFeedProps> = ({ onReportsCountChanged, refreshTrigger }) => {
  const t = useT();

  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 6;

  useEffect(() => {
    fetchReports(true);
  }, [refreshTrigger]);

  const fetchReports = async (reset = false) => {
    setIsLoading(true);
    const currentOffset = reset ? 0 : offset;
    try {
      const url = `/api/reports?limit=${limit}&offset=${currentOffset}`;
      const response = await fetch(url);
      const json = await response.json();

      if (json.success) {
        if (reset) {
          setReports(json.data);
          setOffset(limit);
        } else {
          setReports((prev) => [...prev, ...json.data]);
          setOffset((prev) => prev + limit);
        }
        setTotalCount(json.count);
        if (onReportsCountChanged) {
          onReportsCountChanged(json.count);
        }
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFlagged = (flaggedId: string) => {
    // Optimistic UI updates - slide out or filter the flagged card immediately
    setReports((prev) => prev.filter((r) => r.id !== flaggedId));
    setTotalCount((prev) => Math.max(0, prev - 1));
    if (onReportsCountChanged) {
      onReportsCountChanged(Math.max(0, totalCount - 1));
    }
  };

  const handleLoadMore = () => {
    fetchReports(false);
  };

  const hasMore = reports.length < totalCount;

  return (
    <div className="space-y-4 w-full" id="community-reports-feed">
      <div className="flex justify-between items-center" id="feed-header-bar">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
          <Newspaper className="w-4 h-4 text-slate-400" />
          <span>Recent reports ({totalCount})</span>
        </h3>
        <button
          onClick={() => fetchReports(true)}
          id="refresh-feed-btn"
          className="text-xs text-blue-600 font-bold hover:underline font-mono cursor-pointer flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {reports.length === 0 && !isLoading ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center text-slate-400 font-medium flex flex-col items-center justify-center" id="empty-feed">
          <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 mb-2">
            <Inbox className="w-6 h-6" />
          </div>
          <p className="text-sm">No community logs posted yet. Be the first to share!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="reports-grid">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} onFlagged={handleFlagged} />
          ))}
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center items-center py-6" id="feed-loading-spinner">
          <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      {hasMore && !isLoading && (
        <button
          id="load-more-btn"
          onClick={handleLoadMore}
          className="w-full h-11 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 hover:text-slate-800 font-semibold rounded-2xl transition-all duration-300 text-sm flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
        >
          Load More Reports
        </button>
      )}
    </div>
  );
};
