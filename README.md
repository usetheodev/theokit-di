# theokit-backend-dx

Backend developer-experience packages for the Theo ecosystem, extracted from `theokit-sdk` (2026-06-18, plan `monorepo-cohesion-split`) so the SDK stays a cohesive Agent-AI **Harness** and these generic backend-DX concerns evolve on their own cadence.

## Packages

| Package | What it is |
| --- | --- |
| `@theokit/di` | Lightweight TypeScript IoC container (NestJS-compatible: `@Injectable`, `@Inject`, `@Module`, 3 scopes). |
| `@theokit/di-agent` | Agent-first DI integration — `@InjectAgent()` + `createAgentProvider()` for a REQUEST-scoped `@theokit/sdk` Agent per HTTP request. |
| `@theokit/orm` | Repository pattern + `@InjectRepository` + `@Transactional` over `drizzle-orm`, on top of `@theokit/di`. |

## Relationship to `@theokit/sdk`

`@theokit/di-agent` consumes `@theokit/sdk` as a **published npm dependency** (`^1.9.0`), not a workspace link. Decorators are an OPTIONAL DX layer — the SDK itself no longer requires them (ADR D431, revoked the decorators-mandatory rule).

## Develop

```bash
nvm use
corepack enable && corepack prepare pnpm@9.15.0 --activate
pnpm install
pnpm build
pnpm test
```

## History

Extracted with full git history via `git filter-repo` from `usetheo/theokit-sdk`.
