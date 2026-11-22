import z from "zod";
import { idValidator } from "./id.ts";

export const transaction = z.strictObject({
	note: z.string().max(1024).nullable(),
	amount: z.number().min(0).max(99_999),
	fromId: idValidator,
	toId: idValidator
});

export type NewTransaction = z.infer<typeof transaction>;
