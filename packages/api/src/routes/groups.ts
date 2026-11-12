import { Hono } from "hono";
import { validator, type Group, type User } from "@grocery-split/validation";
import { zValidator } from "../middleware/zValidator.ts";
import type { AppEnv } from "../index.ts";
import { enforceAuth } from "../middleware/auth.ts";
import { nanoid } from "../lib/nanoid.ts";
import { db } from "../lib/db.ts";
import { schema } from "@grocery-split/db";
import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { validateGroupParam } from "../middleware/validateParams.ts";
import trips from "./trips.ts";
import items from "./items.ts";
import { firstOrNotFound } from "../lib/firstOrNotFound.ts";

const group = new Hono<AppEnv<true>>()
	.use(enforceAuth)

	// Getting all groups (that the current user is in)
	.get("/", async (c) => {
		const { user } = c.var.session;

		// Join with memberships to select groups with a membership user id
		const res = await db
			.select({ id: schema.group.id, name: schema.group.name, ownerId: schema.group.ownerId })
			.from(schema.group)
			.innerJoin(schema.membership, eq(schema.group.id, schema.membership.groupId))
			.where(eq(schema.membership.userId, user.id));

		return c.json(res as Group[]);
	})

	// List members for the item editor's split controls.
	.get("/:groupId/members", validateGroupParam, async (c) => {
		const res = await db
			.select({
				id: schema.user.id,
				name: schema.user.name,
				email: schema.user.email,
				image: schema.user.image
			})
			.from(schema.membership)
			.innerJoin(schema.user, eq(schema.membership.userId, schema.user.id))
			.where(eq(schema.membership.groupId, c.var.groupId));

		return c.json(res as User[]);
	})

	// Getting group by id
	.get("/:groupId", validateGroupParam, async (c) => {
		// We know the user must be a part of this group due to the enforceUserInGroup middleware
		const res = await db.select().from(schema.group).where(eq(schema.group.id, c.var.groupId));

		return c.json(firstOrNotFound(res) as Group);
	})

	// Creating groups
	.post("/", zValidator("json", validator.group), async (c) => {
		const { user } = c.var.session;
		const data = c.req.valid("json");
		const groupId = nanoid();

		const [res] = await db.batch([
			db
				.insert(schema.group)
				.values({
					...data,
					id: groupId,
					ownerId: user.id
				})
				.returning(),
			db.insert(schema.membership).values({ groupId, userId: user.id })
		]);

		return c.json(firstOrNotFound(res) as Group);
	})

	// Updating group
	.patch("/:groupId", validateGroupParam, zValidator("json", validator.group), async (c) => {
		const data = c.req.valid("json");

		// Update the actual group
		const res = await db
			.update(schema.group)
			.set(data)
			.where(eq(schema.group.id, c.var.groupId))
			.returning();

		return c.json(firstOrNotFound(res) as Group);
	})

	// Updating group owner (can only be done by the existing group owner)
	.patch(
		"/:groupId/owner",
		validateGroupParam,
		zValidator("json", validator.groupOwner),
		async (c) => {
			const { user } = c.var.session;
			const data = c.req.valid("json");

			// Make sure the new user is part of the group
			const [existingMembership] = await db
				.select({ groupId: schema.membership.groupId })
				.from(schema.membership)
				.where(
					and(
						eq(schema.membership.groupId, c.var.groupId),
						eq(schema.membership.userId, data.ownerId)
					)
				);
			if (!existingMembership) throw new HTTPException(404, { message: "User Not In Group" });

			// Update the actual group
			const res = await db
				.update(schema.group)
				.set(data)
				.where(and(eq(schema.group.id, c.var.groupId), eq(schema.group.ownerId, user.id))) // Make sure the current ownerId matches the user making the request
				.returning();

			return c.json(firstOrNotFound(res) as Group);
		}
	)

	// Delete a group. Only its current owner may do this.
	.delete("/:groupId", validateGroupParam, async (c) => {
		const { user } = c.var.session;

		const res = await db
			.delete(schema.group)
			.where(and(eq(schema.group.id, c.var.groupId), eq(schema.group.ownerId, user.id)))
			.returning();

		if (res.length == 0) throw new HTTPException(404, { message: "Not Found" });

		return c.body(null, 204);
	})

	// Handle all trip requests related to this group
	.route("/:groupId/trips", trips)
	.route("/:groupId/items", items);

export default group;
