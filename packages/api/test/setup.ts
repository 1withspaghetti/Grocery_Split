import { seed, relations } from "@grocery-split/db";
import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";

export async function setup() {
	await seed(drizzle(env.DB, { relations }));
}
