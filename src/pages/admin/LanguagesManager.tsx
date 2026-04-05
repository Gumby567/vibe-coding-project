import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { AdminCmsContextValue } from "@/hooks/useAdminCms";
import type { LangKey } from "../../../types/cms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { canManageSystemSettings } from "@/lib/auth-roles";
import { isSupabaseConfigured } from "@/lib/supabase";
import { Save } from "lucide-react";

const LanguagesManager = () => {
  const { toast } = useToast();
  const { role } = useAuth();
  const { payload, setPayload, savePayload, rowId, loading } = useOutletContext<AdminCmsContextValue>();
  const [saving, setSaving] = useState(false);
  const i18n = payload.i18n;
  const canEdit = canManageSystemSettings(role);

  const toggleLang = (lang: LangKey, on: boolean) => {
    let next = [...i18n.enabledLanguages];
    if (on && !next.includes(lang)) next.push(lang);
    if (!on) next = next.filter((l) => l !== lang);
    if (next.length === 0) next = ["en"];
    setPayload({
      ...payload,
      i18n: { ...i18n, enabledLanguages: next, defaultLanguage: next.includes(i18n.defaultLanguage) ? i18n.defaultLanguage : next[0] },
    });
  };

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

  if (!canEdit) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Editors cannot change site languages. Ask an admin or superadmin to update this section in Supabase or assign you a higher role.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h2 className="text-xl font-semibold">Languages</h2>
        <Button onClick={persist} disabled={saving || !rowId} className="gap-2">
          <Save className="h-4 w-4" />
          Save
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Enabled locales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>English (en)</Label>
            <Switch checked={i18n.enabledLanguages.includes("en")} onCheckedChange={(v) => toggleLang("en", v)} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Estonian (et)</Label>
            <Switch checked={i18n.enabledLanguages.includes("et")} onCheckedChange={(v) => toggleLang("et", v)} />
          </div>
          <div>
            <Label className="mb-2 block">Default language</Label>
            <div className="flex gap-2">
              {i18n.enabledLanguages.map((l) => (
                <Button
                  key={l}
                  type="button"
                  size="sm"
                  variant={i18n.defaultLanguage === l ? "default" : "outline"}
                  onClick={() => setPayload({ ...payload, i18n: { ...i18n, defaultLanguage: l } })}
                >
                  {l.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">The public language switcher only shows enabled languages.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LanguagesManager;
