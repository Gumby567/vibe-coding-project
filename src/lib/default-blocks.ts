import type { ContentBlock } from "../../types/cms";
import { content } from "@/data/content";

let idCounter = 0;
const id = () => `blk-${++idCounter}`;

/** Seed blocks from bundled static content when DB has no row yet. */
export function createDefaultBlocks(): ContentBlock[] {
  const en = content.en;
  const et = content.et;
  return [
    {
      id: id(),
      type: "hero",
      isVisible: true,
      order: 0,
      content: {
        en: { title: en.hero.title, subtitle: en.hero.subtitle, cta: en.hero.cta },
        et: { title: et.hero.title, subtitle: et.hero.subtitle, cta: et.hero.cta },
      },
      style: { background: "transparent", padding: "0" },
    },
    {
      id: id(),
      type: "about",
      isVisible: true,
      order: 1,
      content: {
        en: { title: en.about.title, paragraphs: [...en.about.paragraphs] },
        et: { title: et.about.title, paragraphs: [...et.about.paragraphs] },
      },
      style: { background: "hsl(var(--section-alt))", padding: "0" },
    },
    {
      id: id(),
      type: "offers",
      isVisible: true,
      order: 2,
      content: {
        en: { title: en.offers.title, items: [...en.offers.items] },
        et: { title: et.offers.title, items: [...et.offers.items] },
      },
      style: { background: "transparent", padding: "0" },
    },
    {
      id: id(),
      type: "contact",
      isVisible: true,
      order: 3,
      content: {
        en: { title: en.contact.title, subtitle: en.contact.subtitle },
        et: { title: et.contact.title, subtitle: et.contact.subtitle },
      },
      style: { background: "hsl(var(--background))", padding: "0" },
    },
  ];
}
