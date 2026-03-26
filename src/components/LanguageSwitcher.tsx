import { useI18n } from "@/contexts/I18nContext";
import { Button } from "@/components/ui/button";

const LanguageSwitcher = () => {
  const { lang, setLang } = useI18n();

  return (
    <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
      <button
        onClick={() => setLang("en")}
        className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
          lang === "en"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLang("et")}
        className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
          lang === "et"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        ET
      </button>
    </div>
  );
};

export default LanguageSwitcher;
