import { auth } from "./lib/auth.ts";
import { Hono, type Env } from "hono";
import group from "./routes/groups.ts";
import invites from "./routes/invites.ts";
import { HTTPException } from "hono/http-exception";
import { useAuth } from "./middleware/auth.ts";
import { cors } from "hono/cors";

export interface AppEnv<EnforceAuth extends boolean = false> extends Env {
	Bindings: CloudflareBindings;
	Variables: Record<string, unknown> & {
		session: EnforceAuth extends true
			? typeof auth.$Infer.Session
			: typeof auth.$Infer.Session | null;
	};
}

const app = new Hono<AppEnv<false>>()
	.basePath("/api")
	.use("*", async (c, next) => {
		const corsMiddlewareHandler = cors({
			origin: c.env.FRONTEND_BASE,
			credentials: true
		});
		return corsMiddlewareHandler(c, next);
	})

	// auth
	.all("/auth/*", (c) => auth.handler(c.req.raw))
	.use(useAuth) // Doesn't enforce it, just handles it if it exists. Use `router.use(enforceAuth)` for that.

	// routes
	.route("/groups", group)
	.route("/invites", invites)

	// error handling
	.notFound((c) => c.json({ message: "Not Found" }, 404))
	.onError((err, c) => {
		// For thrown http errors
		if (err instanceof HTTPException) {
			return c.json(
				{
					message: err.message
				},
				err.status
			);
		}
		// For any other unexpected errors, log and return a generic 500 response
		console.error(err.name + ": " + err.message);
		console.error(err);
		return c.json(
			{
				message: "Internal Server Error"
			},
			500
		);
	});

export default app;

export type AppType = typeof app;
