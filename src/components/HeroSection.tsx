import { useI18n } from "@/contexts/I18nContext";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const HeroSection = () => {
  const { t } = useI18n();

  return (
    <section
      className="relative flex min-h-[85vh] items-center justify-center overflow-hidden pt-16"
      style={{ background: "var(--hero-gradient)" }}
    >
      {/* Decorative circles */}
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full bg-accent/10 blur-3xl" />

      <div className="container relative z-10 mx-auto px-4 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl lg:text-6xl">
          {t.hero.title}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-primary-foreground/75 sm:text-xl">
          {t.hero.subtitle}
        </p>
        <div className="mt-10">
          <Button size="lg" variant="secondary" asChild className="text-base font-semibold">
            <a href="#contact">
              {t.hero.cta}
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
