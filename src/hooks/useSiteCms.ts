import { useQuery } from "@tanstack/react-query";
import type { CmsPayload, SiteContentRow } from "../../types/cms";
import { createDefaultCmsPayload, migrateRowToPayload } from "@/lib/cms-defaults";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

async function fetchCmsPayload(): Promise<CmsPayload> {
  if (!isSupabaseConfigured || !supabase) {
    return createDefaultCmsPayload();
  }
  const { data, error } = await supabase.from("site_content").select("*").limit(1).maybeSingle();
  if (error) {
    throw error;
  }
  if (!data) {
    return createDefaultCmsPayload();
  }
  return migrateRowToPayload(data as SiteContentRow);
}

export function useSiteCms() {
  return useQuery({
    queryKey: ["site-cms"],
    queryFn: fetchCmsPayload,
    staleTime: 30_000,
  });
}
