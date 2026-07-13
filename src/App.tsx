/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { LocaleProvider, useT } from './lib/locale';
import { NavTabs } from './components/NavTabs';
import { WaterChecker } from './components/WaterChecker';
import { CityChecker } from './components/CityChecker';
import { MapExplorer } from './components/MapExplorer';
import { CommunityExplorer } from './components/CommunityExplorer';
import { InstallPrompt } from './components/InstallPrompt';
import { WaterChatbot } from './components/WaterChatbot';
import { Droplets, Sparkles, ShieldCheck, Globe, Heart } from 'lucide-react';

function AquaCheckApp() {
  const t = useT();
  const [activeTab, setActiveTab] = useState<'photo' | 'city' | 'map' | 'community'>('photo');
  const [unreadReportsCount, setUnreadReportsCount] = useState(0);
  const [selectedCitySearch, setSelectedCitySearch] = useState<{ country: string; city: string } | undefined>(undefined);
  const [showNewReportBadge, setShowNewReportBadge] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const badgeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerNewReportBadge = () => {
    setShowNewReportBadge(true);
    if (badgeTimerRef.current) {
      clearTimeout(badgeTimerRef.current);
    }
    badgeTimerRef.current = setTimeout(() => {
      setShowNewReportBadge(false);
    }, 5000);
  };

  const handleLogoClick = () => {
    setSelectedCitySearch(undefined);
    setResetKey(prev => prev + 1);
    setActiveTab('photo');
  };

  useEffect(() => {
    return () => {
      if (badgeTimerRef.current) {
        clearTimeout(badgeTimerRef.current);
      }
    };
  }, []);

  // Scroll to top of the page when activeTab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  // Quick navigation helper from other components
  const handleCitySelected = (country: string, city: string) => {
    setSelectedCitySearch({ country, city });
    setActiveTab('city');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/60 via-white to-blue-50/30 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-800" id="aquacheck-root-layout">
      
      {/* HEADER NAVBAR CONTAINER */}
      <header className="w-full max-w-7xl mx-auto px-4 pt-8 lg:pt-10 pb-6 flex flex-col lg:flex-row lg:items-center lg:justify-start gap-6 lg:gap-12 z-20" id="global-app-header">
        {/* LOGO & BRANDING */}
        <div className="flex items-center gap-4 justify-center lg:justify-start w-full lg:w-auto">
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-4 text-left cursor-pointer transition-all duration-200 hover:opacity-[0.97] active:scale-[0.995] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-2xl"
          >
            <div className="relative h-12 w-12 flex items-center justify-center shrink-0">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center text-white shadow-xl shadow-blue-300/80">
                <Droplets className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 bg-amber-400 text-white rounded-full p-0.5 shadow-md">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-blue-950 flex items-center gap-1 leading-none">
                  <span className="bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent font-black font-title">AquaCheck</span>
                  <span className="text-blue-500 font-light font-mono text-xl">AI</span>
                </h1>
                <span className="hidden xs:inline px-2.5 py-0.5 bg-emerald-500 text-white font-black rounded-full text-[9px] uppercase tracking-widest font-sans italic shadow-md shadow-emerald-200">
                  Live Analysis
                </span>
              </div>
              <p className="text-[10px] text-blue-900/50 font-black uppercase tracking-widest font-mono mt-1.5 flex items-center gap-1.5 justify-center lg:justify-start">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>AI Water Intelligence</span>
              </p>
            </div>
          </button>
        </div>

        {/* NAVIGATION & UTILITIES */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto shrink-0 lg:flex-1 lg:ml-auto lg:justify-end">
          <div className="w-full lg:w-[550px]">
            <NavTabs
              activeTab={activeTab}
              setActiveTab={(tab) => {
                // Reset searches if clicking tab directly
                if (tab !== 'city') {
                  setSelectedCitySearch(undefined);
                }
                setActiveTab(tab);
              }}
              reportCount={showNewReportBadge ? unreadReportsCount || 1 : 0}
            />
          </div>
        </div>
      </header>

      {/* PAGE CONTAINER / BODY PANEL */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 pb-12 z-10 mt-6 lg:mt-12" id="page-content-wrapper">
        {activeTab === 'photo' && (
          <WaterChecker
            key={`scanner-${resetKey}`}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'city' && (
          <CityChecker
            key={`city-${resetKey}`}
            initialSearch={selectedCitySearch}
            onSearchCompleted={() => setSelectedCitySearch(undefined)}
          />
        )}

        {activeTab === 'map' && (
          <MapExplorer onCitySelected={handleCitySelected} />
        )}

        {activeTab === 'community' && (
          <CommunityExplorer
            onReportsCountChanged={setUnreadReportsCount}
            onNavigateToCity={handleCitySelected}
            onNewReportAdded={triggerNewReportBadge}
          />
        )}
      </main>

      {/* GLOBAL STANDARD FOOTER */}
      <footer className="w-full max-w-7xl mx-auto px-6 pt-16 pb-12 border-t border-blue-100/50 mt-16 z-10" id="global-app-footer">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 pb-12">
          {/* Brand Info */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <button
              onClick={handleLogoClick}
              className="flex items-center gap-4 text-left cursor-pointer transition-all duration-200 hover:opacity-[0.97] active:scale-[0.995] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-2xl w-fit"
            >
              <div className="relative h-12 w-12 flex items-center justify-center shrink-0">
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center text-white shadow-xl shadow-blue-300/85">
                  <Droplets className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 bg-amber-400 text-white rounded-full p-0.5 shadow-md">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-blue-950 flex items-center gap-1 leading-none m-0 p-0">
                    <span className="bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent font-black font-title">AquaCheck</span>
                    <span className="text-blue-500 font-light font-mono text-lg">AI</span>
                  </h3>
                  <span className="px-2 py-0.5 bg-emerald-500 text-white font-black rounded-full text-[8px] uppercase tracking-widest font-sans italic shadow-sm shadow-emerald-200">
                    Live Analysis
                  </span>
                </div>
                <p className="text-[9px] text-blue-900/50 font-black uppercase tracking-widest font-mono mt-1.5 flex items-center gap-1.5 m-0 p-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>AI Water Intelligence</span>
                </p>
              </div>
            </button>
            <p className="text-xs text-blue-900/60 leading-relaxed max-w-sm">
              Combining cutting-edge computer vision water diagnostics with municipal registries, global compliance heatmaps, and live crowdsourced health sentinel feeds for a safer, healthier world.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-extrabold text-blue-900/40 uppercase tracking-widest font-mono">
                System Online — Cloud Verified
              </span>
            </div>
          </div>

          {/* Hub Navigation Links */}
          <div className="md:col-span-3 flex flex-col gap-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-blue-950 font-mono">
              Platform Modules
            </h4>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setActiveTab('photo')}
                className={`text-xs text-left font-medium hover:text-blue-600 transition-colors cursor-pointer ${activeTab === 'photo' ? 'text-blue-600 font-bold' : 'text-blue-900/50'}`}
              >
                ✦ AI Optical Scanner
              </button>
              <button
                onClick={() => setActiveTab('city')}
                className={`text-xs text-left font-medium hover:text-blue-600 transition-colors cursor-pointer ${activeTab === 'city' ? 'text-blue-600 font-bold' : 'text-blue-900/50'}`}
              >
                ✦ Municipal Directory
              </button>
              <button
                onClick={() => setActiveTab('map')}
                className={`text-xs text-left font-medium hover:text-blue-600 transition-colors cursor-pointer ${activeTab === 'map' ? 'text-blue-600 font-bold' : 'text-blue-900/50'}`}
              >
                ✦ Interactive Risk Map
              </button>
              <button
                onClick={() => setActiveTab('community')}
                className={`text-xs text-left font-medium hover:text-blue-600 transition-colors cursor-pointer ${activeTab === 'community' ? 'text-blue-600 font-bold' : 'text-blue-900/50'}`}
              >
                ✦ Citizen Sentinel Hub
              </button>
            </div>
          </div>

          {/* Education & Global Resources */}
          <div className="md:col-span-4 flex flex-col gap-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-blue-950 font-mono">
              Water Security & Compliance
            </h4>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-900/60 leading-normal">
                  <strong className="text-blue-950 font-bold">WHO Guidelines</strong>: Tested and designed against international WHO safe drinking thresholds.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Globe className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-900/60 leading-normal">
                  <strong className="text-blue-950 font-bold">Offline Resilience</strong>: Progressive Web App standards enable diagnostic utility even in remote locations.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-blue-50/80 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[10.5px] text-blue-900/65 font-mono tracking-wide text-center sm:text-left">
            <div>
              © {new Date().getFullYear()} AquaCheck AI. All rights reserved. Powered by Google Gemini AI.
            </div>
            <div className="mt-1 text-blue-900/55">
              Secure Cloud Processing. Compliant with international water diagnostics standards.
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-blue-900/60 font-mono tracking-wider uppercase bg-blue-50/50 px-3 py-1.5 rounded-full border border-blue-100/50">
            <span>Made for safe water access</span>
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500 animate-pulse" />
          </div>
        </div>
      </footer>

      {/* BOTTOM COLOR RIBBON ACCENT */}
      <div className="h-2 bg-gradient-to-r from-blue-400 via-emerald-300 to-blue-500 w-full mt-auto z-10" />

      {/* CHATBOT WIDGET (ONLY ON LANDING PAGE) */}
      {activeTab === 'photo' && <WaterChatbot />}

      {/* PWA FLOATING PROMPT BANNER */}
      <InstallPrompt />

    </div>
  );
}

export default function App() {
  return (
    <LocaleProvider>
      <AquaCheckApp />
    </LocaleProvider>
  );
}
