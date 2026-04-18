import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// POST /api/import
// Body: JSON array of contact objects parsed from contacts.xml on the client.
// Header: X-Import-Token must match the IMPORT_TOKEN environment variable.
http.route({
  path: "/api/import",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    // Simple token auth — set IMPORT_TOKEN in Convex environment variables
    const token = req.headers.get("x-import-token") ?? "";
    const expected = process.env.IMPORT_TOKEN ?? "";
    if (!expected || token !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!Array.isArray(body)) {
      return new Response(JSON.stringify({ error: "Expected array" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runAction(internal.importAction.importContacts, {
      contacts: body as any,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
