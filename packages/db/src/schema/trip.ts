import { index, integer, snakeCase, text } from "drizzle-orm/sqlite-core";
import { user } from "./user.ts";
import { sql } from "drizzle-orm";
import { group } from "./group.ts";

export const trip = snakeCase.table(
	"trip",
	{
		id: text().primaryKey().notNull(),
		name: text().notNull(),
		groupId: text()
			.notNull()
			.references(() => group.id, { onDelete: "cascade" }),
		createdAt: integer()
			.notNull()
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
		createdById: text()
			.notNull()
			.references(() => user.id, { onDelete: "set null" })
	},
	(t) => [index("trip_groupId_idx").on(t.groupId)]
);
