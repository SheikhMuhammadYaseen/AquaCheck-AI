/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, MapPin, ShieldCheck, MessageSquare, FlaskConical, Flag } from 'lucide-react';
import { CommunityReport } from '../types/report';
import { getScoreColors, getScoreLabel } from '../lib/scoring';
import { useT } from '../lib/locale';

interface ReportCardProps {
  report: CommunityReport;
  onFlagged: (id: string) => void;
}

export const ReportCard: React.FC<ReportCardProps> = ({ report, onFlagged }) => {
  const t = useT();
  const [isFlagging, setIsFlagging] = useState(false);
  const [isFlagged, setIsFlagged] = useState(false);

  const colors = getScoreColors(report.safety_score);
  const scoreLabel = getScoreLabel(report.safety_score);

  const formattedDate = new Date(report.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const handleFlag = async () => {
    if (isFlagging || isFlagged) return;
    setIsFlagging(true);

    try {
      const response = await fetch(`/api/reports/${report.id}/flag`, {
        method: 'PATCH',
      });
      const json = await response.json();

      if (json.success) {
        setIsFlagged(true);
        setTimeout(() => {
          onFlagged(report.id);
        }, 1500);
      }
    } catch (err) {
      console.error("Flagging report failed:", err);
    } finally {
      setIsFlagging(false);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-5 sm:p-6 shadow-md hover:shadow-lg transition-shadow duration-300 relative animate-fade-in" id={`report-card-${report.id}`}>
      
      {/* 1. CARD TOP HEADER */}
      <div className="flex justify-between items-start gap-3 mb-4" id="card-top-header">
        <div>
          <h4 className="font-extrabold text-slate-800 text-sm leading-tight flex items-center gap-1.5">
            <User className="w-4 h-4 text-slate-400" />
            <span>{report.display_name}</span>
          </h4>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-1 font-mono flex flex-wrap items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{report.city}, {report.country}</span>
            {report.location_description && (
              <span className="text-slate-500 font-sans font-semibold capitalize"> ({report.location_description})</span>
            )}
          </p>
        </div>
        <span className="text-[10px] text-slate-300 font-bold font-mono">{formattedDate}</span>
      </div>

      {/* 2. OPTIONAL ATTACHED IMAGE */}
      {report.image_url && (
        <div className="rounded-2xl overflow-hidden mb-4 border border-slate-100 shadow-inner max-h-56" id="card-photo">
          <img
            src={report.image_url}
            alt="User sample"
            className="w-full h-full object-cover rounded-2xl"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* 3. VERDICT BAR (IF ANALYZED) */}
      <div
        className={`rounded-2xl p-3 border mb-4 flex items-center justify-between gap-3 text-xs font-bold ${colors.badge} ${colors.border}`}
        id="card-verdict-bar"
      >
        <span className="truncate flex items-center gap-1.5 font-title uppercase">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>{report.verdict}</span>
        </span>
        <div className="flex items-center gap-1.5 flex-shrink-0 font-mono">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black text-white" style={{ backgroundColor: colors.hex }}>
            {report.safety_score}/10
          </span>
          <span className="text-[10px] uppercase opacity-75">{scoreLabel}</span>
        </div>
      </div>

      {/* 4. USER COMMENTS DESCRIPTION */}
      {report.description && (
        <div className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100/50 rounded-2xl p-3 mb-4 transition-colors flex items-start gap-2" id="card-comments">
          <MessageSquare className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {report.description}
          </p>
        </div>
      )}

      {/* 5. CONTAMINANTS & COLOR DETAILS */}
      {report.contaminants && report.contaminants.length > 0 && (
        <div className="mb-4" id="card-pills">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 mb-1.5 font-mono">
            <FlaskConical className="w-3.5 h-3.5 text-slate-400" />
            <span>Contaminants</span>
          </span>
          <div className="flex flex-wrap gap-1">
            {report.contaminants.map((c, i) => (
              <span key={i} className="text-[9px] font-bold bg-slate-100 hover:bg-slate-150 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200/20 transition-colors">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 6. BOTTOM ROW: FLAGGING & SHARING */}
      <div className="flex justify-between items-center border-t border-slate-50 pt-3" id="card-footer">
        <span className="text-[10px] text-slate-300 font-mono">ID: {report.id}</span>
        
        <button
          onClick={handleFlag}
          id={`flag-btn-${report.id}`}
          disabled={isFlagging || isFlagged}
          className={`px-3 py-1 text-[10px] font-bold rounded-full border transition-all flex items-center gap-1 ${
            isFlagged
              ? 'bg-rose-50 border-rose-200 text-rose-500'
              : 'border-slate-200 hover:border-rose-400 hover:bg-rose-50/30 text-slate-400 hover:text-rose-500 cursor-pointer'
          }`}
        >
          {isFlagged ? (
            <>
              <span>Flagged</span>
              <span>✓</span>
            </>
          ) : isFlagging ? (
            'Flagging...'
          ) : (
            <>
              <Flag className="w-3 h-3 text-slate-400 hover:text-rose-500" />
              <span>Flag</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
};
