import "reflect-metadata";
import { describe, expect, it } from "vitest";
import { Cron, readCronMetadata } from "../src/decorators/cron.js";

/**
 * `readCronMetadata` returns a Map keyed by method. The multi-method contract that
 * shape exists for is covered in `cron-hitl-multi-method.test.ts`; this file covers a
 * single decorated method.
 */
describe("@Cron", () => {
  it("stores schedule and method key", () => {
    class A {
      @Cron({ schedule: "*/5 * * * *" })
      async run(): Promise<void> {}
    }
    const meta = readCronMetadata(A).get("run");
    expect(meta?.schedule).toBe("*/5 * * * *");
    expect(meta?.methodKey).toBe("run");
  });
  it("stores timezone", () => {
    class A {
      @Cron({ schedule: "0 9 * * *", timezone: "America/Sao_Paulo" })
      async job(): Promise<void> {}
    }
    expect(readCronMetadata(A).get("job")?.timezone).toBe("America/Sao_Paulo");
  });
  it("returns an empty map without decorator", () => {
    class Plain {}
    expect(readCronMetadata(Plain).size).toBe(0);
  });
  it("isolates between classes", () => {
    class A {
      @Cron({ schedule: "a" }) async r(): Promise<void> {}
    }
    class B {
      @Cron({ schedule: "b" }) async r(): Promise<void> {}
    }
    expect(readCronMetadata(A).get("r")?.schedule).toBe("a");
    expect(readCronMetadata(B).get("r")?.schedule).toBe("b");
  });
  it("works on sync method", () => {
    class A {
      @Cron({ schedule: "* * * * *" }) run(): void {}
    }
    expect(readCronMetadata(A).get("run")?.methodKey).toBe("run");
  });
  it("stores invalid expression as-is", () => {
    class A {
      @Cron({ schedule: "not-a-cron" }) run(): void {}
    }
    expect(readCronMetadata(A).get("run")?.schedule).toBe("not-a-cron");
  });
});
