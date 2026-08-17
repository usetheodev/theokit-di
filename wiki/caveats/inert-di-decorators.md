---
type: Caveat
title: Inert container decorators
description: "@Primary and @Qualifier are exported but the container never reads them. @PostConstruct and @PreDestroy used to be inert too, and are now implemented."
resource: packages/di/src/decorators
tags: [caveat, di, decorators, doc-drift]
generated: { by: claude-code/claude-opus-5, at: 2026-08-06T15:00:00Z }
sources:
  - id: barrel
    resource: packages/di/src/index.ts
    title: Public barrel of @theokit/di
  - id: container
    resource: packages/di/src/container.ts
    title: Container implementation
  - id: metadata
    resource: packages/di/src/internal/metadata.ts
    title: Metadata keys and readers
  - id: tests
    resource: packages/di/tests/lifecycle-hooks.test.ts
    title: Lifecycle hook behaviour suite
  - id: grep
    resource: "grep for PRIMARY / QUALIFIER_NAMES across packages/di/src"
    title: Metadata key usage sweep
---

Two decorators exported by [@theokit/di](/packages/theokit-di.md) write metadata that
nothing in the package reads. Applying them changes nothing at runtime.

| Decorator | Metadata key | Read by the container |
|---|---|---|
| `@Primary` | `PRIMARY` | no |
| `@Qualifier(name)` | `QUALIFIER_NAMES` | no |
| `@PostConstruct` | `POST_CONSTRUCT` | **yes** |
| `@PreDestroy` | `PRE_DESTROY` | **yes** |

# What changed

All four were inert when this bundle was first written, and each one's JSDoc described
behaviour that did not happen — the defect tracked as
[usetheodev/theokit-di#5](https://github.com/usetheodev/theokit-di/issues/5).

`@PostConstruct` and `@PreDestroy` are now implemented. The container calls the hook
after construction with every dependency injected, and calls the teardown hook before
`dispose()`. Their behaviour is described in [lifecycle hooks](/api/di-decorators.md)
and covered by tests that build a container and observe the effect, rather than reading
the metadata key back.[^tests]

`@Primary` and `@Qualifier` were not implemented. Their docstrings were rewritten to say
so plainly instead of promising a resolution rule that does not exist.[^metadata]

# Why those two were left alone

Both describe choosing between competing implementations of one token. `Container` holds
exactly one registration per token — `registrations` is a `Map<Token, Registration>` —
so there is nothing for a qualifier to choose between, and nothing for `@Primary` to win
against. Registering a second provider for a token replaces the first and warns on
stderr, regardless of either mark.[^container]

Supporting several registrations per token is not a missing branch. The token is the
cache key in `singletonCache` and in the per-request cache, it is the node identity in
cycle detection and in `analyze()`, and it orders disposal. Making it non-unique changes
all of those. That is a design decision, and it has not been made.

# What to do instead

`@Primary` / `@Qualifier` → multiple implementations of one interface
: Register each under a distinct string token and select with
  [`@Inject("token")`](/api/di-decorators.md), or choose the implementation in the
  provider list where the choice is visible. Explicit, and it works today.

The metadata keys are exported from [`METADATA_KEYS`](/api/metadata-keys.md), so a
consumer that wants qualified resolution can read the marks and implement the semantics
itself. The decorators remain a usable annotation vocabulary — they are simply not a
resolution rule this container enforces.[^barrel]

[^barrel]: Public barrel of `@theokit/di`
[^container]: Container implementation
[^metadata]: Metadata keys and readers
[^tests]: Lifecycle hook behaviour suite
[^grep]: Metadata key usage sweep
