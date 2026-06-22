/**
 * M7-7 — non-DI `createRepository(db, table)` factory.
 *
 * Proves the factory yields a working Repository with NO DI container,
 * decorators, or reflect-metadata — only a raw drizzle `db` + `table`
 * (better-sqlite3, whose query builders are awaitable).
 */
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
// Import from repository.js (NOT the index barrel) so this non-DI test does not
// transitively load module.ts → @theokit/di (which must be built separately).
// createRepository's whole point is that no DI is required.
import { createRepository, Repository } from "../../src/repository.js";

const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age"),
});

let sqlite: Database.Database;

beforeEach(() => {
  sqlite = new Database(":memory:");
  sqlite.exec("CREATE TABLE users (id TEXT PRIMARY KEY, name TEXT NOT NULL, age INTEGER);");
});

afterEach(() => {
  sqlite.close();
});

describe("createRepository (M7-7)", () => {
  it("returns a Repository instance without any DI", () => {
    const db = drizzle(sqlite, { schema: { users } });
    const repo = createRepository(db, users);
    expect(repo).toBeInstanceOf(Repository);
  });

  it("supports full CRUD via the factory (no container, no decorators)", async () => {
    const db = drizzle(sqlite, { schema: { users } });
    const repo = createRepository(db, users);

    const created = await repo.insert({ id: "u1", name: "Ada", age: 36 });
    expect(created.name).toBe("Ada");

    const found = await repo.findById("u1");
    expect(found?.name).toBe("Ada");

    await repo.update("u1", { age: 37 });
    expect((await repo.findById("u1"))?.age).toBe(37);

    await repo.delete("u1");
    expect(await repo.findById("u1")).toBeNull();
  });
});
