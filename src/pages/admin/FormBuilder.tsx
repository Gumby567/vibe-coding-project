import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { AdminCmsContextValue } from "@/hooks/useAdminCms";
import type { FormField } from "../../../types/cms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { isSupabaseConfigured } from "@/lib/supabase";
import { Save, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const FormBuilder = () => {
  const { toast } = useToast();
  const { payload, setPayload, savePayload, rowId, loading } = useOutletContext<AdminCmsContextValue>();
  const [saving, setSaving] = useState(false);
  const fc = payload.formConfig;

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

  const sorted = [...fc.fields].sort((a, b) => a.order - b.order);

  const move = (id: string, dir: -1 | 1) => {
    const idx = sorted.findIndex((f) => f.id === id);
    const j = idx + dir;
    if (j < 0 || j >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[j];
    setPayload({
      ...payload,
      formConfig: {
        ...fc,
        fields: fc.fields.map((f) => {
          if (f.id === a.id) return { ...f, order: b.order };
          if (f.id === b.id) return { ...f, order: a.order };
          return f;
        }),
      },
    });
  };

  const removeField = (id: string) => {
    setPayload({
      ...payload,
      formConfig: { ...fc, fields: fc.fields.filter((f) => f.id !== id) },
    });
  };

  const addField = () => {
    const id = `field-${Date.now()}`;
    const order = Math.max(...fc.fields.map((f) => f.order), -1) + 1;
    const f: FormField = {
      id,
      type: "text",
      label: { en: "New field", et: "Uus väli" },
      isRequired: false,
      order,
    };
    setPayload({ ...payload, formConfig: { ...fc, fields: [...fc.fields, f] } });
  };

  if (loading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h2 className="text-xl font-semibold">Form builder</h2>
        <Button onClick={persist} disabled={saving || !rowId} className="gap-2">
          <Save className="h-4 w-4" />
          Save
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Submit &amp; messages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-2">
            <div>
              <Label>Submit EN</Label>
              <Input
                value={fc.submitButtonLabel.en}
                onChange={(e) =>
                  setPayload({
                    ...payload,
                    formConfig: { ...fc, submitButtonLabel: { ...fc.submitButtonLabel, en: e.target.value } },
                  })
                }
              />
            </div>
            <div>
              <Label>Submit ET</Label>
              <Input
                value={fc.submitButtonLabel.et}
                onChange={(e) =>
                  setPayload({
                    ...payload,
                    formConfig: { ...fc, submitButtonLabel: { ...fc.submitButtonLabel, et: e.target.value } },
                  })
                }
              />
            </div>
            <div>
              <Label>Success EN</Label>
              <Input
                value={fc.successMessage.en}
                onChange={(e) =>
                  setPayload({
                    ...payload,
                    formConfig: { ...fc, successMessage: { ...fc.successMessage, en: e.target.value } },
                  })
                }
              />
            </div>
            <div>
              <Label>Success ET</Label>
              <Input
                value={fc.successMessage.et}
                onChange={(e) =>
                  setPayload({
                    ...payload,
                    formConfig: { ...fc, successMessage: { ...fc.successMessage, et: e.target.value } },
                  })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Consent checkbox label EN</Label>
              <Input
                value={fc.consentCheckboxLabel.en}
                onChange={(e) =>
                  setPayload({
                    ...payload,
                    formConfig: { ...fc, consentCheckboxLabel: { ...fc.consentCheckboxLabel, en: e.target.value } },
                  })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Consent checkbox label ET</Label>
              <Input
                value={fc.consentCheckboxLabel.et}
                onChange={(e) =>
                  setPayload({
                    ...payload,
                    formConfig: { ...fc, consentCheckboxLabel: { ...fc.consentCheckboxLabel, et: e.target.value } },
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h3 className="font-medium">Fields</h3>
        <Button type="button" variant="outline" size="sm" onClick={addField}>
          Add field
        </Button>
      </div>

      {sorted.map((f, index) => (
        <Card key={f.id}>
          <CardContent className="pt-6 space-y-3">
            <div className="flex justify-between gap-2">
              <code className="text-xs text-muted-foreground">{f.id}</code>
              <div className="flex gap-1">
                <Button type="button" size="icon" variant="ghost" disabled={index === 0} onClick={() => move(f.id, -1)}>
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button type="button" size="icon" variant="ghost" disabled={index === sorted.length - 1} onClick={() => move(f.id, 1)}>
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button type="button" size="icon" variant="ghost" onClick={() => removeField(f.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              <div>
                <Label>Type</Label>
                <Select
                  value={f.type}
                  onValueChange={(v) =>
                    setPayload({
                      ...payload,
                      formConfig: {
                        ...fc,
                        fields: fc.fields.map((x) => (x.id === f.id ? { ...x, type: v as FormField["type"] } : x)),
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="textarea">Textarea</SelectItem>
                    <SelectItem value="checkbox">Checkbox</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Switch
                  checked={f.isRequired}
                  onCheckedChange={(v) =>
                    setPayload({
                      ...payload,
                      formConfig: {
                        ...fc,
                        fields: fc.fields.map((x) => (x.id === f.id ? { ...x, isRequired: v } : x)),
                      },
                    })
                  }
                />
                <Label>Required</Label>
              </div>
              <div>
                <Label>Label EN</Label>
                <Input
                  value={f.label.en}
                  onChange={(e) =>
                    setPayload({
                      ...payload,
                      formConfig: {
                        ...fc,
                        fields: fc.fields.map((x) => (x.id === f.id ? { ...x, label: { ...x.label, en: e.target.value } } : x)),
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label>Label ET</Label>
                <Input
                  value={f.label.et}
                  onChange={(e) =>
                    setPayload({
                      ...payload,
                      formConfig: {
                        ...fc,
                        fields: fc.fields.map((x) => (x.id === f.id ? { ...x, label: { ...x.label, et: e.target.value } } : x)),
                      },
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default FormBuilder;
