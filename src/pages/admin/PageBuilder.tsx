import { useCallback, useEffect, useMemo, useState } from "react";
import type { BlockLocalizedContent, ContentBlock } from "../../../types/cms";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { createDefaultBlocks } from "@/lib/default-blocks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { canDeleteBlocks } from "@/lib/auth-roles";
import { ChevronDown, ChevronUp, Pencil, Save, Trash2 } from "lucide-react";

function sortBlocks(list: ContentBlock[]) {
  return [...list].sort((a, b) => a.order - b.order);
}

function hexFromCssBackground(bg: string): string {
  const m = /^#([0-9a-fA-F]{6})$/.exec(bg.trim());
  if (m) return m[0];
  return "#1e293b";
}

const PageBuilder = () => {
  const { toast } = useToast();
  const { role } = useAuth();
  const showDelete = canDeleteBlocks(role);
  const [rowId, setRowId] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ContentBlock | null>(null);
  const [draft, setDraft] = useState<ContentBlock | null>(null);

  const sorted = useMemo(() => sortBlocks(blocks), [blocks]);

  const refreshSession = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    setUserEmail(data.session?.user?.email ?? null);
  }, []);

  const fetchContent = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      setLoadError("Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.");
      return;
    }
    setLoading(true);
    setLoadError(null);
    const { data, error } = await supabase.from("site_content").select("*").limit(1).maybeSingle();
    if (error) {
      setLoadError(error.message);
      setRowId(null);
      setBlocks([]);
      setUpdatedAt(null);
      setLoading(false);
      return;
    }
    if (!data) {
      setRowId(null);
      setBlocks([]);
      setUpdatedAt(null);
      setLoading(false);
      return;
    }
    setRowId(data.id);
    setBlocks((data.blocks as ContentBlock[]) ?? []);
    setUpdatedAt(data.updated_at ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchContent();
    refreshSession();
  }, [fetchContent, refreshSession]);

  const removeBlock = (blockId: string) => {
    setBlocks((prev) => {
      const filtered = prev.filter((b) => b.id !== blockId);
      return sortBlocks(filtered).map((b, i) => ({ ...b, order: i }));
    });
  };

  const move = (index: number, dir: -1 | 1) => {
    const list = sortBlocks(blocks);
    const next = index + dir;
    if (next < 0 || next >= list.length) return;
    const a = list[index];
    const b = list[next];
    setBlocks(
      blocks.map((bl) => {
        if (bl.id === a.id) return { ...bl, order: b.order };
        if (bl.id === b.id) return { ...bl, order: a.order };
        return bl;
      }),
    );
  };

  const openEdit = (block: ContentBlock) => {
    setEditing(block);
    setDraft(JSON.parse(JSON.stringify(block)) as ContentBlock);
  };

  const applyDraftLang = (lang: "en" | "et", patch: Partial<BlockLocalizedContent>) => {
    if (!draft) return;
    setDraft({
      ...draft,
      content: {
        ...draft.content,
        [lang]: { ...draft.content[lang], ...patch },
      },
    });
  };

  const saveDraftToBlocks = () => {
    if (!draft) return;
    setBlocks((prev) => prev.map((b) => (b.id === draft.id ? draft : b)));
    setEditing(null);
    setDraft(null);
  };

  const persist = async () => {
    if (!isSupabaseConfigured || !supabase) {
      toast({ title: "Supabase is not configured", variant: "destructive" });
      return;
    }
    if (!rowId) {
      toast({ title: "Nothing to save", description: "Initialize site content first.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const ts = new Date().toISOString();
    const { data: sessionData } = await supabase.auth.getSession();
    const email = sessionData.session?.user?.email ?? null;

    const { error, data } = await supabase
      .from("site_content")
      .update({
        blocks: sortBlocks(blocks),
        updated_at: ts,
      })
      .eq("id", rowId)
      .select("updated_at")
      .maybeSingle();

    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    setUpdatedAt(data?.updated_at ?? ts);
    setUserEmail(email);
    toast({ title: "Saved", description: "Site content was updated." });
  };

  const initializeRow = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    setSaving(true);
    const seed = createDefaultBlocks();
    const { data, error } = await supabase.from("site_content").insert({ blocks: seed }).select("*").single();
    setSaving(false);
    if (error) {
      toast({ title: "Could not create row", description: error.message, variant: "destructive" });
      return;
    }
    setRowId(data.id);
    setBlocks((data.blocks as ContentBlock[]) ?? seed);
    setUpdatedAt(data.updated_at ?? null);
    toast({ title: "Site content initialized" });
  };

  const renderLangFields = (lang: "en" | "et") => {
    if (!draft) return null;
    const c = draft.content[lang];
    const t = draft.type;

    if (t === "hero") {
      return (
        <div className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input
              className="mt-1"
              value={c.title ?? ""}
              onChange={(e) => applyDraftLang(lang, { title: e.target.value })}
            />
          </div>
          <div>
            <Label>Subtitle</Label>
            <Textarea
              className="mt-1"
              rows={3}
              value={c.subtitle ?? ""}
              onChange={(e) => applyDraftLang(lang, { subtitle: e.target.value })}
            />
          </div>
          <div>
            <Label>CTA</Label>
            <Input className="mt-1" value={c.cta ?? ""} onChange={(e) => applyDraftLang(lang, { cta: e.target.value })} />
          </div>
        </div>
      );
    }
    if (t === "about") {
      return (
        <div className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input className="mt-1" value={c.title ?? ""} onChange={(e) => applyDraftLang(lang, { title: e.target.value })} />
          </div>
          <div>
            <Label>Paragraphs</Label>
            <Textarea
              className="mt-1 font-mono text-sm"
              rows={8}
              value={(c.paragraphs ?? []).join("\n\n")}
              onChange={(e) =>
                applyDraftLang(lang, {
                  paragraphs: e.target.value
                    .split(/\n\s*\n/)
                    .map((p) => p.trim())
                    .filter(Boolean),
                })
              }
            />
            <p className="text-xs text-muted-foreground mt-1">Separate paragraphs with a blank line.</p>
          </div>
        </div>
      );
    }
    if (t === "offers") {
      return (
        <div className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input className="mt-1" value={c.title ?? ""} onChange={(e) => applyDraftLang(lang, { title: e.target.value })} />
          </div>
          <div>
            <Label>Bullet items (one per line)</Label>
            <Textarea
              className="mt-1 font-mono text-sm"
              rows={10}
              value={(c.items ?? []).join("\n")}
              onChange={(e) =>
                applyDraftLang(lang, {
                  items: e.target.value
                    .split("\n")
                    .map((l) => l.trim())
                    .filter(Boolean),
                })
              }
            />
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        <div>
          <Label>Title</Label>
          <Input className="mt-1" value={c.title ?? ""} onChange={(e) => applyDraftLang(lang, { title: e.target.value })} />
        </div>
        <div>
          <Label>Subtitle</Label>
          <Textarea
            className="mt-1"
            rows={3}
            value={c.subtitle ?? ""}
            onChange={(e) => applyDraftLang(lang, { subtitle: e.target.value })}
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading site content…</p>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Page Builder</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Reorder sections, edit copy (EN/ET), and section backgrounds. Save to update the database.
          </p>
        </div>
        <Button onClick={persist} disabled={saving || !rowId} className="gap-2 shrink-0">
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>

      {loadError && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6 text-sm text-destructive">{loadError}</CardContent>
        </Card>
      )}

      {!loadError && isSupabaseConfigured && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Session &amp; publish</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>
              <span className="text-foreground font-medium">Last updated:</span>{" "}
              {updatedAt ? new Date(updatedAt).toLocaleString() : "—"}
            </p>
            <p>
              <span className="text-foreground font-medium">Signed in as:</span> {userEmail ?? "Not signed in"}
            </p>
            <p>
              <span className="text-foreground font-medium">Role:</span> {role ?? "—"}
            </p>
          </CardContent>
        </Card>
      )}

      {!rowId && isSupabaseConfigured && !loadError && (
        <Card>
          <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">No row in <code className="text-xs">site_content</code> yet.</p>
            <Button variant="secondary" onClick={initializeRow} disabled={saving}>
              Initialize from template
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {sorted.map((block, index) => (
          <Card key={block.id}>
            <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium capitalize">{block.type}</p>
                <p className="text-xs text-muted-foreground truncate">
                  Order {block.order} · {(block.content.en.title ?? block.content.en.subtitle ?? "").slice(0, 80)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" size="icon" aria-label="Move up" disabled={index === 0} onClick={() => move(index, -1)}>
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Move down"
                  disabled={index === sorted.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button type="button" variant="secondary" className="gap-1" onClick={() => openEdit(block)}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                {showDelete && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    aria-label={`Delete ${block.type} block`}
                    onClick={() => removeBlock(block.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Sheet
        open={!!editing && !!draft}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
            setDraft(null);
          }
        }}
      >
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="capitalize">Edit {draft?.type ?? ""}</SheetTitle>
          </SheetHeader>
          {draft && (
            <div className="mt-6 space-y-6">
              <Tabs defaultValue="en">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="en">English</TabsTrigger>
                  <TabsTrigger value="et">Eesti</TabsTrigger>
                </TabsList>
                <TabsContent value="en" className="mt-4">
                  {renderLangFields("en")}
                </TabsContent>
                <TabsContent value="et" className="mt-4">
                  {renderLangFields("et")}
                </TabsContent>
              </Tabs>

              <div className="space-y-3 border-t pt-4">
                <p className="text-sm font-medium">Background</p>
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <Label className="text-xs">Color (solid)</Label>
                    <Input
                      type="color"
                      className="h-10 w-14 p-1 cursor-pointer"
                      value={hexFromCssBackground(draft.style.background)}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          style: { ...draft.style, background: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="flex-1 min-w-[12rem]">
                    <Label className="text-xs">CSS background</Label>
                    <Input
                      className="mt-1 font-mono text-xs"
                      value={draft.style.background}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          style: { ...draft.style, background: e.target.value },
                        })
                      }
                      placeholder="#0f172a or linear-gradient(...)"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Padding (CSS)</Label>
                  <Input
                    className="mt-1 font-mono text-xs"
                    value={draft.style.padding ?? ""}
                    onChange={(e) => setDraft({ ...draft, style: { ...draft.style, padding: e.target.value } })}
                    placeholder="e.g. 0 or 2rem 1rem"
                  />
                </div>
              </div>

              <Button className="w-full" onClick={saveDraftToBlocks}>
                Apply to draft
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default PageBuilder;
