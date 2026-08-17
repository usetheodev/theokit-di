# theokit-di

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

The dependency-injection ecosystem for the Theo platform — a NestJS-flavoured IoC container, agent-aware DI, and a DI-driven ORM. Split out of `theokit-sdk` on 2026-06-18 so the SDK stays a cohesive Agent-AI **Harness** while these DI/IoC concerns evolve on their own cadence.

## Packages

| Package | What it is |
| --- | --- |
| `@theokit/di` | Lightweight TypeScript IoC container (NestJS-compatible: `@Injectable`, `@Inject`, `@Module`, 3 scopes). |
| `@theokit/di-agent` | Agent-first DI integration — `@InjectAgent()` + `createAgentProvider()` for a REQUEST-scoped `@theokit/sdk` Agent per HTTP request. |
| `@theokit/orm` | Repository pattern + `@InjectRepository` + `@Transactional` over `drizzle-orm`, on top of `@theokit/di`. |

## Relationship to `@theokit/sdk`

`@theokit/di-agent` consumes `@theokit/sdk` as a **published npm dependency** (`^1.9.0`), not a workspace link. Decorators are an OPTIONAL DX layer: the SDK itself does not require them.

## Develop

```bash
nvm use
corepack enable && corepack prepare pnpm@9.15.0 --activate
pnpm install
pnpm build
pnpm test
```

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) — it covers the `workspace → develop → main` promotion
flow, the four commands that gate a change, and the test-first requirement. For a security
problem, follow [SECURITY.md](SECURITY.md) rather than opening a public issue.

Repository-level changes are recorded in [CHANGELOG.md](CHANGELOG.md); each package keeps its
own alongside its source.

## History

The three packages began inside `theokit-sdk` and were split out on 2026-06-18, so
that the SDK could stay a cohesive agent harness while these DI concerns moved at
their own pace. The commit history here was rebuilt on 2026-08-17: the imported
history described a repository these packages no longer live in, down to files and
pull requests that never came with them, and rewriting the messages alone was not
enough to fix that. What you see is a reconstruction of how the packages are built
up, not a transcript of the days they were written. The published versions on npm
are unaffected.

## License

[Apache-2.0](LICENSE) — © 2026 usetheo.dev
