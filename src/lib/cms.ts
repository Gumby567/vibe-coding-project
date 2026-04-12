import { supabase, isSupabaseConfigured } from "./supabase";
import type { LangKey, SeoConfig, FormConfig, ContentBlock } from "../../types/cms";
import { createDefaultFormConfig, createDefaultSeoConfig } from "./cms-defaults";
import { fetchBlocksFromSupabase, formFieldRowsToConfig } from "./cms-remote";

export async function getSEO(lang: LangKey = "en"): Promise<SeoConfig> {
  if (!isSupabaseConfigured || !supabase) return createDefaultSeoConfig();
  const { data, error } = await supabase.from("seo").select("*").eq("lang", lang).single();
  if (error || !data) return createDefaultSeoConfig();
  return {
    title: { [lang]: data.title || "" },
    description: { [lang]: data.description || "" },
    ogTitle: { [lang]: data.og_title || "" },
    ogDescription: { [lang]: data.og_description || "" },
  };
}

export async function getFormFields(): Promise<FormConfig> {
  if (!isSupabaseConfigured || !supabase) return createDefaultFormConfig();
  const { data, error } = await supabase.from("form_fields").select("*").order("order", { ascending: true });
  if (error || !data) return createDefaultFormConfig();
  return formFieldRowsToConfig(data) || createDefaultFormConfig();
}

export async function getPageContent(): Promise<ContentBlock[]> {
  return await fetchBlocksFromSupabase();
}