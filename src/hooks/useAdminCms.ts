import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { CmsPayload, SiteContentRow } from "../../types/cms";
import { createDefaultCmsPayload, migrateRowToPayload } from "@/lib/cms-defaults";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { fetchBlocksFromSupabase } from "@/lib/cms-remote";

export function useAdminCms() {
  const queryClient = useQueryClient();
  const [rowId, setRowId] = useState<string | null>(null);
  const [payload, setPayload] = useState<CmsPayload>(createDefaultCmsPayload());
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRow = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      setError("Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: qErr } = await supabase.from("site_content").select("*").limit(1).maybeSingle();
    if (qErr) {
      setError(qErr.message);
      setLoading(false);
      return;
    }
    if (!data) {
      setRowId(null);
      let nextPayload = createDefaultCmsPayload();
      try {
        const tableBlocks = await fetchBlocksFromSupabase();
        if (tableBlocks.length) {
          nextPayload = { ...nextPayload, blocks: tableBlocks };
        }
      } catch {
        /* keep defaults */
      }
      setPayload(nextPayload);
      setUpdatedAt(null);
      setLoading(false);
      return;
    }
    setRowId(data.id);
    const migrated = migrateRowToPayload(data as SiteContentRow);
    try {
      const tableBlocks = await fetchBlocksFromSupabase();
      if (tableBlocks.length) {
        setPayload({ ...migrated, blocks: tableBlocks });
      } else {
        setPayload(migrated);
      }
    } catch {
      setPayload(migrated);
    }
    setUpdatedAt(data.updated_at ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRow();
  }, [fetchRow]);

  const savePayload = useCallback(
    async (next: CmsPayload) => {
      if (!isSupabaseConfigured || !supabase) {
        return { error: "Supabase not configured" as const };
      }
      const { data: sess } = await supabase.auth.getSession();
      const email = sess.session?.user?.email ?? null;
      const ts = new Date().toISOString();
      if (!rowId) {
        const { data, error: insErr } = await supabase
          .from("site_content")
          .insert({
            cms_data: next,
            blocks: next.blocks,
            updated_at: ts,
            updated_by_email: email,
          })
          .select("*")
          .single();
        if (insErr) return { error: insErr.message };
        setRowId(data.id);
        setUpdatedAt(data.updated_at ?? ts);
        setPayload(migrateRowToPayload(data as SiteContentRow));
        await queryClient.invalidateQueries({ queryKey: ["site-cms"] });
        return { error: null as const };
      }
      const { data, error: upErr } = await supabase
        .from("site_content")
        .update({
          cms_data: next,
          blocks: next.blocks,
          updated_at: ts,
          updated_by_email: email,
        })
        .eq("id", rowId)
        .select("updated_at")
        .maybeSingle();
      if (upErr) return { error: upErr.message };
      setUpdatedAt(data?.updated_at ?? ts);
      setPayload(next);
      await queryClient.invalidateQueries({ queryKey: ["site-cms"] });
      return { error: null as const };
    },
    [rowId, queryClient],
  );

  return {
    rowId,
    payload,
    setPayload,
    updatedAt,
    loading,
    error,
    refetch: fetchRow,
    savePayload,
  };
}

export type AdminCmsContextValue = ReturnType<typeof useAdminCms>;
