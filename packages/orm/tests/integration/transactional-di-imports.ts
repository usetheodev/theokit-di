/**
 * Re-export barrel for `transactional-di.test.ts`.
 *
 * The point of that suite is that everything it uses is reachable from the packages'
 * PUBLIC entry points — `@theokit/di` and `../../src/index.js` — rather than from a deep
 * path into `src/`. Collecting the imports here keeps that guarantee in one place: if a
 * symbol ever falls out of a barrel again, this module stops compiling.
 */

export { Container, Inject, Injectable, PostConstruct } from "@theokit/di";
export {
  bindDataSourceToInstance,
  ORM_DATA_SOURCE_TOKEN,
  OrmConfigurationError,
  OrmModule,
  Transactional,
} from "../../src/index.js";
export { getTxContext } from "../../src/internal/tx-context.js";
