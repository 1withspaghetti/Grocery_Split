import { Hono } from "hono";
import type { AppEnv } from "../index.ts";
import { db } from "../lib/db.ts";
import { schema } from "@grocery-split/db";
import {
	validator,
	type Item,
	type PopulatedItem,
	type WantedItem
} from "@grocery-split/validation";
import { eq, and } from "drizzle-orm";
import { zValidator } from "../middleware/zValidator.ts";
import { validateGroupAndItemParam, validateGroupParam } from "../middleware/validateParams.ts";
import { firstOrNotFound } from "../lib/firstOrNotFound.ts";
import { nanoid } from "../lib/nanoid.ts";
import { HTTPException } from "hono/http-exception";

async function validateTripId(groupId: string, tripId: string | null | undefined) {
	if (tripId === null || tripId === undefined) return;

	const [trip] = await db
		.select({ id: schema.trip.id })
		.from(schema.trip)
		.where(and(eq(schema.trip.id, tripId), eq(schema.trip.groupId, groupId)));

	if (!trip) throw new HTTPException(404, { message: "Trip Not Found" });
}

async function validateShareMembers(groupId: string, userIds: string[]) {
	const members = await db
		.select({ userId: schema.membership.userId })
		.from(schema.membership)
		.where(eq(schema.membership.groupId, groupId));
	const memberIds = new Set(members.map((member) => member.userId));

	if (userIds.some((userId) => !memberIds.has(userId))) {
		throw new HTTPException(400, { message: "All share users must be group members" });
	}
}

// Is a route defined in ./groups.ts so auth is already enforced
const items = new Hono<AppEnv<true>>()
	// Getting all items in the main list (if ?trip=null), or only a specific trip (?trip=id_here)
	.get("/", validateGroupParam, zValidator("query", validator.tripQuery), async (c) => {
		const { tripId } = c.req.valid("query");

		await validateTripId(c.var.groupId, tripId);

		const res = await db.query.item.findMany({
			with: {
				wantedBy: {
					with: {
						user: true
					}
				}
			},
			where: {
				groupId: c.var.groupId,
				tripId: tripId !== undefined ? tripId : { isNull: true }
			}
		});

		return c.json(res as PopulatedItem[]);
	})

	.get("/:itemId", validateGroupAndItemParam, async (c) => {
		const res = await db.query.item.findMany({
			with: {
				wantedBy: {
					with: {
						user: true
					}
				}
			},
			where: {
				id: c.var.itemId
			}
		});

		return c.json(firstOrNotFound(res, "Item Not Found") as PopulatedItem);
	})

	// Get the members sharing an item and their relative number of parts.
	.get("/:itemId/shares", validateGroupAndItemParam, async (c) => {
		const res = await db
			.select({
				itemId: schema.wantedItem.itemId,
				userId: schema.wantedItem.userId,
				parts: schema.wantedItem.parts
			})
			.from(schema.wantedItem)
			.where(eq(schema.wantedItem.itemId, c.var.itemId));

		return c.json(res as WantedItem[]);
	})

	// Create an item in the group's main shopping list or a specified trip
	.post("/", validateGroupParam, zValidator("json", validator.item), async (c) => {
		const { user } = c.var.session;
		const { tripId, ...data } = c.req.valid("json");

		await validateTripId(c.var.groupId, tripId);

		const res = await db
			.insert(schema.item)
			.values({
				...data,
				id: nanoid(),
				groupId: c.var.groupId,
				tripId: tripId ?? null,
				createdById: user.id
			})
			.returning();

		return c.json(firstOrNotFound(res, "Item Not Found") as Item, 201);
	})

	// Update an item's fields.
	.patch("/:itemId", validateGroupAndItemParam, zValidator("json", validator.item), async (c) => {
		const { tripId, ...data } = c.req.valid("json");

		await validateTripId(c.var.groupId, tripId);

		const res = await db
			.update(schema.item)
			.set({
				...data,
				...(tripId !== undefined ? { tripId } : {})
			})
			.where(eq(schema.item.id, c.var.itemId))
			.returning();

		return c.json(firstOrNotFound(res, "Item Not Found") as Item);
	})

	// Replace the complete weighted split for an item.
	.put(
		"/:itemId/shares",
		validateGroupAndItemParam,
		zValidator("json", validator.itemShares),
		async (c) => {
			const shares = c.req.valid("json");

			await validateShareMembers(
				c.var.groupId,
				shares.map((share) => share.userId)
			);

			await db.batch([
				db.delete(schema.wantedItem).where(eq(schema.wantedItem.itemId, c.var.itemId)),
				db
					.insert(schema.wantedItem)
					.values(shares.map((share) => ({ ...share, itemId: c.var.itemId })))
			]);

			return c.json(shares.map((share) => ({ ...share, itemId: c.var.itemId })) as WantedItem[]);
		}
	)

	// Delete an item from the group
	.delete("/:itemId", validateGroupAndItemParam, async (c) => {
		await db.delete(schema.item).where(eq(schema.item.id, c.var.itemId));

		return c.body(null, 204);
	});

export default items;
