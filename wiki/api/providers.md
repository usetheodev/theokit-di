---
type: API Contract
title: Providers
description: The four provider shapes that tell the container how to materialize a value for a token.
resource: packages/di/src/types.ts
tags: [di, providers, api]
generated: { by: claude-code/claude-opus-5, at: 2026-08-06T15:00:00Z }
sources:
  - id: types
    resource: packages/di/src/types.ts
    title: "@theokit/di public type contract"
  - id: container
    resource: packages/di/src/container.ts
    title: Container implementation
---

A provider answers one question: when somebody asks for this token, how is the value
produced? [`Container`](/api/container.md) accepts four shapes, and exactly one of
`useClass`, `useFactory`, `useValue` or `useExisting` must be present.[^types]

# Tokens

A token is either a class constructor or a string.[^types]

```typescript
type Token<T = unknown> = ClassConstructor<T> | string;
```

Class tokens are the primary form — the container reads `design:paramtypes` and
resolves constructor parameters with no annotation at all. String tokens are the
fallback for things that have no runtime class: primitives, interfaces, configuration
values. Symbols are deliberately not supported in v1; the recorded decision
defers them to v2 if real demand appears.[^types]

# The four shapes

## ClassProvider

```typescript
{ provide: Token<T>, useClass: ClassConstructor<T>, scope?: Scope }
```

The container instantiates the class, resolving each constructor parameter first. The
class must carry `@Injectable()` or registration throws
[`MissingInjectableError`](/api/di-errors.md) — validated on both the declarative
`providers: []` path and the imperative `register()` path.[^container]

A bare class is shorthand for `{ provide: X, useClass: X }`, expanded at registration
time.[^container]

Scope precedence is explicit: the provider's own `scope` wins, then the scope declared
on `@Injectable({ scope })`, then `SINGLETON`.[^container]

## FactoryProvider

```typescript
{ provide: Token<T>, useFactory: (...deps) => T | Promise<T>, inject?: Token[], scope?: Scope }
```

The factory produces the value; `inject` names the tokens passed to it, positionally.
The factory may be async, which is what makes this the shape used by
[`createAgentProvider`](/api/agent-provider.md) and
[`OrmModule.forFeature`](/api/orm-module.md).

Resolution tries synchronously first. If any dependency turns out to be async, the
container abandons the sync attempt and re-resolves the whole dependency list through
`Promise.all` before invoking the factory.[^container]

## ValueProvider

```typescript
{ provide: Token<T>, useValue: T }
```

A pre-built value. It has no dependencies, contributes no edges to
[`analyze()`](/api/container.md), and is always registered as `SINGLETON` — a `scope`
field would be meaningless, so the type does not offer one.[^types]

## ExistingProvider

```typescript
{ provide: Token<T>, useExisting: Token<T> }
```

An alias: resolving `provide` resolves `useExisting` instead. Like `ValueProvider` it
is always `SINGLETON`, and its target is validated lazily at resolve time — the chain
may legitimately point at a provider registered later in the same batch.[^container]

# Validation timing

Not every check happens at registration, and knowing which is which explains most
surprising error timings:

| Check | When |
|---|---|
| `provide` is neither `undefined` nor `null` | registration |
| `useClass` is a function | registration |
| `useClass` carries `@Injectable()` | registration |
| Module `exports` are all in `providers` | registration |
| `useExisting` target exists | resolve |
| `inject` tokens exist | resolve |
| Cycles in the chain | resolve, or eagerly via `analyze()` |

# Related

Lifetimes are in [scopes](/api/scopes.md); the decorators that annotate a class before
it becomes a `ClassProvider` are in
[container decorators](/api/di-decorators.md).

[^types]: `@theokit/di` public type contract
[^container]: Container implementation
