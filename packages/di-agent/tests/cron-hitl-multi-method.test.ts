/**
 * Regression tests for #6 — `@Cron` and `@Hitl` used to keep a single object per
 * class, so decorating a second method silently discarded the first. Both are
 * method decorators, like `@Step`, and now accumulate per method the same way.
 */

import "reflect-metadata";

import { describe, expect, it } from "vitest";

import { Cron, readCronMetadata } from "../src/decorators/cron.js";
import { Hitl, readHitlMetadata } from "../src/decorators/hitl.js";

describe("@Cron across several methods of one class", () => {
  it("keeps every decorated method instead of letting the last one win", () => {
    class Jobs {
      @Cron({ schedule: "0 * * * *" })
      hourly(): void {}

      @Cron({ schedule: "0 0 * * *" })
      daily(): void {}
    }

    const meta = readCronMetadata(Jobs);

    expect([...meta.keys()]).toEqual(["hourly", "daily"]);
    expect(meta.get("hourly")?.schedule).toBe("0 * * * *");
    expect(meta.get("daily")?.schedule).toBe("0 0 * * *");
  });

  it("still records the method key on each entry", () => {
    class Jobs {
      @Cron({ schedule: "* * * * *", timezone: "UTC" })
      tick(): void {}
    }

    expect(readCronMetadata(Jobs).get("tick")).toEqual({
      schedule: "* * * * *",
      timezone: "UTC",
      methodKey: "tick",
    });
  });

  it("returns an empty map for an undecorated class", () => {
    class Plain {}

    expect(readCronMetadata(Plain).size).toBe(0);
  });

  it("keeps each class's entries separate", () => {
    class A {
      @Cron({ schedule: "1 * * * *" })
      a(): void {}
    }
    class B {
      @Cron({ schedule: "2 * * * *" })
      b(): void {}
    }

    expect([...readCronMetadata(A).keys()]).toEqual(["a"]);
    expect([...readCronMetadata(B).keys()]).toEqual(["b"]);
  });
});

describe("@Hitl across several methods of one class", () => {
  it("keeps every decorated method instead of letting the last one win", () => {
    class Approvals {
      @Hitl({ tools: ["refund"] })
      approveRefund(): void {}

      @Hitl({ tools: ["transfer"], timeoutMs: 5_000 })
      approveTransfer(): void {}
    }

    const meta = readHitlMetadata(Approvals);

    expect([...meta.keys()]).toEqual(["approveRefund", "approveTransfer"]);
    expect(meta.get("approveRefund")?.tools).toEqual(["refund"]);
    expect(meta.get("approveTransfer")?.timeoutMs).toBe(5_000);
  });

  it("returns an empty map for an undecorated class", () => {
    class Plain {}

    expect(readHitlMetadata(Plain).size).toBe(0);
  });
});
