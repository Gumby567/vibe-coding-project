import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { loadServerEnvOnce } from "./load-server-env";

export type SendEmailEnv = {
  supabaseUrl: string;
  supabaseServiceKey: string;
  resendApiKey: string;
  resendFrom: string;
  adminTo: string;
  teamSlug: string;
};

function getEnv(): SendEmailEnv | { error: string } {
  loadServerEnvOnce();

  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFrom =
    process.env.RESEND_FROM_EMAIL ?? process.env.RESEND_FROM ?? "onboarding@resend.dev";
  const adminTo = process.env.ADMIN_NOTIFICATION_EMAIL ?? process.env.ADMIN_EMAIL;
  const teamSlug =
    process.env.VITE_TEAM_SLUG ?? process.env.TEAM_SLUG ?? process.env.NEXT_PUBLIC_TEAM_SLUG ?? "team-slug";

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

export async function handleSendEmail(
  body: unknown,
): Promise<{ ok: true; inquiryId: string } | { ok: false; error: string }> {
  const env = getEnv();
  if ("error" in env) {
    return { ok: false, error: env.error };
  }

  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid JSON body." };
  }

  const payload = body as Record<string, unknown>;
  const source = typeof payload.source === "string" ? payload.source : "ai-web-2026";
  const teamFromBody = typeof payload.team_slug === "string" ? payload.team_slug : env.teamSlug;

  const supabase = createClient(env.supabaseUrl, env.supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const row: Record<string, unknown> = {
    payload,
    source,
    team_slug: teamFromBody,
  };

  const { data: inserted, error: insertError } = await supabase.from("inquiries").insert(row).select("id").single();

  if (insertError) {
    return { ok: false, error: insertError.message ?? "Failed to save inquiry." };
  }

  const rawId = inserted && typeof inserted === "object" && "id" in inserted ? (inserted as { id: unknown }).id : undefined;
  if (rawId === undefined || rawId === null) {
    return { ok: false, error: "Inquiry insert succeeded but no id was returned; cannot send notification email." };
  }
  const inquiryId = typeof rawId === "string" ? rawId : String(rawId);
  if (inquiryId.trim() === "") {
    return { ok: false, error: "Inquiry insert returned an empty id; cannot send notification email." };
  }

  const subject = `[AI-WEB-2026] ${teamFromBody} — New inquiry`;

  const lines = [
    `Inquiry ID: ${inquiryId}`,
    `team_slug: ${teamFromBody}`,
    `Source: ${source}`,
    "",
    "Fields:",
    ...Object.entries(payload)
      .filter(([k]) => !["source", "team_slug"].includes(k))
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
