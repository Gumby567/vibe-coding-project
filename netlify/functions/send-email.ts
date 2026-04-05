import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { handleSendEmail } from "../../server/send-email-handler";

export const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, error: "Method not allowed" }),
    };
  }
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const result = await handleSendEmail(body);
    return {
      statusCode: result.ok ? 200 : 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }),
    };
  }
};
