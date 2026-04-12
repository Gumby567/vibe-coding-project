import type {
  BlockType,
  CmsPayload,
  ContentBlock,
  LangKey,
  SiteContentRow,
} from "../../types/cms";
import { content } from "@/data/content";
import type { SiteContent } from "@/data/content";

const studentName = () => import.meta.env.VITE_STUDENT_NAME ?? "X";
const teamSlug = () => import.meta.env.VITE_TEAM_SLUG ?? "YOUR_TEAM";

function watermarkFor(lang: "en" | "et"): string {
  const raw = content[lang].footer.built;
  return raw.replace("<STUDENT_NAME>", studentName()).replace("<TEAM_SLUG>", teamSlug());
}

let blockId = 0;
const newBlockId = () => `blk-${Date.now()}-${++blockId}`;

export function createEmptyBlock(type: BlockType): ContentBlock {
  const en = content.en;
  const et = content.et;
  const base: ContentBlock = {
    id: newBlockId(),
    type,
    isVisible: true,
    order: 999,
    content: {
      en: {},
      et: {},
    },
    style: {
      background: "transparent",
      padding: "0",
      textAlign: "center",
      headingPreset: "lg",
      bodyPreset: "md",
    },
  };
  switch (type) {
    case "hero":
      base.content = {
        en: { title: en.hero.title, subtitle: en.hero.subtitle, cta: en.hero.cta },
        et: { title: et.hero.title, subtitle: et.hero.subtitle, cta: et.hero.cta },
      };
      base.style.background = "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(200 60% 25%) 100%)";
      break;
    case "about":
      base.content = {
        en: { title: en.about.title, paragraphs: [...en.about.paragraphs] },
        et: { title: et.about.title, paragraphs: [...et.about.paragraphs] },
      };
      base.style.background = "hsl(var(--section-alt))";
      base.style.textAlign = "left";
      break;
    case "offers":
      base.content = {
        en: { title: en.offers.title, items: [...en.offers.items] },
        et: { title: et.offers.title, items: [...et.offers.items] },
      };
      base.style.textAlign = "left";
      break;
    case "contact":
      base.content = {
        en: { title: en.contact.title, subtitle: en.contact.subtitle },
        et: { title: et.contact.title, subtitle: et.contact.subtitle },
      };
      base.style.background = "hsl(var(--background))";
      break;
    default:
      break;
  }
  return base;
}

export function createDefaultFormConfig() {
  const en = content.en;
  const et = content.et;
  return {
    submitButtonLabel: { en: en.contact.submit, et: et.contact.submit },
    successMessage: { en: en.contact.success, et: et.contact.success },
    consentCheckboxLabel: { en: en.contact.fields.consent, et: et.contact.fields.consent },
    fields: [
      {
        id: "company_name",
        type: "text" as const,
        label: { en: en.contact.fields.companyName, et: et.contact.fields.companyName },
        isRequired: true,
        order: 0,
      },
      {
        id: "contact_person",
        type: "text" as const,
        label: { en: en.contact.fields.contactPerson, et: et.contact.fields.contactPerson },
        isRequired: true,
        order: 1,
      },
      {
        id: "email",
        type: "email" as const,
        label: { en: en.contact.fields.email, et: et.contact.fields.email },
        isRequired: true,
        order: 2,
      },
      {
        id: "message",
        type: "textarea" as const,
        label: { en: en.contact.fields.message, et: et.contact.fields.message },
        isRequired: true,
        order: 3,
      },
      {
        id: "consent",
        type: "checkbox" as const,
        label: { en: en.contact.fields.consent, et: et.contact.fields.consent },
        isRequired: true,
        order: 4,
      },
    ],
  };
}

export function createDefaultCmsPayload(): CmsPayload {
  const en = content.en;
  const et = content.et;
  const blocks: ContentBlock[] = [
    { ...createEmptyBlock("hero"), id: newBlockId(), order: 0 },
    { ...createEmptyBlock("about"), id: newBlockId(), order: 1 },
    { ...createEmptyBlock("offers"), id: newBlockId(), order: 2 },
    { ...createEmptyBlock("contact"), id: newBlockId(), order: 3 },
  ];

  return {
    version: 1,
    blocks,
    nav: {
      brand: { en: en.nav.brand, et: et.nav.brand },
      cta: { en: en.nav.cta, et: et.nav.cta },
      links: en.nav.links.map((link, i) => ({
        id: `nav-${i}`,
        label: { en: link.label, et: et.nav.links[i]?.label ?? link.label },
        href: link.href,
        enabled: true,
        order: i,
      })),
    },
    formConfig: createDefaultFormConfig(),
    seo: {
      title: {
        en: "CoolGas Trading — Reliable Refrigerant Gas Partner",
        et: "CoolGas Trading — Usaldusväärne külmagaasipartner",
      },
      description: {
        en: "We supply high-quality refrigerant gases for HVAC, refrigeration, and industrial applications.",
        et: "Tarnime kvaliteetseid külmagaase HVAC-i, külmutuse ja tööstusrakenduste jaoks.",
      },
      ogTitle: {
        en: "CoolGas Trading — Reliable Refrigerant Gas Partner",
        et: "CoolGas Trading — Usaldusväärne külmagaasipartner",
      },
      ogDescription: {
        en: "International refrigerant gas trading partner.",
        et: "Rahvusvaheline külmagaasi kaubanduspartner.",
      },
    },
    i18n: {
      enabledLanguages: ["en", "et"],
      defaultLanguage: "en",
    },
    footer: {
      watermark: { en: watermarkFor("en"), et: watermarkFor("et") },
    },
  };
}

