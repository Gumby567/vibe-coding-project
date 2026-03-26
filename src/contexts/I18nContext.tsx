import React, { createContext, useContext, useState, useCallback } from "react";
import { content, SiteContent } from "@/data/content";

type Lang = "en" | "et";

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: SiteContent;
}

const I18nContext = createContext<I18nCtx>({
  lang: "en",
  setLang: () => {},
  t: content.en,
});

export const useI18n = () => useContext(I18nContext);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Lang>("en");
  const toggle = useCallback((l: Lang) => setLang(l), []);

  return (
    <I18nContext.Provider value={{ lang, setLang: toggle, t: content[lang] }}>
      {children}
    </I18nContext.Provider>
  );
};
