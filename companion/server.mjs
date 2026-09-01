import { randomBytes, randomUUID } from "node:crypto";
import { createServer } from "node:http";

import {
  DEFAULT_MODEL,
  DEFAULT_PORT,
  buildOpenAIRequest,
  getBearerToken,
  isAllowedExtensionOrigin,
  normalizeModel,
  parseOpenAIResponse,
  readJsonBody,
  safeEqualToken,
} from "./lib.mjs";

const HOST = "127.0.0.1";
const PORT = readPort(process.env.TABSCHOLAR_PORT);
const MODEL = normalizeModel(process.env.OPENAI_MODEL || DEFAULT_MODEL);
const COMPANION_TOKEN =
  process.env.TABSCHOLAR_TOKEN || randomBytes(24).toString("base64url");
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const recentRequestTimes = [];

function readPort(value) {
  if (!value) return DEFAULT_PORT;
  const port = Number.parseInt(value, 10);
  if (!Number.isInteger(port) || port < 1_024 || port > 65_535) {
    throw new TypeError("TABSCHOLAR_PORT must be between 1024 and 65535.");
  }
  return port;
}

function corsHeaders(origin) {
  if (!origin) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    Vary: "Origin",
  };
}

function sendJson(response, statusCode, body, extraHeaders = {}) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...extraHeaders,
  });
  response.end(JSON.stringify(body));
}

function requestWithinRateLimit() {
  const cutoff = Date.now() - 60_000;
  while (recentRequestTimes.length && recentRequestTimes[0] < cutoff) {
    recentRequestTimes.shift();
  }

  if (recentRequestTimes.length >= 20) return false;
  recentRequestTimes.push(Date.now());
  return true;
}

async function createStudyResponse(body) {
  if (!OPENAI_API_KEY) {
    const error = new Error(
      "OPENAI_API_KEY is not set in the companion process environment."
    );
    error.statusCode = 503;
    throw error;
  }

  const upstream = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
      "X-Client-Request-Id": randomUUID(),
    },
    body: JSON.stringify(buildOpenAIRequest(body, MODEL)),
    signal: AbortSignal.timeout(60_000),
  });

  const payload = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    const error = new Error(
      payload?.error?.message || `AI provider request failed (${upstream.status}).`
    );
    error.statusCode = upstream.status;
    throw error;
  }

  return parseOpenAIResponse(payload);
}

const server = createServer(async (request, response) => {
  const origin = request.headers.origin || "";
  if (!isAllowedExtensionOrigin(origin)) {
    sendJson(response, 403, { ok: false, error: "Origin is not allowed." });
    return;
  }

  const cors = corsHeaders(origin);
  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      ...cors,
      "Access-Control-Allow-Headers": "authorization, content-type",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Max-Age": "600",
    });
    response.end();
    return;
  }

  const url = new URL(request.url || "/", `http://${HOST}:${PORT}`);

  if (request.method === "GET" && url.pathname === "/health") {
    sendJson(
      response,
      200,
      {
        ok: true,
        service: "tabscholar-companion",
        providerConfigured: Boolean(OPENAI_API_KEY),
        model: MODEL,
      },
      cors
    );
    return;
  }

  if (request.method !== "POST" || url.pathname !== "/v1/study") {
    sendJson(response, 404, { ok: false, error: "Route not found." }, cors);
    return;
  }

  const token = getBearerToken(request.headers.authorization);
  if (!safeEqualToken(token, COMPANION_TOKEN)) {
    sendJson(response, 401, { ok: false, error: "Invalid companion token." }, cors);
    return;
  }

  if (!requestWithinRateLimit()) {
    sendJson(
      response,
      429,
      { ok: false, error: "Local request limit reached. Try again shortly." },
      cors
    );
    return;
  }

  try {
    const body = await readJsonBody(request);
    const result = await createStudyResponse(body);
    sendJson(response, 200, { ok: true, ...result }, cors);
  } catch (error) {
    const statusCode = Number.isInteger(error.statusCode)
      ? Math.min(Math.max(error.statusCode, 400), 599)
      : 500;
    sendJson(
      response,
      statusCode,
      { ok: false, error: error.message || "Study request failed." },
      cors
    );
  }
});

server.on("error", (error) => {
  console.error(`[TabScholar] Companion failed: ${error.message}`);
  process.exitCode = 1;
});

server.listen(PORT, HOST, () => {
  console.log("TabScholar companion is ready.");
  console.log(`Local URL: http://${HOST}:${PORT}`);
  console.log(`Model: ${MODEL}`);
  console.log(`Companion token: ${COMPANION_TOKEN}`);
  if (!OPENAI_API_KEY) {
    console.warn(
      "OPENAI_API_KEY is not set. Health checks will work, but study requests will not."
    );
  }
  console.log("Press Ctrl+C to stop. The token expires when this process stops.");
});
