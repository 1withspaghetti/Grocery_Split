// Gives the browser tests a fresh database before the API starts, so every run begins with the same seed data.
// The browser tests use their own database folder (api/.wrangler/e2e), so the dev database is never touched.
import { execSync } from "child_process";
import { rmSync } from "fs";
import { resolve } from "path";

const persistDir = resolve(import.meta.dirname, "../../api/.wrangler/e2e");

rmSync(persistDir, { recursive: true, force: true });

// Reuses the db package's migrate + seed script (same seed data as the API tests)
execSync(`pnpm --filter @grocery-split/db db:seed "${resolve(persistDir, "v3")}"`, {
	stdio: "inherit"
});
