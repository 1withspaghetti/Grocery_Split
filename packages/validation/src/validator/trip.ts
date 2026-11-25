import z from "zod";
import { idValidator } from "./id.ts";

export const trip = z.strictObject({
	name: z.string().min(1).max(128),
	paidById: idValidator.nullable().optional() // null if nobody has paid for the trip yet
});

export type NewTrip = z.infer<typeof trip>;
