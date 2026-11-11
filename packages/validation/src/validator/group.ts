import z from "zod";
import { idValidator } from "./id.ts";

export const group = z.strictObject({
	name: z.string().min(1).max(128)
});

export type NewGroup = z.infer<typeof group>;

export const groupOwner = z.strictObject({
	ownerId: idValidator
});

export type UpdateGroupOwner = z.infer<typeof groupOwner>;

export const invite = z.strictObject({
	expires: z.iso.datetime().transform((str) => new Date(str))
});

export type NewInvite = z.infer<typeof invite>;
