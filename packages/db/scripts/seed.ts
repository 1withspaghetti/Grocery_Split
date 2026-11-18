import { relations, seed } from "../src/index.ts";
import { drizzle } from "drizzle-orm/d1";
import { getPlatformProxy } from "wrangler";
import { migrate } from "../src/seed/index.ts";

// An optional path lets the browser tests seed their own database instead of the dev one
const persistPath = process.argv[2] ?? "../api/.wrangler/state/v3";

const { env, dispose } = await getPlatformProxy<CloudflareBindings>({
	configPath: "../api/wrangler.jsonc",
	persist: { path: persistPath }
});

const db = drizzle(env.DB, { relations: relations });
await migrate(db, true);
await seed(db, true);

await dispose();
