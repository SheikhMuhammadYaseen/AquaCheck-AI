/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '../../messages/en.json' with { type: 'json' };
import ur from '../../messages/ur.json' with { type: 'json' };
import hi from '../../messages/hi.json' with { type: 'json' };

export type Locale = 'en' | 'ur' | 'hi';

const translations: Record<Locale, any> = { en, ur, hi };

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aquacheck-locale');
      if (saved === 'en' || saved === 'ur' || saved === 'hi') {
        return saved;
      }
    }
    return 'en';
  });

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('aquacheck-locale', newLocale);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const html = document.documentElement;
    html.lang = locale;
    
    if (locale === 'ur') {
      html.dir = 'rtl';
      document.body.classList.add('locale-ur');
    } else {
      html.dir = 'ltr';
      document.body.classList.remove('locale-ur');
    }
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
};

export const useT = () => {
  const { locale } = useLocale();
  const dict = translations[locale] || en;

  return (key: string, replacements?: Record<string, string | number>): string => {
    const parts = key.split('.');
    let current: any = dict;

    for (const part of parts) {
      if (current === undefined || current === null) {
        break;
      }
      current = current[part];
    }

    if (typeof current !== 'string') {
      // Fallback to English dictionary if key not found in selected locale
      let engFallback: any = en;
      for (const part of parts) {
        if (engFallback === undefined || engFallback === null) break;
        engFallback = engFallback[part];
      }
      if (typeof engFallback === 'string') {
        current = engFallback;
      } else {
        return key;
      }
    }

    let text = current;
    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }

    return text;
  };
};
