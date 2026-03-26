import { useI18n } from "@/contexts/I18nContext";
import { CheckCircle2 } from "lucide-react";

const OffersSection = () => {
  const { t } = useI18n();

  return (
    <section id="offers" className="py-20 bg-section-alt">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="text-3xl font-bold text-foreground text-center">{t.offers.title}</h2>
        <div className="mt-2 mx-auto h-1 w-16 rounded-full bg-accent" />
        <ul className="mt-10 space-y-4">
          {t.offers.items.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <span className="text-foreground text-lg">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default OffersSection;
