import { Hono } from "hono";
import type { AppEnv } from "../index.ts";
import { validateGroupAndTripParam, validateGroupParam } from "../middleware/validateParams.ts";
import { db } from "../lib/db.ts";
import { schema } from "@grocery-split/db";
import { desc, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { validator, type Trip } from "@grocery-split/validation";
import { zValidator } from "../middleware/zValidator.ts";
import { nanoid } from "../lib/nanoid.ts";
import { firstOrNotFound } from "../lib/firstOrNotFound.ts";

// Is a route defined in ./groups.ts so auth is already enforced
const trips = new Hono<AppEnv<true>>()
	// List all trips in the current group, newest first (id breaks ties so the order is stable)
	.get("/", validateGroupParam, async (c) => {
		const res = await db
			.select()
			.from(schema.trip)
			.where(eq(schema.trip.groupId, c.var.groupId))
			.orderBy(desc(schema.trip.createdAt), desc(schema.trip.id));

		return c.json(res as Trip[]);
	})

	// Getting trip by id
	.get("/:tripId", validateGroupAndTripParam, async (c) => {
		// We know the user must be a part of this group due to the enforceUserInGroup middleware
		const res = await db.select().from(schema.trip).where(eq(schema.trip.id, c.var.tripId));

		return c.json(firstOrNotFound(res) as Trip);
	})

	// Creating trips
	.post("/", validateGroupParam, zValidator("json", validator.trip), async (c) => {
		const { user } = c.var.session;
		const data = c.req.valid("json");

		const res = await db
			.insert(schema.trip)
			.values({
				...data,
				id: nanoid(),
				groupId: c.var.groupId,
				createdById: user.id
			})
			.returning();

		if (res.length < 1) throw new HTTPException(500, { message: "Trip Not Found" });
		return c.json(res[0] as Trip);
	})

	// Updating trip
	.patch("/:tripId", validateGroupAndTripParam, zValidator("json", validator.trip), async (c) => {
		const data = c.req.valid("json");

		// Update the actual trip
		const res = await db
			.update(schema.trip)
			.set(data)
			.where(eq(schema.trip.id, c.var.tripId))
			.returning();

		return c.json(firstOrNotFound(res) as Trip);
	})

	// Unassign items before deleting the trip so they remain on the main shopping list.
	.delete("/:tripId", validateGroupAndTripParam, async (c) => {
		await db.batch([
			db.update(schema.item).set({ tripId: null }).where(eq(schema.item.tripId, c.var.tripId)),
			db.delete(schema.trip).where(eq(schema.trip.id, c.var.tripId))
		]);

		return c.body(null, 204);
	});

export default trips;
