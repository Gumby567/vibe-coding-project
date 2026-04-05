import React, { createContext, useContext, useMemo, useState, useCallback } from "react";
import { content, type SiteContent } from "@/data/content";
import type { CmsPayload, LangKey } from "../../types/cms";
import { buildSiteContentFromPayload, createDefaultCmsPayload } from "@/lib/cms-defaults";

interface I18nCtx {
  lang: LangKey;
  setLang: (l: LangKey) => void;
  t: SiteContent;
  payload: CmsPayload;
  enabledLanguages: LangKey[];
}

const I18nContext = createContext<I18nCtx>({
  lang: "en",
  setLang: () => {},
  t: content.en,
  payload: createDefaultCmsPayload(),
  enabledLanguages: ["en", "et"],
});

export const useI18n = () => useContext(I18nContext);

export const I18nProvider: React.FC<{
  children: React.ReactNode;
  payload: CmsPayload;
}> = ({ children, payload }) => {
  const [lang, setLangState] = useState<LangKey>(payload.i18n.defaultLanguage ?? "en");

  const enabledLanguages = useMemo(() => {
    return payload.i18n.enabledLanguages?.length ? payload.i18n.enabledLanguages : (["en"] as LangKey[]);
  }, [payload.i18n.enabledLanguages]);

  const setLang = useCallback(
    (l: LangKey) => {
      if (enabledLanguages.includes(l)) {
        setLangState(l);
      }
    },
    [enabledLanguages],
  );

  const t = useMemo(() => buildSiteContentFromPayload(payload, lang), [payload, lang]);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t,
      payload,
      enabledLanguages,
    }),
    [lang, setLang, t, payload, enabledLanguages],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

/** Fallback when CMS payload is not loaded. */
export function StaticI18nProvider({ children }: { children: React.ReactNode }) {
  return <I18nProvider payload={createDefaultCmsPayload()}>{children}</I18nProvider>;
}
