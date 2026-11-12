import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../index.ts";
import { schema } from "@grocery-split/db";
import { and, count, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "../lib/db.ts";
import { validator } from "@grocery-split/validation";

// If groupId is in the parameter, makes sure the requesting user is a part of that group
export const validateGroupParam = createMiddleware<
	AppEnv<true> & { Variables: { groupId: string } },
	"/:groupId"
>(async (c, next) => {
	const { user } = c.var.session;

	const { success, data, error } = await validator.groupParams.safeParseAsync(c.req.param());
	if (!success) throw new HTTPException(400, { message: error.issues[0].message });

	const [exists] = await db
		.select({ count: count() })
		.from(schema.membership)
		.where(and(eq(schema.membership.groupId, data.groupId), eq(schema.membership.userId, user.id)));
	if (!exists || exists.count == 0) throw new HTTPException(404, { message: "Not Found" });

	c.set("groupId", data.groupId);

	await next();
});

// If groupId and tripId are in the parameter, makes sure the requesting user is a part of that group and that thr tip is part of that group
export const validateGroupAndTripParam = createMiddleware<
	AppEnv<true> & { Variables: { groupId: string; tripId: string } },
	":groupId/:tripId"
>(async (c, next) => {
	const { user } = c.var.session;

	const { success, data, error } = await validator.groupTripParams.safeParseAsync(c.req.param());
	if (!success) throw new HTTPException(400, { message: error.issues[0].message });

	const [exists] = await db
		.select({ count: count() })
		.from(schema.membership)
		.innerJoin(schema.trip, eq(schema.membership.groupId, schema.trip.groupId))
		.where(
			and(
				eq(schema.membership.userId, user.id),
				eq(schema.membership.groupId, data.groupId),
				eq(schema.trip.id, data.tripId)
			)
		);
	if (!exists || exists.count == 0) throw new HTTPException(404, { message: "Not Found" });

	c.set("groupId", data.groupId);
	c.set("tripId", data.tripId);

	await next();
});

export const validateGroupAndItemParam = createMiddleware<
	AppEnv<true> & { Variables: { groupId: string; itemId: string } },
	":groupId/:itemId"
>(async (c, next) => {
	const { user } = c.var.session;

	const { success, data, error } = await validator.groupItemParams.safeParseAsync(c.req.param());
	if (!success) throw new HTTPException(400, { message: error.issues[0].message });

	const [exists] = await db
		.select({ count: count() })
		.from(schema.membership)
		.innerJoin(schema.item, eq(schema.membership.groupId, schema.item.groupId))
		.where(
			and(
				eq(schema.membership.userId, user.id),
				eq(schema.membership.groupId, data.groupId),
				eq(schema.item.id, data.itemId)
			)
		);
	if (!exists || exists.count == 0) throw new HTTPException(404, { message: "Not Found" });

	c.set("groupId", data.groupId);
	c.set("itemId", data.itemId);

	await next();
});
