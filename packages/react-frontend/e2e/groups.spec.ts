import { test, expect, users, apartment4B } from "./fixtures.ts";

// User story (#16): As a roommate, I want to create a household group so that I can manage
// grocery purchases with the people I live with.
test.describe("my groups", () => {
	test("sends a signed out visitor to the sign in page", async ({ page }) => {
		await page.goto("/groups");

		await expect(page).toHaveURL("/");
		await expect(page.getByRole("button", { name: "Sign in with Google" })).toBeVisible();
	});

	test("shows a signed in user only the groups they belong to", async ({ page, signInAs }) => {
		await signInAs(users.jake.id);
		await page.goto("/groups");

		const groups = page.getByRole("region", { name: "Your groups" });
		await expect(page.getByRole("heading", { name: "My Groups" })).toBeVisible();
		await expect(groups.getByRole("heading", { name: apartment4B.name })).toBeVisible();
		// Jake isn't a member of "Bunch of Friends"
		await expect(groups.getByRole("heading", { name: "Bunch of Friends" })).toHaveCount(0);
	});

	test("creates a group that is still there after a refresh", async ({ page, signInAs }) => {
		await signInAs(users.marilyn.id);
		await page.goto("/groups");

		await page.getByRole("button", { name: "Create a group" }).click();
		await page.getByRole("textbox", { name: "Group name" }).fill("Dorm Room 12");
		await page.getByRole("button", { name: "Add", exact: true }).click();

		const groups = page.getByRole("region", { name: "Your groups" });
		await expect(groups.getByRole("heading", { name: "Dorm Room 12" })).toBeVisible();
		// The form closes once the group is saved
		await expect(page.getByRole("textbox", { name: "Group name" })).toHaveCount(0);

		// Reloading fetches the list from the API again, so this proves it was saved to the database
		await page.reload();
		await expect(groups.getByRole("heading", { name: "Dorm Room 12" })).toBeVisible();
	});
});
