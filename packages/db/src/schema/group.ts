import { index, integer, primaryKey, snakeCase, text } from "drizzle-orm/sqlite-core";
import { user } from "./user.ts";
import { sql } from "drizzle-orm";

export const group = snakeCase.table("group", {
	id: text().primaryKey().notNull(),
	ownerId: text()
		.notNull()
		.references(() => user.id, { onDelete: "restrict" }),
	name: text().notNull()
});

export const membership = snakeCase.table(
	"membership",
	{
		userId: text()
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		groupId: text()
			.notNull()
			.references(() => group.id, { onDelete: "cascade" }),
		createdAt: integer()
			.notNull()
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
	},
	(t) => [
		primaryKey({ columns: [t.userId, t.groupId] }),
		index("membership_userId_idx").on(t.userId),
		index("membership_groupId_idx").on(t.groupId)
	]
);

export const invite = snakeCase.table(
	"invite",
	{
		code: text().notNull().primaryKey(),
		groupId: text()
			.notNull()
			.references(() => group.id, { onDelete: "cascade" }),
		expires: integer().notNull(),
		createdAt: integer()
			.notNull()
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
		createdById: text()
			.notNull()
			.references(() => user.id, { onDelete: "cascade" })
	},
	(t) => [index("invite_groupId_idx").on(t.groupId)]
);
