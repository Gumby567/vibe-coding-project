/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_TEAM_SLUG?: string;
  readonly VITE_STUDENT_NAME?: string;
  /** Override submit URL (default `/api/send-email`; Netlify redirects to the function). */
  readonly VITE_SEND_EMAIL_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
