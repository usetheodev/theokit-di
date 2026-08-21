---
"@theokit/di-agent": minor
---

**Breaking: `readCronMetadata` and `readHitlMetadata` return a `ReadonlyMap` keyed by
method name.** `@Cron` and `@Hitl` applied to two methods of the same class silently
overwrote each other — the second decorator replaced the first, and nothing failed.
Reading either now gives you every decorated method instead of the last one.

Every published export carries documentation an editor can show (56/56 on the emitted
declarations), and `DecoratedClass` — the constructor type the reader helpers accept —
is exported so consumers can name it.

Peer range widened to accept `@theokit/di@^0.2.0`.
