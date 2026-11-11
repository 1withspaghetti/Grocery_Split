import { relations, seed } from "../src/index.ts";
import { drizzle } from "drizzle-orm/d1";
import { getPlatformProxy } from "wrangler";
import { migrate } from "../src/seed/index.ts";

const { env, dispose } = await getPlatformProxy<CloudflareBindings>({
	configPath: "../api/wrangler.jsonc",
	persist: { path: "../api/.wrangler/state/v3" }
});

const db = drizzle(env.DB, { relations: relations });
await migrate(db, true);
await seed(db, true);

await dispose();
