import {
  MAX_MATERIAL_LENGTH,
  STUDY_MODES,
  isFreshLabDraft,
  validateStudyRequest,
} from "./core.js";

const hasExtensionApi =
  typeof chrome !== "undefined" && Boolean(chrome.runtime?.id);

const elements = {
  form: document.querySelector("#studyForm"),
  material: document.querySelector("#material"),
  context: document.querySelector("#context"),
  companionToken: document.querySelector("#companionToken"),
  materialCount: document.querySelector("#materialCount"),
  materialError: document.querySelector("#materialError"),
  status: document.querySelector("#status"),
  statusText: document.querySelector("#statusText"),
  studyButton: document.querySelector("#studyButton"),
  openLab: document.querySelector("#openLab"),
  forgetToken: document.querySelector("#forgetToken"),
  clearAll: document.querySelector("#clearAll"),
  resultCard: document.querySelector("#resultCard"),
  resultTitle: document.querySelector("#resultTitle"),
  resultText: document.querySelector("#resultText"),
  resultMeta: document.querySelector("#resultMeta"),
  copyResult: document.querySelector("#copyResult"),
};

function selectedMode() {
  return document.querySelector('input[name="mode"]:checked')?.value || "explain";
}

function setStatus(state, text) {
  elements.status.dataset.state = state;
  elements.statusText.textContent = text;
}

function setLoading(loading) {
  elements.studyButton.disabled = loading;
  elements.studyButton.dataset.loading = String(loading);
  elements.studyButton.querySelector(".button-label").textContent = loading
    ? "Studying"
    : "Study this";
}

function updateCount() {
  elements.materialCount.textContent = `${elements.material.value.length.toLocaleString()} / ${MAX_MATERIAL_LENGTH.toLocaleString()}`;
}

function showResult(text, mode, meta = "") {
  elements.resultTitle.textContent = STUDY_MODES[mode]?.label || "Your next step";
  elements.resultText.textContent = text;
  elements.resultMeta.textContent = meta;
  elements.resultCard.hidden = false;
}

async function saveSessionToken() {
  if (!hasExtensionApi) return;

  const token = elements.companionToken.value.trim();
  if (token) {
    await chrome.storage.session.set({ companionToken: token });
  }
}

async function refreshHealth() {
  if (!hasExtensionApi) {
    setStatus("offline", "Preview");
    return;
  }

  setStatus("checking", "Checking");
  try {
    const response = await chrome.runtime.sendMessage({ type: "health" });
    if (!response?.ok) throw new Error(response?.error);

    const health = response.result;
    setStatus(
      health.providerConfigured ? "ready" : "offline",
      health.providerConfigured ? "Ready" : "Needs key"
    );
  } catch {
    setStatus("offline", "Offline");
  }
}

async function restoreSession() {
  if (!hasExtensionApi) {
    updateCount();
    return;
  }

  const [{ companionToken = "" }, { labDraft = null }] = await Promise.all([
    chrome.storage.session.get("companionToken"),
    chrome.storage.local.get("labDraft"),
  ]);

  elements.companionToken.value = companionToken;

  if (labDraft) {
    await chrome.storage.local.remove("labDraft");
  }

  if (isFreshLabDraft(labDraft)) {
    elements.material.value = labDraft.material;
    elements.context.value = labDraft.context || "";
    const mode = document.querySelector(
      `input[name="mode"][value="${labDraft.mode || "explain"}"]`
    );
    if (mode) mode.checked = true;
  }

  updateCount();
}

elements.material.addEventListener("input", () => {
  elements.materialError.textContent = "";
  updateCount();
});

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  elements.materialError.textContent = "";

  const request = {
    mode: selectedMode(),
    material: elements.material.value,
    context: elements.context.value,
  };
  const validation = validateStudyRequest(request);

  if (!validation.ok) {
    elements.materialError.textContent = validation.error;
    return;
  }

  setLoading(true);
  elements.resultCard.hidden = true;

  try {
    if (!hasExtensionApi) {
      showResult(
        "Load the unpacked extension to connect the local companion.",
        request.mode,
        "Static local preview"
      );
      return;
    }

    await saveSessionToken();
    const response = await chrome.runtime.sendMessage({ type: "study", request });
    if (!response?.ok) throw new Error(response?.error || "Study request failed.");

    const { text, model, usage } = response.result;
    const tokenNote = usage?.total_tokens
      ? `${usage.total_tokens.toLocaleString()} total tokens`
      : "Session-only result";
    showResult(text, request.mode, [model, tokenNote].filter(Boolean).join(" · "));
    setStatus("ready", "Ready");
  } catch (error) {
    showResult(error.message, request.mode, "Nothing was submitted automatically.");
    setStatus("offline", "Check setup");
  } finally {
    setLoading(false);
  }
});

elements.openLab.addEventListener("click", () => {
  if (hasExtensionApi) {
    chrome.tabs.create({ url: chrome.runtime.getURL("lab/index.html") });
  } else {
    window.open("lab/index.html", "_blank", "noopener");
  }
});

elements.forgetToken.addEventListener("click", async () => {
  if (hasExtensionApi) {
    await chrome.storage.session.remove("companionToken");
  }
  elements.companionToken.value = "";
  elements.companionToken.focus();
});

elements.clearAll.addEventListener("click", () => {
  elements.form.reset();
  elements.material.value = "";
  elements.context.value = "";
  elements.resultCard.hidden = true;
  elements.materialError.textContent = "";
  updateCount();
});

elements.copyResult.addEventListener("click", async () => {
  await navigator.clipboard.writeText(elements.resultText.textContent);
  const original = elements.copyResult.textContent;
  elements.copyResult.textContent = "Copied";
  setTimeout(() => {
    elements.copyResult.textContent = original;
  }, 1_200);
});

await restoreSession();
await refreshHealth();
