# TabScholar

TabScholar is a local-first browser extension for studying material that the
learner intentionally provides. It offers explanations, progressive hints,
retrieval practice, and reasoning feedback without reading or controlling
third-party websites.

This repository is a standalone project. It does not contain code, assets, or
Git history from another extension.

## Safety boundary

TabScholar is intentionally narrow:

- No content scripts
- No `tabs`, `scripting`, `activeTab`, or broad website permissions
- No page scraping, automatic form filling, clicking, or submission
- No permissions for learning-management platforms
- No API key stored in extension code or browser storage
- No automatic persistence of study material or model responses
- A bundled synthetic lab is used for demonstrations and tests

The complete scope is documented in [docs/PROJECT-SCOPE.md](docs/PROJECT-SCOPE.md),
and the security design is documented in
[docs/THREAT-MODEL.md](docs/THREAT-MODEL.md).

## Architecture

```text
User-entered material
        |
        v
Extension popup --session token--> 127.0.0.1 companion
                                          |
                                          v
                                OpenAI Responses API

Bundled synthetic lab --explicit click--> temporary popup draft
```

The extension may contact only `http://127.0.0.1:43117`. The companion binds
only to the loopback interface, requires a random session token, checks the
extension origin, rate-limits requests, keeps the OpenAI API key in its process
environment, and requests `store: false` from the Responses API.

OpenAI's official API documentation says API keys must not be exposed in
client-side browser code, which is why TabScholar uses the local companion:
[API authentication](https://platform.openai.com/docs/api-reference/authentication).

## Requirements

- A Chromium-based browser with Manifest V3 extension support
- Node.js 20 or newer
- An OpenAI API key with billing configured

The default model is `gpt-5-mini`, which supports the Responses API. Set
`OPENAI_MODEL` before starting the companion to choose a different compatible
model available to your account.

## Quick start on Windows PowerShell

1. Open PowerShell in this repository.
2. Set the API key in the current terminal session. Do not paste it into the
   extension or commit it to a file:

   ```powershell
   $env:OPENAI_API_KEY="your-key-here"
   npm start
   ```

3. Keep the companion running and copy the temporary companion token printed
   in the terminal.
4. Open `chrome://extensions`, enable Developer mode, and choose **Load
   unpacked**.
5. Select the `extension` directory in this repository.
6. Open TabScholar, paste the companion token into **Local companion
   connection**, and enter your own study material.

The companion token is stored with `chrome.storage.session`, so it is cleared
when the browser session ends. The API key never enters the extension.

## Safe lab

Choose **Open safe lab** in the popup to open a synthetic practice page bundled
inside the extension. The page demonstrates an explicit, user-controlled data
handoff without reading or modifying any external website.

The lab is the only page-like environment included in the project. It uses
made-up course material and does not imitate or target a real service.

## Development

This project intentionally has no runtime package dependencies.

```powershell
npm install
npm run verify
```

`npm run verify` checks every JavaScript file, validates the manifest boundary,
and runs the unit tests.

## Data handling

- The extension does not store study material or responses automatically.
- The safe lab briefly stores a draft locally after an explicit click; the
  popup consumes or discards it on its next open, and rejects drafts older than
  15 minutes.
- The companion does not log prompts, responses, or the API key.
- `store: false` disables persisted Responses API application state for each
  request.
- OpenAI may retain abuse-monitoring logs according to its current
  [API data controls](https://platform.openai.com/docs/guides/your-data).

Do not submit confidential, regulated, copyrighted, or third-party material
unless you are authorized to do so.

## Branding

The repository includes the original logo supplied by the project owner and
the generated extension icon sizes. Run `npm run icons` to regenerate the icon
exports. The artwork has a separate rights notice and is not covered by the
MIT software license; see [brand/README.md](brand/README.md) and
[NOTICE.md](NOTICE.md).

## Contributing

Contributions are welcome when they preserve the safety boundary. Read
[CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## License

TabScholar is available under the [MIT License](LICENSE). The name and future
brand artwork are not automatically granted trademark rights by the software
license.
