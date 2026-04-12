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

function getTeamSlugFromProcess(): string {
  return (
    process.env.VITE_TEAM_SLUG ??
    process.env.TEAM_SLUG ??
    process.env.NEXT_PUBLIC_TEAM_SLUG ??
    "YOUR_TEAM"
  );
}

function getResendMailEnv():
  | { resendApiKey: string; resendFrom: string; adminTo: string; teamSlug: string }
  | { error: string } {
  loadServerEnvOnce();
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFrom =
    process.env.RESEND_FROM_EMAIL ?? process.env.RESEND_FROM ?? "onboarding@resend.dev";
  const adminTo = process.env.ADMIN_NOTIFICATION_EMAIL ?? process.env.ADMIN_EMAIL;
  const teamSlug = getTeamSlugFromProcess();
  if (!resendApiKey) {
    return { error: "Missing RESEND_API_KEY." };
  }
  if (!adminTo) {
    return { error: "Missing ADMIN_NOTIFICATION_EMAIL (or ADMIN_EMAIL) for inbound inquiries." };
  }
  return { resendApiKey, resendFrom, adminTo, teamSlug };
}

function getEnv(): SendEmailEnv | { error: string } {
  loadServerEnvOnce();

  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFrom =
    process.env.RESEND_FROM_EMAIL ?? process.env.RESEND_FROM ?? "onboarding@resend.dev";
  const adminTo = process.env.ADMIN_NOTIFICATION_EMAIL ?? process.env.ADMIN_EMAIL;
  const teamSlug = getTeamSlugFromProcess();

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

async function sendNotificationEmail(params: {
  resendApiKey: string;
  resendFrom: string;
  adminTo: string;
  subject: string;
  lines: string[];
}): Promise<{ ok: false; error: string } | { ok: true }> {
  const resend = new Resend(params.resendApiKey);
  const { error: mailError } = await resend.emails.send({
    from: params.resendFrom,
    to: params.adminTo,
    subject: params.subject,
    text: params.lines.join("\n"),
  });
  if (mailError) {
    return { ok: false, error: mailError.message || "Failed to send email." };
  }
  return { ok: true };
}

export async function handleSendEmail(
  body: unknown,
): Promise<{ ok: true; inquiryId: string } | { ok: false; error: string }> {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid JSON body." };
  }

  const payload = body as Record<string, unknown>;
  const inquiryIdRaw = payload.inquiry_id;
  const inquiryId = typeof inquiryIdRaw === "string" ? inquiryIdRaw : undefined;

  /** Client already inserted the row; only notify by email. */
  if (inquiryId) {
    const mail = getResendMailEnv();
    if ("error" in mail) {
      return { ok: false, error: mail.error };
    }
    const teamFromBody =
      typeof payload.team_slug === "string" && payload.team_slug.trim() !== ""
        ? payload.team_slug
        : mail.teamSlug;
    const subject = `[AI-WEB-2026] ${teamFromBody}`;
    const lines = [
      `Inquiry ID: ${inquiryId}`,
      `team_slug: ${teamFromBody}`,
      `Source: ${typeof payload.source === "string" ? payload.source : "ai-web-2026"}`,
      "",
      "Submitted fields:",
      ...Object.entries(payload)
        .filter(([k]) => !["source", "team_slug"].includes(k))
        .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`),
    ];
    const sent = await sendNotificationEmail({
      resendApiKey: mail.resendApiKey,
      resendFrom: mail.resendFrom,
      adminTo: mail.adminTo,
      subject,
      lines,
    });
    if (!sent.ok) {
      return { ok: false, error: sent.error };
    }
    return { ok: true, inquiryId };
  }

  const env = getEnv();
  if ("error" in env) {
    return { ok: false, error: env.error };
  }

  const source = typeof payload.source === "string" ? payload.source : "ai-web-2026";
  const teamFromBody = typeof payload.team_slug === "string" ? payload.team_slug : env.teamSlug;

  const supabase = createClient(env.supabaseUrl, env.supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const strVal = (v: unknown) => {
    if (typeof v === "string") return v.trim();
    if (typeof v === "boolean") return v ? "yes" : "no";
    return "";
  };
  const row = {
    company_name: strVal(payload.company_name) || strVal(payload.companyName),
    contact_person: strVal(payload.contact_person) || strVal(payload.contactPerson),
    email: strVal(payload.email),
    message: strVal(payload.message),
    team_slug: teamFromBody,
    source,
  };

  const { data: inserted, error: insertError } = await supabase.from("inquiries").insert(row).select("id").single();

  if (insertError) {
    return { ok: false, error: insertError.message ?? "Failed to save inquiry." };
  }

  const rawId = inserted && typeof inserted === "object" && "id" in inserted ? (inserted as { id: unknown }).id : undefined;
  if (rawId === undefined || rawId === null) {
    return { ok: false, error: "Inquiry insert succeeded but no id was returned; cannot send notification email." };
  }
  const newInquiryId = typeof rawId === "string" ? rawId : String(rawId);
  if (newInquiryId.trim() === "") {
    return { ok: false, error: "Inquiry insert returned an empty id; cannot send notification email." };
  }

  const subject = `[AI-WEB-2026] ${teamFromBody}`;

  const lines = [
    `Inquiry ID: ${newInquiryId}`,
    `team_slug: ${teamFromBody}`,
    `Source: ${source}`,
    "",
    "Fields:",
    ...Object.entries(payload)
      .filter(([k]) => !["source", "team_slug"].includes(k))
      .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`),
  ];

  const sent = await sendNotificationEmail({
    resendApiKey: env.resendApiKey,
    resendFrom: env.resendFrom,
    adminTo: env.adminTo,
    subject,
    lines,
  });
  if (!sent.ok) {
    return { ok: false, error: sent.error };
  }

  return { ok: true, inquiryId: newInquiryId };
}
