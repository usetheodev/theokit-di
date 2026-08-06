---
type: Error Catalog
title: Container errors
description: Every typed failure @theokit/di can throw, what triggers it, and how to fix it.
resource: packages/di/src/errors.ts
tags: [di, errors, troubleshooting]
generated: { by: claude-code/claude-opus-5, at: 2026-08-06T15:00:00Z }
sources:
  - id: errors
    resource: packages/di/src/errors.ts
    title: "@theokit/di error classes"
  - id: loader
    resource: packages/di/src/internal/module-loader.ts
    title: Module loader
  - id: container
    resource: packages/di/src/container.ts
    title: Container implementation
---

Production code in [@theokit/di](/packages/theokit-di.md) never throws a bare `Error`.
Every failure mode has a class with a stable `name` and the context needed to act on
it.[^errors]

Two exceptions are honest to name: a `TypeError` is used for malformed provider
objects and for the missing-`emitDecoratorMetadata` case, because those are consumer
type errors rather than container domain failures.[^container]

# From resolution

| Error | Thrown when | Carries |
|---|---|---|
| `TokenNotFoundError` | A token was never registered. | `token`, `resolutionPath` |
| `CyclicDependencyError` | A resolution chain revisits a token. | `cycle` |
| `AsyncProviderInSyncResolveError` | `resolve()` hit an async provider. | `token` |
| `ScopeViolationError` | REQUEST-scoped resolve outside `runInRequest`. | `token` |

`TokenNotFoundError` renders the full path — `AppService → UserService → DbConnection`
— rather than just the missing name, because in a deep graph the path is the part that
tells you where the wiring went wrong.[^errors]

`AsyncProviderInSyncResolveError` is not a bug report, it is a routing signal: switch
the call site to `resolveAsync()`. The container also uses it internally as a
control-flow marker, catching it to decide that a whole dependency list must be
re-resolved asynchronously.[^container]

# From registration

| Error | Thrown when | Fix |
|---|---|---|
| `MissingInjectableError` | A class provider lacks `@Injectable()`. | Add the decorator. |
| `ContainerFrozenError` | `register()` after the first `resolve()`. | Register earlier, or pass `allowDynamicRegistration: true`. |
| `ContainerDisposedError` | `resolve()` after `dispose()`. | Build a new container. |
| `ReflectMetadataMissingError` | The `reflect-metadata` polyfill is absent. | `import "reflect-metadata"` once at the entry point. |

# From the module loader

| Error | Thrown when | Carries |
|---|---|---|
| `InvalidModuleError` | `registerModule()` got a class without `@Module()`. | `target` |
| `InvalidExportError` | A module exports a token not in its own `providers`. | `moduleName`, `token` |
| `CyclicModuleImportError` | Module imports form a cycle. | `cycle` as module names |

These live in `internal/module-loader.ts` but are re-exported from the public
barrel.[^loader]

# describeToken

The helper every message uses to render a token, exported for consumers building
their own diagnostics.[^errors]

```typescript
describeToken(UserService);      // "UserService"
describeToken("DATABASE_URL");   // "\"DATABASE_URL\""
```

String tokens are JSON-quoted and class tokens are not, so a message never leaves you
guessing which kind of token failed. Anything else renders as `<unknown token>` — a
defensive branch that should be unreachable.

# Diagnosing the two metadata failures

They look alike and have different fixes.

`ReflectMetadataMissingError` means the polyfill never loaded: `Reflect.getMetadata`
is not a function. Import `reflect-metadata` once, at the top of your entry file.

A `TypeError` reading `has @Injectable() but no constructor metadata` means the
polyfill is present but the compiler emitted nothing — the container saw zero
parameter types on a class whose constructor declares parameters. Turn on
`emitDecoratorMetadata`.[^container]

There is a third, narrower message for a parameter the container can see but cannot
resolve: a primitive or interface parameter with no `@Inject`. The fix is an explicit
string token, and the message says so.[^container]

# Related

Where each of these arises in the resolution sequence is traced in
[resolution pipeline](/architecture/resolution-pipeline.md). The ORM has its own
hierarchy, described in [ORM errors](/api/orm-errors.md).

[^errors]: `@theokit/di` error classes
[^loader]: Module loader
[^container]: Container implementation
