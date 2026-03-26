import { useI18n } from "@/contexts/I18nContext";
import { Snowflake } from "lucide-react";

const Footer = () => {
  const { t } = useI18n();

  return (
    <footer className="border-t border-border py-8 bg-muted/50">
      <div className="container mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-2 text-muted-foreground mb-3">
          <Snowflake className="h-4 w-4" />
          <span className="font-semibold text-foreground">{t.nav.brand}</span>
        </div>
        <p className="text-sm text-muted-foreground">{t.footer.built}</p>
      </div>
    </footer>
  );
};

export default Footer;
