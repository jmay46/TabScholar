import assert from "node:assert/strict";
import test from "node:test";

import {
  buildOpenAIRequest,
  getBearerToken,
  isAllowedExtensionOrigin,
  normalizeModel,
  parseOpenAIResponse,
  safeEqualToken,
} from "../companion/lib.mjs";

test("allows only Chromium extension origins or non-browser local clients", () => {
  assert.equal(isAllowedExtensionOrigin(""), true);
  assert.equal(
    isAllowedExtensionOrigin(
      "chrome-extension://abcdefghijklmnopabcdefghijklmnop"
    ),
    true
  );
  assert.equal(isAllowedExtensionOrigin("https://example.test"), false);
  assert.equal(isAllowedExtensionOrigin("chrome-extension://too-short"), false);
});

test("parses and compares bearer tokens without prefix confusion", () => {
  assert.equal(getBearerToken("Bearer session-secret"), "session-secret");
  assert.equal(getBearerToken("Basic session-secret"), "");
  assert.equal(safeEqualToken("same", "same"), true);
  assert.equal(safeEqualToken("same", "different"), false);
});

test("validates model identifiers", () => {
  assert.equal(normalizeModel("gpt-5-mini"), "gpt-5-mini");
  assert.throws(() => normalizeModel("model with spaces"), /unsupported/i);
});

test("builds a stateless Responses API request", () => {
  const request = buildOpenAIRequest(
    { mode: "quiz", material: "Synthetic notes" },
    "gpt-5-mini"
  );

  assert.equal(request.model, "gpt-5-mini");
  assert.equal(request.store, false);
  assert.equal(request.max_output_tokens, 1_000);
  assert.match(request.instructions, /patient study coach/i);
  assert.match(request.input, /three concise practice questions/i);
});

test("parses a complete provider response without persisting it", () => {
  const parsed = parseOpenAIResponse({
    id: "resp_test",
    model: "gpt-5-mini",
    output: [
      {
        type: "message",
        content: [{ type: "output_text", text: "Try recalling the definition." }],
      },
    ],
    usage: { total_tokens: 42 },
  });

  assert.equal(parsed.text, "Try recalling the definition.");
  assert.equal(parsed.requestId, "resp_test");
  assert.equal(parsed.usage.total_tokens, 42);
});

