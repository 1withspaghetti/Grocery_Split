import type { Group } from "./group.ts";
import type { ID } from "./id.ts";
import type { User } from "./user.ts";

export interface Trip {
	id: ID;
	name: string;
	groupId: Group["id"];
	createdAt: number;
	createdById: User["id"];
}
