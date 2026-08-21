---
"@theokit/di": minor
---

**Breaking: the container now disposes only what it constructed.**

`container.dispose()` used to tear down a `useValue` instance the caller built and
still holds a reference to — so a caller who closed their own pool, as every
convention says they should, closed it twice. It also disposed an instance reached
through `useExisting` once per token naming it, and an alias resolves to the same
object by definition.

The rule is ownership: `useClass` and `useFactory` are constructed by the container
and torn down by it; `useValue` and `useExisting` are not. If you relied on
`dispose()` closing a value you passed in, close it yourself.

**`@PostConstruct` and `@PreDestroy` are now called.** They previously recorded
metadata that nothing read. `@PostConstruct` runs once per instance after every
constructor dependency is injected; an async hook is awaited by `resolveAsync`, and
`resolve()` throws `AsyncPostConstructInSyncResolveError` rather than hand back an
object whose initialiser is still running. `@PreDestroy` runs before `dispose()` when
a class has both, and a class no longer needs `dispose()` to be torn down.

Every published export now carries documentation an editor can show (37/37 on the
emitted declarations, up from 33/37), and JSDoc no longer cites plans, ADRs or audit
findings that live in no repository a reader can reach.
