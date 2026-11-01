import type { ID } from "./id.ts";
import type { Group } from "./group.ts";
import type { Trip } from "./trip.ts";
import type { User } from "./user.ts";

export interface Item {
	id: ID;
	groupId: Group["id"];
	tripId: Trip["id"] | null;
	name: string;
	quantity: string | null;
	notes: string | null;
	price: number | null;
	createdAt: number;
	createdById: User["id"];
}

export interface PopulatedItem extends Item {
	wantedBy: PopulatedWantedItem[];
}

export interface WantedItem {
	itemId: Item["id"];
	userId: User["id"];
	parts: number;
}

export interface PopulatedWantedItem extends WantedItem {
	user: User;
}
