# Project scope

TabScholar helps a learner study text they intentionally provide. Its product
boundary matters as much as its feature set.

## In scope

- Manual text entry and paste
- Explanation, hints, retrieval practice, and feedback on learner reasoning
- Official AI APIs accessed through a local or user-controlled backend
- Synthetic fixtures and extension-local demonstration pages
- Accessibility, privacy, testing, and defensive security improvements
- Export initiated by the learner for content they are authorized to use

## Out of scope

- Reading, scraping, monitoring, or extracting content from third-party pages
- Injecting scripts into learning platforms
- Automatically answering, filling, clicking, navigating, or submitting work
- Circumventing access controls, browser locks, proctoring, rate limits, or
  platform safeguards
- Capturing credentials, session identifiers, cookies, or account data
- Reproducing proprietary assessment banks or copyrighted course material
- UI automation of consumer AI websites in place of official APIs
- Branding that implies affiliation with another product, publisher, school, or
  platform

## Change-control rule

A pull request that adds a new browser permission, host permission, content
script, network destination, persistent data field, or automation capability
must include:

1. A threat-model update
2. A least-privilege justification
3. New tests that lock the permission to the minimum scope
4. An explicit maintainer review of legal, privacy, and user-consent impacts

Features in the out-of-scope list should be rejected rather than hidden behind
a disclaimer or optional flag.

