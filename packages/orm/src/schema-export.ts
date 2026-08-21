import type { Column, Table } from "drizzle-orm";
import { getTableColumns } from "drizzle-orm";
import { OrmSchemaExportError } from "./errors.js";

/**
 * A JSON Schema draft-07 object describing one table.
 *
 * This is the contract a non-TypeScript consumer reads. `additionalProperties` is fixed to `false`
 * so a generator in another language produces a closed model rather than one that silently accepts
 * columns this table does not have.
 */
export type JsonSchema7 = {
  $schema?: string;
  title?: string;
  type: "object";
  properties: Record<string, JsonSchema7Property>;
  required: string[];
  additionalProperties: false;
};

/**
 * One column, as JSON Schema draft-07 sees it.
 *
 * `x-check` is the one field outside the standard: it carries the SQL check constraint verbatim,
 * because draft-07 has no vocabulary for it and dropping it would let a generated model accept
 * values the database will reject.
 */
export type JsonSchema7Property = {
  type?: "string" | "integer" | "number" | "boolean" | "object" | "array" | "null";
  format?: string;
  maxLength?: number;
  multipleOf?: number;
  default?: unknown;
  enum?: ReadonlyArray<string | number>;
  contentEncoding?: string;
  "x-check"?: string;
  description?: string;
};

interface ColumnInternal {
  dataType?: string;
  columnType?: string;
  notNull?: boolean;
  hasDefault?: boolean;
  default?: unknown;
  defaultFn?: () => unknown;
  enumValues?: ReadonlyArray<string>;
  length?: number;
  precision?: number;
  scale?: number;
  primary?: boolean;
  isPrimaryKey?: boolean;
  primaryKey?: boolean;
}

function tableNameOf(table: unknown): string {
  if (table === null || typeof table !== "object") return "<unknown>";
  const sym = (table as Record<symbol, unknown>)[Symbol.for("drizzle:Name")];
  if (typeof sym === "string") return sym;
  const inner = (table as { _?: { name?: string } })._;
  return inner?.name ?? "<unknown>";
}

function lower(s: string | undefined): string {
  return (s ?? "").toLowerCase();
}

function isInteger(dataType: string, columnType: string): boolean {
  if (dataType === "number" && /int/.test(columnType)) return true;
  if (dataType === "integer") return true;
  return false;
}

type ColumnMatcher = (meta: ColumnInternal, dt: string, ct: string) => JsonSchema7Property | null;

const matchEnum: ColumnMatcher = (meta) =>
  Array.isArray(meta.enumValues) && meta.enumValues.length > 0
    ? { type: "string", enum: [...meta.enumValues] }
    : null;

const matchUuid: ColumnMatcher = (_m, _dt, ct) =>
  /uuid/.test(ct) ? { type: "string", format: "uuid" } : null;

const matchNumeric: ColumnMatcher = (meta, _dt, ct) => {
  if (!/numeric|decimal/.test(ct)) return null;
  const out: JsonSchema7Property = { type: "string", format: "decimal" };
  if (typeof meta.scale === "number" && meta.scale >= 0) {
    out.multipleOf = 10 ** -meta.scale;
  }
  return out;
};

const matchBigint: ColumnMatcher = (_m, _dt, ct) =>
  /bigint/.test(ct) ? { type: "string", format: "int64" } : null;

const matchDate: ColumnMatcher = (_m, dt, ct) =>
  dt === "date" || /timestamp|date/.test(ct) ? { type: "string", format: "date-time" } : null;

const matchBlob: ColumnMatcher = (_m, _dt, ct) =>
  /blob|bytea|binary/.test(ct) ? { type: "string", contentEncoding: "base64" } : null;

const matchBoolean: ColumnMatcher = (_m, dt, ct) =>
  dt === "boolean" || /boolean|bool/.test(ct) ? { type: "boolean" } : null;

const matchJson: ColumnMatcher = (_m, dt, ct) =>
  dt === "json" || /json/.test(ct) ? { type: "object" } : null;

const matchInteger: ColumnMatcher = (_m, dt, ct) =>
  isInteger(dt, ct) ? { type: "integer" } : null;

const matchFloat: ColumnMatcher = (_m, dt, ct) =>
  dt === "number" || /real|double|float/.test(ct) ? { type: "number" } : null;

const matchString: ColumnMatcher = (meta, dt, ct) => {
  if (!(dt === "string" || /text|varchar|char/.test(ct))) return null;
  const out: JsonSchema7Property = { type: "string" };
  if (typeof meta.length === "number" && meta.length > 0) out.maxLength = meta.length;
  return out;
};

const COLUMN_MATCHERS: readonly ColumnMatcher[] = [
  matchEnum,
  matchUuid,
  matchNumeric,
  matchBigint,
  matchDate,
  matchBlob,
  matchBoolean,
  matchJson,
  matchInteger,
  matchFloat,
  matchString,
];

function mapColumnToJsonSchema(
  colName: string,
  col: Column,
  tableName: string,
): JsonSchema7Property {
  const meta = col as unknown as ColumnInternal;
  const dt = lower(meta.dataType);
  const ct = lower(meta.columnType);

  for (const matcher of COLUMN_MATCHERS) {
    const result = matcher(meta, dt, ct);
    if (result !== null) return result;
  }

  throw new OrmSchemaExportError(
    `Cannot export column "${colName}" of table "${tableName}": unknown type (dataType="${meta.dataType}", columnType="${meta.columnType}"). Add to mapColumnToJsonSchema or use the "_excludeFromExport: true" annotation.`,
  );
}

/**
 * Emit the JSON Schema draft-07 description of one Drizzle table.
 *
 * A column is `required` when it is `NOT NULL` and has no default — the two together are what
 * decide whether a caller must supply a value, and treating `NOT NULL` alone as required would
 * demand values the database would have filled in.
 *
 * @throws {OrmSchemaExportError} when a column's type has no mapping. Emitting a partial schema
 *   would be worse than failing: a consumer in another language would generate a model missing a
 *   field and discover it at the first insert.
 */
export function exportSchema(table: Table): JsonSchema7 {
  const tableName = tableNameOf(table);
  const columns = getTableColumns(table) as Record<string, Column>;

  const properties: Record<string, JsonSchema7Property> = {};
  const required: string[] = [];

  for (const [colName, col] of Object.entries(columns)) {
    const meta = col as unknown as ColumnInternal;
    const prop = mapColumnToJsonSchema(colName, col, tableName);

    if (meta.hasDefault === true) {
      if (meta.default !== undefined) {
        prop.default = meta.default;
      }
    }

    if (meta.notNull === true && meta.hasDefault !== true) {
      required.push(colName);
    }

    properties[colName] = prop;
  }

  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: tableName,
    type: "object",
    properties,
    required,
    additionalProperties: false,
  };
}

/**
 * Emit one schema per table, keyed by the table's name in the database rather than by the key it
 * has in the Drizzle schema object — the two differ whenever a table is declared as
 * `users: sqliteTable("app_users", ...)`, and a consumer generating models needs the name the
 * database answers to.
 *
 * @throws {OrmSchemaExportError} from the first table that has an unmappable column.
 */
export function exportSchemas(schema: Record<string, Table>): Record<string, JsonSchema7> {
  const out: Record<string, JsonSchema7> = {};
  for (const [, table] of Object.entries(schema)) {
    const name = tableNameOf(table);
    out[name] = exportSchema(table);
  }
  return out;
}
