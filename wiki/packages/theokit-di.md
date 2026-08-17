---
type: Package
title: "@theokit/di"
description: Lightweight TypeScript IoC container with a NestJS-compatible decorator API, three lifecycle scopes and four provider types.
resource: https://www.npmjs.com/package/@theokit/di
tags: [package, di, container, typescript]
generated: { by: claude-code/claude-opus-5, at: 2026-08-06T15:00:00Z }
sources:
  - id: pkg
    resource: packages/di/package.json
    title: "@theokit/di package manifest"
  - id: readme
    resource: packages/di/README.md
    title: "@theokit/di README"
  - id: barrel
    resource: packages/di/src/index.ts
    title: Public barrel of @theokit/di
  - id: changelog
    resource: packages/di/CHANGELOG.md
    title: "@theokit/di changelog"
---

`@theokit/di` is the foundation package of this monorepo. It is a runtime IoC
container: consumers annotate classes with decorators, register them as providers,
and ask the container for an instance instead of constructing one by hand.

The API is deliberately NestJS-shaped — `@Injectable`, `@Inject`, `@Module`,
`providers: []` — so anyone who knows Nest can read a theokit wiring file without
learning a new vocabulary.[^readme]

# Identity

Name
: `@theokit/di`

Version
: `0.1.1`[^pkg]

License
: Apache-2.0

Node
: `>=22.12.0`, ESM and CJS both built by `tsup`

Peer dependency
: `reflect-metadata@^0.2.0` — the only one[^pkg]

# What it ships

The public barrel exports the runtime, the decorators, the error hierarchy, the
metadata key table and the type contract.[^barrel]

| Export | Kind | Documented in |
|---|---|---|
| `Container` | class | [Container](/api/container.md) |
| `Injectable`, `Inject`, `Optional`, `Module` | decorators | [Container decorators](/api/di-decorators.md) |
| `Primary`, `Qualifier`, `PostConstruct`, `PreDestroy` | decorators | [Inert container decorators](/caveats/inert-di-decorators.md) |
| `Scope` | const enum | [Scopes](/api/scopes.md) |
| `Provider` and its four variants | types | [Providers](/api/providers.md) |
| `METADATA_KEYS` | const | [METADATA_KEYS](/api/metadata-keys.md) |
| 9 error classes + `describeToken` | errors | [Container errors](/api/di-errors.md) |
| 3 module-loader errors | errors | [Container errors](/api/di-errors.md) |

# Required consumer configuration

Two TypeScript flags are mandatory, because the container reads constructor
parameter types out of `design:paramtypes` metadata that only the compiler can emit:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

`reflect-metadata` must also be imported exactly once at the application entry
point. Without it the container throws
[`ReflectMetadataMissingError`](/api/di-errors.md) on the first class resolve;
with the polyfill but without `emitDecoratorMetadata` it throws a `TypeError`
naming the missing flag.[^readme]

# Polyglot position

The package is intentionally TypeScript-only. A DI container is a language-specific
runtime construct, so the cross-language story of the theokit ecosystem lives in the
contract layer instead — OpenAPI from `@theokit/http`, and SQL migrations plus
JSON Schema from [schema export](/api/schema-export.md).[^readme]

# Consumers

Both other packages in this monorepo build directly on it:
[@theokit/di-agent](/packages/theokit-di-agent.md) for REQUEST-scoped agents
and [@theokit/orm](/packages/theokit-orm.md) for repository injection. The
full dependency picture is in [package topology](/architecture/package-topology.md).

# Known design trade-offs

The `Container` class is 830 lines, above the 500-line heuristic file budget. The
recorded decision is to keep the class whole — it is the single point of truth for
resolution, lifecycle, metadata reading, alias resolution, request-scope propagation
and disposal — and to hold the complexity budget at the method level instead, with
Extract Method.[^changelog]

A type-only import cycle between `container.ts` and `internal/module-loader.ts` was
broken in `0.1.1` by introducing the narrow `ModuleRegistrar` interface in the leaf
`types.ts` module. `Container` satisfies it structurally, so
there was no behaviour change.[^changelog]

[^pkg]: `@theokit/di` package manifest
[^readme]: `@theokit/di` README
[^barrel]: Public barrel of `@theokit/di`
[^changelog]: `@theokit/di` changelog
