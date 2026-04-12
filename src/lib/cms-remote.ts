import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type {
  BlockLocalizedContent,
  BlockRow,
  BlockStyle,
  BlockType,
  CmsPayload,
  ContentBlock,
  FormConfig,
  FormField,
  FormFieldRow,
  LangKey,
  SeoConfig,
  SeoRow,
  SiteContentRow,
  TranslationRow,
} from "../../types/cms";
import { createDefaultCmsPayload, createDefaultFormConfig, migrateRowToPayload, sortBlocks } from "@/lib/cms-defaults";

function defaultBlockStyle(): BlockStyle {
  return {
    background: "transparent",
    padding: "0",
    textAlign: "center",
    headingPreset: "lg",
    bodyPreset: "md",
  };
}

export function blockRowToContentBlock(row: BlockRow): ContentBlock {
  const style = { ...defaultBlockStyle(), ...(row.style ?? {}) };
  const content = (row.content ?? { en: {}, et: {} }) as Record<string, BlockLocalizedContent>;
  return {
    id: row.id,
    type: row.type as BlockType,
    order: row.order ?? 0,
    isVisible: row.is_visible !== false,
    content,
    style,
    updated_at: row.updated_at ?? null,
    updated_by_email: row.updated_by_email ?? null,
  };
}

export function contentBlockToUpsertRow(b: ContentBlock): Record<string, unknown> {
  return {
    id: b.id,
    type: b.type,
    order: b.order,
    is_visible: b.isVisible,
    style: b.style,
    content: b.content,
    updated_at: b.updated_at ?? new Date().toISOString(),
    updated_by_email: b.updated_by_email ?? null,
  };
}

export async function fetchBlocksFromSupabase(): Promise<ContentBlock[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase.from("blocks").select("*").order("order", { ascending: true });
  if (error) throw error;
  return sortBlocks((data as BlockRow[] | null)?.map(blockRowToContentBlock) ?? []);
}

export async function fetchBlockTranslations(): Promise<TranslationRow[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("translations")
    .select("resource_type, resource_id, lang, payload")
    .eq("resource_type", "block");
  if (error) return [];
  return (data ?? []) as TranslationRow[];
}

export function mergeBlockTranslations(blocks: ContentBlock[], rows: TranslationRow[]): ContentBlock[] {
  if (!rows.length) return blocks;
  return blocks.map((b) => {
    const nextContent = { ...b.content };
    for (const row of rows) {
      if (row.resource_id !== b.id) continue;
      const lang = row.lang as LangKey;
      const patch = row.payload as Partial<BlockLocalizedContent>;
      nextContent[lang] = { ...(nextContent[lang] ?? {}), ...patch };
    }
    return { ...b, content: nextContent };
  });
}

export function formFieldRowsToConfig(rows: FormFieldRow[] | null | undefined): FormConfig | null {
  if (!rows?.length) return null;
  const sorted = [...rows].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const fields: FormField[] = sorted.map((r) => ({
    id: r.field_key,
    type: r.type,
    label: {
      en: r.label_en ?? r.field_key,
      et: r.label_et ?? r.label_en ?? r.field_key,
    },
    isRequired: !!r.is_required,
    order: r.order ?? 0,
  }));
  const base = createDefaultFormConfig();
  return {
    ...base,
    fields,
  };
}

export async function fetchFormFieldsConfig(): Promise<FormConfig | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.from("form_fields").select("*").order("order", { ascending: true });
  if (error) return null;
  return formFieldRowsToConfig(data as FormFieldRow[]);
}

export function seoRowsToConfig(rows: SeoRow[] | null | undefined): Partial<SeoConfig> | null {
  if (!rows?.length) return null;
  const title: Record<string, string> = {};
  const description: Record<string, string> = {};
  const ogTitle: Record<string, string> = {};
  const ogDescription: Record<string, string> = {};
  for (const r of rows) {
    const k = r.lang;
    if (r.title) title[k] = r.title;
    if (r.description) description[k] = r.description;
    if (r.og_title) ogTitle[k] = r.og_title;
    if (r.og_description) ogDescription[k] = r.og_description;
  }
  return { title, description, ogTitle, ogDescription };
}

