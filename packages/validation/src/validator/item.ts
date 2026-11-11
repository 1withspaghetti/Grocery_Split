import z from "zod";
import { idValidator } from "./id.ts";

export const item = z.strictObject({
	name: z.string().min(1).max(128),
	quantity: z.string().max(128).nullable(),
	notes: z.string().max(1024).nullable(),
	price: z.number().min(0).max(99_999).nullable(),
	tripId: idValidator.nullable().optional()
});

export type NewItem = z.infer<typeof item>;

export const wantedItem = z.strictObject({
	userId: idValidator,
	parts: z.int32().min(1)
});

export type NewWantedItem = z.infer<typeof wantedItem>;

export const itemShares = z
	.array(wantedItem)
	.min(1)
	.refine(
		(shares) => new Set(shares.map((share) => share.userId)).size === shares.length,
		"Each user can have only one share entry"
	);

export type ItemShares = z.infer<typeof itemShares>;
