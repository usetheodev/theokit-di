import { Inject } from "@theokit/di";
import { getRepositoryToken } from "./tokens.js";

/**
 * Inject the {@link Repository} for one table.
 *
 * Shorthand for `@Inject(getRepositoryToken(entity, dataSourceName))` — the repository must have
 * been registered by {@link OrmModule.forFeature} for the same data source, or resolution fails
 * with `TokenNotFoundError` naming the token.
 *
 * @param entity a Drizzle table object
 * @param dataSourceName the data source this table belongs to; omit for the default one
 * @throws {OrmConfigurationError} at decoration time when `entity` is not a Drizzle table — the
 *   token is derived from the table's name, so an unnameable entity cannot produce one.
 */
export function InjectRepository(entity: unknown, dataSourceName?: string): ParameterDecorator {
  return Inject(getRepositoryToken(entity, dataSourceName));
}
