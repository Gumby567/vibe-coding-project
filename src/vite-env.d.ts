/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Assignment team id (e.g. YOUR_TEAM). Used in footer, meta, inquiries, and email subject. */
  readonly VITE_TEAM_SLUG?: string;
  /** Student display name for footer attribution. */
  readonly VITE_STUDENT_NAME?: string;
  /** Override submit URL (default `/api/send-email`; Netlify redirects to the function). */
  readonly VITE_SEND_EMAIL_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
