# Threat model

## Security goals

TabScholar should help with user-provided study material without gaining access
to unrelated browsing activity, third-party services, or long-lived secrets.

The primary goals are:

1. Keep provider API keys out of client-side extension code and storage.
2. Prevent websites from using the local companion as an AI proxy.
3. Ensure content movement is visible and initiated by the learner.
4. Minimize browser permissions and network destinations.
5. Avoid persistent storage of study material and model responses.

## Assets

- OpenAI API key in the companion process environment
- Random companion session token
- User-entered study material and optional reasoning draft
- Generated study response
- API usage and associated billing quota

## Trust boundaries

### Extension popup

The popup accepts manual input and sends a validated request to the extension
service worker. It has no ability to inspect third-party tabs.

### Extension service worker

The service worker can contact only the fixed loopback companion URL declared
in `host_permissions`. It reads the short-lived companion token from
`chrome.storage.session` and does not receive the provider API key.

### Local companion

The companion binds to `127.0.0.1`, not a public or LAN interface. It accepts
browser requests only from a Chromium extension origin, requires a timing-safe
comparison of a random bearer token, limits body size, rate-limits study
requests, and does not log request bodies.

### AI provider

Only validated user-entered text, the selected study mode, and optional context
are sent through the official Responses API. Requests use `store: false`.

## Threats and mitigations

| Threat | Mitigation | Residual risk |
| --- | --- | --- |
| API key extraction from extension files | Key exists only in companion environment | Malware or a compromised local machine can still read process secrets |
| Website calls localhost companion | Extension-origin check plus random bearer token | A malicious installed extension with the token could call it |
| Cross-site request forgery | Non-simple authenticated JSON request, origin validation, exact CORS response | Browser implementation bugs remain possible |
| Prompt injection in pasted material | Material is clearly delimited and treated as quoted content | Models may still follow adversarial text imperfectly |
| Unexpected cost from repeated requests | Session token, body-size limit, and 20-request-per-minute local cap | Authorized users can still incur normal API charges |
| Sensitive text sent unintentionally | Manual-only input and visible submit action | Users can still paste information they should not share |
| Persistent local exposure | No automatic persistence of inputs or outputs; session-only token | Browser memory and operating-system diagnostics may retain fragments |
| Permission expansion in a contribution | Manifest boundary tests and scope review rule | Maintainers must enforce review discipline |

## Explicit non-goals

TabScholar is not a penetration-testing tool, page automation framework,
proctoring bypass, answer-submission agent, or content extraction utility.

The bundled lab is synthetic and extension-local. It is designed to teach and
test the boundary without interacting with a third party.

