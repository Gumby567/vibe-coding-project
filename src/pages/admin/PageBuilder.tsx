import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { AdminCmsContextValue } from "@/hooks/useAdminCms";
import type { BlockLocalizedContent, BlockType, ContentBlock } from "../../../types/cms";
import { createEmptyBlock } from "@/lib/cms-defaults";
import { sortBlocks } from "@/lib/cms-defaults";
import { isSupabaseConfigured } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { canDeleteBlocks } from "@/lib/auth-roles";
import { ChevronDown, ChevronUp, Copy, Pencil, Plus, Save, Trash2, Eye, EyeOff } from "lucide-react";
import { createDefaultCmsPayload } from "@/lib/cms-defaults";
import { deleteBlockRow, insertBlockRow, syncAllBlocksToSupabase } from "@/lib/cms-remote";
import { I18nProvider } from "@/contexts/I18nContext";
import { BlockRenderer } from "@/components/BlockRenderer";

function hexFromCssBackground(bg: string): string {
  const m = /^#([0-9a-fA-F]{6})$/.exec(bg.trim());
  if (m) return m[0];
  return "#1e293b";
}

const PageBuilder = () => {
  const { toast } = useToast();
  const { user, role } = useAuth();
  const showDelete = canDeleteBlocks(role);
  const ctx = useOutletContext<AdminCmsContextValue>();
  const { payload, setPayload, savePayload, rowId, loading, error, updatedAt, refetch } = ctx;

  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<ContentBlock | null>(null);
  const [draft, setDraft] = useState<ContentBlock | null>(null);
  const [addType, setAddType] = useState<BlockType>("hero");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "canvas">("list");

  const userEmail = user?.email ?? null;
  const sorted = useMemo(() => sortBlocks(payload.blocks), [payload.blocks]);

  const reorderBlocks = async (sourceId: string, targetId: string) => {
    const list = sortBlocks(payload.blocks);
    const fromIndex = list.findIndex((b) => b.id === sourceId);
    const toIndex = list.findIndex((b) => b.id === targetId);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;
    const next = [...list];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    const normalized = next.map((b, i) => ({ ...b, order: i }));
    syncBlocks(normalized);
    if (!isSupabaseConfigured) return;
    const sync = await syncAllBlocksToSupabase(normalized);
    if (sync.error) {
      toast({ title: "Reorder sync failed", description: sync.error, variant: "destructive" });
    }
  };

  const persist = async () => {
    if (!isSupabaseConfigured) {
      toast({ title: "Supabase is not configured", variant: "destructive" });
      return;
    }
    if (!rowId) {
      toast({ title: "Initialize site content first.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const sorted = sortBlocks(payload.blocks);
    const sync = await syncAllBlocksToSupabase(sorted);
    if (sync.error) {
      setSaving(false);
      toast({ title: "Blocks table sync failed", description: sync.error, variant: "destructive" });
      return;
    }
    const next = { ...payload, blocks: sorted };
    const result = await savePayload(next);
    setSaving(false);
    if (result.error) {
      toast({ title: "Save failed", description: result.error, variant: "destructive" });
      return;
    }
    await refetch();
    toast({ title: "Saved", description: "Public site will update after refresh." });
  };

  const initializeRow = async () => {
    if (!isSupabaseConfigured) return;
    setSaving(true);
    const defaults = createDefaultCmsPayload();
    const result = await savePayload(defaults);
    if (result.error) {
      setSaving(false);
      toast({ title: "Could not create row", description: result.error, variant: "destructive" });
      return;
    }
    const sync = await syncAllBlocksToSupabase(defaults.blocks);
    setSaving(false);
    if (sync.error) {
      toast({ title: "Site row created but blocks table sync failed", description: sync.error, variant: "destructive" });
    } else {
      toast({ title: "Site content initialized" });
    }
    await refetch();
  };

  const syncBlocks = (blocks: ContentBlock[]) => setPayload({ ...payload, blocks });

  const removeBlock = async (blockId: string) => {
    if (isSupabaseConfigured) {
      const { error: delErr } = await deleteBlockRow(blockId);
      if (delErr) {
        toast({ title: "Delete failed", description: delErr, variant: "destructive" });
        return;
      }
    }
    const next = sortBlocks(payload.blocks.filter((b) => b.id !== blockId)).map((b, i) => ({ ...b, order: i }));
    syncBlocks(next);
    if (isSupabaseConfigured) {
      const sync = await syncAllBlocksToSupabase(next);
      if (sync.error) {
        toast({ title: "Reorder sync failed", description: sync.error, variant: "destructive" });
      }
      await refetch();
    }
  };

  const duplicateBlock = async (block: ContentBlock) => {
    const copy: ContentBlock = JSON.parse(JSON.stringify(block));
    copy.id = `blk-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    copy.order = Math.max(...payload.blocks.map((b) => b.order), -1) + 1;
    const next = [...payload.blocks, copy];
    syncBlocks(next);
    if (isSupabaseConfigured) {
      const { error: insErr } = await insertBlockRow(copy);
      if (insErr) {
        toast({ title: "Duplicate failed", description: insErr, variant: "destructive" });
        return;
      }
      await refetch();
    }
  };

  const addBlock = async () => {
    const nb = createEmptyBlock(addType);
    nb.order = Math.max(...payload.blocks.map((b) => b.order), -1) + 1;
    nb.updated_at = new Date().toISOString();
    nb.updated_by_email = user?.email ?? null;
    const next = [...payload.blocks, nb];
    syncBlocks(next);
    if (isSupabaseConfigured) {
      const { error: insErr } = await insertBlockRow(nb);
      if (insErr) {
        toast({ title: "Could not add block", description: insErr, variant: "destructive" });
        return;
      }
      await refetch();
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const list = sortBlocks(payload.blocks);
    const j = index + dir;
    if (j < 0 || j >= list.length) return;
    const a = list[index];
    const b = list[j];
    const next = payload.blocks.map((bl) => {
      if (bl.id === a.id) return { ...bl, order: b.order };
      if (bl.id === b.id) return { ...bl, order: a.order };
      return bl;
    });
    syncBlocks(next);
    if (isSupabaseConfigured) {
      const sync = await syncAllBlocksToSupabase(sortBlocks(next));
      if (sync.error) {
        toast({ title: "Move sync failed", description: sync.error, variant: "destructive" });
      }
      await refetch();
    }
  };

  const toggleVisible = async (blockId: string, visible: boolean) => {
    const next = payload.blocks.map((b) => (b.id === blockId ? { ...b, isVisible: visible } : b));
    syncBlocks(next);
    if (isSupabaseConfigured) {
      const sync = await syncAllBlocksToSupabase(sortBlocks(next));
      if (sync.error) {
        toast({ title: "Visibility sync failed", description: sync.error, variant: "destructive" });
      }
      await refetch();
    }
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

  const saveDraftToBlocks = async () => {
    if (!draft) return;
    const now = new Date().toISOString();
    const updatedDraft = {
      ...draft,
      updated_at: now,
      updated_by_email: user?.email ?? null,
    };
    const next = payload.blocks.map((b) => (b.id === updatedDraft.id ? updatedDraft : b));
    syncBlocks(next);
    if (isSupabaseConfigured) {
      const sync = await syncAllBlocksToSupabase(sortBlocks(next));
      if (sync.error) {
        toast({ title: "Save failed", description: sync.error, variant: "destructive" });
        return;
      }
      await refetch();
    }
    setEditing(null);
    setDraft(null);
  };

  const renderLangFields = (lang: "en" | "et") => {
    if (!draft) return null;
    const c = draft.content[lang] ?? {};
    const t = draft.type;
    if (t === "hero") {
      return (
        <div className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input className="mt-1" value={c.title ?? ""} onChange={(e) => applyDraftLang(lang, { title: e.target.value })} />
          </div>
          <div>
            <Label>Subtitle</Label>
            <Textarea className="mt-1" rows={3} value={c.subtitle ?? ""} onChange={(e) => applyDraftLang(lang, { subtitle: e.target.value })} />
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
          <Textarea className="mt-1" rows={3} value={c.subtitle ?? ""} onChange={(e) => applyDraftLang(lang, { subtitle: e.target.value })} />
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
          <h2 className="text-xl font-semibold">Visual page builder</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Reorder, show/hide, duplicate, and edit blocks. Typography and layout options are in each block&apos;s edit panel.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={persist} disabled={saving || !rowId} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save to Supabase"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              window.sessionStorage.setItem("cmsPreviewPayload", JSON.stringify(payload));
              window.open(`${window.location.origin}/?previewDraft=1`, "_blank");
            }}
            className="gap-2"
          >
            Preview draft
          </Button>
          <Button variant="outline" onClick={() => setViewMode(viewMode === "list" ? "canvas" : "list")} className="gap-2">
            {viewMode === "list" ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {viewMode === "list" ? "Canvas view" : "List view"}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Audit</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>
            <span className="text-foreground font-medium">Site last updated:</span>{" "}
            {updatedAt ? new Date(updatedAt).toLocaleString() : "—"}
          </p>
          <p>
            <span className="text-foreground font-medium">Signed in as:</span> {userEmail ?? "—"}
          </p>
          <p>
            <span className="text-foreground font-medium">Role:</span> {role ?? "—"}
          </p>
        </CardContent>
      </Card>

      {!rowId && isSupabaseConfigured && !error && (
        <Card>
          <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              No row in <code className="text-xs">site_content</code> yet. Creates default blocks + menu + form config.
            </p>
            <Button variant="secondary" onClick={initializeRow} disabled={saving}>
              Initialize CMS
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Add block</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 items-end">
          <div className="space-y-1">
            <Label>Block type</Label>
            <Select value={addType} onValueChange={(v) => setAddType(v as BlockType)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hero">Hero</SelectItem>
                <SelectItem value="about">About</SelectItem>
                <SelectItem value="offers">Offers</SelectItem>
                <SelectItem value="contact">Contact</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="button" variant="outline" className="gap-1" onClick={addBlock}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        {viewMode === "list"
          ? "Drag blocks to reorder or use the move buttons. The preview below updates with current CMS state."
          : "Canvas view: Click blocks to edit, drag to reorder. Visual preview of your page layout."}
      </p>
      {viewMode === "list" ? (
        <div className="space-y-3">
          {sorted.map((block, index) => (
            <Card
              key={block.id}
              draggable
              onDragStart={() => setDraggingId(block.id)}
              onDragEnd={() => setDraggingId(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={async (event) => {
                event.preventDefault();
                if (draggingId && draggingId !== block.id) {
                  await reorderBlocks(draggingId, block.id);
                }
                setDraggingId(null);
              }}
              className={
                !block.isVisible
                  ? "opacity-60"
                  : draggingId === block.id
                  ? "border-dashed border-2 border-accent"
                  : ""
              }
            >
              <CardContent className="py-4 flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium capitalize">{block.type}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      Order {block.order} · {(block.content.en?.title ?? block.content.en?.subtitle ?? "").toString().slice(0, 80)}
                    </p>
                    {(block.updated_at || block.updated_by_email) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Updated {block.updated_at ? new Date(block.updated_at).toLocaleString() : "—"} by {block.updated_by_email ?? "unknown"}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={block.isVisible} onCheckedChange={(v) => toggleVisible(block.id, v)} aria-label="Visible on site" />
                    <span className="text-xs text-muted-foreground hidden sm:inline">Visible</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" size="icon" aria-label="Move up" disabled={index === 0} onClick={() => move(index, -1)}>
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="outline" size="icon" aria-label="Move down" disabled={index === sorted.length - 1} onClick={() => move(index, 1)}>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="secondary" className="gap-1" onClick={() => openEdit(block)}>
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button type="button" variant="outline" className="gap-1" onClick={() => duplicateBlock(block)}>
                    <Copy className="h-4 w-4" />
                    Duplicate
                  </Button>
                  {showDelete && (
                    <Button type="button" variant="destructive" size="icon" aria-label={`Delete ${block.type}`} onClick={() => removeBlock(block.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((block, index) => (
            <div
              key={block.id}
              draggable
              onDragStart={() => setDraggingId(block.id)}
              onDragEnd={() => setDraggingId(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={async (event) => {
                event.preventDefault();
                if (draggingId && draggingId !== block.id) {
                  await reorderBlocks(draggingId, block.id);
                }
                setDraggingId(null);
              }}
              className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                !block.isVisible
                  ? "opacity-60 border-gray-300"
                  : draggingId === block.id
                  ? "border-dashed border-accent"
                  : "border-gray-200 hover:border-accent"
              }`}
              onClick={() => openEdit(block)}
            >
              <div className="absolute top-2 left-2 z-10 flex gap-1">
                <Button type="button" variant="secondary" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); openEdit(block); }}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button type="button" variant="outline" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); duplicateBlock(block); }}>
                  <Copy className="h-3 w-3" />
                </Button>
                {showDelete && (
                  <Button type="button" variant="destructive" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="absolute top-2 right-2 z-10">
                <Switch checked={block.isVisible} onCheckedChange={(v) => toggleVisible(block.id, v)} aria-label="Visible on site" />
              </div>
              <div className="pointer-events-none">
                <I18nProvider payload={payload}>
                  <BlockRenderer block={block} />
                </I18nProvider>
              </div>
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Live preview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Preview the current CMS content in a read-only view. Edits apply immediately in this preview.
          </p>
          <div className="overflow-hidden rounded-2xl border border-border bg-surface p-4 pointer-events-none">
            <I18nProvider payload={payload}>
              <div className="space-y-8">
                {sorted.map((block) => (
                  <BlockRenderer key={block.id} block={block} />
                ))}
              </div>
            </I18nProvider>
          </div>
        </CardContent>
      </Card>

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
                <p className="text-sm font-medium">Layout &amp; typography</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Text align</Label>
                    <Select
                      value={draft.style.textAlign ?? "center"}
                      onValueChange={(v) =>
                        setDraft({
                          ...draft,
                          style: { ...draft.style, textAlign: v as "left" | "center" | "right" },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Heading size</Label>
                    <Select
                      value={draft.style.headingPreset ?? "lg"}
                      onValueChange={(v) =>
                        setDraft({
                          ...draft,
                          style: { ...draft.style, headingPreset: v as "sm" | "md" | "lg" | "xl" },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sm">Small</SelectItem>
                        <SelectItem value="md">Medium</SelectItem>
                        <SelectItem value="lg">Large</SelectItem>
                        <SelectItem value="xl">XL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Body size</Label>
                    <Select
                      value={draft.style.bodyPreset ?? "md"}
                      onValueChange={(v) =>
                        setDraft({ ...draft, style: { ...draft.style, bodyPreset: v as "sm" | "md" | "lg" } })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sm">Small</SelectItem>
                        <SelectItem value="md">Medium</SelectItem>
                        <SelectItem value="lg">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-3 border-t pt-4">
                <p className="text-sm font-medium">Background</p>
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <Label className="text-xs">Color</Label>
                    <Input
                      type="color"
                      className="h-10 w-14 p-1 cursor-pointer"
                      value={hexFromCssBackground(draft.style.background)}
                      onChange={(e) => setDraft({ ...draft, style: { ...draft.style, background: e.target.value } })}
                    />
                  </div>
                  <div className="flex-1 min-w-[12rem]">
                    <Label className="text-xs">CSS (solid or gradient)</Label>
                    <Input
                      className="mt-1 font-mono text-xs"
                      value={draft.style.background}
                      onChange={(e) => setDraft({ ...draft, style: { ...draft.style, background: e.target.value } })}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Padding</Label>
                  <Input
                    className="mt-1 font-mono text-xs"
                    value={draft.style.padding ?? ""}
                    onChange={(e) => setDraft({ ...draft, style: { ...draft.style, padding: e.target.value } })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Margin bottom</Label>
                  <Input
                    className="mt-1 font-mono text-xs"
                    value={draft.style.marginBottom ?? ""}
                    onChange={(e) => setDraft({ ...draft, style: { ...draft.style, marginBottom: e.target.value } })}
                    placeholder="e.g. 2rem"
                  />
                </div>
              </div>

              <Button className="w-full" onClick={() => void saveDraftToBlocks()}>
                Apply changes
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default PageBuilder;
