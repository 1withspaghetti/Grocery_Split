import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [
		cloudflareTest(async () => {
			const migrationsDir = path.join(import.meta.dirname, "../db/migrations");
			const migrationsPattern = path.join(import.meta.dirname, "../db/migrations/*/migration.sql");
			const migrations = await readD1Migrations({ migrationsDir, migrationsPattern });

			return {
				wrangler: { configPath: "./wrangler.jsonc" },
				miniflare: {
					// Add a test-only binding for migrations, so we can apply them in a setup file
					bindings: { TEST_MIGRATIONS: migrations }
				}
			};
		})
	],
	test: {
		testTimeout: 10_000
	}
});
