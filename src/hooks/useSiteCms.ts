import { useQuery } from "@tanstack/react-query";
import type { CmsPayload } from "../../types/cms";
import { createDefaultCmsPayload } from "@/lib/cms-defaults";
import { isSupabaseConfigured } from "@/lib/supabase";
import { loadPublicCmsPayload } from "@/lib/cms-remote";

async function fetchCmsPayload(): Promise<CmsPayload> {
  if (!isSupabaseConfigured) {
    return createDefaultCmsPayload();
  }
  return loadPublicCmsPayload();
}

export function useSiteCms() {
  return useQuery({
    queryKey: ["site-cms"],
    queryFn: fetchCmsPayload,
    staleTime: 30_000,
  });
}
