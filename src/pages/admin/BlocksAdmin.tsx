import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { ContentBlock } from "../../../types/cms";
import { createDefaultCmsPayload, sortBlocks } from "@/lib/cms-defaults";
import { isSupabaseConfigured } from "@/lib/supabase";
import { deleteBlockRow, fetchBlocksFromSupabase, syncAllBlocksToSupabase } from "@/lib/cms-remote";
import { canDeleteBlocks } from "@/lib/auth-roles";
import { BlockEditor } from "@/components/admin/BlockEditor";

/**
 * Minimal blocks admin (functional UI only). Uses the `blocks` Supabase table.
 */
const BlocksAdmin = () => {
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const { role } = useAuth();
  const showDelete = canDeleteBlocks(role);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await fetchBlocksFromSupabase();
      setBlocks(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const persistOrder = async (next: ContentBlock[]) => {
    const sorted = sortBlocks(next).map((b, i) => ({ ...b, order: i }));
    setBlocks(sorted);
    if (!isSupabaseConfigured) return;
    const { error } = await syncAllBlocksToSupabase(sorted);
    if (error) setErr(error);
  };

  const saveBlock = async (b: ContentBlock) => {
    const next = blocks.map((x) => (x.id === b.id ? b : x));
    setBlocks(next);
    if (!isSupabaseConfigured) return;
    const { error } = await syncAllBlocksToSupabase(sortBlocks(next));
    if (error) setErr(error);
  };

  const move = async (id: string, dir: -1 | 1) => {
    const sorted = sortBlocks(blocks);
    const i = sorted.findIndex((b) => b.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= sorted.length) return;
    const a = sorted[i];
    const b = sorted[j];
    const next = blocks.map((bl) => {
      if (bl.id === a.id) return { ...bl, order: b.order };
      if (bl.id === b.id) return { ...bl, order: a.order };
      return bl;
    });
    await persistOrder(next);
  };

  const remove = async (id: string) => {
    if (isSupabaseConfigured) {
      const { error } = await deleteBlockRow(id);
      if (error) {
        setErr(error);
        return;
      }
    }
    const next = blocks.filter((b) => b.id !== id);
    await persistOrder(next);
  };

  const toggleVis = async (id: string, visible: boolean) => {
    const next = blocks.map((b) => (b.id === id ? { ...b, isVisible: visible } : b));
    await persistOrder(next);
  };

  if (loading) return <p>Loading blocks…</p>;
  if (err) return <p role="alert">Error: {err}</p>;
  if (!isSupabaseConfigured) return <p>Supabase env vars are not set.</p>;

  const sorted = sortBlocks(blocks);

  const initializeBlocks = async () => {
    if (!isSupabaseConfigured) {
      setErr("Supabase env vars are not set.");
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const defaults = createDefaultCmsPayload().blocks;
      const { error } = await syncAllBlocksToSupabase(defaults);
      if (error) {
        setErr(error);
      } else {
        setBlocks(sortBlocks(defaults));
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: "1.25rem", marginBottom: 8 }}>Blocks (table)</h1>
      <p style={{ marginBottom: 12 }}>
        <button type="button" onClick={() => void load()}>
          Reload
        </button>
        {sorted.length === 0 ? (
          <button type="button" onClick={() => void initializeBlocks()} style={{ marginLeft: 12 }}>
            Initialize default blocks
          </button>
        ) : null}
      </p>
      {sorted.map((block, index) => (
        <BlockEditor
          key={block.id}
          block={block}
          disableUp={index === 0}
          disableDown={index === sorted.length - 1}
          onSave={saveBlock}
          onMoveUp={() => move(block.id, -1)}
          onMoveDown={() => move(block.id, 1)}
          onDelete={showDelete ? () => remove(block.id) : undefined}
          canDelete={showDelete}
          onToggleVisible={(v) => toggleVis(block.id, v)}
        />
      ))}
      {sorted.length === 0 ? <p>No rows in `blocks`. Add rows in Supabase or use the visual page builder.</p> : null}
    </div>
  );
};

export default BlocksAdmin;
