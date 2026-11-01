import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { env } from "cloudflare:workers";
import { db } from "./db.ts";
import { schema } from "@grocery-split/db";
import { nanoid } from "./nanoid.ts";

export const auth = betterAuth({
	appName: "Grocery Split",
	baseURL: env.API_BASE,
	trustedOrigins: [env.FRONTEND_BASE],
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: "sqlite", schema }),
	emailAndPassword: {
		enabled: false
	},
	socialProviders: {
		google: {
			clientId: env.GOOGLE_CLIENT_ID,
			clientSecret: env.GOOGLE_CLIENT_SECRET
		}
	},
	advanced: {
		database: {
			generateId: () => nanoid(),
			joins: true
		}
	}
});
