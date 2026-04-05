import { useI18n } from "@/contexts/I18nContext";
import type { LangKey } from "../../types/cms";

const labels: Record<LangKey, string> = {
  en: "EN",
  et: "ET",
};

const LanguageSwitcher = () => {
  const { lang, setLang, enabledLanguages } = useI18n();

  if (enabledLanguages.length <= 1) {
    return null;
  }

  return (
    <div
      className="flex items-center gap-1 rounded-md border border-border p-0.5"
      role="group"
      aria-label="Language"
    >
      {enabledLanguages.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
            lang === code
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {labels[code] ?? code.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
