import { useState } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const contactSchema = z.object({
  companyName: z.string().trim().min(1).max(200),
  contactPerson: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(255),
  message: z.string().trim().min(1).max(2000),
  consent: z.literal(true, { errorMap: () => ({ message: "Consent is required" }) }),
});

const ContactSection = () => {
  const { t } = useI18n();
  const { toast } = useToast();
  const [form, setForm] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    message: "",
    consent: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = contactSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    toast({ title: t.contact.success });
    setForm({ companyName: "", contactPerson: "", email: "", message: "", consent: false });
  };

  const update = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <section id="contact" className="py-20 bg-background">
      <div className="container mx-auto px-4 max-w-xl">
        <h2 className="text-3xl font-bold text-foreground text-center">{t.contact.title}</h2>
        <div className="mt-2 mx-auto h-1 w-16 rounded-full bg-accent" />
        <p className="mt-4 text-center text-muted-foreground">{t.contact.subtitle}</p>

        <Card className="mt-10">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-foreground">{t.contact.fields.companyName}</label>
                <Input
                  value={form.companyName}
                  onChange={(e) => update("companyName", e.target.value)}
                  className="mt-1"
                />
                {errors.companyName && <p className="text-xs text-destructive mt-1">{errors.companyName}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">{t.contact.fields.contactPerson}</label>
                <Input
                  value={form.contactPerson}
                  onChange={(e) => update("contactPerson", e.target.value)}
                  className="mt-1"
                />
                {errors.contactPerson && <p className="text-xs text-destructive mt-1">{errors.contactPerson}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">{t.contact.fields.email}</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className="mt-1"
                />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">{t.contact.fields.message}</label>
                <Textarea
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                  rows={4}
                  className="mt-1"
                />
                {errors.message && <p className="text-xs text-destructive mt-1">{errors.message}</p>}
              </div>
              <div className="flex items-start gap-2">
                <Checkbox
                  checked={form.consent}
                  onCheckedChange={(v) => update("consent", !!v)}
                  id="consent"
                />
                <label htmlFor="consent" className="text-sm text-muted-foreground leading-tight cursor-pointer">
                  {t.contact.fields.consent}
                </label>
              </div>
              {errors.consent && <p className="text-xs text-destructive">{errors.consent}</p>}

              <Button type="submit" className="w-full">
                {t.contact.submit}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default ContactSection;
