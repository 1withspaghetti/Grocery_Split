import type { Group } from "./group.ts";
import type { ID } from "./id.ts";
import type { User } from "./user.ts";

export interface Transaction {
	id: ID;
	groupId: Group["id"];
	note: string | null;
	amount: number;
	fromId: User["id"];
	toId: User["id"];
	createdAt: number;
	createdById: User["id"];
}
