import { timingSafeEqual } from "node:crypto";

import {
  TUTOR_INSTRUCTIONS,
  buildStudyInput,
  extractResponseText,
  validateStudyRequest,
} from "../extension/core.js";

export const DEFAULT_MODEL = "gpt-5-mini";
export const DEFAULT_PORT = 43_117;
export const MAX_REQUEST_BYTES = 32_768;

export function isAllowedExtensionOrigin(origin) {
  if (!origin) return true;
  return /^chrome-extension:\/\/[a-p]{32}$/.test(origin);
}

export function safeEqualToken(actual, expected) {
  const left = Buffer.from(String(actual ?? ""));
  const right = Buffer.from(String(expected ?? ""));

  return left.length === right.length && timingSafeEqual(left, right);
}

export function getBearerToken(header) {
  const match = /^Bearer\s+(.+)$/i.exec(String(header ?? ""));
  return match?.[1]?.trim() || "";
}

export function normalizeModel(value) {
  const model = String(value || DEFAULT_MODEL).trim();
  if (!/^[a-z0-9][a-z0-9._-]{1,79}$/i.test(model)) {
    throw new TypeError("OPENAI_MODEL contains unsupported characters.");
  }
  return model;
}

export function buildOpenAIRequest(request, model = DEFAULT_MODEL) {
  const validation = validateStudyRequest(request);
  if (!validation.ok) {
    throw new TypeError(validation.error);
  }

  return {
    model: normalizeModel(model),
    instructions: TUTOR_INSTRUCTIONS,
    input: buildStudyInput(validation.value),
    max_output_tokens: 1_000,
    store: false,
  };
}

export function parseOpenAIResponse(response) {
  const text = extractResponseText(response);
  if (!text) {
    throw new Error("The AI provider returned no readable text.");
  }

  return {
    text,
    model: response?.model || null,
    usage: response?.usage || null,
    requestId: response?.id || null,
  };
}

export async function readJsonBody(request, maxBytes = MAX_REQUEST_BYTES) {
  const chunks = [];
  let bytes = 0;

  for await (const chunk of request) {
    bytes += chunk.length;
    if (bytes > maxBytes) {
      const error = new Error("Request body is too large.");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  if (!chunks.length) {
    const error = new Error("Request body is required.");
    error.statusCode = 400;
    throw error;
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("Request body must be valid JSON.");
    error.statusCode = 400;
    throw error;
  }
}

