import "reflect-metadata";
import { describe, expect, it } from "vitest";

import { Hitl, readHitlMetadata } from "../src/decorators/hitl.js";

/**
 * `readHitlMetadata` returns a Map keyed by method. The multi-method contract that
 * shape exists for is covered in `cron-hitl-multi-method.test.ts`; this file covers a
 * single decorated method.
 */
describe("@Hitl", () => {
  it("stores tools list and method key", () => {
    class MyAgent {
      @Hitl({ tools: ["execute"] })
      async approve(_name: string, _input: unknown): Promise<boolean> {
        return true;
      }
    }
    const meta = readHitlMetadata(MyAgent).get("approve");
    expect(meta?.tools).toEqual(["execute"]);
    expect(meta?.methodKey).toBe("approve");
  });

  it("stores custom timeoutMs", () => {
    class A {
      @Hitl({ tools: ["deploy"], timeoutMs: 60_000 })
      async check(): Promise<boolean> {
        return false;
      }
    }
    expect(readHitlMetadata(A).get("check")?.timeoutMs).toBe(60_000);
  });

  it("defaults timeoutMs to undefined", () => {
    class A {
      @Hitl({ tools: ["exec"] })
      async approve(): Promise<boolean> {
        return true;
      }
    }
    expect(readHitlMetadata(A).get("approve")?.timeoutMs).toBeUndefined();
  });

  it("supports multiple tools", () => {
    class A {
      @Hitl({ tools: ["execute", "writeFile", "deploy"] })
      async approve(): Promise<boolean> {
        return true;
      }
    }
    expect(readHitlMetadata(A).get("approve")?.tools).toHaveLength(3);
  });

  it("returns an empty map for undecorated class", () => {
    class Plain {}
    expect(readHitlMetadata(Plain).size).toBe(0);
  });

  it("isolates metadata between classes", () => {
    class A {
      @Hitl({ tools: ["a"] })
      async approve(): Promise<boolean> {
        return true;
      }
    }
    class B {
      @Hitl({ tools: ["b"] })
      async approve(): Promise<boolean> {
        return true;
      }
    }
    expect(readHitlMetadata(A).get("approve")?.tools).toEqual(["a"]);
    expect(readHitlMetadata(B).get("approve")?.tools).toEqual(["b"]);
  });

  it("works on sync method", () => {
    class A {
      @Hitl({ tools: ["exec"] })
      approveSync(_name: string): boolean {
        return true;
      }
    }
    const meta = readHitlMetadata(A).get("approveSync");
    expect(meta?.methodKey).toBe("approveSync");
    expect(meta?.tools).toEqual(["exec"]);
  });

  it("preserves a symbol method key", () => {
    const sym = Symbol("approve");
    class A {
      @Hitl({ tools: ["exec"] })
      [sym](): boolean {
        return true;
      }
    }
    expect(readHitlMetadata(A).get(sym)?.methodKey).toBe(sym);
  });
});
