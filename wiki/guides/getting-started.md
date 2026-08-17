---
type: Guide
title: Getting started
description: From an empty project to a resolved service — install, configure TypeScript, register providers, resolve.
resource: packages/di/README.md
tags: [guide, di, onboarding]
generated: { by: claude-code/claude-opus-5, at: 2026-08-06T15:00:00Z }
sources:
  - id: dreadme
    resource: packages/di/README.md
    title: "@theokit/di README"
  - id: ormreadme
    resource: packages/orm/README.md
    title: "@theokit/orm README"
  - id: container
    resource: packages/di/src/container.ts
    title: Container implementation
---

The shortest path to a working container, and the three configuration mistakes that
account for most first-run failures.

# 1. Install

```bash
pnpm add @theokit/di reflect-metadata
```

`reflect-metadata` is a peer dependency, not a transitive one — it patches the global
`Reflect` object, so exactly one copy must exist in the application.[^dreadme]

# 2. Configure TypeScript

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

Both are required. Without them the compiler emits no `design:paramtypes` and the
container cannot see constructor parameters at all.[^dreadme]

# 3. Import the polyfill once

```typescript
// src/main.ts — the entry point, before anything else
import "reflect-metadata";
```

Once, at the top of the entry file. Importing it in several modules is harmless but
importing it in none is fatal.

# 4. Write a service and a module

```typescript
import { Container, Injectable, Module } from "@theokit/di";

@Injectable()
class GreeterService {
  greet(name: string): string {
    return `Hello, ${name}!`;
  }
}

@Module({ providers: [GreeterService] })
class AppModule {}
```

[`@Injectable()`](/api/di-decorators.md) is mandatory on any class you register —
without it, registration throws `MissingInjectableError`.

# 5. Resolve

```typescript
const container = new Container();
container.registerModule(AppModule);

const greeter = container.resolve(GreeterService);
console.log(greeter.greet("world"));
```

Modules are optional. A flat container is equally valid and often clearer for a small
application:

```typescript
const container = new Container({ providers: [GreeterService] });
```

# 6. Dispose on shutdown

```typescript
process.on("SIGTERM", async () => {
  await container.dispose();
});
```

Any singleton with a `dispose()` or `Symbol.asyncDispose` method is cleaned up in
reverse construction order.[^container] The whole lifecycle can also be written as
`await using container = new Container(...)`.

# The three things that go wrong first

Registering after the first resolve
: `ContainerFrozenError`. The container freezes on first `resolve()` — see
  [Container](/api/container.md). Register everything up front; use
  `allowDynamicRegistration: true` only in tests.

Injecting a primitive or an interface
: A `TypeError` naming the parameter index. TypeScript erases both to a wrapper the
  container will not treat as a token. Annotate with
  [`@Inject("SOME_TOKEN")`](/api/di-decorators.md).

Calling `resolve()` on an async chain
: `AsyncProviderInSyncResolveError`. One async provider anywhere in the chain makes
  the whole resolve async — switch to `resolveAsync()`. This is routine as soon as
  [`createAgentProvider`](/api/agent-provider.md) is involved.

Every failure mode is catalogued in [container errors](/api/di-errors.md).

# Adding the ORM

```bash
pnpm add @theokit/orm drizzle-orm
pnpm add -D drizzle-kit
```

```typescript
const container = new Container({
  providers: [
    ...OrmModule.forRoot({ schema: { users }, dialect: "sqlite", db }),
    ...OrmModule.forFeature([users]),
    UserService,
  ],
});
```

Order matters: `forRoot` must precede `forFeature` for the same data source, or
`forFeature` throws with a message naming the missing call.[^ormreadme] The details are
in [OrmModule](/api/orm-module.md).

# Next

[One agent per HTTP request](/guides/request-scope-http.md) covers request scoping,
which is where most real applications go next.

[^dreadme]: `@theokit/di` README
[^ormreadme]: `@theokit/orm` README
[^container]: Container implementation
