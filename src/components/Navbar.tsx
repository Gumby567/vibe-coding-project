import { useI18n } from "@/contexts/I18nContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Snowflake } from "lucide-react";

const Navbar = () => {
  const { t } = useI18n();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <a href="#" className="flex items-center gap-2 font-bold text-lg text-primary">
          <Snowflake className="h-6 w-6" />
          {t.nav.brand}
        </a>

        <div className="hidden md:flex items-center gap-6">
          {t.nav.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Button size="sm" asChild>
            <a href="#contact">{t.nav.cta}</a>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
