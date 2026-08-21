import type { Table } from "drizzle-orm";

/** Any Drizzle table. The alias exists so this package's signatures name the domain concept
 *  rather than repeating a dependency's type everywhere a table is accepted. */
export type AnyTable = Table;

/**
 * The SQL dialect a data source speaks.
 *
 * It is carried rather than inferred because behaviour genuinely differs by dialect: `@Transactional`
 * refuses an `isolationLevel` on `sqlite`, which has transaction *behaviours* and no isolation level
 * to set, and accepting one there would drop it silently.
 */
export type Dialect = "sqlite" | "pg" | "mysql";

/**
 * What {@link OrmModule.forRoot} needs to build a data source.
 *
 * `db` is the Drizzle handle you already built — this package never opens a connection of its own,
 * so pooling, credentials and migrations stay where you configured them. `dataSourceName` names
 * this source when an application has more than one; omit it and it is `"default"`.
 */
export interface OrmRootOptions<
  TSchema extends Record<string, AnyTable> = Record<string, AnyTable>,
> {
  schema: TSchema;
  dialect: Dialect;
  db: unknown;
  dataSourceName?: string;
}

/**
 * A configured database handle plus the schema and dialect it belongs to.
 *
 * Resolve it from the container with {@link ORM_DATA_SOURCE_TOKEN} when you need the raw Drizzle
 * handle — running a query no repository covers, or binding it for `@Transactional`.
 */
export interface DataSource<TSchema extends Record<string, AnyTable> = Record<string, AnyTable>> {
  readonly name: string;
  readonly dialect: Dialect;
  readonly schema: TSchema;
  // biome-ignore lint/suspicious/noExplicitAny: Drizzle db handle has driver-specific shape (BetterSQLite3Database vs PgDatabase vs MySqlDatabase); narrow types come at use-site via Repository<T> generic
  readonly db: any;
}

/**
 * Container token for the default {@link DataSource}.
 *
 * Inject it with `@Inject(ORM_DATA_SOURCE_TOKEN)`. A named data source is registered under its own
 * token, so this one resolves the source registered without a `dataSourceName`.
 */
export const ORM_DATA_SOURCE_TOKEN = "ORM_DATA_SOURCE";

/**
 * Who is acting, for the duration of one async chain.
 *
 * Repositories copy these into agent-aware columns on insert and update when the table declares
 * them, so a row records which agent and which run produced it without the call sites passing ids
 * down. Established with {@link withAgentContext}; every field is optional because a partial
 * context is more useful than none.
 */
export interface AgentContext {
  agentId?: string;
  runId?: string;
  conversationId?: string;
}