export function sortBlocks(list: ContentBlock[]) {
  return [...list].sort((a, b) => a.order - b.order);
}

export function migrateRowToPayload(row: SiteContentRow): CmsPayload {
  if (row.cms_data && row.cms_data.version === 1) {
    return row.cms_data;
  }
  const legacy = row.blocks;
  if (legacy && legacy.length > 0) {
    const base = createDefaultCmsPayload();
    return {
      ...base,
      blocks: legacy.map((b, i) => ({
        ...b,
        order: typeof b.order === "number" ? b.order : i,
      })) as ContentBlock[],
    };
  }
  return createDefaultCmsPayload();
}

function pickLang<T extends Record<string, string>>(obj: T, lang: LangKey): string {
  return obj[lang] ?? obj.en ?? "";
}

/** Build legacy `SiteContent` view for components that still consume `t` from I18n. */
export function buildSiteContentFromPayload(payload: CmsPayload, lang: LangKey): SiteContent {
  const blocks = sortBlocks(payload.blocks).filter((b) => b.isVisible);
  const hero = blocks.find((b) => b.type === "hero");
  const about = blocks.find((b) => b.type === "about");
  const offers = blocks.find((b) => b.type === "offers");
  const contact = blocks.find((b) => b.type === "contact");
  const fc = payload.formConfig;

  const linkLabel = (l: (typeof payload.nav.links)[0]) => pickLang(l.label, lang);

  return {
    nav: {
      brand: pickLang(payload.nav.brand, lang),
      cta: pickLang(payload.nav.cta, lang),
      links: sortLinks(payload.nav.links).map((l) => ({
        label: linkLabel(l),
        href: l.href,
      })),
    },
    hero: {
      title: hero?.content[lang]?.title ?? "",
      subtitle: hero?.content[lang]?.subtitle ?? "",
      cta: hero?.content[lang]?.cta ?? "",
    },
    about: {
      title: about?.content[lang]?.title ?? "",
      paragraphs: about?.content[lang]?.paragraphs ?? [],
    },
    offers: {
      title: offers?.content[lang]?.title ?? "",
      items: offers?.content[lang]?.items ?? [],
    },
    contact: {
      title: contact?.content[lang]?.title ?? "",
      subtitle: contact?.content[lang]?.subtitle ?? "",
      fields: {
        companyName: fc.fields.find((f) => f.id === "company_name" || f.id === "companyName")?.label[lang] ?? "",
        contactPerson: fc.fields.find((f) => f.id === "contact_person" || f.id === "contactPerson")?.label[lang] ?? "",
        email: fc.fields.find((f) => f.id === "email")?.label[lang] ?? "",
        message: fc.fields.find((f) => f.id === "message")?.label[lang] ?? "",
        consent: pickLang(fc.consentCheckboxLabel as Record<string, string>, lang),
      },
      submit: pickLang(fc.submitButtonLabel as Record<string, string>, lang),
      success: pickLang(fc.successMessage as Record<string, string>, lang),
    },
    footer: {
      built: pickLang(payload.footer.watermark as Record<string, string>, lang),
    },
  };
}

function sortLinks(links: CmsPayload["nav"]["links"]) {
  return [...links].filter((l) => l.enabled).sort((a, b) => a.order - b.order);
}

export function headingClass(preset?: string): string {
  switch (preset) {
    case "sm":
      return "text-2xl sm:text-3xl";
    case "md":
      return "text-3xl sm:text-4xl";
    case "lg":
      return "text-4xl sm:text-5xl";
    case "xl":
      return "text-5xl sm:text-6xl";
    default:
      return "text-4xl sm:text-5xl";
  }
}

export function bodyClass(preset?: string): string {
  switch (preset) {
    case "sm":
      return "text-sm sm:text-base";
    case "lg":
      return "text-lg sm:text-xl";
    case "md":
    default:
      return "text-base sm:text-lg";
  }
}
