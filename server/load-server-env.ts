import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

let didLoad = false;

/**
 * Merges Vite-style env files into `process.env` for Node-only code (send-email handler).
 * Call from the Vite plugin at server startup (with `mode`) and/or at the start of `getEnv()`
 * so the handler does not depend on `vite.config.ts` mutating `process.env`.
 *
 * Precedence matches Vite: each later file overrides keys from earlier files. The first file
 * loaded uses `override: false` so values already set by the host (CI, serverless) keep priority;
 * subsequent files use `override: true` so `.env.local` can override `.env`.
 */
export function loadServerEnvOnce(mode?: string): void {
  if (didLoad) {
    return;
  }
  didLoad = true;

  const root = process.cwd();
  const resolvedMode =
    mode ?? (process.env.NODE_ENV === "production" ? "production" : "development");

  const files = [
    ".env",
    ".env.local",
    `.env.${resolvedMode}`,
    `.env.${resolvedMode}.local`,
  ];

  let index = 0;
  for (const name of files) {
    const fullPath = resolve(root, name);
    if (existsSync(fullPath)) {
      config({ path: fullPath, override: index > 0 });
      index += 1;
    }
  }
}
