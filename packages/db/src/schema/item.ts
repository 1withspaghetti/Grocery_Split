import { index, integer, primaryKey, real, snakeCase, text } from "drizzle-orm/sqlite-core";
import { user } from "./user.ts";
import { group } from "./group.ts";
import { trip } from "./trip.ts";
import { sql } from "drizzle-orm";

export const item = snakeCase.table(
	"item",
	{
		id: text().primaryKey().notNull(),
		groupId: text()
			.notNull()
			.references(() => group.id, { onDelete: "cascade" }),
		tripId: text() // CAN BE NULL if the item is not yet assigned to a trip
			.references(() => trip.id, { onDelete: "cascade" }),
		name: text().notNull(),
		quantity: text(),
		notes: text(),
		price: real(), // CAN BE NULL if the price is not known yet
		createdAt: integer()
			.notNull()
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
		createdById: text()
			.notNull()
			.references(() => user.id, { onDelete: "set null" })
	},
	(t) => [
		index("item_groupId_idx").on(t.groupId),
		index("item_groupId_tripId_idx").on(t.groupId, t.tripId)
	]
);

export const wantedItem = snakeCase.table(
	"wantedItem",
	{
		itemId: text()
			.notNull()
			.references(() => item.id, { onDelete: "cascade" }),
		userId: text()
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		parts: integer().notNull()
	},
	(t) => [
		primaryKey({ columns: [t.itemId, t.userId] }),
		index("wantedItem_itemId_idx").on(t.itemId),
		index("wantedItem_userId_idx").on(t.userId)
	]
);
