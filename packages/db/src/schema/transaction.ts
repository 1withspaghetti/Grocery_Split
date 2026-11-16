import { index, integer, real, snakeCase, text } from "drizzle-orm/sqlite-core";
import { user } from "./user.ts";
import { sql } from "drizzle-orm";
import { group } from "./group.ts";

export const transaction = snakeCase.table(
	"transaction",
	{
		id: text().primaryKey().notNull(),
		groupId: text()
			.notNull()
			.references(() => group.id, { onDelete: "cascade" }),
		amount: real().notNull(),
		fromId: text()
			.notNull()
			.references(() => user.id, { onDelete: "no action" }),
		toId: text()
			.notNull()
			.references(() => user.id, { onDelete: "no action" }),
		createdAt: integer()
			.notNull()
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
		createdById: text()
			.notNull()
			.references(() => user.id, { onDelete: "no action" })
	},
	(t) => [
		index("transaction_groupId_createdAt_idx").on(t.groupId, t.createdAt),
		index("transaction_groupId_fromId_idx").on(t.groupId, t.fromId),
		index("transaction_groupId_toId_idx").on(t.groupId, t.toId)
	]
);
