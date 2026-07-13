/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UploadZone } from './UploadZone';
import { ScoreCard } from './ScoreCard';
import { WaterAnalysis } from '../types/analysis';
import { useT } from '../lib/locale';
import { 
  Sparkles, 
  Droplet, 
  ArrowRight, 
  Eye, 
  ShieldCheck, 
  TrendingUp, 
  Share2, 
  RotateCcw, 
  Activity, 
  AlertCircle,
  Search,
  Map,
  Users,
  ChevronRight,
  ShieldAlert,
  Info,
  Bot,
  MessageSquare
} from 'lucide-react';

interface WaterCheckerProps {
  setActiveTab?: (tab: 'photo' | 'city' | 'map' | 'community') => void;
}

export const WaterChecker: React.FC<WaterCheckerProps> = ({ setActiveTab }) => {
  const t = useT();

  const [phase, setPhase] = useState<'upload' | 'preview' | 'loading' | 'result' | 'error'>('upload');
  const [imageData, setImageData] = useState<{ base64: string; mimeType: string; previewUrl: string } | null>(null);
  const [analysis, setAnalysis] = useState<WaterAnalysis | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);
  const [copied, setCopied] = useState(false);

  const steps = [
    t('upload.readingImage'),
    t('upload.analyzingQuality'),
    t('upload.preparingReport'),
  ];

  // Animate loading steps
  useEffect(() => {
    if (phase !== 'loading') return;

    const timer1 = setTimeout(() => setLoadingStep(1), 1200);
    const timer2 = setTimeout(() => setLoadingStep(2), 2600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [phase]);

  const handleImageSelected = (base64: string, mimeType: string, previewUrl: string) => {
    setImageData({ base64, mimeType, previewUrl });
    setPhase('preview');
  };

  const handleAnalyze = async () => {
    if (!imageData) return;

    setPhase('loading');
    setLoadingStep(0);
    setErrorMessage('');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageData.base64,
          mimeType: imageData.mimeType,
        }),
      });

      const json = await response.json();

      if (json.success) {
        setAnalysis(json.data);
        setPhase('result');
      } else {
        setErrorMessage(json.error || t('errors.apiError'));
        setPhase('error');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(t('errors.genericError'));
      setPhase('error');
    }
  };

  const handleShare = () => {
    if (!analysis) return;
    const shareText = `My water sample scored ${analysis.score}/10 on AquaCheck AI — ${analysis.verdict}. Advice: ${analysis.recommendation} Check yours at: ${window.location.origin}`;
    
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error("Failed to copy text: ", err);
    });
  };

  const handleReset = () => {
    if (imageData?.previewUrl) {
      URL.revokeObjectURL(imageData.previewUrl);
    }
    setImageData(null);
    setAnalysis(null);
    setPhase('upload');
    setLoadingStep(0);
  };

  return (
    <div 
      className={`w-full mx-auto transition-all duration-500 ${phase === 'upload' ? 'max-w-7xl' : 'max-w-lg'}`} 
      id="water-checker-main"
    >
      {phase === 'upload' && (
        <div className="space-y-12 lg:space-y-16 animate-fade-in" id="landing-page-container">
          {/* SECTION 1: HERO OVERVIEW & AI SCANNER ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center" id="landing-hero-grid">
            {/* HERO LEFT COLUMN */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              {/* Tagline Badge */}
              <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-100/80 backdrop-blur-md text-blue-700 font-extrabold rounded-full text-[10px] sm:text-xs uppercase tracking-widest w-fit mb-4 sm:mb-6 italic shadow-sm border border-blue-200/50">
                <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
                <span>AquaCheck AI Unified Platform</span>
              </div>
              
              {/* High-Impact Typography */}
              <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] xl:text-[3.5rem] font-black text-blue-950 leading-[1.1] mb-4 sm:mb-6 tracking-tight">
                A Cleaner Sip.<br />
                <span className="bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">A Healthier Life.</span>
              </h1>
              
              <p className="text-sm sm:text-base text-blue-900/70 max-w-xl mb-6 font-medium leading-relaxed">
                AquaCheck AI is an intelligent water safety platform that unifies instant photo-based testing, global water quality intelligence, geospatial risk mapping, regulatory compliance, and live community reporting.
              </p>

              {/* AQUABOT AI CONVERSATIONAL ASSISTANT DEEPLINK BANNER */}
              <div className="bg-gradient-to-br from-blue-50/90 via-sky-50/70 to-emerald-50/50 rounded-[24px] p-5 text-slate-800 border-2 border-blue-100/80 shadow-md relative overflow-hidden mb-6" id="aquabot-promo-section">
                {/* Decorative premium glows */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-300/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-emerald-300/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="relative flex flex-col gap-4 items-start">
                  <div className="space-y-2 w-full">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-gradient-to-tr from-blue-600 to-sky-400 text-white rounded-xl shadow-sm">
                        <Bot className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <span className="text-[9px] bg-blue-100 text-blue-700 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                          Instant Intelligence
                        </span>
                        <h4 className="font-extrabold text-base text-blue-950 tracking-tight mt-0.5">
                          Meet Your AquaBot AI Assistant
                        </h4>
                      </div>
                    </div>
                    
                    <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                      Need instant clarity on water safety? AquaBot is our custom-trained expert specializing in household water safety diagnostics, purification tech, and regional guidelines.
                    </p>
                  </div>

                  <div className="w-full sm:w-auto pt-1">
                    <button
                      onClick={() => {
                        const btn = document.getElementById('chatbot-toggle-button');
                        if (btn) btn.click();
                      }}
                      className="bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white font-extrabold text-xs px-5 py-3 rounded-xl transition-all duration-300 shadow-md hover:scale-[1.01] cursor-pointer flex items-center gap-2 w-full sm:w-auto justify-center active:scale-95"
                      id="aquabot-promo-chat-btn"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Start Live Chat with AquaBot</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* SYSTEM STATISTICS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-center w-full max-w-xl mx-auto lg:mx-0" id="aggregate-metrics-row">
                <div className="bg-white p-3 sm:p-4 rounded-2xl border border-blue-50/80 shadow-md shadow-blue-100/10 flex flex-col justify-center items-center">
                  <div className="text-lg sm:text-xl font-black text-blue-600 leading-none">2,480+</div>
                  <div className="text-[10px] sm:text-[11px] font-extrabold text-blue-900/50 uppercase mt-1.5 tracking-wider leading-tight">Tested Samples</div>
                </div>
                <div className="bg-white p-3 sm:p-4 rounded-2xl border border-blue-50/80 shadow-md shadow-blue-100/10 flex flex-col justify-center items-center">
                  <div className="text-lg sm:text-xl font-black text-emerald-500 leading-none">400+</div>
                  <div className="text-[10px] sm:text-[11px] font-extrabold text-blue-900/50 uppercase mt-1.5 tracking-wider leading-tight">Cities Indexed</div>
                </div>
                <div className="bg-white p-3 sm:p-4 rounded-2xl border border-blue-50/80 shadow-md shadow-blue-100/10 flex flex-col justify-center items-center">
                  <div className="text-lg sm:text-xl font-black text-purple-500 leading-none">100%</div>
                  <div className="text-[10px] sm:text-[11px] font-extrabold text-blue-900/50 uppercase mt-1.5 tracking-wider leading-tight">AI Resilience</div>
                </div>
                <div className="bg-white p-3 sm:p-4 rounded-2xl border border-blue-50/80 shadow-md shadow-blue-100/10 flex flex-col justify-center items-center">
                  <div className="text-lg sm:text-xl font-black text-amber-500 leading-none">PWA</div>
                  <div className="text-[10px] sm:text-[11px] font-extrabold text-blue-900/50 uppercase mt-1.5 tracking-wider leading-tight">Offline Ready</div>
                </div>
              </div>
            </div>

            {/* HERO RIGHT COLUMN (CORE SCANNER & SNAP SNAPSHOT GUIDE) */}
            <div className="lg:col-span-5 w-full flex flex-col gap-5">
              <div className="bg-white/95 backdrop-blur-md rounded-[32px] p-6 border-4 border-white shadow-xl shadow-blue-100/30 flex flex-col relative overflow-hidden" id="diagnose-upload-panel">
                {/* Subtle top decoration */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-sky-400" />
                
                <h3 className="text-base font-black text-blue-950 text-center mb-1 flex items-center justify-center gap-2">
                  <Droplet className="w-5 h-5 text-blue-600 animate-pulse" />
                  <span>AI Optical Scanner</span>
                </h3>
                <p className="text-[11px] text-blue-900/50 text-center mb-4 font-medium leading-normal">
                  Analyze water coloration, turbidity index, and particulates from an image
                </p>
                
                <UploadZone onImageSelected={handleImageSelected} isLoading={false} />
              </div>
              
              {/* INFORMATIVE HOW TO PREPARE SAMPLE CARD */}
              <div className="bg-gradient-to-br from-blue-600 to-sky-500 rounded-2xl p-4.5 text-white flex flex-col gap-2.5 shadow-md shadow-blue-100/50">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-white/10 text-white rounded-lg shrink-0 mt-0.5">
                    <Info className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs text-white leading-tight">Sample Snapshot Guide</h5>
                    <p className="text-[11px] text-blue-100 mt-1 leading-relaxed">
                      For high precision results: pour the sample into a transparent, clear glass. Snap the photo in bright, natural light against a neutral background. Avoid reflections and fingers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: INTERACTIVE PORTAL HUBS (FULL WIDTH) */}
          <div className="border-t border-blue-50 pt-10" id="portal-quick-links-section">
            <h3 className="text-xs font-black uppercase tracking-widest text-blue-900/40 mb-5 font-mono flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Explore the AquaCheck Intelligence Hub
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5" id="platform-quick-links">
              {/* City Database Shortcut */}
              <button
                onClick={() => setActiveTab?.('city')}
                className="bg-white p-5 rounded-3xl border-2 border-blue-50 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-300 text-left flex flex-col justify-between group cursor-pointer relative overflow-hidden"
                id="portal-link-city"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-full -mr-6 -mt-6 transition-all group-hover:scale-110 pointer-events-none" />
                <div className="relative">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl w-fit mb-4">
                    <Search className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-full text-[9px] uppercase tracking-wider font-mono">
                    400+ Cities
                  </span>
                  <h4 className="font-extrabold text-sm text-blue-950 mt-3 leading-snug">
                    Municipal Directory
                  </h4>
                  <p className="text-[11px] text-blue-900/50 mt-1.5 leading-normal">
                    Verify local tap chemistry, compliance indexes & risk trends.
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-blue-600 font-extrabold mt-4 group-hover:gap-2 transition-all">
                  <span>Search Registry</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* Geographical Map Shortcut */}
              <button
                onClick={() => setActiveTab?.('map')}
                className="bg-white p-5 rounded-3xl border-2 border-blue-50 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-100/50 transition-all duration-300 text-left flex flex-col justify-between group cursor-pointer relative overflow-hidden"
                id="portal-link-map"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-full -mr-6 -mt-6 transition-all group-hover:scale-110 pointer-events-none" />
                <div className="relative">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl w-fit mb-4">
                    <Map className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-full text-[9px] uppercase tracking-wider font-mono">
                    Interactive Map
                  </span>
                  <h4 className="font-extrabold text-sm text-blue-950 mt-3 leading-snug">
                    Worldwide Safety
                  </h4>
                  <p className="text-[11px] text-blue-900/50 mt-1.5 leading-normal">
                    Visualize contamination zones and regional compliance ratings.
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-extrabold mt-4 group-hover:gap-2 transition-all">
                  <span>Open World Map</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* Community Feeds Shortcut */}
              <button
                onClick={() => setActiveTab?.('community')}
                className="bg-white p-5 rounded-3xl border-2 border-blue-50 hover:border-purple-400 hover:shadow-xl hover:shadow-purple-100/50 transition-all duration-300 text-left flex flex-col justify-between group cursor-pointer relative overflow-hidden"
                id="portal-link-community"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-purple-50 rounded-full -mr-6 -mt-6 transition-all group-hover:scale-110 pointer-events-none" />
                <div className="relative">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-xl w-fit mb-4">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 bg-purple-50 text-purple-700 font-bold rounded-full text-[9px] uppercase tracking-wider font-mono">
                    Sentinel
                  </span>
                  <h4 className="font-extrabold text-sm text-blue-950 mt-3 leading-snug">
                    Citizen Sentinel
                  </h4>
                  <p className="text-[11px] text-blue-900/50 mt-1.5 leading-normal">
                    Report local issues, track odor/color complaints & tap updates.
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-purple-600 font-extrabold mt-4 group-hover:gap-2 transition-all">
                  <span>View Community Hub</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </button>
            </div>
          </div>

          {/* SECTION 3: ADVANCED DIAGNOSTIC CAPABILITIES (FULL WIDTH) */}
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 border-2 border-blue-50/80 shadow-xl shadow-blue-100/20" id="educational-bento-panel">
            <h3 className="text-base font-black text-blue-950 mb-6 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <span>Our Advanced Diagnostic Capabilities</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              <div className="flex gap-4 items-start">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0 shadow-sm">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-extrabold text-sm text-blue-950 leading-tight">Visual Analysis (AI Scan)</h5>
                  <p className="text-xs text-blue-900/60 mt-1.5 leading-relaxed">
                    Uses visual algorithms to scan for color tints, water clarity, turbidity (NTU), particulate suspensions, and organic bubble patterns.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl shrink-0 shadow-sm">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-extrabold text-sm text-blue-950 leading-tight">Chemical Compliance Records</h5>
                  <p className="text-xs text-blue-900/60 mt-1.5 leading-relaxed">
                    Correlates city records with international safety parameters for lead, arsenic, fluorides, chlorine, nitrates, and hardness.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0 shadow-sm">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-extrabold text-sm text-blue-950 leading-tight">10-Year Public Health Projection</h5>
                  <p className="text-xs text-blue-900/60 mt-1.5 leading-relaxed">
                    Leverages historical WHO data, climate patterns, and infrastructure quality to project safety outlooks for mapped cities.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl shrink-0 shadow-sm">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-extrabold text-sm text-blue-950 leading-tight">Crowdsourced Odor & Color Reports</h5>
                  <p className="text-xs text-blue-900/60 mt-1.5 leading-relaxed">
                    Processes active community complaints about odor, local well failures, pipe scale issues, and recent tap quality tests.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {phase === 'preview' && imageData && (
        <div className="bg-white rounded-[40px] border-4 border-white shadow-2xl shadow-blue-200/40 p-6 sm:p-8 text-center animate-fade-in" id="preview-container">
          <div className="relative rounded-2xl overflow-hidden border border-blue-100 shadow-inner max-h-72 mb-6">
            <img
              src={imageData.previewUrl}
              alt="Water Sample"
              className="w-full h-full object-cover rounded-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
          
          <button
            id="analyze-btn"
            onClick={handleAnalyze}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 hover:scale-[1.01] active:scale-[0.99] text-white font-extrabold rounded-2xl transition-all duration-300 shadow-lg shadow-blue-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Activity className="w-5 h-5 animate-pulse" />
            <span>{t('upload.analyzeButton')}</span>
          </button>
          
          <button
            id="change-photo-btn"
            onClick={handleReset}
            className="mt-4 text-sm text-blue-900/60 hover:text-blue-600 transition-colors font-extrabold block mx-auto py-2 flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t('upload.changePhoto')}</span>
          </button>
        </div>
      )}

      {phase === 'loading' && (
        <div className="bg-white rounded-[40px] border-4 border-white shadow-2xl shadow-blue-200/40 p-8 text-center flex flex-col items-center justify-center min-h-[320px]" id="loading-container">
          {/* Water ripples spinner */}
          <div className="relative flex items-center justify-center h-20 w-20 mb-8">
            <span className="animate-ping absolute inline-flex h-12 w-12 rounded-full bg-blue-400 opacity-25" />
            <span className="animate-ping absolute inline-flex h-16 w-16 rounded-full bg-blue-300 opacity-10 delay-300" />
            <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-300">
              <Droplet className="w-6 h-6 animate-bounce text-white" />
            </div>
          </div>

          <div className="space-y-3.5 w-full max-w-xs mx-auto text-left" id="loading-steps-list">
            {steps.map((step, idx) => {
              const isCurrent = loadingStep === idx;
              const isPassed = loadingStep > idx;
              return (
                <div
                  key={idx}
                  id={`loading-step-${idx}`}
                  className={`flex items-center gap-3 text-sm transition-all duration-500 ${
                    isCurrent
                      ? 'text-blue-600 font-extrabold scale-[1.02]'
                      : isPassed
                      ? 'text-blue-900/40 font-semibold'
                      : 'text-blue-900/20 font-normal'
                  }`}
                >
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-mono border-2 ${
                    isCurrent
                      ? 'bg-blue-50 border-blue-600 text-blue-600 animate-pulse font-black'
                      : isPassed
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-500 font-black'
                      : 'bg-transparent border-blue-100 text-blue-900/20'
                  }`}>
                    {isPassed ? '✓' : idx + 1}
                  </div>
                  <span>{step}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {phase === 'result' && analysis && (
        <div id="results-wrapper">
          <ScoreCard analysis={analysis} />
          
          <div className="mt-5 flex flex-col sm:flex-row gap-3 px-4" id="results-actions">
            <button
              id="share-btn"
              onClick={handleShare}
              className="flex-1 h-12 bg-white text-blue-600 hover:text-blue-700 border-2 border-blue-200 rounded-2xl transition-all duration-300 text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-blue-100"
            >
              <Share2 className="w-4 h-4" />
              <span>{copied ? t('upload.copied') : t('upload.shareResult')}</span>
            </button>
            <button
              id="check-another-btn"
              onClick={handleReset}
              className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl transition-all duration-300 text-sm shadow-lg shadow-blue-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t('upload.checkAnother')}</span>
            </button>
          </div>
        </div>
      )}

      {phase === 'error' && (
        <div className="bg-white rounded-[40px] border-4 border-white shadow-2xl shadow-blue-200/40 p-8 text-center animate-fade-in" id="error-container">
          <div className="h-16 w-16 rounded-3xl bg-red-50 flex items-center justify-center mx-auto mb-6 text-red-500 shadow-md">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h4 className="text-blue-950 font-black text-xl mb-3">Analysis Failed</h4>
          <p className="text-blue-900/60 text-sm leading-relaxed mb-8 px-4">{errorMessage}</p>
          <button
            id="try-again-btn"
            onClick={handleReset}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl transition-all duration-300 shadow-lg shadow-blue-200 cursor-pointer flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Try Again</span>
          </button>
        </div>
      )}
    </div>
  );
};
