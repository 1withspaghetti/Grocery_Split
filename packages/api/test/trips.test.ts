import { env } from "cloudflare:workers";
import { describe, it, expect, beforeAll } from "vitest";
import { auth } from "../src/lib/auth";
import type { TestHelpers } from "better-auth/plugins";
import { seed, relations } from "@grocery-split/db";
import { drizzle } from "drizzle-orm/d1";
import { applyD1Migrations } from "cloudflare:test";
import { api } from "./utils";
import type { Trip } from "@grocery-split/validation";

describe("trips routes", () => {
	let authTestHelper: TestHelpers;
	beforeAll(async () => {
		// Cloudflare creates individual databases for each test file, se migrates and seeding needs to be applied for each file
		await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
		await seed(drizzle(env.DB, { relations }));

		const ctx = await auth.$context;
		authTestHelper = ctx.test;
	});

	it.for([
		{ method: "GET", path: "/api/groups/0/trips" },
		{ method: "GET", path: "/api/groups/0/trips/0" },
		{ method: "POST", path: "/api/groups/0/trips" },
		{ method: "PATCH", path: "/api/groups/0/trips/0" },
		{ method: "DELETE", path: "/api/groups/0/trips/0" }
	])(
		"responds with not authorized and proper message for $method $path",
		async ({ method, path }) => {
			const res = await api.get(path, { method });
			expect(res.status).toBe(401);
			expect(await res.json()).toStrictEqual({ message: "Not authorized" });
		}
	);

	it.for([
		{ method: "GET", path: "/trips" },
		{ method: "GET", path: "/trips/trip000000000001" },
		{ method: "POST", path: "/trips" },
		{ method: "PATCH", path: "/trips/trip000000000001" },
		{ method: "DELETE", path: "/trips/trip000000000001" }
	])("fails to $method $path for an invalid group id", async ({ method, path }) => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const res = await api.get(`/api/groups/0${path}`, { headers, method });
		expect(res.status).toBe(400);
		expect(await res.json()).toStrictEqual({ message: "Invalid ID" });
	});

	it.for([
		{ method: "GET", path: "/trips" },
		{ method: "GET", path: "/trips/trip000000000001" },
		{ method: "POST", path: "/trips" },
		{ method: "PATCH", path: "/trips/trip000000000001" },
		{ method: "DELETE", path: "/trips/trip000000000001" }
	])("fails to $method $path for a non-existent group", async ({ method, path }) => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const res = await api.get(`/api/groups/group99999999999${path}`, { headers, method });
		expect(res.status).toBe(404);
		expect(await res.json()).toStrictEqual({ message: "Not Found" });
	});

	it.for([
		{ method: "GET", path: "/trips" },
		{ method: "GET", path: "/trips/trip000000000001" },
		{ method: "POST", path: "/trips" },
		{ method: "PATCH", path: "/trips/trip000000000001" },
		{ method: "DELETE", path: "/trips/trip000000000001" }
	])(
		"fails to $method $path for a group whom you are not a member of",
		async ({ method, path }) => {
			const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
			const res = await api.get(`/api/groups/group00000000002${path}`, { headers, method });
			expect(res.status).toBe(404);
			expect(await res.json()).toStrictEqual({ message: "Not Found" });
		}
	);

	// GET /api/groups/:id/trips

	it("responds with the list of trips for group 1", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const res = await api.get("/api/groups/group00000000001/trips", { headers });
		expect(res.status).toBe(200);
		expect(await res.json()).toStrictEqual([
			{
				id: "trip000000000002",
				groupId: "group00000000001",
				name: "Costco",
				createdById: "user000000000002",
				createdAt: 946684800000
			},
			{
				id: "trip000000000001",
				groupId: "group00000000001",
				name: "Trader Joes 10/8",
				createdById: "user000000000001",
				createdAt: 946684800000
			}
		]);
	});

	it("responds with the list of trips for group 2", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000002" });
		const res = await api.get("/api/groups/group00000000002/trips", { headers });
		expect(res.status).toBe(200);
		expect(await res.json()).toStrictEqual([
			{
				id: "trip000000000003",
				groupId: "group00000000002",
				name: "Food4Less",
				createdById: "user000000000002",
				createdAt: 946684800000
			}
		]);
	});

	// GET /api/group/:id/trips/:id

	it("fails to get trip for an invalid trip id", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const res = await api.get("/api/groups/group00000000001/trips/0", { headers });
		expect(res.status).toBe(400);
		expect(await res.json()).toStrictEqual({ message: "Invalid ID" });
	});

	it("fails to get trip for a non-existent trip", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const res = await api.get("/api/groups/group00000000001/trips/trip999999999999", { headers });
		expect(res.status).toBe(404);
		expect(await res.json()).toStrictEqual({ message: "Not Found" });
	});

	it("fails to get trip whom is not part of that group", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const res = await api.get("/api/groups/group00000000001/trips/trip000000000003", { headers });
		expect(res.status).toBe(404);
		expect(await res.json()).toStrictEqual({ message: "Not Found" });
	});

	it("responds with the trip for trip1", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const res = await api.get("/api/groups/group00000000001/trips/trip000000000001", { headers });
		expect(res.status).toBe(200);
		expect(await res.json()).toStrictEqual({
			id: "trip000000000001",
			groupId: "group00000000001",
			name: "Trader Joes 10/8",
			createdById: "user000000000001",
			createdAt: 946684800000
		});
	});

	it("responds with the trip for trip3", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000002" });
		const res = await api.get("/api/groups/group00000000002/trips/trip000000000003", { headers });
		expect(res.status).toBe(200);
		expect(await res.json()).toStrictEqual({
			id: "trip000000000003",
			groupId: "group00000000002",
			name: "Food4Less",
			createdById: "user000000000002",
			createdAt: 946684800000
		});
	});

	// POST /api/groups/:id/trips

	it("fails to create a trip with missing parameters", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const body = {
			invalidProperty: true
		};
		const res = await api.post("/api/groups/group00000000001/trips", body, { headers });
		expect(res.status).toBe(400);
	});

	it("fails to create a trip with invalid data", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const body = {
			name: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
		};
		const res = await api.post("/api/groups/group00000000001/trips", body, { headers });
		expect(res.status).toBe(400);
	});

	it("fails to create a trip with extra parameter", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const body = {
			id: "trip00000000test", // Instead of letting the server generate an id
			name: "Test Trip"
		};
		const res = await api.post("/api/groups/group00000000001/trips", body, { headers });
		expect(res.status).toBe(400);
	});

	let createdTripId: string;
	let createdTripAt: number;
	it("creates a new trip", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const body = {
			name: "Test Trip"
		};
		const res = await api.post("/api/groups/group00000000001/trips", body, { headers });
		expect(res.status).toBe(200);
		const resBody = (await res.json()) as Trip;
		createdTripId = resBody.id;
		createdTripAt = resBody.createdAt;
		console.log("created trip id", createdTripId);
		console.log("created trip at", createdTripAt);
		expect(resBody).toStrictEqual({
			id: createdTripId,
			groupId: "group00000000001",
			name: "Test Trip",
			createdById: "user000000000001",
			createdAt: createdTripAt
		});
		// createdAt in the last second
		expect(createdTripAt)
			.lessThan(Date.now())
			.greaterThan(Date.now() - 1000);
	});

	it("responds with the trip for newly created trip", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000003" });
		const res = await api.get(`/api/groups/group00000000001/trips/${createdTripId}`, { headers });
		expect(res.status).toBe(200);
		expect(await res.json()).toStrictEqual({
			id: createdTripId,
			groupId: "group00000000001",
			name: "Test Trip",
			createdById: "user000000000001",
			createdAt: createdTripAt
		});
	});

	// PATCH /api/groups/:id/trips/:id

	it("fails to edit trip for an invalid trip id", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const res = await api.patch("/api/groups/group00000000001/trips/0", {}, { headers });
		expect(res.status).toBe(400);
		expect(await res.json()).toStrictEqual({ message: "Invalid ID" });
	});

	it("fails to edit trip for a non-existent trip", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const res = await api.patch(
			"/api/groups/group00000000001/trips/trip999999999999",
			{},
			{ headers }
		);
		expect(res.status).toBe(404);
		expect(await res.json()).toStrictEqual({ message: "Not Found" });
	});

	it("fails to edit trip whom is not part of that group", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const res = await api.patch(
			"/api/groups/group00000000001/trips/trip000000000003",
			{},
			{ headers }
		);
		expect(res.status).toBe(404);
		expect(await res.json()).toStrictEqual({ message: "Not Found" });
	});

	it("fails to edit a trip with missing parameters", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000002" });
		const body = {
			invalidProperty: true
		};
		const res = await api.patch(`/api/groups/group00000000001/trips/${createdTripId}`, body, {
			headers
		});
		expect(res.status).toBe(400);
	});

	it("fails to edit a trip with invalid data", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000002" });
		const body = {
			name: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
		};
		const res = await api.patch(`/api/groups/group00000000001/trips/${createdTripId}`, body, {
			headers
		});
		expect(res.status).toBe(400);
	});

	it("fails to edit a trip with extra parameter", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000002" });
		const body = {
			id: "trip00000000test", // Instead of letting the server generate an id
			name: "Test Trip"
		};
		const res = await api.patch(`/api/groups/group00000000001/trips/${createdTripId}`, body, {
			headers
		});
		expect(res.status).toBe(400);
	});

	it("edits a trip", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const body = {
			name: "Test Trip edited"
		};
		const res = await api.patch(`/api/groups/group00000000001/trips/${createdTripId}`, body, {
			headers
		});
		expect(res.status).toBe(200);
		expect(await res.json()).toStrictEqual({
			id: createdTripId,
			groupId: "group00000000001",
			name: "Test Trip edited",
			createdById: "user000000000001",
			createdAt: createdTripAt
		});
	});

	it("responds with the trip for edited trip", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000003" });
		const res = await api.get(`/api/groups/group00000000001/trips/${createdTripId}`, { headers });
		expect(res.status).toBe(200);
		expect(await res.json()).toStrictEqual({
			id: createdTripId,
			groupId: "group00000000001",
			name: "Test Trip edited",
			createdById: "user000000000001",
			createdAt: createdTripAt
		});
	});

	// DELETE /api/groups/:id/trips/:id

	it("fails to delete trip for an invalid trip id", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const res = await api.delete("/api/groups/group00000000001/trips/0", { headers });
		expect(res.status).toBe(400);
		expect(await res.json()).toStrictEqual({ message: "Invalid ID" });
	});

	it("fails to delete trip for a non-existent trip", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const res = await api.delete("/api/groups/group00000000001/trips/trip999999999999", {
			headers
		});
		expect(res.status).toBe(404);
		expect(await res.json()).toStrictEqual({ message: "Not Found" });
	});

	it("fails to delete trip whom is not part of that group", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const res = await api.delete("/api/groups/group00000000001/trips/trip000000000003", {
			headers
		});
		expect(res.status).toBe(404);
		expect(await res.json()).toStrictEqual({ message: "Not Found" });
	});

	it("deletes a trip", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const res = await api.delete(`/api/groups/group00000000001/trips/${createdTripId}`, {
			headers
		});
		expect(res.status).toBe(204);
	});

	it("fails to fetch deleted trip", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const res = await api.get(`/api/groups/group00000000001/trips/${createdTripId}`, { headers });
		expect(res.status).toBe(404);
		expect(await res.json()).toStrictEqual({ message: "Not Found" });
	});
});
