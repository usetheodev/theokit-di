# API

## Container

* [Container](container.md) - The DI runtime: register, resolve, request scope, analyze, dispose.
* [Providers](providers.md) - The four ways a token is materialized.
* [Scopes](scopes.md) - SINGLETON, TRANSIENT and REQUEST lifetimes.
* [Container decorators](di-decorators.md) - `@Injectable`, `@Inject`, `@Optional`, `@Module`.
* [METADATA_KEYS](metadata-keys.md) - The shared reflect-metadata wire format.
* [Container errors](di-errors.md) - Every typed failure mode the container throws.

## Agents

* [Agent provider](agent-provider.md) - `@InjectAgent`, `createAgentProvider`, `AGENT_TOKEN`.
* [Agent decorators](agent-decorators.md) - The sixteen declarative agent-capability decorators.
* [buildWorkflow](workflow-builder.md) - Compiles `@Step` methods into a `@theokit/sdk` Workflow.

## ORM

* [Repository](repository.md) - CRUD over a Drizzle table, transaction-aware.
* [OrmModule](orm-module.md) - `forRoot` / `forFeature` provider builders and repository tokens.
* [@Transactional](transactional.md) - Method decorator wrapping a call in `db.transaction`.
* [Agent context columns](agent-context.md) - Auto-filling `agentId` / `runId` / `conversationId`.
* [Schema export](schema-export.md) - Drizzle tables to JSON Schema 7 for polyglot consumers.
* [ORM errors](orm-errors.md) - The `OrmError` hierarchy.
