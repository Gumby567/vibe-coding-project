import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { AdminCmsContextValue } from "@/hooks/useAdminCms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { isSupabaseConfigured } from "@/lib/supabase";
import { Save } from "lucide-react";

const HASHES = [
  { value: "#hero", label: "Hero" },
  { value: "#about", label: "About" },
  { value: "#offers", label: "Offers" },
  { value: "#contact", label: "Contact" },
];

const MenuEditor = () => {
  const { toast } = useToast();
  const { payload, setPayload, savePayload, rowId, loading } = useOutletContext<AdminCmsContextValue>();
  const [saving, setSaving] = useState(false);

  const nav = payload.nav;
  const footer = payload.footer;

  const persist = async () => {
    if (!isSupabaseConfigured || !rowId) {
      toast({ title: "Initialize CMS from Page Builder first.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const r = await savePayload(payload);
    setSaving(false);
    if (r.error) toast({ title: "Save failed", description: r.error, variant: "destructive" });
    else toast({ title: "Saved" });
  };

  const moveLink = (id: string, dir: -1 | 1) => {
    const sorted = [...nav.links].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((l) => l.id === id);
    const j = idx + dir;
    if (j < 0 || j >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[j];
    setPayload({
      ...payload,
      nav: {
        ...nav,
        links: nav.links.map((l) => {
          if (l.id === a.id) return { ...l, order: b.order };
          if (l.id === b.id) return { ...l, order: a.order };
          return l;
        }),
      },
    });
  };

  if (loading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h2 className="text-xl font-semibold">Menu &amp; footer</h2>
        <Button onClick={persist} disabled={saving || !rowId} className="gap-2">
          <Save className="h-4 w-4" />
          Save
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Branding &amp; CTA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Brand (EN)</Label>
            <Input value={nav.brand.en} onChange={(e) => setPayload({ ...payload, nav: { ...nav, brand: { ...nav.brand, en: e.target.value } } })} />
          </div>
          <div>
            <Label>Brand (ET)</Label>
            <Input value={nav.brand.et} onChange={(e) => setPayload({ ...payload, nav: { ...nav, brand: { ...nav.brand, et: e.target.value } } })} />
          </div>
          <div>
            <Label>Nav CTA (EN)</Label>
            <Input value={nav.cta.en} onChange={(e) => setPayload({ ...payload, nav: { ...nav, cta: { ...nav.cta, en: e.target.value } } })} />
          </div>
          <div>
            <Label>Nav CTA (ET)</Label>
            <Input value={nav.cta.et} onChange={(e) => setPayload({ ...payload, nav: { ...nav, cta: { ...nav.cta, et: e.target.value } } })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Navigation links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...nav.links]
            .sort((a, b) => a.order - b.order)
            .map((link, index, arr) => (
              <div key={link.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">Link {index + 1}</span>
                  <div className="flex items-center gap-2">
                    <Switch checked={link.enabled} onCheckedChange={(v) =>
                      setPayload({
                        ...payload,
                        nav: {
                          ...nav,
                          links: nav.links.map((l) => (l.id === link.id ? { ...l, enabled: v } : l)),
                        },
                      })
                    } />
                    <Button type="button" size="sm" variant="outline" disabled={index === 0} onClick={() => moveLink(link.id, -1)}>
                      Up
                    </Button>
                    <Button type="button" size="sm" variant="outline" disabled={index === arr.length - 1} onClick={() => moveLink(link.id, 1)}>
                      Down
                    </Button>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  <div>
                    <Label>Label EN</Label>
                    <Input
                      value={link.label.en}
                      onChange={(e) =>
                        setPayload({
                          ...payload,
                          nav: { ...nav, links: nav.links.map((l) => (l.id === link.id ? { ...l, label: { ...l.label, en: e.target.value } } : l)) },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Label ET</Label>
                    <Input
                      value={link.label.et}
                      onChange={(e) =>
                        setPayload({
                          ...payload,
                          nav: { ...nav, links: nav.links.map((l) => (l.id === link.id ? { ...l, label: { ...l.label, et: e.target.value } } : l)) },
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label>Target (block section)</Label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={link.href}
                    onChange={(e) =>
                      setPayload({
                        ...payload,
                        nav: { ...nav, links: nav.links.map((l) => (l.id === link.id ? { ...l, href: e.target.value } : l)) },
                      })
                    }
                  >
                    {HASHES.map((h) => (
                      <option key={h.value} value={h.value}>
                        {h.label} ({h.value})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Footer watermark</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>EN</Label>
            <Input
              value={footer.watermark.en}
              onChange={(e) =>
                setPayload({
                  ...payload,
                  footer: { watermark: { ...footer.watermark, en: e.target.value } },
                })
              }
            />
          </div>
          <div>
            <Label>ET</Label>
            <Input
              value={footer.watermark.et}
              onChange={(e) =>
                setPayload({
                  ...payload,
                  footer: { watermark: { ...footer.watermark, et: e.target.value } },
                })
              }
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Include: Built in AI Web Session 2026, ClearContent CMS, Student name, Team slug. Use env vars VITE_STUDENT_NAME / VITE_TEAM_SLUG on the public site for defaults in new sites.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MenuEditor;