export async function fetchSeoFromSupabase(): Promise<Partial<SeoConfig> | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.from("seo").select("*");
  if (error) return null;
  return seoRowsToConfig(data as SeoRow[]);
}

/** Loads merged CMS payload for the public site (blocks table + optional overlays). */
export async function loadPublicCmsPayload(): Promise<CmsPayload> {
  if (!isSupabaseConfigured || !supabase) {
    return createDefaultCmsPayload();
  }
  const { data, error } = await supabase.from("site_content").select("*").limit(1).maybeSingle();
  const base =
    !error && data ? migrateRowToPayload(data as SiteContentRow) : createDefaultCmsPayload();
  const [tableBlocks, translations, fc, seoPatch] = await Promise.all([
    fetchBlocksFromSupabase().catch(() => []),
    fetchBlockTranslations().catch(() => []),
    fetchFormFieldsConfig(),
    fetchSeoFromSupabase(),
  ]);
  let blocks = tableBlocks.length ? tableBlocks : base.blocks;
  blocks = mergeBlockTranslations(blocks, translations);
  const mergedSeo = seoPatch
    ? {
        title: { ...base.seo.title, ...(seoPatch.title ?? {}) },
        description: { ...base.seo.description, ...(seoPatch.description ?? {}) },
        ogTitle: { ...(base.seo.ogTitle ?? {}), ...(seoPatch.ogTitle ?? {}) },
        ogDescription: { ...(base.seo.ogDescription ?? {}), ...(seoPatch.ogDescription ?? {}) },
      }
    : base.seo;
  const formConfig = fc ?? base.formConfig;
  return {
    ...base,
    blocks: sortBlocks(blocks),
    formConfig,
    seo: mergedSeo,
  };
}

async function resolveBlockAuditFields() {
  if (!supabase) return { updated_at: new Date().toISOString(), updated_by_email: null };
  const { data } = await supabase.auth.getSession();
  const email = data.session?.user?.email ?? null;
  return { updated_at: new Date().toISOString(), updated_by_email: email };
}

export async function upsertBlockRow(block: ContentBlock) {
  if (!supabase) return { error: "No client" as const };
  const audit = await resolveBlockAuditFields();
  const row = { ...contentBlockToUpsertRow(block), ...audit };
  const { error } = await supabase.from("blocks").upsert(row, { onConflict: "id" });
  return { error: error?.message ?? null };
}

export async function deleteBlockRow(id: string) {
  if (!supabase) return { error: "No client" as const };
  const { error } = await supabase.from("blocks").delete().eq("id", id);
  return { error: error?.message ?? null };
}

export async function insertBlockRow(block: ContentBlock) {
  if (!supabase) return { error: "No client" as const };
  const audit = await resolveBlockAuditFields();
  const { error } = await supabase.from("blocks").insert({ ...contentBlockToUpsertRow(block), ...audit });
  return { error: error?.message ?? null };
}

export async function syncAllBlocksToSupabase(blocks: ContentBlock[]): Promise<{ error: string | null }> {
  if (!supabase) return { error: "No client" };
  const audit = await resolveBlockAuditFields();
  for (const b of sortBlocks(blocks)) {
    // Save revision before update
    const { error: revErr } = await supabase.from("revisions").insert({
      resource_type: "block",
      resource_id: b.id,
      snapshot: b,
      created_by_email: audit.updated_by_email,
    });
    if (revErr) console.warn("Revision save failed:", revErr); // Non-blocking

    const { error } = await supabase.from("blocks").upsert({ ...contentBlockToUpsertRow(b), ...audit }, { onConflict: "id" });
    if (error) return { error: error.message };
  }
  return { error: null };
}
