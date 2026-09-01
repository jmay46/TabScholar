# Contributing to TabScholar

Thanks for helping improve TabScholar.

## Before opening a pull request

1. Read `docs/PROJECT-SCOPE.md` and `docs/THREAT-MODEL.md`.
2. Keep all examples synthetic or clearly licensed for reuse.
3. Do not add site-specific scraping, automatic answering, or submission code.
4. Do not add broad browser permissions.
5. Run `npm run verify`.

## Development workflow

Create a focused branch and keep commits understandable:

```text
feat: add a new study mode
fix: handle an empty provider response
test: lock down companion origin validation
docs: clarify local data handling
```

Pull requests should explain the user benefit, security implications, tests,
and any data-handling changes.

## New permissions or network access

These changes receive additional scrutiny. Include the least-privilege reason,
alternatives considered, threat-model changes, and tests proving the scope
cannot silently expand.

## Brand assets

Do not add third-party logos, screenshots, or trademarks. Brand changes should
use original artwork with documented provenance.

