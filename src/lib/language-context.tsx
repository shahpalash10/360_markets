"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Language, Currency, TRANSLATIONS, TranslationDictionary } from "./translations";

interface LanguageContextType {
  language: Language;
  currency: Currency;
  setLanguage: (lang: Language) => void;
  t: TranslationDictionary;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "EN",
  currency: "USD",
  setLanguage: () => {},
  t: TRANSLATIONS.EN,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("EN");
  const [currency, setCurrencyState] = useState<Currency>("USD");

  useEffect(() => {
    const saved = localStorage.getItem("markets_language") as Language;
    if (saved && (saved === "EN" || saved === "JA" || saved === "ZH")) {
      setLanguageState(saved);
      if (saved === "JA") setCurrencyState("JPY");
      else if (saved === "ZH") setCurrencyState("CNY");
      else setCurrencyState("USD");
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (lang === "JA") setCurrencyState("JPY");
    else if (lang === "ZH") setCurrencyState("CNY");
    else setCurrencyState("USD");

    localStorage.setItem("markets_language", lang);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        currency,
        setLanguage,
        t: TRANSLATIONS[language] || TRANSLATIONS.EN,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
