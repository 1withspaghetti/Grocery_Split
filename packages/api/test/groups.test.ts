import { exports, env } from "cloudflare:workers";
import { describe, it, expect, beforeAll } from "vitest";
import { auth } from "../src/lib/auth";
import type { TestHelpers } from "better-auth/plugins";
import { seed, relations } from "@grocery-split/db";
import { drizzle } from "drizzle-orm/d1";
import { applyD1Migrations } from "cloudflare:test";

describe("base worker", () => {
	let authTestHelper: TestHelpers;
	beforeAll(async () => {
		// Cloudflare creates individual databases for each test file, se migrates and seeding needs to be applied for each file
		await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
		await seed(drizzle(env.DB, { relations }));

		const ctx = await auth.$context;
		authTestHelper = ctx.test;
	});

	it.for([
		{ method: "GET", path: "/api/groups" },
		{ method: "GET", path: "/api/groups/0/members" },
		{ method: "GET", path: "/api/groups/0" },
		{ method: "POST", path: "/api/groups" },
		{ method: "PATCH", path: "/api/groups/0" },
		{ method: "PATCH", path: "/api/groups/owner" },
		{ method: "DELETE", path: "/api/groups/0" }
	])(
		"responds with not authorized and proper message for $method $path",
		async ({ method, path }) => {
			const res = await exports.default.fetch(`${env.API_BASE}${path}`, { method });
			expect(res.status).toBe(401);
			expect(await res.json()).toStrictEqual({ message: "Not authorized" });
		}
	);

	it("responds with my list of groups for user1", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const res = await exports.default.fetch(`${env.API_BASE}/api/groups`, { headers });
		expect(res.status).toBe(200);
		expect(await res.json()).toStrictEqual([
			{
				id: "group00000000001",
				name: "Apartment 4B",
				ownerId: "user000000000001"
			}
		]);
	});

	it("responds with my list of groups for user2", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000002" });
		const res = await exports.default.fetch(`${env.API_BASE}/api/groups`, { headers });
		expect(res.status).toBe(200);
		expect(await res.json()).toStrictEqual([
			{
				id: "group00000000001",
				name: "Apartment 4B",
				ownerId: "user000000000001"
			},
			{
				id: "group00000000002",
				name: "Bunch of Friends",
				ownerId: "user000000000002"
			}
		]);
	});
});
