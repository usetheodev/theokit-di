---
type: API Surface
title: Container decorators
description: The four @theokit/di decorators the container actually reads — @Injectable, @Inject, @Optional and @Module.
resource: packages/di/src/decorators
tags: [di, decorators, api]
generated: { by: claude-code/claude-opus-5, at: 2026-08-06T15:00:00Z }
sources:
  - id: injectable
    resource: packages/di/src/decorators/injectable.ts
    title: "@Injectable implementation"
  - id: inject
    resource: packages/di/src/decorators/inject.ts
    title: "@Inject implementation"
  - id: optional
    resource: packages/di/src/decorators/optional.ts
    title: "@Optional implementation"
  - id: module
    resource: packages/di/src/decorators/module.ts
    title: "@Module implementation"
  - id: loader
    resource: packages/di/src/internal/module-loader.ts
    title: Module loader
  - id: container
    resource: packages/di/src/container.ts
    title: Container implementation
---

Four decorators are read by [`Container`](/api/container.md) at runtime. Four more are
exported but inert — those are catalogued separately in
[inert container decorators](/caveats/inert-di-decorators.md).

# @Injectable(options?)

Class decorator. Marks a class as DI-managed and optionally fixes its scope.

```typescript
@Injectable()
class UserService {
  constructor(private db: DbConnection) {}
}

@Injectable({ scope: Scope.REQUEST })
class RequestLogger {}
```

It writes an `InjectableMetadata` object under `METADATA_KEYS.INJECTABLE` — `{}` when
no scope is given, so the presence of the key is itself the marker.[^injectable]

The decorator is not decoration. Registering an undecorated class throws
[`MissingInjectableError`](/api/di-errors.md), on both the declarative and imperative
paths.[^container] The reason is that the container needs the class to have been
processed by a decorator at all for TypeScript to emit `design:paramtypes`; without
that emission there is nothing to auto-resolve.

# @Inject(token)

Parameter decorator. Overrides the type-derived token for one constructor parameter.

```typescript
class GreeterService {
  constructor(
    @Inject("DATABASE_URL") readonly dbUrl: string,
    @Inject(LoggerInterface) readonly logger: LoggerInterface,
  ) {}
}
```

Required whenever the parameter has no usable runtime class: primitives and
interfaces both erase to a wrapper the container refuses to treat as a token. It
accumulates into a `Map<number, Token>` keyed by parameter index.[^inject]

Two packages build on it directly:
[`InjectAgent()`](/api/agent-provider.md) is `Inject(AGENT_TOKEN)`, and
[`InjectRepository(table)`](/api/orm-module.md) is `Inject(getRepositoryToken(table))`.

# @Optional()

Parameter decorator. Turns an unregistered dependency into `undefined` instead of a
throw.

```typescript
class GreeterService {
  constructor(@Optional() private logger?: Logger) {}
}
```

Its blast radius is deliberately narrow: it swallows `TokenNotFoundError` and nothing
else. A factory that throws, or a cycle, still propagates.[^optional] That narrowness
is what keeps it from hiding real wiring bugs.

# @Module(metadata)

Class decorator. Groups providers, imports and exports.

```typescript
@Module({
  providers: [UserService, { provide: "DB_URL", useValue: process.env.DB }],
  imports: [LoggingModule],
  exports: [UserService],
})
class UserModule {}
```

The decorated class is never instantiated — it only carries metadata that
`registerModule()` reads.[^module] Modules are opt-in; a flat container is
the default usage.

`loadModule` walks imports depth-first with a path stack, so a cycle throws
`CyclicModuleImportError` naming the module chain. Registration happens in post-order,
which means an imported module's providers land before its importer's.[^loader]

## exports is documentation, not enforcement

`exports` is validated — listing a token that is not in the module's own `providers`
throws `InvalidExportError` — but it is not enforced at resolve time. Once any module
registers a provider, that provider is resolvable from anywhere in the container. This
is the flat NestJS-style behaviour, and token-level visibility is explicitly deferred
to v2.[^loader]

Treat `exports` as a statement of intent your team reads, not a boundary the runtime
guards.

[^injectable]: `@Injectable` implementation
[^inject]: `@Inject` implementation
[^optional]: `@Optional` implementation
[^module]: `@Module` implementation
[^loader]: Module loader
[^container]: Container implementation
