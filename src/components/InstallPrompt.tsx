/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { isIOS, isInStandaloneMode, BeforeInstallPromptEvent } from '../lib/pwa';
import { Smartphone, Share, Plus } from 'lucide-react';

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);

  useEffect(() => {
    // 1. If already installed/standalone, do not show anything
    if (isInStandaloneMode()) return;

    // 2. Check if iOS device
    if (isIOS()) {
      setIsIOSDevice(true);
      // Check if dismissed before in localStorage
      const isDismissed = localStorage.getItem('pwa_ios_prompt_dismissed');
      if (!isDismissed) {
        setIsVisible(true);
      }
      return;
    }

    // 3. For Android/Chrome: intercept beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      const isDismissed = localStorage.getItem('pwa_prompt_dismissed');
      if (!isDismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    setIsVisible(false);
    
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA installation outcome: ${outcome}`);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (isIOSDevice) {
      localStorage.setItem('pwa_ios_prompt_dismissed', 'true');
    } else {
      localStorage.setItem('pwa_prompt_dismissed', 'true');
    }
  };

  if (!isVisible) return null;

  return (
    <div
      id="pwa-install-banner"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:max-w-md bg-slate-950 text-white rounded-[24px] p-4.5 border border-slate-800 shadow-2xl z-50 animate-fade-in flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
    >
      <div className="flex gap-3 items-start">
        <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl shrink-0 mt-0.5">
          <Smartphone className="w-5 h-5" />
        </div>
        <div>
          <h5 className="font-extrabold text-sm text-slate-100 font-title leading-tight">Install AquaCheck App</h5>
          <p className="text-slate-400 text-xs mt-1 leading-normal flex flex-wrap items-center gap-1">
            {isIOSDevice ? (
              <>
                Tap the Share button <Share className="w-3.5 h-3.5 inline mx-0.5 text-blue-400" /> in Safari and select 'Add to Home Screen' <Plus className="w-3.5 h-3.5 inline mx-0.5 text-emerald-400" /> to use offline.
              </>
            ) : (
              "Install the companion app on your device for one-tap analysis and offline reporting."
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        {!isIOSDevice && deferredPrompt && (
          <button
            id="pwa-install-btn"
            onClick={handleInstallClick}
            className="px-4 h-9 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-md shadow-blue-900/30"
          >
            Install
          </button>
        )}
        <button
          id="pwa-dismiss-btn"
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white text-xs font-semibold font-mono px-2 py-1.5"
        >
          {isIOSDevice ? 'Got it' : 'Dismiss'}
        </button>
      </div>
    </div>
  );
};
