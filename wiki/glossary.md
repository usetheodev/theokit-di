---
type: Glossary
title: theokit-di terms
description: What the recurring terms of this monorepo mean, in one place.
tags: [glossary, terminology]
generated: { by: claude-code/claude-opus-5, at: 2026-08-06T15:00:00Z }
sources:
  - id: types
    resource: packages/di/src/types.ts
    title: "@theokit/di public type contract"
  - id: ormtypes
    resource: packages/orm/src/types.ts
    title: "@theokit/orm type contract"
---

# Container terms

Token
: What identifies a dependency — a class constructor or a string. Symbols are
  deliberately unsupported in v1. See [providers](/api/providers.md).

Provider
: The instruction for materializing a token's value. Exactly one of `useClass`,
  `useFactory`, `useValue` or `useExisting`.

Scope
: How long a resolved instance lives: `SINGLETON` per container, `TRANSIENT` per
  resolve, `REQUEST` per `runInRequest` boundary. See [scopes](/api/scopes.md).

Resolution path
: The chain of tokens traversed to reach the current one. It is what cycle detection
  tests against and what `TokenNotFoundError` prints.

Frozen container
: State entered on the first `resolve()`, after which registration throws unless
  `allowDynamicRegistration` was set. See [Container](/api/container.md).

Registration
: The container's internal record for a token — its scope, its factory, and whichever of
  `classTarget`, `injectTokens` or `aliasTarget` applies.[^types]

Primitive type marker
: One of `Number`, `String`, `Boolean`, `Object`, `Array`, `Function` — what TypeScript
  emits for a primitive or interface parameter. Detected so the container can ask for an
  explicit token instead of reporting `TokenNotFoundError: Object`.

Single-flight cache
: Caching an in-flight Promise so concurrent callers await one factory run rather than
  starting several. Traced in
  [resolution pipeline](/architecture/resolution-pipeline.md).

# Agent terms

Agent
: A `@theokit/sdk` runtime object. This repository never constructs one — it wires a
  consumer-supplied factory. See [agent provider](/api/agent-provider.md).

Squad
: A team of agents running in order. Declared with `@Squad`, executed by the SDK's
  `createSquad`.

Step
: One unit of a decorator-declared workflow, with at most one upstream. Compiled by
  [`buildWorkflow`](/api/workflow-builder.md).

Bridge layer
: A module that imports the SDK at runtime rather than only writing metadata.
  `workflow-builder.ts` is the only one. See
  [metadata-only agent decorators](/caveats/metadata-only-agent-decorators.md).

# ORM terms

Entity
: A Drizzle table object. The vocabulary is inherited from TypeORM; the runtime type is
  Drizzle's `Table`.[^ormtypes]

DataSource
: The bundle of `name`, `dialect`, `schema` and the Drizzle `db` handle that
  `OrmModule.forRoot` registers. See [OrmModule](/api/orm-module.md).

Repository token
: `REPO:<table>` for the default data source, `REPO:<source>:<table>` otherwise —
  derived from the SQL table name, not the variable name.

Agent context
: The `{ agentId, runId, conversationId }` triple carried in an `AsyncLocalStorage` and
  auto-filled into matching columns. See
  [agent context columns](/api/agent-context.md).

Transaction context
: A separate `AsyncLocalStorage` holding a Drizzle transaction handle, read by
  `Repository`'s `db` getter. Populated only by
  [`@Transactional`](/api/transactional.md).

# Cross-cutting

ADR
: Architecture Decision Record. Source comments and changelog entries used to cite these
  by bare identifier — D2, D4, D5, D7, D11, D422, D431 — but the documents live outside
  this repository, so the citations pointed nowhere a reader could follow. They were
  removed from the source on 2026-08-17 and the reasoning each one stood for is now
  written where it applies. A few survive in released changelog entries, which are
  immutable.

Inert decorator
: A decorator that writes metadata nothing reads. See
  [inert container decorators](/caveats/inert-di-decorators.md).

[^types]: `@theokit/di` public type contract
[^ormtypes]: `@theokit/orm` type contract
