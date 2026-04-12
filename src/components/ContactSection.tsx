import { useMemo, useState } from "react";
import { useI18n } from "@/contexts/I18nContext";
import type { ContentBlock, FormField } from "../../types/cms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

function buildSchema(fields: FormField[]) {
  const sorted = [...fields].sort((a, b) => a.order - b.order);
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of sorted) {
    if (f.type === "checkbox") {
      shape[f.id] = f.isRequired
        ? z.literal(true, { errorMap: () => ({ message: "Required" }) })
        : z.boolean().optional();
    } else if (f.type === "email") {
      shape[f.id] = f.isRequired
        ? z.string().trim().email().max(255)
        : z.union([z.literal(""), z.string().trim().email().max(255)]);
    } else if (f.type === "textarea") {
      shape[f.id] = f.isRequired
        ? z.string().trim().min(1).max(5000)
        : z.union([z.literal(""), z.string().trim().max(5000)]);
    } else {
      shape[f.id] = f.isRequired
        ? z.string().trim().min(1).max(500)
        : z.union([z.literal(""), z.string().trim().max(500)]);
    }
  }
  return z.object(shape);
}

function strVal(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (typeof v === "boolean") return v ? "yes" : "no";
  return "";
}

function inquiryRowFromForm(data: Record<string, unknown>) {
  const company =
    strVal(data.company_name) ||
    strVal(data.companyName) ||
    strVal(data.company) ||
    "";
  const contactPerson =
    strVal(data.contact_person) ||
    strVal(data.contactPerson) ||
    strVal(data.name) ||
    "";
  const email = strVal(data.email);
  let message =
    strVal(data.message) ||
    strVal(data.body) ||
    "";
  const consent = data.consent === true || data.agree === true;
  const marketing = data.marketing === true;
  const extras: string[] = [];
  if (consent) extras.push("consent: accepted");
  if (marketing) extras.push("marketing: opted in");
  if (extras.length) {
    message = message ? `${message}\n\n${extras.join("\n")}` : extras.join("\n");
  }
  return { company_name: company, contact_person: contactPerson, email, message };
}

const DEFAULT_SUCCESS = "Thank you for your message. We will contact you shortly.";

function sendEmailUrl() {
  return (
    import.meta.env.VITE_SEND_EMAIL_URL ??
    (import.meta.env.DEV ? "/api/send-email" : "/.netlify/functions/send-email")
  );
}

type Props = {
  block: ContentBlock;
};

const ContactSection = ({ block }: Props) => {
  const { lang, payload } = useI18n();
  const { toast } = useToast();
  const fc = payload.formConfig;
  const fields = useMemo(() => [...fc.fields].sort((a, b) => a.order - b.order), [fc.fields]);
  const schema = useMemo(() => buildSchema(fields), [fields]);

  const initial = useMemo(() => {
    const o: Record<string, string | boolean> = {};
    for (const f of fields) {
      o[f.id] = f.type === "checkbox" ? false : "";
    }
    return o;
  }, [fields]);

  const [form, setForm] = useState<Record<string, string | boolean>>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const c = block.content[lang] ?? block.content.en ?? {};
  const st = block.style;

  const update = (id: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[String(err.path[0])] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    const teamSlug = import.meta.env.VITE_TEAM_SLUG ?? "YOUR_TEAM";
    const source = "ai-web-2026";

    try {
      if (!isSupabaseConfigured || !supabase) {
        toast({
          title: "Configuration error",
          description: "Supabase is not configured.",
          variant: "destructive",
        });
        return;
      }

      const row = {
        ...inquiryRowFromForm(result.data as Record<string, unknown>),
        team_slug: teamSlug,
        source,
      };

      const { data: inserted, error: insErr } = await supabase.from("inquiries").insert(row).select("id").maybeSingle();

      if (insErr || !inserted?.id) {
        toast({
          title: "Could not save inquiry",
          description: insErr?.message ?? "Insert failed.",
          variant: "destructive",
        });
        return;
      }

      const inquiryId = String(inserted.id);
      const res = await fetch(sendEmailUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...result.data,
          inquiry_id: inquiryId,
          team_slug: teamSlug,
          source,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        toast({
          title: "Saved, but email failed",
          description: typeof data.error === "string" ? data.error : res.statusText,
          variant: "destructive",
        });
        return;
      }

      const successMsg =
        fc.successMessage[lang] ?? fc.successMessage.en ?? DEFAULT_SUCCESS;
      toast({ title: successMsg });
      setForm(initial);
    } catch {
      toast({
        title: "Network error",
        description: "Submit failed. Check Supabase policies and the send-email function.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      className="py-20 bg-background"
      style={{
        background: st.background,
        padding: st.padding,
        marginBottom: st.marginBottom,
      }}
    >
      <div className="container mx-auto px-4 max-w-xl">
        <h2 className="text-3xl font-bold text-foreground text-center">{c.title}</h2>
        <div className="mt-2 mx-auto h-1 w-16 rounded-full bg-accent" />
        <p className="mt-4 text-center text-muted-foreground">{c.subtitle}</p>

        <Card className="mt-10">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {fields.map((f) => {
                const label = f.label[lang] ?? f.label.en ?? f.id;
                const err = errors[f.id];
                const errId = err ? `${f.id}-error` : undefined;
                if (f.type === "checkbox") {
                  return (
                    <div key={f.id} className="space-y-1">
                      <div className="flex items-start gap-2">
                        <Checkbox
                          checked={!!form[f.id]}
                          onCheckedChange={(v) => update(f.id, !!v)}
                          id={f.id}
                          aria-invalid={!!err}
                          aria-describedby={errId}
                        />
                        <Label htmlFor={f.id} className="text-sm text-muted-foreground leading-tight cursor-pointer">
                          {label}
                          {f.isRequired ? <span className="text-destructive"> *</span> : null}
                        </Label>
                      </div>
                      {err ? (
                        <p id={errId} className="text-xs text-destructive pl-8">
                          {err}
                        </p>
                      ) : null}
                    </div>
                  );
                }
                return (
                  <div key={f.id} className="space-y-1">
                    <Label htmlFor={f.id}>
                      {label}
                      {f.isRequired ? <span className="text-destructive"> *</span> : null}
                    </Label>
                    {f.type === "textarea" ? (
                      <Textarea
                        id={f.id}
                        name={f.id}
                        value={String(form[f.id] ?? "")}
                        onChange={(e) => update(f.id, e.target.value)}
                        rows={4}
                        className={cn(err && "border-destructive")}
                        aria-invalid={!!err}
                        aria-describedby={errId}
                        aria-required={f.isRequired}
                      />
                    ) : (
                      <Input
                        id={f.id}
                        name={f.id}
                        type={f.type === "email" ? "email" : "text"}
                        value={String(form[f.id] ?? "")}
                        onChange={(e) => update(f.id, e.target.value)}
                        className={cn(err && "border-destructive")}
                        autoComplete={f.type === "email" ? "email" : "on"}
                        aria-invalid={!!err}
                        aria-describedby={errId}
                        aria-required={f.isRequired}
                      />
                    )}
                    {err ? (
                      <p id={errId} className="text-xs text-destructive">
                        {err}
                      </p>
                    ) : null}
                  </div>
                );
              })}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  fc.submitButtonLabel[lang] ?? fc.submitButtonLabel.en
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default ContactSection;
