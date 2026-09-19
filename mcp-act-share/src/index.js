#!/usr/bin/env node
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { normalizeTest } from "./validate.js";

function loadProjectEnv() {
  const out = {};
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    const raw = readFileSync(resolve(here, "..", "..", ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq < 0) continue;
      const k = t.slice(0, eq).trim();
      let v = t.slice(eq + 1).trim();
      if (v.length >= 2 && v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      if (k && !(k in process.env)) out[k] = v;
    }
  } catch {
    console.error("act-share: no project .env found, using process env");
  }
  return out;
}

const fileEnv = loadProjectEnv();
const pick = (k) => process.env[k] || fileEnv[k] || "";

const SUPABASE_URL = pick("SUPABASE_URL") || pick("VITE_SUPABASE_URL");
const SERVICE_KEY = pick("SUPABASE_SERVICE_ROLE_KEY");
const ANON_KEY = pick("SUPABASE_ANON_KEY") || pick("VITE_SUPABASE_ANON_KEY");
const SHARE_BASE_URL = (process.env.SHARE_BASE_URL || "https://actprep.vercel.app").replace(/\/$/, "");

const SLUG_ALPHA = "abcdefghjkmnpqrstuvwxyz23456789";

function makeSlug() {
  const bytes = randomBytes(15);
  let s = "";
  for (let i = 0; i < 15; i++) s += SLUG_ALPHA[bytes[i] % SLUG_ALPHA.length];
  return `${s.slice(0, 5)}-${s.slice(5, 10)}-${s.slice(10, 15)}`;
}

function keyRole(key) {
  try {
    const payload = JSON.parse(Buffer.from(String(key).split(".")[1], "base64").toString("utf8"));
    return payload.role || "unknown";
  } catch {
    return "unreadable";
  }
}

function supabase() {
  if (!SUPABASE_URL) throw new Error("SUPABASE_URL (or VITE_SUPABASE_URL) is not set in the MCP server environment.");
  const key = SERVICE_KEY || ANON_KEY;
  if (!key) throw new Error("Set SUPABASE_SERVICE_ROLE_KEY (preferred) or SUPABASE_ANON_KEY in the MCP server environment.");
  console.error(`act-share: supabase key role=${keyRole(key)} (service_role bypasses RLS; anon is bound by the 24h policy)`);
  return createClient(SUPABASE_URL, key);
}

const TestPayload = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  timeMinutes: z.number().optional(),
  figures: z.record(z.string()).optional(),
  passages: z.array(z.any()).optional(),
  questions: z.array(z.any()).optional(),
  theory: z.any().optional(),
  intro: z.any().optional(),
  theoryBreaks: z.array(z.any()).optional(),
});

const server = new McpServer({ name: "act-share", version: "1.0.0" });

server.registerTool(
  "generate_act_link",
  {
    description:
      "Store an ACTprep test (reading, english, find, or math) in Supabase and return a share link that works for 24 hours, then auto-expires. Reading paras are plain strings; english paras are span arrays [{t}, {u:n,t}, {box}; find questions use answers spans, not options/answer; math questions use statement plus options, with optional theory intro and theoryBreaks between questions.",
    inputSchema: {
      section: z.enum(["reading", "english", "find", "math"]).describe("Test section. Must match the JSON shape."),
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
    const expiresAt = new Date(Date.now() + (24 * 60 - 10) * 60 * 1000).toISOString();
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

server.registerTool(
  "delete_shared_test",
  {
    description: "Permanently delete a share link by slug. Requires SUPABASE_SERVICE_ROLE_KEY in the MCP server environment (anon keys cannot delete by design).",
    inputSchema: {
      slug: z.string().describe("The slug from the share URL (the part after actprep.vercel.app/ or /s/)."),
    },
  },
  async ({ slug }) => {
    if (!SERVICE_KEY) {
      return {
        content: [
          {
            type: "text",
            text: "Delete refused: the MCP server runs on an anon key, which has no delete grant by design (any visitor could otherwise destroy links). Set SUPABASE_SERVICE_ROLE_KEY and restart the server to enable deletion.",
          },
        ],
        isError: true,
      };
    }
    const clean = String(slug || "").trim().replace(/^.*\//, "");
    const sb = supabase();
    const { data, error } = await sb.from("share_links").delete().eq("slug", clean).select("slug");
    if (error) {
      return { content: [{ type: "text", text: `Delete failed: ${error.message}` }], isError: true };
    }
    if (!data || data.length === 0) {
      return {
        content: [{ type: "text", text: `No live share found for "${clean}". Already expired, deleted, or never existed.` }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: `Deleted share link "${clean}" completely. Its URL now shows the expired-link page.` }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
