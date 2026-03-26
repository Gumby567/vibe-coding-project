import { useI18n } from "@/contexts/I18nContext";

const AboutSection = () => {
  const { t } = useI18n();

  return (
    <section id="about" className="py-20 bg-background">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="text-3xl font-bold text-foreground text-center">{t.about.title}</h2>
        <div className="mt-2 mx-auto h-1 w-16 rounded-full bg-accent" />
        <div className="mt-8 space-y-4">
          {t.about.paragraphs.map((p, i) => (
            <p key={i} className="text-muted-foreground text-lg leading-relaxed">
              {p}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
