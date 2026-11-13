import z from "zod";
import { idValidator } from "./id.ts";

export const groupParams = z.object({
	groupId: idValidator
});

export const groupTripParams = z.object({
	groupId: idValidator,
	tripId: idValidator
});

export const groupItemParams = z.object({
	groupId: idValidator,
	itemId: idValidator
});

export const inviteParams = z.object({
	code: z.string().regex(/^[0-9a-zA-Z]{1,16}$/, "Invalid Invite Code")
});

export const tripQuery = z.object({
	tripId: idValidator.optional()
});

// How an item list is sorted, defaults to oldest first so new items are added to the bottom
export const itemSort = z.object({
	sort: z.enum(["createdAt", "name", "price"]).default("createdAt"),
	order: z.enum(["asc", "desc"]).default("asc")
});

export type ItemSort = z.infer<typeof itemSort>;

export const itemListQuery = tripQuery.extend(itemSort.shape);
