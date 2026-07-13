/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Users, Megaphone } from 'lucide-react';
import { ReportForm } from './ReportForm';
import { ReportFeed } from './ReportFeed';
import { CommunityMap } from './CommunityMap';
import { useT } from '../lib/locale';

interface CommunityExplorerProps {
  onReportsCountChanged?: (count: number) => void;
  onNavigateToCity: (country: string, city: string) => void;
  onNewReportAdded?: () => void;
}

export const CommunityExplorer: React.FC<CommunityExplorerProps> = ({
  onReportsCountChanged,
  onNavigateToCity,
  onNewReportAdded,
}) => {
  const t = useT();

  const [showForm, setShowForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleReportSuccess = () => {
    setShowForm(false);
    // Increment trigger to refresh feed & clusters synchronously!
    setRefreshTrigger((prev) => prev + 1);
    if (onNewReportAdded) {
      onNewReportAdded();
    }
  };

  return (
    <div className="space-y-6 w-full max-w-2xl mx-auto animate-fade-in" id="community-explorer-main">
      
      {/* SECTION CARD */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 sm:p-8 text-center flex flex-col items-center" id="community-jumbotron">
        <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4 text-blue-600 shadow-sm">
          <Users className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-extrabold font-title tracking-tight text-slate-900 leading-tight">
          {t('community.title')}
        </h2>
        <p className="text-sm text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
          {t('community.subtitle')}
        </p>

        {!showForm && (
          <button
            id="report-issue-toggle"
            onClick={() => setShowForm(true)}
            className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 hover:scale-[1.01] active:scale-[0.99] text-white font-bold rounded-2xl transition-all duration-300 shadow-lg shadow-blue-100 cursor-pointer text-sm flex items-center gap-2"
          >
            <Megaphone className="w-4 h-4 text-white" />
            <span>{t('community.submitButton')}</span>
          </button>
        )}
      </div>

      {/* EXPANDED SUBMISSION FORM */}
      {showForm && (
        <div id="expanded-form-wrapper" className="transition-all duration-500">
          <ReportForm onSuccess={handleReportSuccess} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* COMMUNITY TRACKER CLUSTERS */}
      {!showForm && (
        <CommunityMap refreshTrigger={refreshTrigger} onSelectCityFilter={onNavigateToCity} />
      )}

      {/* RECENT FEED LOGS */}
      {!showForm && (
        <ReportFeed onReportsCountChanged={onReportsCountChanged} refreshTrigger={refreshTrigger} />
      )}

    </div>
  );
};
