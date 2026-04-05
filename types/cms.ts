export type LangKey = "en" | "et";

export interface FormField {
  id: string;
  type: "text" | "email" | "textarea" | "checkbox";
  label: Record<string, string>;
  isRequired: boolean;
  order: number;
}

export interface FormConfig {
  submitButtonLabel: Record<string, string>;
  successMessage: Record<string, string>;
  consentCheckboxLabel: Record<string, string>;
  fields: FormField[];
}

/** Block types rendered on the public site (see BlockRenderer). */
export type BlockType = "hero" | "about" | "offers" | "contact";

export type TextAlign = "left" | "center" | "right";
export type HeadingPreset = "sm" | "md" | "lg" | "xl";
export type BodyPreset = "sm" | "md" | "lg";

export interface BlockStyle {
  background: string;
  padding?: string;
  marginBottom?: string;
  textAlign?: TextAlign;
  headingPreset?: HeadingPreset;
  bodyPreset?: BodyPreset;
  maxWidth?: string;
}

export interface BlockLocalizedContent {
  title?: string;
  subtitle?: string;
  cta?: string;
  paragraphs?: string[];
  items?: string[];
}

export interface ContentBlock {
  id: string;
  type: BlockType;
  isVisible: boolean;
  order: number;
  content: Record<string, BlockLocalizedContent>;
  style: BlockStyle;
}

export interface NavLinkItem {
  id: string;
  label: Record<string, string>;
  /** Hash target e.g. #about, #offers, #contact */
  href: string;
  enabled: boolean;
  order: number;
}

export interface NavConfig {
  brand: Record<string, string>;
  cta: Record<string, string>;
  links: NavLinkItem[];
}

export interface SeoConfig {
  title: Record<string, string>;
  description: Record<string, string>;
  ogTitle?: Record<string, string>;
  ogDescription?: Record<string, string>;
}

export interface I18nSiteConfig {
  enabledLanguages: LangKey[];
  defaultLanguage: LangKey;
}

export interface FooterConfig {
  watermark: Record<string, string>;
}

/** Full CMS document stored in Supabase `site_content.cms_data` (jsonb). */
export interface CmsPayload {
  version: 1;
  blocks: ContentBlock[];
  nav: NavConfig;
  formConfig: FormConfig;
  seo: SeoConfig;
  i18n: I18nSiteConfig;
  footer: FooterConfig;
}

/** Row shape for `site_content`. */
export interface SiteContentRow {
  id: string;
  blocks?: ContentBlock[] | null;
  cms_data?: CmsPayload | null;
  updated_at: string | null;
  updated_by_email?: string | null;
}
