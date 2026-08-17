---
type: API Surface
title: OrmModule
description: forRoot and forFeature provider builders, the repository token scheme, and the @InjectRepository decorator.
resource: packages/orm/src/module.ts
tags: [orm, di, module, providers]
generated: { by: claude-code/claude-opus-5, at: 2026-08-06T15:00:00Z }
sources:
  - id: module
    resource: packages/orm/src/module.ts
    title: OrmModule implementation
  - id: tokens
    resource: packages/orm/src/tokens.ts
    title: getRepositoryToken implementation
  - id: injectrepo
    resource: packages/orm/src/inject-repository.ts
    title: InjectRepository implementation
  - id: e2e
    resource: packages/orm/tests/integration/module-end-to-end.test.ts
    title: OrmModule end-to-end test
---

`OrmModule` is how [@theokit/orm](/packages/theokit-orm.md) meets
[@theokit/di](/packages/theokit-di.md). Despite the name it is not a `@Module()` class
— it is an object with two functions that each return a
[`Provider[]`](/api/providers.md) you spread into a container.[^module]

```typescript
const container = new Container({
  providers: [
    ...OrmModule.forRoot({ schema: { users }, dialect: "sqlite", db }),
    ...OrmModule.forFeature([users]),
  ],
});
```

# forRoot(options)

Registers the data source. Options are validated eagerly, each with its own
[`OrmConfigurationError`](/api/orm-errors.md):[^module]

| Option | Required | Validation |
|---|---|---|
| `schema` | yes | carried onto the data source |
| `dialect` | yes | must be `"sqlite"`, `"pg"` or `"mysql"` |
| `db` | yes | must not be `undefined` or `null` |
| `dataSourceName` | no | defaults to `"default"` |

It returns a single `ValueProvider` holding the data source, under the token
`ORM_DATA_SOURCE` for the default source and `ORM_DATA_SOURCE:<name>` for a named one.

# forFeature(entities, dataSourceName?)

Returns one [`FactoryProvider`](/api/providers.md) per table, each injecting the data
source and constructing a [`Repository`](/api/repository.md):[^module]

```typescript
{
  provide: getRepositoryToken(entity, dataSourceName),
  inject: [dataSourceToken],
  useFactory: (ds) => new Repository(ds.db, entity),
}
```

It rejects a non-array, an empty array, and a data source whose `forRoot` has not run —
that last message names the missing call explicitly.

## The ordering guard uses module-level state

`forRoot` records each registered name in a module-level `Set`, and `forFeature` checks
it. This is what turns "you forgot `forRoot`" into an actionable error instead of a
`TokenNotFoundError` at first resolve.[^module]

The cost is that the `Set` is process-global, not per-container. Two containers in one
process share it, so a `forFeature` in the second container passes the check on the
strength of a `forRoot` from the first. The package acknowledges this with
`OrmModule._resetForTesting()`, marked `@internal` and used by the suite to clear the
state between cases.[^module] For a single application container this is invisible; for
a test file building many containers, reset between them.

# getRepositoryToken(entity, dataSourceName?)

```typescript
getRepositoryToken(users);                  // "REPO:users"
getRepositoryToken(users, "analytics");     // "REPO:analytics:users"
```

The scheme mirrors the NestJS TypeORM convention.[^tokens] The entity name is read from
`Symbol.for("drizzle:Name")`, falling back to `_.name`; a table exposing neither throws
`OrmConfigurationError`, as does passing `null` or `undefined`.

Note that the token is derived from the **table name**, not the variable name. Two
distinct Drizzle tables that declare the same SQL name collide on one token, and the
container's last-write-wins rule means the second silently replaces the first.

# InjectRepository(entity, dataSourceName?)

```typescript
export function InjectRepository(entity: unknown, dataSourceName?: string): ParameterDecorator {
  return Inject(getRepositoryToken(entity, dataSourceName));
}
```

A one-line wrapper over [`@Inject`](/api/di-decorators.md) that computes the token for
you.[^injectrepo] Because it runs `getRepositoryToken` at decoration time, a malformed
entity throws while the class is being defined — at import time, before any container
exists.

```typescript
@Injectable()
class UserService {
  constructor(@InjectRepository(users) private readonly repo: Repository<typeof users>) {}
}
```

The `Repository<typeof users>` annotation is what carries the row types; the decorator
supplies the token, TypeScript supplies the shape.

[^module]: `OrmModule` implementation
[^tokens]: `getRepositoryToken` implementation
[^injectrepo]: `InjectRepository` implementation
[^e2e]: `OrmModule` end-to-end test
