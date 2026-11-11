import { type DrizzleD1Database } from "drizzle-orm/d1";
import { migrate as _migrate } from "drizzle-orm/d1/migrator";
import { relations, schema } from "../index.ts";
import { inArray } from "drizzle-orm";
import { items, groups, users, memberships, trips, wantedItems } from "./data.ts";
import { resolve } from "path";

export async function migrate(db: DrizzleD1Database<typeof relations>) {
	// Migrate database
	console.log("Migrating database...");
	await _migrate(db, { migrationsFolder: resolve(import.meta.dirname, "../../migrations") });
}

export async function seed(db: DrizzleD1Database<typeof relations>) {
	// Fetching existing users
	const realUsers = await db.query.user.findMany({
		columns: { id: true },
		where: {
			accounts: true
		}
	});
	console.log("Fetched real users...", realUsers);

	// Delete everything from all schema-defined tables
	console.log("Resting database...");
	await db.delete(schema.wantedItem).where(
		inArray(
			schema.wantedItem.itemId,
			items.map((r) => r.id)
		)
	);
	await db.delete(schema.item).where(
		inArray(
			schema.item.groupId,
			groups.map((r) => r.id)
		)
	);
	await db.delete(schema.trip).where(
		inArray(
			schema.trip.groupId,
			groups.map((r) => r.id)
		)
	);
	await db.delete(schema.membership).where(
		inArray(
			schema.membership.groupId,
			groups.map((r) => r.id)
		)
	);
	await db.delete(schema.group).where(
		inArray(
			schema.group.id,
			groups.map((r) => r.id)
		)
	);
	await db.delete(schema.user).where(
		inArray(
			schema.user.id,
			users.map((r) => r.id)
		)
	);

	// Seed data
	console.log("Adding dummy data...");
	await db.insert(schema.user).values(users);
	await db.insert(schema.group).values(groups);
	await db.insert(schema.membership).values(memberships);
	await db.insert(schema.trip).values(trips);
	await db.insert(schema.item).values(items);
	await db.insert(schema.wantedItem).values(wantedItems);

	console.log("Adding real users to dummy groups...");
	for (const userId of realUsers.map((row) => row.id))
		await db.insert(schema.membership).values(
			["group00000000001", "group00000000002"].map((groupId) => ({
				groupId,
				userId,
				createdAt: Date.now()
			}))
		);

	console.log("Done");
}
