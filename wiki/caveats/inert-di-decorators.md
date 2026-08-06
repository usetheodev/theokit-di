---
type: Caveat
title: Inert container decorators
description: "@Primary, @Qualifier, @PostConstruct and @PreDestroy are exported and documented, but the container never reads their metadata."
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
    resource: packages/di/tests/lifecycle.test.ts
    title: Lifecycle decorator test suite
  - id: grep
    resource: "grep for PRIMARY / QUALIFIER_NAMES / POST_CONSTRUCT / PRE_DESTROY across packages/di/src at commit 3861d5c"
    title: Metadata key usage sweep
---

Four decorators exported by [@theokit/di](/packages/theokit-di.md) write metadata that
nothing reads. Applying them is a no-op at runtime.

| Decorator | Metadata key | Written by | Read by |
|---|---|---|---|
| `@Primary` | `PRIMARY` | `decorators/primary.ts` | nothing |
| `@Qualifier(name)` | `QUALIFIER_NAMES` | `decorators/qualifier.ts` | nothing |
| `@PostConstruct` | `POST_CONSTRUCT` | `decorators/lifecycle.ts` | nothing |
| `@PreDestroy` | `PRE_DESTROY` | `decorators/lifecycle.ts` | nothing |

# The evidence

A sweep for those four key names across `packages/di/src` at commit `3861d5c` returns
exactly two kinds of hit: the declaration in `internal/metadata.ts`, and the
`defineMetadata` call in each decorator. There is no `getMetadata` for any of
them.[^grep]

`container.ts` confirms it from the other side. It imports six readers from
`internal/metadata.ts` — `hasReflectMetadata`, `isInjectable`, `isPrimitiveTypeMarker`,
`readInjectableMetadata`, `readInjectTokens` and `readOptionalFlags` — and
`internal/metadata.ts` exports no reader for the four keys above.[^container][^metadata]

# What the docstrings claim

Each decorator's JSDoc describes behaviour that does not happen:[^metadata]

`@PostConstruct`
: "method called after DI resolution completes... if the method returns a Promise, the
  Container awaits it before returning the instance." The container never calls the
  method.

`@PreDestroy`
: "Called during container.dispose(). Called BEFORE Disposable.dispose()." Disposal only
  looks for `dispose()` and `Symbol.asyncDispose`; it never consults this key.

`@Primary`
: "Resolution priority: @Qualifier > @Primary > error." No such priority exists —
  re-registering a token is last-write-wins with a stderr warning.

`@Qualifier`
: "narrows the selection to the provider registered with that qualifier name." The
  container has no notion of a qualified registration.

# What the tests cover

`lifecycle.test.ts` and `qualifier-primary.test.ts` are green, and they are green
honestly: every assertion reads the metadata key back and checks the stored
value.[^tests]

```typescript
@PostConstruct
init() {}
// ...
expect(Reflect.getMetadata(METADATA_KEYS.POST_CONSTRUCT, Service)).toBe("init");
```

No test constructs a container, resolves a decorated class and observes an
initialization call — because there is nothing to observe. The suites assert the
metadata contract, which is the only contract these decorators currently have. This is
recorded in [test inventory](/architecture/testing.md).

# What to do instead

`@PostConstruct` → asynchronous initialization
: Use an async [`FactoryProvider`](/api/providers.md) that awaits its own setup before
  returning the instance, and resolve with `resolveAsync`.

`@PreDestroy` → cleanup
: Implement `dispose()` or `Symbol.asyncDispose` on the class. That is the interface
  [`Container.dispose`](/api/container.md) actually walks, in reverse construction
  order.

`@Primary` / `@Qualifier` → multiple implementations of one interface
: Register each under a distinct string token and select with
  [`@Inject("token")`](/api/di-decorators.md). Explicit, and it works today.

# Tracked as

Filed as [usetheodev/theokit-di#5](https://github.com/usetheodev/theokit-di/issues/5).

# Status

The metadata keys are exported from
[`METADATA_KEYS`](/api/metadata-keys.md), so an external consumer *could* read them and
implement the semantics itself — the decorators are a usable annotation vocabulary even
while the container ignores them.

Nothing in the repository states whether these are planned features or abandoned ones.
Treat the docstrings as design intent, not as a description of shipped behaviour, until
that is decided.

[^barrel]: Public barrel of `@theokit/di`
[^container]: Container implementation
[^metadata]: Metadata keys and readers
[^tests]: Lifecycle decorator test suite
[^grep]: Metadata key usage sweep
