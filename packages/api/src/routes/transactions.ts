import { Hono } from "hono";
import type { AppEnv } from "../index.ts";
import { db } from "../lib/db.ts";
import { schema } from "@grocery-split/db";
import { validator, type Transaction } from "@grocery-split/validation";
import { eq, and } from "drizzle-orm";
import { zValidator } from "../middleware/zValidator.ts";
import {
	validateGroupAndTransactionParam,
	validateGroupParam
} from "../middleware/validateParams.ts";
import { firstOrNotFound } from "../lib/firstOrNotFound.ts";
import { nanoid } from "../lib/nanoid.ts";
import { HTTPException } from "hono/http-exception";

async function validateUserId(groupId: string, userId: string | null | undefined) {
	if (userId === null || userId === undefined) return;

	const [trip] = await db
		.select({ id: schema.membership.userId })
		.from(schema.membership)
		.where(and(eq(schema.membership.userId, userId), eq(schema.membership.groupId, groupId)));

	if (!trip) throw new HTTPException(404, { message: "Trip Not Found" });
}

// Is a route defined in ./groups.ts so auth is already enforced
const transactions = new Hono<AppEnv<true>>()
	// Getting all items in the main list (if ?trip=null), or only a specific trip (?trip=id_here)
	// Sorted with ?sort=createdAt|name|price&order=asc|desc, defaults to oldest first so new items are added to the bottom
	.get("/", validateGroupParam, zValidator("query", validator.transactionSort), async (c) => {
		const { sort, order } = c.req.valid("query");

		const res = await db.query.transaction.findMany({
			where: {
				groupId: c.var.groupId
			},
			orderBy: (item, { asc, desc }) => {
				const direction = order === "asc" ? asc : desc;
				// Transactions with the same value fall back to oldest first (id breaks ties so the order is stable)
				const tiebreak = [asc(item.createdAt), asc(item.id)];

				switch (sort) {
					case "amount":
						return [direction(item.amount), ...tiebreak];
					default:
						return [direction(item.createdAt), direction(item.id)];
				}
			}
		});

		return c.json(res as Transaction[]);
	})

	.get("/:transactionId", validateGroupAndTransactionParam, async (c) => {
		const res = await db.query.transaction.findMany({
			where: {
				id: c.var.transactionId
			}
		});

		return c.json(firstOrNotFound(res, "Transaction Not Found") as Transaction);
	})

	// Create a transaction in a group
	.post("/", validateGroupParam, zValidator("json", validator.transaction), async (c) => {
		const { user } = c.var.session;
		const data = c.req.valid("json");

		await Promise.all([
			validateUserId(c.var.groupId, data.fromId),
			validateUserId(c.var.groupId, data.toId)
		]);

		const res = await db
			.insert(schema.transaction)
			.values({
				...data,
				id: nanoid(),
				groupId: c.var.groupId,
				createdById: user.id
			})
			.returning();

		return c.json(firstOrNotFound(res, "Transaction Not Found") as Transaction, 201);
	})

	// Update an transaction's fields.
	.patch(
		"/:transactionId",
		validateGroupAndTransactionParam,
		zValidator("json", validator.transaction),
		async (c) => {
			const data = c.req.valid("json");

			await Promise.all([
				validateUserId(c.var.groupId, data.fromId),
				validateUserId(c.var.groupId, data.toId)
			]);

			const res = await db
				.update(schema.transaction)
				.set(data)
				.where(eq(schema.transaction.id, c.var.transactionId))
				.returning();

			return c.json(firstOrNotFound(res, "Transaction Not Found") as Transaction);
		}
	)

	// Delete a transaction from the group
	.delete("/:transactionId", validateGroupAndTransactionParam, async (c) => {
		await db.delete(schema.transaction).where(eq(schema.transaction.id, c.var.transactionId));

		return c.body(null, 204);
	});

export default transactions;
