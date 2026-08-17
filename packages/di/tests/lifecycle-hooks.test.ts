/**
 * Behaviour tests for `@PostConstruct` and `@PreDestroy`.
 *
 * The sibling `lifecycle.test.ts` asserts only that the decorators write their
 * metadata keys, which stayed green for as long as nothing read them back. These
 * tests build a container, resolve the decorated class and observe the effect, so
 * they fail if the container ever stops honouring the hooks (#5).
 */

import "reflect-metadata";

import { describe, expect, it } from "vitest";

import { Container } from "../src/container.js";
import { Injectable } from "../src/decorators/injectable.js";
import { PostConstruct, PreDestroy } from "../src/decorators/lifecycle.js";
import { Scope } from "../src/types.js";

describe("@PostConstruct", () => {
  it("runs after construction, with constructor dependencies already injected", () => {
    @Injectable()
    class Dependency {
      readonly value = "injected";
    }

    @Injectable()
    class Service {
      seen?: string;
      constructor(private readonly dep: Dependency) {}

      @PostConstruct
      init(): void {
        this.seen = this.dep.value;
      }
    }

    const container = new Container({ providers: [Dependency, Service] });

    expect(container.resolve(Service).seen).toBe("injected");
  });

  it("runs exactly once for a SINGLETON, no matter how often it is resolved", () => {
    let calls = 0;

    @Injectable()
    class Service {
      @PostConstruct
      init(): void {
        calls += 1;
      }
    }

    const container = new Container({ providers: [Service] });
    container.resolve(Service);
    container.resolve(Service);
    container.resolve(Service);

    expect(calls).toBe(1);
  });

  it("runs per instance for a TRANSIENT", () => {
    let calls = 0;

    @Injectable({ scope: Scope.TRANSIENT })
    class Service {
      @PostConstruct
      init(): void {
        calls += 1;
      }
    }

    const container = new Container({ providers: [Service] });
    container.resolve(Service);
    container.resolve(Service);

    expect(calls).toBe(2);
  });

  it("is awaited by resolveAsync when the hook is async", async () => {
    @Injectable()
    class Service {
      ready = false;

      @PostConstruct
      async init(): Promise<void> {
        await Promise.resolve();
        this.ready = true;
      }
    }

    const container = new Container({ providers: [Service] });

    expect((await container.resolveAsync(Service)).ready).toBe(true);
  });

  it("rejects an async hook on the synchronous path instead of returning a half-built instance", () => {
    @Injectable()
    class Service {
      @PostConstruct
      async init(): Promise<void> {
        await Promise.resolve();
      }
    }

    const container = new Container({ providers: [Service] });

    // Silently handing back an object whose init() has not finished is the one
    // outcome worse than failing, so the sync path refuses rather than guesses.
    expect(() => container.resolve(Service)).toThrow(/resolveAsync/);
  });

  it("lets a throwing hook surface rather than yielding a half-built instance", () => {
    @Injectable()
    class Service {
      @PostConstruct
      init(): void {
        throw new Error("init failed");
      }
    }

    const container = new Container({ providers: [Service] });

    expect(() => container.resolve(Service)).toThrow("init failed");
  });
});

describe("@PreDestroy", () => {
  it("runs on container.dispose() for a class with no dispose() of its own", async () => {
    const order: string[] = [];

    @Injectable()
    class DbConnection {
      @PreDestroy
      close(): void {
        order.push("pre-destroy");
      }
    }

    const container = new Container({ providers: [DbConnection] });
    container.resolve(DbConnection);
    await container.dispose();

    expect(order).toEqual(["pre-destroy"]);
  });

  it("runs BEFORE Disposable.dispose() when a class has both", async () => {
    const order: string[] = [];

    @Injectable()
    class Service {
      @PreDestroy
      beforeDispose(): void {
        order.push("pre-destroy");
      }

      dispose(): void {
        order.push("dispose");
      }
    }

    const container = new Container({ providers: [Service] });
    container.resolve(Service);
    await container.dispose();

    expect(order).toEqual(["pre-destroy", "dispose"]);
  });

  it("is awaited when the hook is async", async () => {
    let closed = false;

    @Injectable()
    class DbConnection {
      @PreDestroy
      async close(): Promise<void> {
        await Promise.resolve();
        closed = true;
      }
    }

    const container = new Container({ providers: [DbConnection] });
    container.resolve(DbConnection);
    await container.dispose();

    expect(closed).toBe(true);
  });

  it("runs for REQUEST-scoped instances when the request ends", async () => {
    const order: string[] = [];

    @Injectable({ scope: Scope.REQUEST })
    class RequestService {
      @PreDestroy
      close(): void {
        order.push("closed");
      }
    }

    const container = new Container({ providers: [RequestService] });
    await container.runInRequest(async () => {
      container.resolve(RequestService);
    });

    expect(order).toEqual(["closed"]);
  });

  it("aggregates a failing hook without skipping the remaining instances", async () => {
    const closed: string[] = [];

    @Injectable()
    class Bad {
      @PreDestroy
      close(): void {
        throw new Error("close failed");
      }
    }

    @Injectable()
    class Good {
      @PreDestroy
      close(): void {
        closed.push("good");
      }
    }

    const container = new Container({ providers: [Bad, Good] });
    container.resolve(Bad);
    container.resolve(Good);

    await expect(container.dispose()).rejects.toThrow(AggregateError);
    expect(closed).toEqual(["good"]);
  });
});
