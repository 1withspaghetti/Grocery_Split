import { test, expect, users, apartment4B } from "./fixtures.ts";

// User story (#22): As a roommate, I want to specify which roommates are sharing a grocery item
// so that people are only charged for items they use.
test.describe("group shopping list", () => {
	test.beforeEach(async ({ page, signInAs }) => {
		await signInAs(users.jake.id);
		await page.goto(`/groups/${apartment4B.id}/list`);
		await expect(page.getByRole("button", { name: "Edit Orange Chicken" })).toBeVisible();
	});

	test("adds an item shared with a roommate", async ({ page }) => {
		const list = page.getByRole("region", { name: "Group shopping list" });

		await page.getByRole("button", { name: "Add an item" }).click();
		await page.getByRole("textbox", { name: "Name", exact: true }).fill("Oat Milk");
		await page.getByRole("textbox", { name: "Quantity", exact: true }).fill("2 cartons");
		// Split it with Marilyn
		await page.getByRole("button", { name: "Add user" }).click();
		await page
			.getByRole("combobox")
			.filter({ hasText: "Choose a group member" })
			.selectOption({ label: users.marilyn.name });
		await expect(page.getByLabel(`Shares for ${users.marilyn.name}`)).toHaveValue("1");
		await page.getByRole("button", { name: "Add", exact: true }).click();

		const row = list.getByRole("button", { name: "Edit Oat Milk" });
		await expect(row).toBeVisible();
		await expect(row).toContainText("2 cartons");

		// Still there after a refresh, so it was saved by the API
		await page.reload();
		await expect(list.getByRole("button", { name: "Edit Oat Milk" })).toBeVisible();
	});

	test("won't add an item that nobody is sharing", async ({ page }) => {
		const list = page.getByRole("region", { name: "Group shopping list" });

		await page.getByRole("button", { name: "Add an item" }).click();
		await page.getByRole("textbox", { name: "Name", exact: true }).fill("Paper Towels");
		await page.getByRole("button", { name: "Add", exact: true }).click();

		await expect(page.getByRole("alert")).toHaveText("Pick at least one member to split with.");

		// Nothing was saved
		await page.reload();
		await expect(list.getByRole("button", { name: "Edit Orange Chicken" })).toBeVisible();
		await expect(list.getByRole("button", { name: "Edit Paper Towels" })).toHaveCount(0);
	});
});
