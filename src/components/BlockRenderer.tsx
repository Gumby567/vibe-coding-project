import type { ContentBlock, LangKey } from "../../types/cms";
import { bodyClass, headingClass } from "@/lib/cms-defaults";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  block: ContentBlock;
  lang: LangKey;
};

function alignClass(a?: string) {
  switch (a) {
    case "left":
      return "text-left";
    case "right":
      return "text-right";
    default:
      return "text-center";
  }
}

export function BlockRenderer({ block, lang }: Props) {
  if (!block.isVisible) return null;
  const c = block.content[lang] ?? block.content.en ?? {};
  const st = block.style;

  switch (block.type) {
    case "hero":
      return (
        <section
          id="hero"
          className={cn(
            "relative flex min-h-[85vh] items-center justify-center overflow-hidden pt-16",
            alignClass(st.textAlign),
          )}
          style={{
            background: st.background || "var(--hero-gradient)",
            padding: st.padding ?? undefined,
            marginBottom: st.marginBottom,
            maxWidth: st.maxWidth,
            marginLeft: st.maxWidth ? "auto" : undefined,
            marginRight: st.maxWidth ? "auto" : undefined,
          }}
        >
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full bg-accent/10 blur-3xl" />
          <div className="container relative z-10 mx-auto px-4">
            <h1
              className={cn(
                "mx-auto max-w-3xl font-bold tracking-tight text-primary-foreground",
                headingClass(st.headingPreset),
              )}
            >
              {c.title}
            </h1>
            <p
              className={cn(
                "mx-auto mt-6 max-w-2xl text-primary-foreground/75",
                bodyClass(st.bodyPreset),
              )}
            >
              {c.subtitle}
            </p>
            <div className="mt-10">
              <Button size="lg" variant="secondary" asChild className="text-base font-semibold">
                <a href="#contact">
                  {c.cta}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>
        </section>
      );
    case "about":
      return (
        <section
          id="about"
          className={cn("py-20", alignClass(st.textAlign))}
          style={{
            background: st.background,
            padding: st.padding,
            marginBottom: st.marginBottom,
          }}
        >
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className={cn("font-bold text-foreground", headingClass(st.headingPreset === "xl" ? "md" : "sm"))}>
              {c.title}
            </h2>
            <div className={cn("mt-2 h-1 w-16 rounded-full bg-accent", st.textAlign === "center" && "mx-auto", st.textAlign === "right" && "ml-auto")} />
            <div className={cn("mt-6 space-y-4 text-muted-foreground", bodyClass(st.bodyPreset))}>
              {(c.paragraphs ?? []).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </section>
      );
    case "offers":
      return (
        <section
          id="offers"
          className="py-20 bg-background"
          style={{
            background: st.background,
            padding: st.padding,
            marginBottom: st.marginBottom,
          }}
        >
          <div className="container mx-auto px-4">
            <h2 className={cn("text-center font-bold text-foreground", headingClass(st.headingPreset === "xl" ? "md" : "sm"))}>
              {c.title}
            </h2>
            <div className="mt-2 mx-auto h-1 w-16 rounded-full bg-accent" />
            <ul className="mt-10 grid gap-4 md:grid-cols-2 max-w-4xl mx-auto">
              {(c.items ?? []).map((item, i) => (
                <li
                  key={i}
                  className="flex gap-3 rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm"
                >
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />
                  <span className={bodyClass(st.bodyPreset)}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      );
    case "contact":
      return null;
    default:
      return null;
  }
}
