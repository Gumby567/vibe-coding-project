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
  updated_at?: string | null;
  updated_by_email?: string | null;
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

/** Row shape for Supabase `blocks` table (source of truth for page sections). */
export interface BlockRow {
  id: string;
  type: string;
  order: number;
  is_visible?: boolean | null;
  style?: BlockStyle | null;
  /** Localized copy: `{ en: {...}, et: {...} }` */
  content?: Record<string, BlockLocalizedContent> | null;
  updated_at?: string | null;
  updated_by_email?: string | null;
}

/** Row for `translations` overlays (optional). */
export interface TranslationRow {
  resource_type: string;
  resource_id: string;
  lang: LangKey;
  payload: Partial<BlockLocalizedContent> | Record<string, unknown>;
}

/** Row for `form_fields` table. */
export interface FormFieldRow {
  id: string;
  field_key: string;
  type: "text" | "email" | "textarea" | "checkbox";
  label_en: string | null;
  label_et: string | null;
  is_required: boolean | null;
  order: number | null;
}

/** Row for `seo` table (per language). */
export interface SeoRow {
  lang: LangKey;
  title: string | null;
  description: string | null;
  og_title?: string | null;
  og_description?: string | null;
}
