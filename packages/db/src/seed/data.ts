import type { schema } from "../index.ts";

const emptyDate = new Date("01-01-2000");
const emptyTime = emptyDate.getTime();

export const users: (typeof schema.user.$inferInsert)[] = [
	{
		id: "user000000000001",
		email: "user1@example.com",
		name: "Jake",
		createdAt: emptyDate,
		updatedAt: emptyDate,
		emailVerified: true
	},
	{
		id: "user000000000002",
		email: "user2@example.com",
		name: "Marilyn",
		createdAt: emptyDate,
		updatedAt: emptyDate,
		emailVerified: true
	},
	{
		id: "user000000000003",
		email: "user3@example.com",
		name: "Conner",
		createdAt: emptyDate,
		updatedAt: emptyDate,
		emailVerified: true
	}
];

export const groups: (typeof schema.group.$inferInsert)[] = [
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
];

export const memberships: (typeof schema.membership.$inferInsert)[] = [
	{
		userId: "user000000000001",
		groupId: "group00000000001",
		createdAt: emptyTime
	},
	{
		userId: "user000000000002",
		groupId: "group00000000001",
		createdAt: emptyTime
	},
	{
		userId: "user000000000003",
		groupId: "group00000000001",
		createdAt: emptyTime
	},
	{
		userId: "user000000000002",
		groupId: "group00000000002",
		createdAt: emptyTime
	},
	{
		userId: "user000000000003",
		groupId: "group00000000002",
		createdAt: emptyTime
	}
];

export const trips: (typeof schema.trip.$inferInsert)[] = [
	{
		id: "trip000000000001",
		groupId: "group00000000001",
		name: "Trader Joes 10/8",
		createdById: "user000000000001",
		createdAt: emptyTime
	},
	{
		id: "trip000000000002",
		groupId: "group00000000001",
		name: "Costco",
		createdById: "user000000000002",
		createdAt: emptyTime
	},
	{
		id: "trip000000000003",
		groupId: "group00000000002",
		name: "Food4Less",
		createdById: "user000000000002",
		createdAt: emptyTime
	}
];

export const items: (typeof schema.item.$inferInsert)[] = [
	{
		id: "item000000000001",
		groupId: "group00000000001",
		name: "Orange Chicken",
		quantity: "1 bag",
		notes: "The good tasting one",
		createdById: "user000000000001",
		createdAt: emptyTime
	},
	{
		id: "item000000000002",
		groupId: "group00000000001",
		name: "Cheese",
		quantity: "shredded cheddar",
		createdById: "user000000000002",
		createdAt: emptyTime
	},
	{
		id: "item000000000003",
		groupId: "group00000000001",
		tripId: "trip000000000001",
		name: "Chicken Tikka Masala",
		quantity: "1 bag",
		createdById: "user000000000001",
		createdAt: emptyTime
	},
	{
		id: "item000000000004",
		groupId: "group00000000001",
		tripId: "trip000000000001",
		name: "Pizza Dough",
		createdById: "user000000000002",
		createdAt: emptyTime
	},
	{
		id: "item000000000005",
		groupId: "group00000000001",
		tripId: "trip000000000002",
		name: "Milk 2%",
		quantity: "2 gals",
		createdById: "user000000000002",
		createdAt: emptyTime
	},
	{
		id: "item000000000006",
		groupId: "group00000000002",
		tripId: "trip000000000003",
		name: "Blueberries",
		quantity: "small box",
		createdById: "user000000000003",
		createdAt: emptyTime
	},
	{
		id: "item000000000007",
		groupId: "group00000000002",
		tripId: "trip000000000003",
		name: "Arizona Iced tea",
		notes: "Mucho Mango... yummy",
		createdById: "user000000000003",
		createdAt: emptyTime
	}
];

export const wantedItems: (typeof schema.wantedItem.$inferInsert)[] = [
	{
		itemId: "item000000000001",
		userId: "user000000000001",
		parts: 2
	},
	{
		itemId: "item000000000001",
		userId: "user000000000002",
		parts: 1
	},
	{
		itemId: "item000000000002",
		userId: "user000000000002",
		parts: 1
	},
	{
		itemId: "item000000000003",
		userId: "user000000000001",
		parts: 1
	},
	{
		itemId: "item000000000004",
		userId: "user000000000001",
		parts: 1
	},
	{
		itemId: "item000000000004",
		userId: "user000000000002",
		parts: 1
	},
	{
		itemId: "item000000000005",
		userId: "user000000000001",
		parts: 1
	},
	{
		itemId: "item000000000005",
		userId: "user000000000002",
		parts: 1
	},
	{
		itemId: "item000000000006",
		userId: "user000000000003",
		parts: 1
	},
	{
		itemId: "item000000000007",
		userId: "user000000000002",
		parts: 1
	},
	{
		itemId: "item000000000007",
		userId: "user000000000003",
		parts: 2
	}
];
