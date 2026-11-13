import { env } from "cloudflare:workers";
import { describe, it, expect, beforeAll } from "vitest";
import { auth } from "../src/lib/auth";
import type { TestHelpers } from "better-auth/plugins";
import { seed, relations } from "@grocery-split/db";
import { drizzle } from "drizzle-orm/d1";
import { applyD1Migrations } from "cloudflare:test";
import { api } from "./utils";
import type { PopulatedItem } from "@grocery-split/validation";

describe("items routes", () => {
	let authTestHelper: TestHelpers;
	beforeAll(async () => {
		// Cloudflare creates individual databases for each test file, se migrates and seeding needs to be applied for each file
		await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
		await seed(drizzle(env.DB, { relations }));

		const ctx = await auth.$context;
		authTestHelper = ctx.test;
	});

	// Fetches an item list and returns just the names, so the order is easy to compare
	async function listNames(query: string) {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const res = await api.get(`/api/groups/group00000000001/items${query}`, { headers });
		expect(res.status).toBe(200);
		return ((await res.json()) as PopulatedItem[]).map((item) => item.name);
	}

	it("responds with not authorized and proper message for GET /api/groups/0/items", async () => {
		const res = await api.get("/api/groups/0/items");
		expect(res.status).toBe(401);
		expect(await res.json()).toStrictEqual({ message: "Not authorized" });
	});

	// GET /api/groups/:id/items sorting

	it("lists the main list oldest first by default", async () => {
		// Both seeded items share a createdAt, so the id breaks the tie
		expect(await listNames("")).toStrictEqual(["Orange Chicken", "Cheese"]);
	});

	it("lists the main list newest first", async () => {
		expect(await listNames("?sort=createdAt&order=desc")).toStrictEqual([
			"Cheese",
			"Orange Chicken"
		]);
	});

	it("lists the main list by name", async () => {
		expect(await listNames("?sort=name")).toStrictEqual(["Cheese", "Orange Chicken"]);
		expect(await listNames("?sort=name&order=desc")).toStrictEqual(["Orange Chicken", "Cheese"]);
	});

	it.for([{ query: "?sort=quantity" }, { query: "?sort=name&order=up" }, { query: "?order=DESC" }])(
		"fails to list items with invalid sorting $query",
		async ({ query }) => {
			const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
			const res = await api.get(`/api/groups/group00000000001/items${query}`, { headers });
			expect(res.status).toBe(400);
		}
	);

	it("creates priced items in a trip to sort", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		for (const [name, price] of [
			["Eggs", 5.5],
			["bread", 2],
			["Apples", 3.25]
		] as const) {
			const body = { name, quantity: null, notes: null, price, tripId: "trip000000000002" };
			const res = await api.post("/api/groups/group00000000001/items", body, { headers });
			expect(res.status).toBe(201);
		}
	});

	it("lists a trip by price with unpriced items last", async () => {
		// "Milk 2%" is seeded without a price
		expect(await listNames("?tripId=trip000000000002&sort=price")).toStrictEqual([
			"bread",
			"Apples",
			"Eggs",
			"Milk 2%"
		]);
		expect(await listNames("?tripId=trip000000000002&sort=price&order=desc")).toStrictEqual([
			"Eggs",
			"Apples",
			"bread",
			"Milk 2%"
		]);
	});

	it("lists a trip by name ignoring case", async () => {
		expect(await listNames("?tripId=trip000000000002&sort=name")).toStrictEqual([
			"Apples",
			"bread",
			"Eggs",
			"Milk 2%"
		]);
	});
});
