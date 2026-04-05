import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export type SendEmailEnv = {
  supabaseUrl: string;
  supabaseServiceKey: string;
  resendApiKey: string;
  resendFrom: string;
  adminTo: string;
  teamSlug: string;
};

function getEnv(): SendEmailEnv | { error: string } {
  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFrom =
    process.env.RESEND_FROM_EMAIL ?? process.env.RESEND_FROM ?? "onboarding@resend.dev";
  const adminTo = process.env.ADMIN_NOTIFICATION_EMAIL ?? process.env.ADMIN_EMAIL;
  const teamSlug =
    process.env.VITE_TEAM_SLUG ?? process.env.TEAM_SLUG ?? process.env.NEXT_PUBLIC_TEAM_SLUG ?? "Team-Slug";

  if (!supabaseUrl || !supabaseServiceKey) {
    return { error: "Missing Supabase URL or service role key (SUPABASE_SERVICE_ROLE_KEY)." };
  }
  if (!resendApiKey) {
    return { error: "Missing RESEND_API_KEY." };
  }
  if (!adminTo) {
    return { error: "Missing ADMIN_NOTIFICATION_EMAIL (or ADMIN_EMAIL) for inbound inquiries." };
  }

  return {
    supabaseUrl,
    supabaseServiceKey,
    resendApiKey,
    resendFrom,
    adminTo,
    teamSlug,
  };
}

export async function handleSendEmail(body: unknown): Promise<{ ok: true; inquiryId: string } | { ok: false; error: string }> {
  const env = getEnv();
  if ("error" in env) {
    return { ok: false, error: env.error };
  }

  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid JSON body." };
  }

  const payload = body as Record<string, unknown>;
  const source = typeof payload.source === "string" ? payload.source : "ai-web-2026";

  const supabase = createClient(env.supabaseUrl, env.supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: inserted, error: insertError } = await supabase
    .from("inquiries")
    .insert({
      payload: payload,
      source,
    })
    .select("id")
    .single();

  if (insertError) {
    return { ok: false, error: insertError.message ?? "Failed to save inquiry." };
  }

  const inquiryId = inserted?.id as string;
  const subject = `[AI-WEB-2026] [${env.teamSlug}] - New Inquiry`;

  const lines = [
    `Inquiry ID: ${inquiryId}`,
    `Source: ${source}`,
    "",
    "Fields:",
    ...Object.entries(payload)
      .filter(([k]) => k !== "source")
      .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`),
  ];

  const resend = new Resend(env.resendApiKey);
  const { error: mailError } = await resend.emails.send({
    from: env.resendFrom,
    to: env.adminTo,
    subject,
    text: lines.join("\n"),
  });

  if (mailError) {
    return { ok: false, error: mailError.message || "Failed to send email." };
  }

  return { ok: true, inquiryId };
}
