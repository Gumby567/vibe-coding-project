import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { AdminCmsContextValue } from "@/hooks/useAdminCms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { isSupabaseConfigured } from "@/lib/supabase";
import { Save } from "lucide-react";

const SEOManager = () => {
  const { toast } = useToast();
  const { payload, setPayload, savePayload, rowId, loading } = useOutletContext<AdminCmsContextValue>();
  const [saving, setSaving] = useState(false);
  const seo = payload.seo;

  const persist = async () => {
    if (!isSupabaseConfigured || !rowId) {
      toast({ title: "Initialize CMS first.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const r = await savePayload(payload);
    setSaving(false);
    if (r.error) toast({ title: "Save failed", description: r.error, variant: "destructive" });
    else toast({ title: "Saved" });
  };

  if (loading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h2 className="text-xl font-semibold">SEO manager</h2>
        <Button onClick={persist} disabled={saving || !rowId} className="gap-2">
          <Save className="h-4 w-4" />
          Save
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Page title &amp; meta (per language)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Title EN</Label>
            <Input value={seo.title.en} onChange={(e) => setPayload({ ...payload, seo: { ...seo, title: { ...seo.title, en: e.target.value } } })} />
          </div>
          <div>
            <Label>Title ET</Label>
            <Input value={seo.title.et} onChange={(e) => setPayload({ ...payload, seo: { ...seo, title: { ...seo.title, et: e.target.value } } })} />
          </div>
          <div>
            <Label>Meta description EN</Label>
            <Textarea rows={3} value={seo.description.en} onChange={(e) => setPayload({ ...payload, seo: { ...seo, description: { ...seo.description, en: e.target.value } } })} />
          </div>
          <div>
            <Label>Meta description ET</Label>
            <Textarea rows={3} value={seo.description.et} onChange={(e) => setPayload({ ...payload, seo: { ...seo, description: { ...seo.description, et: e.target.value } } })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Social preview (optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>OG title EN</Label>
            <Input
              value={seo.ogTitle?.en ?? ""}
              onChange={(e) =>
                setPayload({
                  ...payload,
                  seo: { ...seo, ogTitle: { ...(seo.ogTitle ?? {}), en: e.target.value } },
                })
              }
            />
          </div>
          <div>
            <Label>OG title ET</Label>
            <Input
              value={seo.ogTitle?.et ?? ""}
              onChange={(e) =>
                setPayload({
                  ...payload,
                  seo: { ...seo, ogTitle: { ...(seo.ogTitle ?? {}), et: e.target.value } },
                })
              }
            />
          </div>
          <div>
            <Label>OG description EN</Label>
            <Textarea
              rows={2}
              value={seo.ogDescription?.en ?? ""}
              onChange={(e) =>
                setPayload({
                  ...payload,
                  seo: { ...seo, ogDescription: { ...(seo.ogDescription ?? {}), en: e.target.value } },
                })
              }
            />
          </div>
          <div>
            <Label>OG description ET</Label>
            <Textarea
              rows={2}
              value={seo.ogDescription?.et ?? ""}
              onChange={(e) =>
                setPayload({
                  ...payload,
                  seo: { ...seo, ogDescription: { ...(seo.ogDescription ?? {}), et: e.target.value } },
                })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SEOManager;
