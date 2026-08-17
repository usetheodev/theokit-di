---
type: Caveat
title: "@Transactional needs its DataSource bound explicitly"
description: Nothing binds the DataSource for you. The decorator once claimed the container did it automatically; it never has, and the binding call was not exported.
resource: packages/orm/src/transactional.ts
tags: [caveat, orm, transactions, doc-drift]
generated: { by: claude-code/claude-opus-5, at: 2026-08-06T15:00:00Z }
sources:
  - id: tx
    resource: packages/orm/src/transactional.ts
    title: "@Transactional implementation"
  - id: module
    resource: packages/orm/src/module.ts
    title: OrmModule implementation
  - id: barrel
    resource: packages/orm/src/index.ts
    title: Public barrel of @theokit/orm
  - id: tests
    resource: packages/orm/tests/integration/transactional-di.test.ts
    title: "@Transactional binding suite"
---

[`@Transactional()`](/api/transactional.md) needs a `DataSource` on the instance whose
method it wraps, and nothing puts one there for you. Not `OrmModule`, not the container.
You call `bindDataSourceToInstance` yourself.

This surprises people arriving from NestJS, where the equivalent is wired by the
framework. It is worth stating plainly rather than discovering at the first call.

# Why the decorator cannot do it itself

`@Transactional` is a method decorator. It runs once, at class-definition time, long
before any container exists and with no reference to one. All it can do at call time is
look on `this` for a DataSource somebody else put there.[^tx]

`OrmModule` cannot put it there either: `forRoot` returns a `ValueProvider` and
`forFeature` a `FactoryProvider` per table. Neither touches the consuming class.[^module]

# The two ways that work

Container-managed — inject the DataSource and bind it in a `@PostConstruct` hook, which
runs after construction with every dependency already in place:[^tests]

```typescript
@Injectable()
class TransferService {
  constructor(@Inject(ORM_DATA_SOURCE_TOKEN) private readonly ds: DataSource) {}

  @PostConstruct
  bindTransactions() {
    bindDataSourceToInstance(this, this.ds);
  }

  @Transactional()
  async transfer() { /* getTxContext() is live here */ }
}
```

Plain construction — bind directly, before calling the method:

```typescript
const svc = new TransferService();
bindDataSourceToInstance(svc, dataSource);
await svc.transfer();
```

# What this used to be

Tracked as [usetheodev/theokit-di#4](https://github.com/usetheodev/theokit-di/issues/4):
the decorator's own documentation offered two routes and neither was available. It
claimed `OrmModule` arranged the binding automatically, which no code ever did, and it
pointed at `bindDataSourceToInstance` — which was not exported from the package barrel,
so a consumer following the error message could not even compile.

Both halves are resolved. `bindDataSourceToInstance` is exported and covered by a
reachability test that imports it through the barrel, and the `@PostConstruct` hook the
recipe above depends on now actually runs. The error message no longer mentions
automatic binding; it names the one call that fixes the problem.

`isolationLevel` was accepted and silently ignored — its parameter was not even read.
It is now passed to the driver, and rejected outright on `sqlite`, which has no
per-transaction isolation level to set. A dropped isolation level is not the kind of
thing that should fail quietly.[^tx]

[^tx]: `@Transactional` implementation
[^module]: `OrmModule` implementation
[^barrel]: Public barrel of `@theokit/orm`
[^tests]: `@Transactional` binding suite
