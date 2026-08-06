---
type: Caveat
title: "@Transactional has no DI binding path"
description: The decorator claims the container binds its data source automatically; no such code exists, and the manual alternative is not exported.
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
    resource: packages/orm/tests/integration/transactional.test.ts
    title: "@Transactional test suite"
  - id: sweep
    resource: "grep for bindDataSourceToInstance across packages/*/src and packages/*/tests at commit 3861d5c"
    title: Binding call-site sweep
---

[`@Transactional()`](/api/transactional.md) needs a `DataSource` on the instance whose
method it wraps. Its documentation names two ways to get one there. One of them is not
implemented, and the other is not reachable from the published package.

# What the source claims

From the module's own header:[^tx]

> The `OrmModule` arranges this automatically when classes are DI-managed.
>
> Direct (non-DI) instantiation requires manually calling
> `bindDataSourceToInstance(instance, ds)` before invoking the method.

The runtime error message repeats it:

> The class must be DI-managed via `Container.resolve` OR
> `bindDataSourceToInstance(instance, ds)` must be called before invoking the method.

# What the code does

**The DI path does not exist.** `module.ts` has no reference to
`bindDataSourceToInstance`, to the `Symbol.for("Theo:orm:dataSource")` key, or to any
post-construction hook. `OrmModule.forRoot` returns one `ValueProvider` and
`forFeature` returns one `FactoryProvider` per table — neither touches the consuming
class.[^module]

Nor could it, given the container's design.
[`Container`](/api/container.md) constructs instances and caches them; it exposes no
post-construction interception point. The
[`@PostConstruct` hook that might have served](/caveats/inert-di-decorators.md) is
itself inert.

A sweep for `bindDataSourceToInstance` across every `src` and `tests` directory at
commit `3861d5c` returns hits in exactly two files: its own declaration in
`transactional.ts`, and the test file that calls it manually.[^sweep] No production
code calls it.

**The manual path is not exported.** `bindDataSourceToInstance` is `export`ed from
`transactional.ts` but absent from `src/index.ts`, which re-exports `Transactional`
alone from that module.[^barrel] A consumer installing `@theokit/orm` from npm cannot
import it.

# What the tests show

Every `@Transactional` case binds by hand, reaching past the barrel into the source
path:[^tests]

```typescript
import { bindDataSourceToInstance } from "../../src/transactional.js";
// ...
const svc = new CommitService();
bindDataSourceToInstance(svc, ds);
```

The suite covers commit, rollback, tx propagation, an unbound instance, and a driver
without `.transaction()`. It does not cover resolving a `@Transactional` class through
a container, and `integration/module-end-to-end.test.ts` never mentions the decorator
at all.

So the tests are green and the DI path is untested — because there is nothing there to
test. The relative-path import is itself the signal: a public API would have been
imported from the barrel, as
[`create-repository-barrel.test.ts`](/architecture/testing.md) does deliberately for
`createRepository`.

# Consequences

| You want | Result today |
|---|---|
| Resolve a `@Transactional` class from a container | `OrmConfigurationError` on the first call |
| Bind manually in an application | `bindDataSourceToInstance` is not importable from the package |
| Bind manually inside this repository | Works, via a relative import |

The decorator's own mechanism is sound —
[the propagation into `Repository`](/api/repository.md) is real and tested. What is
missing is the wiring that puts a `DataSource` on the instance.

# Workarounds

Manage the transaction explicitly, with no decorator:

```typescript
await ds.db.transaction(async (tx) => {
  // repositories resolved here do NOT see tx unless withTxContext wraps the call
});
```

Note the caveat inside the caveat: [`Repository`](/api/repository.md) joins a
transaction by reading `getTxContext()`, and only `@Transactional` populates that
store. A bare `db.transaction` gives you a `tx` handle that injected repositories will
not pick up.

# Tracked as

Filed as [usetheodev/theokit-di#4](https://github.com/usetheodev/theokit-di/issues/4),
with the ignored `isolationLevel` as a sub-bug in the same issue.

# Fixing it properly

Two changes, in this order:

- [ ] Export `bindDataSourceToInstance` from `src/index.ts` — one line, and it makes
      the documented manual path real for npm consumers.
- [ ] Either implement the DI binding, or correct the header and the error message so
      they stop promising it.

The second is the one that matters. Documentation describing behaviour that does not
exist costs more than a missing feature, because it sends people looking for a bug in
their own wiring.

[^tx]: `@Transactional` implementation
[^module]: `OrmModule` implementation
[^barrel]: Public barrel of `@theokit/orm`
[^tests]: `@Transactional` test suite
[^sweep]: Binding call-site sweep
