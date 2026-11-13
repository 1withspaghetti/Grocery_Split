import { env } from "cloudflare:workers";
import { describe, it, expect, beforeAll } from "vitest";
import { auth } from "../src/lib/auth";
import type { TestHelpers } from "better-auth/plugins";
import { seed, relations, schema } from "@grocery-split/db";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { applyD1Migrations } from "cloudflare:test";
import { api } from "./utils";
import type { User } from "@grocery-split/validation";

describe("invites routes", () => {
	let authTestHelper: TestHelpers;
	const db = drizzle(env.DB, { relations });

	beforeAll(async () => {
		// Cloudflare creates individual databases for each test file, se migrates and seeding needs to be applied for each file
		await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
		await seed(db);

		// The seed has no invites, so make some. user1 is only in group 1, group 2 is user2 and user3
		const hour = 60 * 60 * 1000;
		await db.insert(schema.invite).values([
			{
				code: "validInvite1",
				groupId: "group00000000002",
				expires: Date.now() + hour,
				createdById: "user000000000002"
			},
			{
				code: "expiredInvite1",
				groupId: "group00000000002",
				expires: Date.now() - hour,
				createdById: "user000000000002"
			},
			{
				code: "group1Invite",
				groupId: "group00000000001",
				expires: Date.now() + hour,
				createdById: "user000000000001"
			}
		]);

		const ctx = await auth.$context;
		authTestHelper = ctx.test;
	});

	async function memberIds(groupId: string, userId: string) {
		const headers = await authTestHelper.getAuthHeaders({ userId });
		const res = await api.get(`/api/groups/${groupId}/members`, { headers });
		expect(res.status).toBe(200);
		return ((await res.json()) as User[]).map((user) => user.id).sort();
	}

	async function inviteExists(code: string) {
		const rows = await db.select().from(schema.invite).where(eq(schema.invite.code, code));
		return rows.length > 0;
	}

	// Security

	it("responds with not authorized and proper message for POST /api/invites/:code", async () => {
		const res = await api.post("/api/invites/validInvite1", {});
		expect(res.status).toBe(401);
		expect(await res.json()).toStrictEqual({ message: "Not authorized" });
	});

	it.for([
		{ code: "waytoolonginvitecode" }, // Over 16 characters
		{ code: "bad-code" },
		{ code: "bad%20code" },
		{ code: "%27%20OR%201%3D1--" } // ' OR 1=1--
	])("fails to join with an invalid invite code $code", async ({ code }) => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const res = await api.post(`/api/invites/${code}`, {}, { headers });
		expect(res.status).toBe(400);
		expect(await res.json()).toStrictEqual({ message: "Invalid Invite Code" });
	});

	it("fails to join with a non-existent invite code", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const res = await api.post("/api/invites/doesNotExist1", {}, { headers });
		expect(res.status).toBe(404);
		expect(await res.json()).toStrictEqual({ message: "Invite Not Found" });
	});

	it("only allows joining with POST", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const res = await api.get("/api/invites/validInvite1", { headers });
		expect(res.status).toBe(404);
	});

	// Expiry (#102)

	it("fails to join with an expired invite and deletes it", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const res = await api.post("/api/invites/expiredInvite1", {}, { headers });
		expect(res.status).toBe(410);
		expect(await res.json()).toStrictEqual({ message: "Invite Expired" });
		expect(await inviteExists("expiredInvite1")).toBe(false);
	});

	it("does not add the user to the group for an expired invite", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const res = await api.get("/api/groups/group00000000002", { headers });
		expect(res.status).toBe(404);
		expect(await memberIds("group00000000002", "user000000000002")).toStrictEqual([
			"user000000000002",
			"user000000000003"
		]);
	});

	it("responds with not found for an expired invite that was already deleted", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const res = await api.post("/api/invites/expiredInvite1", {}, { headers });
		expect(res.status).toBe(404);
		expect(await res.json()).toStrictEqual({ message: "Invite Not Found" });
	});

	// Joining

	it("joins the group with a valid invite", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		// The body is ignored, so it can't be used to pick another group, user or owner
		const body = {
			groupId: "group00000000001",
			userId: "user000000000003",
			ownerId: "user000000000001"
		};
		const res = await api.post("/api/invites/validInvite1", body, { headers });
		expect(res.status).toBe(200);
		expect(await res.json()).toStrictEqual({
			id: "group00000000002",
			name: "Bunch of Friends",
			ownerId: "user000000000002"
		});
	});

	it("can access the group after joining, without becoming its owner", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const res = await api.get("/api/groups/group00000000002", { headers });
		expect(res.status).toBe(200);
		expect(await res.json()).toStrictEqual({
			id: "group00000000002",
			name: "Bunch of Friends",
			ownerId: "user000000000002"
		});
		expect(await memberIds("group00000000002", "user000000000001")).toStrictEqual([
			"user000000000001",
			"user000000000002",
			"user000000000003"
		]);
	});

	it("keeps a valid invite after it's used so others can join", async () => {
		expect(await inviteExists("validInvite1")).toBe(true);
	});

	it("does not add a duplicate membership when joining again", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000001" });
		const res = await api.post("/api/invites/validInvite1", {}, { headers });
		expect(res.status).toBe(200);
		expect(await memberIds("group00000000002", "user000000000001")).toStrictEqual([
			"user000000000001",
			"user000000000002",
			"user000000000003"
		]);
	});

	it("responds with the group when already a member", async () => {
		const headers = await authTestHelper.getAuthHeaders({ userId: "user000000000002" });
		const res = await api.post("/api/invites/group1Invite", {}, { headers });
		expect(res.status).toBe(200);
		expect(await res.json()).toStrictEqual({
			id: "group00000000001",
			name: "Apartment 4B",
			ownerId: "user000000000001"
		});
		expect(await memberIds("group00000000001", "user000000000002")).toStrictEqual([
			"user000000000001",
			"user000000000002",
			"user000000000003"
		]);
	});
});
