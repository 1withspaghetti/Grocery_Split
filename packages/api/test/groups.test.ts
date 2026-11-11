import { env } from "cloudflare:workers";
import { describe, it, expect, beforeAll } from "vitest";
import { auth } from "../src/lib/auth";
import type { TestHelpers } from "better-auth/plugins";
import { seed, relations } from "@grocery-split/db";
import { drizzle } from "drizzle-orm/d1";
import { applyD1Migrations } from "cloudflare:test";
import { api } from "./utils";

describe("groups routes", () => {
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
			const res = await api.get(path, { method });
			expect(res.status).toBe(401);
			expect(await res.json()).toStrictEqual({ message: "Not authorized" });
		}
	);

	// GET /api/groups

	it("responds with the list of groups for user1", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const res = await api.get("/api/groups", { headers });
		expect(res.status).toBe(200);
		expect(await res.json()).toStrictEqual([
			{
				id: "group00000000001",
				name: "Apartment 4B",
				ownerId: "user000000000001"
			}
		]);
	});

	it("responds with the list of groups for user2", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000002" });
		const res = await api.get("/api/groups", { headers });
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

	// GET /api/group/:id

	it("fails to get group for an invalid group id", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const res = await api.get("/api/groups/0", { headers });
		expect(res.status).toBe(400);
		expect(await res.json()).toStrictEqual({ message: "Invalid ID" });
	});

	it("fails to get group for a non-existent group", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const res = await api.get("/api/groups/group99999999999", { headers });
		expect(res.status).toBe(404);
		expect(await res.json()).toStrictEqual({ message: "Group Not Found" });
	});

	it("fails to get group whom you are not a member of", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const res = await api.get("/api/groups/group00000000002", { headers });
		expect(res.status).toBe(404);
		expect(await res.json()).toStrictEqual({ message: "Group Not Found" });
	});

	it("responds with the group for group1", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const res = await api.get("/api/groups/group00000000001", { headers });
		expect(res.status).toBe(200);
		expect(await res.json()).toStrictEqual({
			id: "group00000000001",
			name: "Apartment 4B",
			ownerId: "user000000000001"
		});
	});

	it("responds with the group for group2", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000002" });
		const res = await api.get("/api/groups/group00000000002", { headers });
		expect(res.status).toBe(200);
		expect(await res.json()).toStrictEqual({
			id: "group00000000002",
			name: "Bunch of Friends",
			ownerId: "user000000000002"
		});
	});

	// GET /api/group/:id/members

	it("fails to list group members for an invalid group id", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const res = await api.get("/api/groups/0/members", { headers });
		expect(res.status).toBe(400);
		expect(await res.json()).toStrictEqual({ message: "Invalid ID" });
	});

	it("fails to list group members for a non-existent group", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const res = await api.get("/api/groups/group99999999999/members", { headers });
		expect(res.status).toBe(404);
		expect(await res.json()).toStrictEqual({ message: "Group Not Found" });
	});

	it("fails to list group members for a group whom you are not a member of", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const res = await api.get("/api/groups/group00000000002/members", { headers });
		expect(res.status).toBe(404);
		expect(await res.json()).toStrictEqual({ message: "Group Not Found" });
	});

	it("responds with the group members for group1", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const res = await api.get("/api/groups/group00000000001/members", { headers });
		expect(res.status).toBe(200);
		expect(await res.json()).toStrictEqual([
			{
				id: "user000000000001",
				email: "user1@example.com",
				name: "Jake",
				image: null
			},
			{
				id: "user000000000002",
				email: "user2@example.com",
				name: "Marilyn",
				image: null
			},
			{
				id: "user000000000003",
				email: "user3@example.com",
				name: "Conner",
				image: null
			}
		]);
	});

	it("responds with the group members for group2", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000002" });
		const res = await api.get("/api/groups/group00000000002/members", { headers });
		expect(res.status).toBe(200);
		expect(await res.json()).toStrictEqual([
			{
				id: "user000000000002",
				email: "user2@example.com",
				name: "Marilyn",
				image: null
			},
			{
				id: "user000000000003",
				email: "user3@example.com",
				name: "Conner",
				image: null
			}
		]);
	});

	// POST /api/groups

	it("fails to create a group with missing parameters", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000003" });
		const body = {
			invalidProperty: true
		};
		const res = await api.post("/api/groups", body, { headers });
		expect(res.status).toBe(400);
	});

	it("fails to create a group with invalid data", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000003" });
		const body = {
			name: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
		};
		const res = await api.post("/api/groups", body, { headers });
		expect(res.status).toBe(400);
	});

	it("fails to create a group with extra parameter", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000003" });
		const body = {
			id: "group0000000test", // Instead of letting the server generate an id
			name: "Test Group"
		};
		const res = await api.post("/api/groups", body, { headers });
		expect(res.status).toBe(400);
	});

	let createdGroupId: string;
	it("creates a new group", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000003" });
		const body = {
			name: "Test Group"
		};
		const res = await api.post("/api/groups", body, { headers });
		expect(res.status).toBe(200);
		const resBody = (await res.json()) as unknown;
		expect(resBody).toHaveProperty("id");
		expect(resBody).toHaveProperty("name", "Test Group");
		expect(resBody).toHaveProperty("ownerId", "user000000000003");
		createdGroupId = (resBody as { id: string }).id;
		console.log("created group id", createdGroupId);
	});

	it("responds with the group for newly created group", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000003" });
		const res = await api.get(`/api/groups/${createdGroupId}`, { headers });
		expect(res.status).toBe(200);
		expect(await res.json()).toStrictEqual({
			id: createdGroupId,
			name: "Test Group",
			ownerId: "user000000000003"
		});
	});

	it("responds with the group members for newly created group", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000003" });
		const res = await api.get(`/api/groups/${createdGroupId}/members`, { headers });
		expect(res.status).toBe(200);
		expect(await res.json()).toStrictEqual([
			{
				id: "user000000000003",
				email: "user3@example.com",
				name: "Conner",
				image: null
			}
		]);
	});

	// PATCH /api/groups/:id

	it("fails to edit a group for an invalid group id", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000003" });
		const res = await api.patch("/api/groups/0", {}, { headers });
		expect(res.status).toBe(400);
		expect(await res.json()).toStrictEqual({ message: "Invalid ID" });
	});

	it("fails to edit a group for a non-existent group", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000003" });
		const res = await api.patch("/api/groups/group99999999999", {}, { headers });
		expect(res.status).toBe(404);
		expect(await res.json()).toStrictEqual({ message: "Group Not Found" });
	});

	it("fails to edit a group whom you are not a member of", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const res = await api.patch("/api/groups/group00000000002", {}, { headers });
		expect(res.status).toBe(404);
		expect(await res.json()).toStrictEqual({ message: "Group Not Found" });
	});

	it("fails to edit a group with missing parameters", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000003" });
		const body = {
			invalidProperty: true
		};
		const res = await api.patch(`/api/groups/${createdGroupId}`, body, { headers });
		expect(res.status).toBe(400);
	});

	it("fails to edit a group with invalid data", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000003" });
		const body = {
			name: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
		};
		const res = await api.patch(`/api/groups/${createdGroupId}`, body, { headers });
		expect(res.status).toBe(400);
	});

	it("fails to edit a group with extra parameter", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000003" });
		const body = {
			id: "group0000000test", // Instead of letting the server generate an id
			name: "Test Group edited"
		};
		const res = await api.patch(`/api/groups/${createdGroupId}`, body, { headers });
		expect(res.status).toBe(400);
	});

	it("edits a group", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000003" });
		const body = {
			name: "Test Group edited"
		};
		const res = await api.patch(`/api/groups/${createdGroupId}`, body, { headers });
		expect(res.status).toBe(200);
		expect(await res.json()).toStrictEqual({
			id: createdGroupId,
			name: "Test Group edited",
			ownerId: "user000000000003"
		});
	});

	it("responds with the edited group", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000003" });
		const res = await api.get(`/api/groups/${createdGroupId}`, { headers });
		expect(res.status).toBe(200);
		expect(await res.json()).toStrictEqual({
			id: createdGroupId,
			name: "Test Group edited",
			ownerId: "user000000000003"
		});
	});

	// DELETE /api/groups/:id

	it("fails to delete a group for an invalid group id", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const res = await api.delete("/api/groups/0", { headers });
		expect(res.status).toBe(400);
		expect(await res.json()).toStrictEqual({ message: "Invalid ID" });
	});

	it("fails to delete a group for a non-existent group", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const res = await api.delete("/api/groups/group99999999999", { headers });
		expect(res.status).toBe(404);
		expect(await res.json()).toStrictEqual({ message: "Group Not Found" });
	});

	it("fails to delete a group whom you are not a member of", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const res = await api.delete("/api/groups/group00000000002", { headers });
		expect(res.status).toBe(404);
		expect(await res.json()).toStrictEqual({ message: "Group Not Found" });
	});

	it("fails to delete a group whom you are not the owner of", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000002" });
		const res = await api.delete("/api/groups/group00000000001", { headers });
		expect(res.status).toBe(404);
		expect(await res.json()).toStrictEqual({ message: "Group Not Found" });
	});

	it("deletes a group", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000003" });
		const res = await api.delete(`/api/groups/${createdGroupId}`, { headers });
		expect(res.status).toBe(200);
	});

	it("fails to fetch deleted group", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000003" });
		const res = await api.get(`/api/groups/${createdGroupId}`, { headers });
		expect(res.status).toBe(404);
		expect(await res.json()).toStrictEqual({ message: "Group Not Found" });
	});
});
