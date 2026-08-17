---
type: API Contract
title: METADATA_KEYS
description: The shared reflect-metadata key table that lets decorators in one package be read by code in another.
resource: packages/di/src/internal/metadata.ts
tags: [di, metadata, reflect-metadata, contract]
generated: { by: claude-code/claude-opus-5, at: 2026-08-06T15:00:00Z }
sources:
  - id: metadata
    resource: packages/di/src/internal/metadata.ts
    title: Metadata keys and readers
  - id: dichangelog
    resource: packages/di/CHANGELOG.md
    title: "@theokit/di changelog"
---

`METADATA_KEYS` is the wire format of this ecosystem. Decorators write under these
string keys; readers elsewhere look them up. Because the table is exported from
[@theokit/di](/packages/theokit-di.md), a decorator shipped in
[@theokit/di-agent](/packages/theokit-di-agent.md) and a reader in a third package can
agree without importing each other.[^metadata]

Every key is namespaced `usetheo:di:*`, with one exception: `DESIGN_PARAMTYPES` is
`design:paramtypes`, the key TypeScript itself emits.

# Keys the container reads

| Key | Value | Written by |
|---|---|---|
| `INJECTABLE` | `InjectableMetadata` | `@Injectable()` |
| `INJECT_TOKENS` | `Map<number, Token>` | `@Inject(token)` |
| `OPTIONAL_FLAGS` | `Set<number>` | `@Optional()` |
| `DESIGN_PARAMTYPES` | `unknown[]` | the TypeScript compiler |

These four drive constructor resolution. See
[container decorators](/api/di-decorators.md).

# Keys nothing reads at runtime

| Key | Written by | Status |
|---|---|---|
| `QUALIFIER_NAMES` | `@Qualifier(name)` | [inert](/caveats/inert-di-decorators.md) |
| `PRIMARY` | `@Primary` | [inert](/caveats/inert-di-decorators.md) |
| `POST_CONSTRUCT` | `@PostConstruct` | [inert](/caveats/inert-di-decorators.md) |
| `PRE_DESTROY` | `@PreDestroy` | [inert](/caveats/inert-di-decorators.md) |

# Keys reserved for the agent layer

Sixteen keys back the [agent decorators](/api/agent-decorators.md): `SANDBOX`,
`SUBAGENT`, `SQUAD`, `STEP`, `HITL`, `AUTO_SUMMARIZE`, `TOOL`, `WORKFLOW`, `EVAL`,
`CRON`, `SUBSCRIPTION`, `AUTH`, `RETRIEVER`, `RERANKER`, `TEXT_SPLITTER` and
`MEMORY_SCOPE`.[^metadata]

They live in the DI package rather than the agent package on purpose: the key table is
the shared contract, so a consumer can read `@Tool` metadata without depending on the
package that defines the decorator.

That placement has a versioning consequence the team hit directly. `SQUAD` and `STEP`
were added as a **patch** release (`0.1.1`), not a minor, because a `0.2.0` would fall
outside the `^0.1.0` peer range of both `@theokit/di-agent` and `@theokit/orm` and
force each of them to `1.0.0`. Adding values to an already-exported const was judged
additive enough to justify it.[^dichangelog]

# Reader functions

Alongside the table, the module exports the readers the container uses. Each is
defensive: if `reflect-metadata` is absent or the stored value has the wrong shape,
they return an empty value rather than throwing.[^metadata]

`hasReflectMetadata()`
: Probes whether the polyfill installed `Reflect.getMetadata`.

`readParamTypes(target)`
: Constructor parameter types, or `[]`.

`readInjectTokens(target)`
: `@Inject` overrides by index, or an empty `Map`.

`readOptionalFlags(target)`
: `@Optional` indices, or an empty `Set`.

`readInjectableMetadata(target)` / `isInjectable(target)`
: The `@Injectable` options, and whether the decorator was present at all.

`isPrimitiveTypeMarker(value)`
: Whether a parameter type is one of `Number`, `String`, `Boolean`, `Object`, `Array`
  or `Function`.

That last one carries more weight than it looks. TypeScript emits `Object` for an
interface-typed parameter, so without this check the container would report
`TokenNotFoundError: Object` — accurate and useless. Detecting the marker is what lets
it say instead that primitives and interfaces need an explicit `@Inject` token.[^metadata]

[^metadata]: Metadata keys and readers
[^dichangelog]: `@theokit/di` changelog
