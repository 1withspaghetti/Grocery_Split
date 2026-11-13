import { Hono } from "hono";
import { validator, type Group } from "@grocery-split/validation";
import { schema } from "@grocery-split/db";
import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import type { AppEnv } from "../index.ts";
import { enforceAuth } from "../middleware/auth.ts";
import { zValidator } from "../middleware/zValidator.ts";
import { db } from "../lib/db.ts";
import { firstOrNotFound } from "../lib/firstOrNotFound.ts";

const invites = new Hono<AppEnv<true>>()
	.use(enforceAuth)

	// Join the invite's group with its code. Joining a group you're already in just returns the group
	.post("/:code", zValidator("param", validator.inviteParams), async (c) => {
		const { user } = c.var.session;
		const { code } = c.req.valid("param");

		const invite = firstOrNotFound(
			await db
				.select({ groupId: schema.invite.groupId, expires: schema.invite.expires })
				.from(schema.invite)
				.where(eq(schema.invite.code, code)),
			"Invite Not Found"
		);

		// Expired invites can't be used, so they're deleted when someone tries to
		if (invite.expires <= Date.now()) {
			await db.delete(schema.invite).where(eq(schema.invite.code, code));
			throw new HTTPException(410, { message: "Invite Expired" });
		}

		const [res] = await db.batch([
			db.select().from(schema.group).where(eq(schema.group.id, invite.groupId)),
			db
				.insert(schema.membership)
				.values({ groupId: invite.groupId, userId: user.id })
				.onConflictDoNothing()
		]);

		return c.json(firstOrNotFound(res) as Group);
	});

export default invites;
