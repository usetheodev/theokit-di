import { describe, expect, it } from "vitest";

import {
  Container,
  ContainerDisposedError,
  type Disposable,
  Injectable,
  Scope,
} from "../src/index.js";

// ─────────────────────────────────────────────────────────────────────
// Disposal lifecycle
// ─────────────────────────────────────────────────────────────────────

describe("Container.dispose()", () => {
  it("calls instance.dispose() in REVERSE construction order", async () => {
    const disposalOrder: string[] = [];

    @Injectable()
    class A implements Disposable {
      dispose(): void {
        disposalOrder.push("A");
      }
    }
    @Injectable()
    class B implements Disposable {
      constructor(readonly a: A) {}
      dispose(): void {
        disposalOrder.push("B");
      }
    }

    const c = new Container({ providers: [A, B] });
    c.resolve(A); // construct A first
    c.resolve(B); // then B (which transitively constructs A, but cached)

    await c.dispose();
    // Reverse order: last-constructed disposed first.
    expect(disposalOrder).toEqual(["B", "A"]);
  });

  it("calls Symbol.asyncDispose if available (preferred over .dispose)", async () => {
    let asyncDisposeCalled = false;
    let syncDisposeCalled = false;

    @Injectable()
    class MixedDispose {
      [Symbol.asyncDispose]() {
        asyncDisposeCalled = true;
        return Promise.resolve();
      }
      dispose() {
        syncDisposeCalled = true;
      }
    }

    const c = new Container({ providers: [MixedDispose] });
    c.resolve(MixedDispose);
    await c.dispose();

    expect(asyncDisposeCalled).toBe(true);
    expect(syncDisposeCalled).toBe(false);
  });

  it("continues on individual failure and aggregates errors", async () => {
    @Injectable()
    class GoodA implements Disposable {
      dispose(): void {}
    }
    @Injectable()
    class BadB implements Disposable {
      dispose(): void {
        throw new Error("bad-B");
      }
    }
    @Injectable()
    class BadC implements Disposable {
      dispose(): void {
        throw new Error("bad-C");
      }
    }

    const c = new Container({ providers: [GoodA, BadB, BadC] });
    c.resolve(GoodA);
    c.resolve(BadB);
    c.resolve(BadC);

    try {
      await c.dispose();
      expect.fail("dispose should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AggregateError);
      expect((err as AggregateError).errors).toHaveLength(2);
    }
  });

  it("clears singleton cache so subsequent resolve throws ContainerDisposedError", async () => {
    @Injectable()
    class Foo {}
    const c = new Container({ providers: [Foo] });
    c.resolve(Foo);
    await c.dispose();
    expect(() => c.resolve(Foo)).toThrowError(ContainerDisposedError);
  });

  it("is idempotent — second dispose is a no-op", async () => {
    let count = 0;

    @Injectable()
    class Foo implements Disposable {
      dispose(): void {
        count += 1;
      }
    }
    const c = new Container({ providers: [Foo] });
    c.resolve(Foo);
    await c.dispose();
    await c.dispose();
    expect(count).toBe(1);
  });

  it("Symbol.asyncDispose enables `await using` syntax", async () => {
    let disposed = false;

    @Injectable()
    class Tracker implements Disposable {
      dispose(): void {
        disposed = true;
      }
    }

    {
      await using c = new Container({ providers: [Tracker] });
      c.resolve(Tracker);
    } // scope exits → dispose() called

    expect(disposed).toBe(true);
  });
});

describe("runInRequest — disposal even on callback throw", () => {
  it("disposes REQUEST-scoped instances when callback succeeds", async () => {
    let disposed = false;

    @Injectable()
    class Tracker implements Disposable {
      dispose(): void {
        disposed = true;
      }
    }
    const c = new Container();
    c.register({ provide: Tracker, useClass: Tracker, scope: Scope.REQUEST });

    await c.runInRequest(async () => {
      c.resolve(Tracker);
    });

    expect(disposed).toBe(true);
  });

  it("disposes REQUEST-scoped instances EVEN IF the callback throws", async () => {
    let disposed = false;

    @Injectable()
    class Tracker implements Disposable {
      dispose(): void {
        disposed = true;
      }
    }
    const c = new Container();
    c.register({ provide: Tracker, useClass: Tracker, scope: Scope.REQUEST });

    await expect(
      c.runInRequest(async () => {
        c.resolve(Tracker);
        throw new Error("handler-boom");
      }),
    ).rejects.toThrow("handler-boom");

    // Must still dispose despite the throw.
    expect(disposed).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Who owns the instance decides who disposes it
// ─────────────────────────────────────────────────────────────────────

describe("Container.dispose() — resource ownership", () => {
  it("does NOT dispose a value the container was handed rather than built", async () => {
    let disposed = 0;
    // The caller built this and still holds the reference, so the caller can — and by every
    // convention should — close it. A container that closes it too turns an ordinary teardown
    // into a double close, which is the one failure mode neither side can see coming.
    const pool = {
      dispose(): void {
        disposed += 1;
      },
    };

    const container = new Container();
    container.register({ provide: "POOL", useValue: pool });
    container.resolve("POOL");
    await container.dispose();

    expect(disposed).toBe(0);
  });

  it("disposes what it built from a factory, because nobody else has the reference", async () => {
    let disposed = 0;
    const container = new Container();
    container.register({
      provide: "BUILT",
      useFactory: () => ({
        dispose(): void {
          disposed += 1;
        },
      }),
    });
    container.resolve("BUILT");
    await container.dispose();

    expect(disposed).toBe(1);
  });

  it("disposes an aliased instance ONCE, however many tokens reach it", async () => {
    let disposed = 0;
    const container = new Container();
    container.register({
      provide: "REAL",
      useFactory: () => ({
        dispose(): void {
          disposed += 1;
        },
      }),
    });
    container.register({ provide: "ALIAS", useExisting: "REAL" });

    // `useExisting` is an alias, so both tokens resolve to the SAME object. Disposing it once
    // per token that named it would close one resource twice.
    expect(container.resolve("ALIAS")).toBe(container.resolve("REAL"));
    await container.dispose();

    expect(disposed).toBe(1);
  });

  it("does not dispose a handed-in value reached through an alias either", async () => {
    let disposed = 0;
    const handle = {
      dispose(): void {
        disposed += 1;
      },
    };
    const container = new Container();
    container.register({ provide: "HANDLE", useValue: handle });
    container.register({ provide: "ALIAS", useExisting: "HANDLE" });
    container.resolve("ALIAS");
    await container.dispose();

    expect(disposed).toBe(0);
  });

  it("leaves a REQUEST-scoped handed-in value alone when the request ends", async () => {
    let disposed = 0;
    const handle = {
      dispose(): void {
        disposed += 1;
      },
    };
    const container = new Container();
    container.register({ provide: "H", useValue: handle, scope: Scope.REQUEST });
    await container.runInRequest(async () => {
      container.resolve("H");
    });

    expect(disposed).toBe(0);
  });
});
