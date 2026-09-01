const practiceMaterial = document.querySelector("#practiceMaterial");
const reasoning = document.querySelector("#reasoning");
const confirmation = document.querySelector("#confirmation");
const hasExtensionApi =
  typeof chrome !== "undefined" && Boolean(chrome.runtime?.id);

document.querySelector("#loadSample").addEventListener("click", () => {
  reasoning.value =
    "I would choose the narrow permission because the extension only needs to contact a service on this computer. Broad page or tab access would give it capabilities unrelated to its purpose.";
  reasoning.focus();
});

document.querySelector("#sendToWorkspace").addEventListener("click", async () => {
  const material = practiceMaterial.innerText.trim();

  if (!hasExtensionApi) {
    confirmation.textContent =
      "Preview only. Load the unpacked extension to transfer this draft.";
    return;
  }

  await chrome.storage.local.set({
    labDraft: {
      material,
      context: reasoning.value.trim(),
      mode: reasoning.value.trim() ? "reasoning" : "explain",
      createdAt: Date.now(),
    },
  });

  confirmation.textContent =
    "Loaded. Open the TabScholar toolbar popup to continue.";
});
