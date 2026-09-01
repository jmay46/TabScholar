import { publicErrorMessage, validateStudyRequest } from "./core.js";

const COMPANION_BASE_URL = "http://127.0.0.1:43117";

async function readCompanionToken() {
  const { companionToken = "" } = await chrome.storage.session.get(
    "companionToken"
  );
  return companionToken.trim();
}

async function callCompanion(path, options = {}) {
  const response = await fetch(`${COMPANION_BASE_URL}${path}`, {
    cache: "no-store",
    ...options,
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || `Local companion failed (${response.status}).`);
  }

  return payload;
}

async function checkHealth() {
  return callCompanion("/health");
}

async function requestStudy(request) {
  const validation = validateStudyRequest(request);
  if (!validation.ok) {
    throw new TypeError(validation.error);
  }

  const companionToken = await readCompanionToken();
  if (!companionToken) {
    throw new Error("Enter the companion token shown in your terminal.");
  }

  return callCompanion("/v1/study", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${companionToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(validation.value),
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id) {
    sendResponse({ ok: false, error: "Untrusted message sender." });
    return false;
  }

  const task =
    message?.type === "health"
      ? checkHealth()
      : message?.type === "study"
        ? requestStudy(message.request)
        : Promise.reject(new Error("Unsupported request type."));

  task
    .then((result) => sendResponse({ ok: true, result }))
    .catch((error) =>
      sendResponse({ ok: false, error: publicErrorMessage(error) })
    );

  return true;
});

