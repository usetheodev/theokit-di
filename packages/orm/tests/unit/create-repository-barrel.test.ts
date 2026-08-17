/**
 * Guard the PUBLIC barrel export of `createRepository`.
 *
 * The CRUD test imports from `src/repository.js` (DI-isolation). This separate,
 * DI-tolerant test asserts `createRepository` is reachable from the package's
 * public entry (`@theokit/orm`) so a future barrel refactor can't silently drop
 * it. Loads `src/index.js` (which transitively pulls `@theokit/di`).
 */
import { describe, expect, it } from "vitest";
import { createRepository } from "../../src/index.js";

describe("createRepository public barrel", () => {
  it("is exported from the @theokit/orm entry", () => {
    expect(typeof createRepository).toBe("function");
  });
});
