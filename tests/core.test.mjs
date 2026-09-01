import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_CONTEXT_LENGTH,
  MAX_MATERIAL_LENGTH,
  LAB_DRAFT_TTL_MS,
  buildStudyInput,
  extractResponseText,
  isFreshLabDraft,
  normalizeText,
  publicErrorMessage,
  validateStudyRequest,
} from "../extension/core.js";

test("normalizes line endings and removes null characters", () => {
  assert.equal(normalizeText("  alpha\r\nbeta\u0000  "), "alpha\nbeta");
});

test("accepts only fresh, timestamped safe-lab drafts", () => {
  const now = 2_000_000;

  assert.equal(
    isFreshLabDraft({ material: "Synthetic prompt", createdAt: now - 1_000 }, now),
    true
  );
  assert.equal(
    isFreshLabDraft(
      { material: "Synthetic prompt", createdAt: now - LAB_DRAFT_TTL_MS - 1 },
      now
    ),
    false
  );
  assert.equal(isFreshLabDraft({ material: "Synthetic prompt" }, now), false);
});

test("validates a normal manual study request", () => {
  const result = validateStudyRequest({
    mode: "explain",
    material: "Why does least privilege reduce risk?",
    context: "I think it reduces unnecessary access.",
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.mode, "explain");
});

test("rejects unsupported modes and invalid lengths", () => {
  assert.equal(
    validateStudyRequest({ mode: "answer", material: "Question" }).ok,
    false
  );
  assert.equal(
    validateStudyRequest({ mode: "explain", material: "  " }).ok,
    false
  );
  assert.equal(
    validateStudyRequest({
      mode: "explain",
      material: "x".repeat(MAX_MATERIAL_LENGTH + 1),
    }).ok,
    false
  );
  assert.equal(
    validateStudyRequest({
      mode: "explain",
      material: "Question",
      context: "x".repeat(MAX_CONTEXT_LENGTH + 1),
    }).ok,
    false
  );
});

test("builds an explicitly user-provided, mode-specific prompt", () => {
  const input = buildStudyInput({
    mode: "hint",
    material: "A synthetic practice question",
    context: "My first attempt",
  });

  assert.match(input, /progressively stronger hints/i);
  assert.match(input, /LEARNER-PROVIDED MATERIAL/);
  assert.match(input, /LEARNER'S CONTEXT OR ATTEMPT/);
  assert.match(input, /learner supplied this material manually/i);
});

test("extracts text from raw Responses API output", () => {
  const text = extractResponseText({
    output: [
      {
        type: "message",
        content: [
          { type: "output_text", text: "First paragraph." },
          { type: "output_text", text: "Second paragraph." },
        ],
      },
    ],
  });

  assert.equal(text, "First paragraph.\nSecond paragraph.");
});

test("maps sensitive provider errors to user-safe guidance", () => {
  assert.match(publicErrorMessage(new Error("401 invalid API key")), /authenticate/i);
  assert.match(publicErrorMessage(new Error("fetch failed")), /companion/i);
  assert.match(publicErrorMessage(new Error("429 rate limit")), /rate-limiting/i);
});
