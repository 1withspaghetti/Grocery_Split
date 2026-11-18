import { defineConfig, devices } from "@playwright/test";

// The browser tests run their own API and frontend on separate ports, so they don't clash with `pnpm dev`
export const API_BASE = "http://localhost:8788";
export const FRONTEND_BASE = "http://localhost:5174";

export default defineConfig({
	testDir: "./e2e",
	// All tests share one seeded database, so they run one at a time
	fullyParallel: false,
	workers: 1,
	reporter: "list",
	use: {
		baseURL: FRONTEND_BASE,
		trace: "retain-on-failure"
	},
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
	webServer: [
		{
			name: "api",
			// Reset + seed the test database, then start the API in test mode (enables the test-only sign in route)
			command: [
				"node e2e/reset-db.ts",
				"&& pnpm --dir ../api exec wrangler dev src/index.ts --port 8788 --persist-to .wrangler/e2e",
				"--var MODE:test",
				`--var API_BASE:${API_BASE}`,
				`--var FRONTEND_BASE:${FRONTEND_BASE}`,
				"--var BETTER_AUTH_SECRET:browser-tests-only-secret-not-used-anywhere-else"
			].join(" "),
			// Any response (even 401) means the API is up
			url: `${API_BASE}/api/groups`,
			reuseExistingServer: false,
			timeout: 180_000
		},
		{
			name: "frontend",
			command: "pnpm exec vite --port 5174 --strictPort",
			url: FRONTEND_BASE,
			env: {
				VITE_API_BASE: `${API_BASE}/`,
				VITE_FRONTEND_BASE: `${FRONTEND_BASE}/`
			},
			reuseExistingServer: false,
			timeout: 180_000
		}
	]
});
