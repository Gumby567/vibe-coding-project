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
import { ChevronDown, ChevronUp, Copy, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { createDefaultCmsPayload } from "@/lib/cms-defaults";

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
  const { payload, setPayload, savePayload, rowId, loading, error, updatedAt } = ctx;

  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<ContentBlock | null>(null);
  const [draft, setDraft] = useState<ContentBlock | null>(null);
  const [addType, setAddType] = useState<BlockType>("hero");

  const userEmail = user?.email ?? null;
  const sorted = useMemo(() => sortBlocks(payload.blocks), [payload.blocks]);

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
    const next = { ...payload, blocks: sortBlocks(payload.blocks) };
    const result = await savePayload(next);
    setSaving(false);
    if (result.error) {
      toast({ title: "Save failed", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Saved", description: "Public site will update after refresh." });
  };

  const initializeRow = async () => {
    if (!isSupabaseConfigured) return;
    setSaving(true);
    const result = await savePayload(createDefaultCmsPayload());
    setSaving(false);
    if (result.error) {
      toast({ title: "Could not create row", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Site content initialized" });
  };

  const syncBlocks = (blocks: ContentBlock[]) => setPayload({ ...payload, blocks });

  const removeBlock = (blockId: string) => {
    syncBlocks(
      sortBlocks(payload.blocks.filter((b) => b.id !== blockId)).map((b, i) => ({ ...b, order: i })),
    );
  };

  const duplicateBlock = (block: ContentBlock) => {
    const copy: ContentBlock = JSON.parse(JSON.stringify(block));
    copy.id = `blk-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    copy.order = Math.max(...payload.blocks.map((b) => b.order), -1) + 1;
    syncBlocks([...payload.blocks, copy]);
  };

  const addBlock = () => {
    const nb = createEmptyBlock(addType);
    nb.order = Math.max(...payload.blocks.map((b) => b.order), -1) + 1;
    syncBlocks([...payload.blocks, nb]);
  };

  const move = (index: number, dir: -1 | 1) => {
    const list = sortBlocks(payload.blocks);
    const next = index + dir;
    if (next < 0 || next >= list.length) return;
    const a = list[index];
    const b = list[next];
    syncBlocks(
      payload.blocks.map((bl) => {
        if (bl.id === a.id) return { ...bl, order: b.order };
        if (bl.id === b.id) return { ...bl, order: a.order };
        return bl;
      }),
    );
  };

  const toggleVisible = (blockId: string, visible: boolean) => {
    syncBlocks(payload.blocks.map((b) => (b.id === blockId ? { ...b, isVisible: visible } : b)));
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
    syncBlocks(payload.blocks.map((b) => (b.id === draft.id ? draft : b)));
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

      <div className="space-y-3">
        {sorted.map((block, index) => (
          <Card key={block.id} className={!block.isVisible ? "opacity-60" : ""}>
            <CardContent className="py-4 flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium capitalize">{block.type}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    Order {block.order} · {(block.content.en?.title ?? block.content.en?.subtitle ?? "").toString().slice(0, 80)}
                  </p>
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

              <Button className="w-full" onClick={saveDraftToBlocks}>
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
