import { exports, env } from "cloudflare:workers";
import { describe, it, expect } from "vitest";

describe("base worker", () => {
	it("responds with not found and proper message for /404", async () => {
		const response = await exports.default.fetch(`${env.API_BASE}/404`);
		expect(response.status).toBe(404);
		expect(await response.json()).toStrictEqual({ message: "Not Found" });
	});
});
