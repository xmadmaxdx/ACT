#!/usr/bin/env node
import { randomBytes } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { normalizeTest } from "./validate.js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const SHARE_BASE_URL = (process.env.SHARE_BASE_URL || "https://actprep.vercel.app").replace(/\/$/, "");

const SLUG_ALPHA = "abcdefghjkmnpqrstuvwxyz23456789";

function makeSlug() {
  const bytes = randomBytes(15);
  let s = "";
  for (let i = 0; i < 15; i++) s += SLUG_ALPHA[bytes[i] % SLUG_ALPHA.length];
  return `${s.slice(0, 5)}-${s.slice(5, 10)}-${s.slice(10, 15)}`;
}

function supabase() {
  if (!SUPABASE_URL) throw new Error("SUPABASE_URL (or VITE_SUPABASE_URL) is not set in the MCP server environment.");
  const key = SERVICE_KEY || ANON_KEY;
  if (!key) throw new Error("Set SUPABASE_SERVICE_ROLE_KEY (preferred) or SUPABASE_ANON_KEY in the MCP server environment.");
  return createClient(SUPABASE_URL, key);
}

const TestPayload = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  timeMinutes: z.number().optional(),
  figures: z.record(z.string()).optional(),
  passages: z.array(z.any()).min(1, "Need at least 1 passage in passages."),
  questions: z.array(z.any()).min(1, "Need at least 1 question."),
});

const server = new McpServer({ name: "act-share", version: "1.0.0" });

server.registerTool(
  "generate_act_link",
  {
    description:
      "Store an ACTprep test (reading, english, or find) in Supabase and return a share link that works for 24 hours, then auto-expires. Reading paras are plain strings; english paras are span arrays [{t}, {u:n,t}, {box}; find questions use answers spans, not options/answer.",
    inputSchema: {
      section: z.enum(["reading", "english", "find"]).describe("Test section. Must match the JSON shape."),
      test: TestPayload.describe("Full test object: {id?, title?, timeMinutes?, passages, questions}. Same shape as the app Start-from-JSON input."),
      mode: z.enum(["untimed", "timed"]).optional().describe("Link timing mode. Default untimed."),
    },
  },
  async ({ section, test, mode }) => {
    let normalized;
    try {
      normalized = normalizeTest(section, test);
    } catch (e) {
      return {
        content: [{ type: "text", text: `Invalid ${section} test: ${e.message}` }],
        isError: true,
      };
    }
    const sb = supabase();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    let slug = "";
    let lastError = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      slug = makeSlug();
      const { error } = await sb.from("share_links").insert({
        slug,
        section,
        title: normalized.title,
        test: normalized,
        expires_at: expiresAt,
      });
      if (!error) {
        lastError = null;
        break;
      }
      lastError = error;
      if (!String(error.message || "").toLowerCase().includes("duplicate")) break;
    }
    if (lastError) {
      return {
        content: [{ type: "text", text: `Could not store the test: ${lastError.message}` }],
        isError: true,
      };
    }
    const timing = mode === "timed" ? "?mode=timed" : "";
    const url = `${SHARE_BASE_URL}/${slug}${timing}`;
    const alt = `${SHARE_BASE_URL}/s/${slug}${timing}`;
    const lines = [
      `Share link (works for 24 hours, then auto-deletes):`,
      url,
      ``,
      `Alternate form (same test): ${alt}`,
      `Section: ${section} · Questions: ${normalized.total} · Time: ${normalized.timeMinutes} min · Expires: ${expiresAt}`,
    ];
    return { content: [{ type: "text", text: lines.join("\n") }] };
  }
);

server.registerTool(
  "get_shared_test",
  {
    description: "Look up a share-link slug and return its section, title, question count, and expiry. Use to verify a link before sending it.",
    inputSchema: {
      slug: z.string().describe("The slug from the share URL (the part after actprep.vercel.app/ or /s/)."),
    },
  },
  async ({ slug }) => {
    const clean = String(slug || "").trim().replace(/^.*\//, "");
    const sb = supabase();
    const { data, error } = await sb
      .from("share_links")
      .select("slug, section, title, expires_at")
      .eq("slug", clean)
      .maybeSingle();
    if (error) {
      return { content: [{ type: "text", text: `Lookup failed: ${error.message}` }], isError: true };
    }
    if (!data) {
      return {
        content: [{ type: "text", text: `No live share found for "${clean}". It has expired (24h) or never existed.` }],
        isError: true,
      };
    }
    const row = await sb.from("share_links").select("test").eq("slug", clean).maybeSingle();
    const total = row.data && row.data.test ? row.data.test.total ?? row.data.test.questions?.length ?? "?" : "?";
    return {
      content: [
        {
          type: "text",
          text: [
            `Slug: ${data.slug}`,
            `Title: ${data.title}`,
            `Section: ${data.section}`,
            `Questions: ${total}`,
            `Expires: ${data.expires_at}`,
            `URL: ${SHARE_BASE_URL}/${data.slug}`,
          ].join("\n"),
        },
      ],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
