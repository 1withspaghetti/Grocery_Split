import { validator } from "@grocery-split/validation";
import { describe, expect, it } from "vitest";

describe("item validation", () => {
	const validItem = { name: "Milk", quantity: null, notes: null, price: 0 };

	it("accepts an item with a zero price", () => {
		expect(validator.item.safeParse(validItem).success).toBe(true);
	});

	it("rejects a negative price", () => {
		expect(validator.item.safeParse({ ...validItem, price: -1 }).success).toBe(false);
	});

	it("rejects an empty name", () => {
		expect(validator.item.safeParse({ ...validItem, name: "" }).success).toBe(false);
	});
});

describe("item share validation", () => {
	const first = { userId: "user000000000001", parts: 1 };
	const second = { userId: "user000000000002", parts: 2 };

	it("accepts shares for two different users", () => {
		expect(validator.itemShares.safeParse([first, second]).success).toBe(true);
	});

	it("rejects an empty list of shares", () => {
		expect(validator.itemShares.safeParse([]).success).toBe(false);
	});

	it("rejects multiple shares for the same user", () => {
		expect(validator.itemShares.safeParse([first, { ...first, parts: 2 }]).success).toBe(false);
	});
});
