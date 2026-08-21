import { OrmConfigurationError } from "./errors.js";

const DEFAULT_DS = "default";

const DRIZZLE_NAME_SYMBOL = Symbol.for("drizzle:Name");

function resolveEntityName(entity: unknown): string {
  if (entity === null || entity === undefined) {
    throw new OrmConfigurationError(
      "[orm] getRepositoryToken: entity is null/undefined. Pass a Drizzle table object.",
    );
  }
  const ent = entity as Record<string | symbol, unknown>;
  const symbolName = ent[DRIZZLE_NAME_SYMBOL];
  if (typeof symbolName === "string" && symbolName.length > 0) return symbolName;
  const inner = ent._ as { name?: unknown } | undefined;
  if (inner && typeof inner.name === "string" && inner.name.length > 0) {
    return inner.name;
  }
  throw new OrmConfigurationError(
    "[orm] getRepositoryToken: cannot resolve entity name. Pass a Drizzle table (must have either Symbol.for('drizzle:Name') or _.name).",
  );
}

/**
 * The container token under which one table's {@link Repository} is registered.
 *
 * `REPO:<table>` for the default data source and `REPO:<source>:<table>` for a named one, mirroring
 * the NestJS TypeORM convention. The name comes from the table as the DATABASE knows it, not from
 * the key it has in your schema object — the two differ whenever a table is declared as
 * `users: sqliteTable("app_users", ...)`.
 *
 * @throws {OrmConfigurationError} when `entity` is null, undefined, or carries no resolvable
 *   Drizzle name. Deriving a token from an unnameable entity would register the repository under a
 *   token nothing could ask for.
 */
export function getRepositoryToken(entity: unknown, dataSourceName: string = DEFAULT_DS): string {
  const entityName = resolveEntityName(entity);
  return dataSourceName === DEFAULT_DS
    ? `REPO:${entityName}`
    : `REPO:${dataSourceName}:${entityName}`;
}
