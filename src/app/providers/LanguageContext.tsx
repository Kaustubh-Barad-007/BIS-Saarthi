import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { UI_STRINGS } from '@/shared/lib/i18n';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('bis_lang') || 'en';
  });

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('bis_lang', lang);
  };

  const t = (key: string): string => {
    const strings = UI_STRINGS[language] || UI_STRINGS['en'];
    return strings[key] || UI_STRINGS['en'][key] || key;
  };

  // Sync with document language for accessibility
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
