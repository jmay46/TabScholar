# Security policy

## Supported versions

Security fixes are applied to the latest version on the default branch.

## Reporting a vulnerability

Please open a private security advisory in the repository rather than a public
issue. Include:

- A concise description of the impact
- Reproduction steps using synthetic or self-owned data
- The affected file and version
- A suggested mitigation, if available

Do not test against third-party services, accounts, or data on this project's
behalf.

## Secret handling

Never commit API keys, companion tokens, credentials, cookies, or real study
content. Provider keys belong in the companion process environment and nowhere
else.

If a secret is committed, revoke it immediately. Removing it in a later commit
does not remove it from Git history.

## Permission changes

Any change to `permissions`, `host_permissions`, content scripts, or network
destinations requires a threat-model update and explicit maintainer review.

