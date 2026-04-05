export interface FormField {
  id: string;
  type: "text" | "email" | "textarea" | "checkbox";
  label: string;
  isRequired: boolean;
  order: number;
}

export interface FormConfig {
  submitButtonLabel: { en: string; et: string };
  successMessage: { en: string; et: string };
  consentCheckboxLabel: { en: string; et: string };
  fields: FormField[];
}

/** Block types rendered on the public site (see BlockRenderer). */
export type BlockType = "hero" | "about" | "offers" | "contact";

export interface BlockStyle {
  /** CSS background, e.g. #0f172a or linear-gradient(...) */
  background: string;
  padding?: string;
}

/** Localized payload per block; keys depend on block.type */
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
  content: { en: BlockLocalizedContent; et: BlockLocalizedContent };
  style: BlockStyle;
}

/** Row shape for `site_content` (blocks stored as JSON). */
export interface SiteContentRow {
  id: string;
  blocks: ContentBlock[];
  updated_at: string | null;
  /** Optional: set by trigger or app on save */
  updated_by_email?: string | null;
}
