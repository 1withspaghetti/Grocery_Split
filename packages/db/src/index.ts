// "schema" includes all schema objects, such as tables.
export * as schema from "./schema/index.ts";

// "relations" includes the defineRelations export from the main relation definition
export { relations } from "./relations.ts";

export { seed } from "./seed/index.ts";
