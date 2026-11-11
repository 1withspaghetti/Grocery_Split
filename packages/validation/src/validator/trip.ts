import z from "zod";

export const trip = z.strictObject({
	name: z.string().min(1).max(128)
});

export type NewTrip = z.infer<typeof trip>;
