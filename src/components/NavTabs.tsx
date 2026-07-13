/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useT } from '../lib/locale';
import { Camera, Search, Globe, Users } from 'lucide-react';

export interface NavTabsProps {
  activeTab: 'photo' | 'city' | 'map' | 'community';
  setActiveTab: (tab: 'photo' | 'city' | 'map' | 'community') => void;
  reportCount?: number;
}

export const NavTabs: React.FC<NavTabsProps> = ({ activeTab, setActiveTab, reportCount }) => {
  const t = useT();

  const tabs = [
    { id: 'photo', icon: Camera, labelKey: 'nav.photoCheck' },
    { id: 'city', icon: Search, labelKey: 'nav.cityCheck' },
    { id: 'map', icon: Globe, labelKey: 'nav.worldMap' },
    { id: 'community', icon: Users, labelKey: 'nav.community' },
  ] as const;

  return (
    <div className="w-full flex justify-center lg:justify-end" id="nav-tabs-container">
      <div 
        className="flex bg-slate-100 p-1 rounded-2xl sm:rounded-full border border-slate-200/60 shadow-sm w-full"
        style={{ maxWidth: '550px' }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 py-2.5 px-2 sm:px-4 text-center rounded-xl sm:rounded-full text-xs font-black transition-all duration-300 relative cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200 scale-[1.02]'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-white/60'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'opacity-70'}`} />
              <span className="hidden sm:inline truncate">{t(tab.labelKey)}</span>
              <span className="inline sm:hidden truncate text-[10px]">
                {tab.id === 'photo' && 'Vision'}
                {tab.id === 'city' && 'City'}
                {tab.id === 'map' && 'Map'}
                {tab.id === 'community' && 'Feed'}
              </span>
              
              {/* Report Count Badge for Community Tab */}
              {tab.id === 'community' && reportCount !== undefined && reportCount > 0 && (
                <span id="report-count-badge" className="absolute -top-1 -right-1 flex h-4.5 min-w-[18px] px-1 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-black text-white shadow-sm animate-pulse border border-white">
                  {reportCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
