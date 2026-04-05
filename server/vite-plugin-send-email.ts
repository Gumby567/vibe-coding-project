import type { Connect } from "vite";
import type { Plugin } from "vite";
import { loadServerEnvOnce } from "./load-server-env";
import { handleSendEmail } from "./send-email-handler";

function readBody(req: Connect.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function attach(middlewares: Connect.Server) {
  middlewares.use(async (req, res, next) => {
    const url = req.url?.split("?")[0] ?? "";
    if (url !== "/api/send-email" || req.method !== "POST") {
      return next();
    }
    try {
      const raw = await readBody(req);
      const json = raw ? JSON.parse(raw) : {};
      const result = await handleSendEmail(json);
      res.statusCode = result.ok ? 200 : 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(result));
    } catch (e) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }));
    }
  });
}

/** Serves POST /api/send-email during `vite dev` and `vite preview` (Node middleware). */
export function sendEmailApiPlugin(): Plugin {
  return {
    name: "send-email-api",
    configureServer(server) {
      loadServerEnvOnce(server.config.mode);
      attach(server.middlewares);
    },
    configurePreviewServer(server) {
      loadServerEnvOnce(server.config.mode);
      attach(server.middlewares);
    },
  };
}
