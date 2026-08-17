---
type: API Class
title: Container
description: The DI runtime — registration, synchronous and asynchronous resolution, request scoping, graph analysis and disposal.
resource: packages/di/src/container.ts
tags: [di, container, api, runtime]
generated: { by: claude-code/claude-opus-5, at: 2026-08-06T15:00:00Z }
sources:
  - id: container
    resource: packages/di/src/container.ts
    title: Container implementation
  - id: tests
    resource: packages/di/tests/container-core.test.ts
    title: Container core test suite
  - id: types
    resource: packages/di/src/types.ts
    title: "@theokit/di public type contract"
---

`Container` is the whole runtime of [@theokit/di](/packages/theokit-di.md). One class
holds the registry, the caches, the request-scope storage and the disposal chain; the
decorators only write metadata that this class reads.[^container]

```typescript
import { Container } from "@theokit/di";

const container = new Container({ providers: [GreeterService] });
const greeter = container.resolve(GreeterService);
```

# Constructor

```typescript
new Container(options?: ContainerOptions)
```

`ContainerOptions` has two fields, both optional:[^types]

| Option | Default | Meaning |
|---|---|---|
| `providers` | `[]` | Declarative seed. Each entry is registered exactly as if `register()` had been called. |
| `allowDynamicRegistration` | `false` | Permits `register()` after the first `resolve()`. Recommended for tests only. |

# Public methods

| Method | Signature | Notes |
|---|---|---|
| `register` | `(providerOrClass) => void` | Accepts a full provider or a bare class. Re-registering a token warns on stderr and the last write wins. |
| `registerModule` | `(moduleClass) => void` | Loads a `@Module()` class and everything it transitively imports. |
| `has` | `(token) => boolean` | Registry membership only; does not attempt resolution. |
| `resolve` | `<T>(token) => T` | Synchronous. Throws if the chain touches an async provider. |
| `resolveAsync` | `<T>(token) => Promise<T>` | Always returns a Promise, even for synchronous providers. |
| `runInRequest` | `<R>(callback) => Promise<R>` | Opens a REQUEST scope around the callback. |
| `analyze` | `() => { nodes, edges, cycles }` | Debug snapshot of the dependency graph. |
| `dispose` | `() => Promise<void>` | Idempotent; also bound to `Symbol.asyncDispose`. |

# The freeze rule

The container freezes on the first `resolve()`. Any later `register()` or
`registerModule()` throws `ContainerFrozenError` unless the constructor received
`allowDynamicRegistration: true`.[^container]

The reason is a class of bug that is very hard to see: a singleton constructed under
one set of registrations, followed by a different registration arriving later, leaves
two parts of the application disagreeing about which implementation they got. Failing
loudly at registration time is cheaper than debugging that.

# Request scope

```typescript
await container.runInRequest(async () => {
  const svc = await container.resolveAsync(RequestScopedService);
});
```

`runInRequest` allocates a fresh per-request cache and instance list, runs the
callback inside an `AsyncLocalStorage` context, and disposes every REQUEST-scoped
instance in a `finally` block — so instances are cleaned up even when the callback
throws.[^container] Resolving a REQUEST-scoped provider outside this boundary throws
[`ScopeViolationError`](/api/di-errors.md).

The propagation limit is the usual `AsyncLocalStorage` one: a raw `setTimeout` or
`setImmediate` callback that escapes the Promise chain leaves the context behind.
[One agent per HTTP request](/guides/request-scope-http.md) shows the pattern that
respects it.

# analyze()

`analyze()` walks the registry and returns nodes, edges and every distinct cycle.
Edges come from constructor metadata for class providers, from the explicit `inject`
list for factory providers, and from the alias target for existing providers; value
providers contribute none.[^container]

The reason to call it is coverage. Resolve-time cycle detection only fires for chains
somebody actually resolves, so a cycle among providers nobody touches stays invisible
until it does not. `analyze()` finds those, which makes it worth asserting in a test.

Two honest limits: `isAsync` on each node is hard-coded to `false` because asynchrony
is only known at resolve time, and cycle detection uses an iterative DFS rather than
recursion specifically so a large graph does not blow the call stack.[^container]

# Disposal

`dispose()` runs each singleton's cleanup in reverse construction order, so dependents
are torn down before their dependencies. An instance qualifies if it has a `dispose()`
method or a `Symbol.asyncDispose` method, with the symbol taking priority. Errors do
not stop the chain — every instance gets its turn and the collected failures are
rethrown as one `AggregateError`.[^container]

After disposal the container is closed: any further `resolve()` throws
`ContainerDisposedError`. Because `Symbol.asyncDispose` is wired up, the whole
lifecycle can also be written as `await using container = new Container(...)`.

# Related

The mechanics of a single resolution are traced step by step in
[resolution pipeline](/architecture/resolution-pipeline.md). The provider shapes it
accepts are in [providers](/api/providers.md), the lifetimes in
[scopes](/api/scopes.md), and every failure it can throw in
[container errors](/api/di-errors.md).

[^container]: Container implementation
[^types]: `@theokit/di` public type contract
[^tests]: Container core test suite
