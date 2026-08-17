/**
 * Regression tests for #4 — `@Transactional` was unusable from the published package.
 *
 * Both binding paths its own docs offered were unavailable: the DI one did not exist,
 * and `bindDataSourceToInstance` was not exported from the barrel, so a consumer could
 * not even take the manual route the error message told them to take.
 *
 * Everything here imports from `../../src/index.js` on purpose. The pre-existing
 * transactional suite reaches into `../../src/transactional.js` directly, which is why
 * it stayed green while the public surface was broken.
 */

import { describe, expect, it } from "vitest";
import type { DataSource } from "../../src/types.js";
import {
  bindDataSourceToInstance,
  Container,
  getTxContext,
  Inject,
  Injectable,
  ORM_DATA_SOURCE_TOKEN,
  OrmConfigurationError,
  OrmModule,
  PostConstruct,
  Transactional,
} from "./transactional-di-imports.js";

function makeDataSource(dialect: DataSource["dialect"] = "pg"): {
  ds: DataSource;
  configs: unknown[];
} {
  const configs: unknown[] = [];
  return {
    configs,
    ds: {
      name: "default",
      dialect,
      schema: {},
      db: {
        transaction: async (cb: (tx: unknown) => Promise<unknown>, config?: unknown) => {
          configs.push(config);
          return cb({ marker: "tx" });
        },
      },
    },
  };
}

describe("bindDataSourceToInstance reachability", () => {
  it("is exported from the public barrel", () => {
    // The error message instructs consumers to call this. Before #4 it was not
    // exported, so following that instruction did not compile.
    expect(typeof bindDataSourceToInstance).toBe("function");
  });
});

describe("@Transactional bound through the container", () => {
  it("runs inside a transaction when the DataSource is injected and bound in @PostConstruct", async () => {
    const { ds } = makeDataSource();

    @Injectable()
    class TransferService {
      constructor(@Inject(ORM_DATA_SOURCE_TOKEN) private readonly dataSource: DataSource) {}

      @PostConstruct
      bindTransactions(): void {
        bindDataSourceToInstance(this, this.dataSource);
      }

      @Transactional()
      async run(): Promise<string> {
        return (getTxContext() as { marker: string }).marker;
      }
    }

    const container = new Container({
      providers: [...OrmModule.forRoot({ schema: {}, dialect: "pg", db: ds.db }), TransferService],
    });

    await expect(container.resolve(TransferService).run()).resolves.toBe("tx");
  });

  it("still fails with an actionable error when nothing bound a DataSource", async () => {
    class Unbound {
      @Transactional()
      async run(): Promise<void> {}
    }

    await expect(new Unbound().run()).rejects.toThrow(OrmConfigurationError);
    // The message must only name paths that exist.
    await expect(new Unbound().run()).rejects.toThrow(/bindDataSourceToInstance/);
  });
});

describe("@Transactional isolationLevel", () => {
  it("passes the requested level down to the driver instead of dropping it", async () => {
    const { ds, configs } = makeDataSource("pg");

    class Service {
      @Transactional({ isolationLevel: "serializable" })
      async run(): Promise<void> {}
    }

    const svc = new Service();
    bindDataSourceToInstance(svc, ds);
    await svc.run();

    expect(configs).toEqual([{ isolationLevel: "serializable" }]);
  });

  it("passes no config at all when no level was requested", async () => {
    const { ds, configs } = makeDataSource("pg");

    class Service {
      @Transactional()
      async run(): Promise<void> {}
    }

    const svc = new Service();
    bindDataSourceToInstance(svc, ds);
    await svc.run();

    expect(configs).toEqual([undefined]);
  });

  it("refuses a level on sqlite rather than accepting one it cannot honour", async () => {
    const { ds } = makeDataSource("sqlite");

    class Service {
      @Transactional({ isolationLevel: "serializable" })
      async run(): Promise<void> {}
    }

    const svc = new Service();
    bindDataSourceToInstance(svc, ds);

    // Silently ignoring an isolation level is the dangerous outcome in a
    // transactional context, so this fails loudly instead.
    await expect(svc.run()).rejects.toThrow(/sqlite/);
  });
});
