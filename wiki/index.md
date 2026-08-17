---
okf_version: "0.2"
---

# theokit-di knowledge bundle

Agent-readable knowledge for the `theokit-di` monorepo — the dependency-injection
ecosystem of the Theo platform: a NestJS-flavoured IoC container, an agent-aware DI
layer, and a DI-driven ORM over Drizzle.

Every concept here was derived from the source tree at commit `30d39c8` and from a
test run on 2026-08-06 (252 passing tests). Where the shipped code and its own
documentation disagree, the [caveats](caveats/index.md) section states what the code
actually does.

# Packages

* [@theokit/di](packages/theokit-di.md) - Lightweight TypeScript IoC container, three scopes, four provider types.
* [@theokit/di-agent](packages/theokit-di-agent.md) - REQUEST-scoped Agent wiring plus sixteen metadata-only agent decorators.
* [@theokit/orm](packages/theokit-orm.md) - Repository pattern, agent-aware columns, transactions and JSON Schema export over `drizzle-orm`.

# API surface

* [Container](api/container.md) - The DI runtime: register, resolve, request scope, analyze, dispose.
* [Providers](api/providers.md) - The four ways a token is materialized.
* [Scopes](api/scopes.md) - SINGLETON, TRANSIENT and REQUEST lifetimes.
* [Container decorators](api/di-decorators.md) - `@Injectable`, `@Inject`, `@Optional`, `@Module`.
* [METADATA_KEYS](api/metadata-keys.md) - The shared reflect-metadata wire format.
* [Container errors](api/di-errors.md) - Every typed failure mode the container throws.
* [Agent provider](api/agent-provider.md) - `@InjectAgent`, `createAgentProvider`, `AGENT_TOKEN`.
* [Agent decorators](api/agent-decorators.md) - The sixteen declarative agent-capability decorators.
* [buildWorkflow](api/workflow-builder.md) - Compiles `@Step` methods into a `@theokit/sdk` Workflow.
* [Repository](api/repository.md) - CRUD over a Drizzle table, transaction-aware.
* [OrmModule](api/orm-module.md) - `forRoot` / `forFeature` provider builders and repository tokens.
* [@Transactional](api/transactional.md) - Method decorator wrapping a call in `db.transaction`.
* [Agent context columns](api/agent-context.md) - Auto-filling `agentId` / `runId` / `conversationId`.
* [Schema export](api/schema-export.md) - Drizzle tables to JSON Schema 7 for polyglot consumers.
* [ORM errors](api/orm-errors.md) - The `OrmError` hierarchy.

# Architecture

* [Package topology](architecture/package-topology.md) - How the three packages and their peers depend on each other.
* [Resolution pipeline](architecture/resolution-pipeline.md) - What happens between `resolve(token)` and a constructed instance.
* [Test inventory](architecture/testing.md) - What the 252 tests actually cover, and what they do not.

# Guides

* [Getting started](guides/getting-started.md) - From install to a resolved service.
* [One agent per HTTP request](guides/request-scope-http.md) - The REQUEST-scope wedge, end to end.

# Caveats

* [Inert container decorators](caveats/inert-di-decorators.md) - Four exported decorators the container never reads.
* [Metadata-only agent decorators](caveats/metadata-only-agent-decorators.md) - Sixteen decorators with no runtime consumer in this repo.
* [@Transactional has no DI binding path](caveats/transactional-di-binding.md) - The documented DI route does not exist.

# Reference

* [Glossary](glossary.md) - The recurring terms, in one place.
