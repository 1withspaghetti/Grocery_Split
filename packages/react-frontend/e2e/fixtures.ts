import { test as base, expect } from "@playwright/test";
import { API_BASE } from "../playwright.config.ts";

// Seeded users (packages/db/src/seed/data.ts), the same ones the API tests use
export const users = {
	jake: { id: "user000000000001", name: "Jake" }, // owner of Apartment 4B
	marilyn: { id: "user000000000002", name: "Marilyn" } // in Apartment 4B and Bunch of Friends
};

export const apartment4B = { id: "group00000000001", name: "Apartment 4B" };

// Google sign in can't be automated, so `signInAs` asks the test-only API route for a real session cookie
// (better-auth's testUtils plugin, the same thing the API tests use) and gives it to the browser.
export const test = base.extend<{ signInAs: (userId: string) => Promise<void> }>({
	// (`provide` is Playwright's fixture callback, usually called `use`, renamed so the React hooks lint rule ignores it)
	signInAs: async ({ context, request }, provide) => {
		await provide(async (userId) => {
			const res = await request.post(`${API_BASE}/api/test/login`, { data: { userId } });
			expect(res.status()).toBe(200);
			await context.addCookies(await res.json());
		});
	}
});

export { expect };
