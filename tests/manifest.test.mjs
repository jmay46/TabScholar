import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const manifestUrl = new URL("../extension/manifest.json", import.meta.url);
const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));

test("keeps browser permissions at the documented minimum", () => {
  assert.deepEqual(manifest.permissions, ["storage"]);
  assert.deepEqual(manifest.host_permissions, ["http://127.0.0.1:43117/*"]);
  assert.equal(Object.hasOwn(manifest, "content_scripts"), false);
});

test("does not add page automation capabilities", () => {
  const forbidden = [
    "activeTab",
    "tabs",
    "scripting",
    "webNavigation",
    "webRequest",
    "debugger",
    "cookies",
  ];

  for (const permission of forbidden) {
    assert.equal(
      manifest.permissions.includes(permission),
      false,
      `${permission} must not be added without a reviewed scope change`
    );
  }
});

test("limits extension network connections to the loopback companion", () => {
  const csp = manifest.content_security_policy.extension_pages;
  assert.match(csp, /connect-src http:\/\/127\.0\.0\.1:43117/);
  assert.doesNotMatch(csp, /https:/);
});

test("references each required extension icon", async () => {
  for (const size of ["16", "32", "48", "128"]) {
    assert.equal(manifest.icons[size], `assets/icon${size}.png`);
    assert.equal(manifest.action.default_icon[size], `assets/icon${size}.png`);
    await access(new URL(`../extension/assets/icon${size}.png`, import.meta.url));
  }
});
