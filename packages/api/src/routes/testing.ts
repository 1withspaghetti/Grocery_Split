import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import z from "zod";
import { validator } from "@grocery-split/validation";
import type { AppEnv } from "../index.ts";
import { auth } from "../lib/auth.ts";
import { zValidator } from "../middleware/zValidator.ts";

// Only used by the browser (Playwright) tests, so they can sign in as a seeded user without Google.
// The testUtils plugin is only loaded when MODE=test (see lib/auth.ts), so in dev and production this always 404s.
const testing = new Hono<AppEnv>().post(
	"/login",
	zValidator("json", z.strictObject({ userId: validator.idValidator })),
	async (c) => {
		const { test } = await auth.$context;
		if (!test) throw new HTTPException(404, { message: "Not Found" });

		const { userId } = c.req.valid("json");
		const cookies = await test.getCookies({
			userId,
			domain: new URL(c.env.FRONTEND_BASE).hostname
		});

		return c.json(cookies);
	}
);

export default testing;
