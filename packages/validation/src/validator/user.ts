import z from "zod";

export const user = z.strictObject({
	email: z.email(),
	name: z.string().min(1).max(128)
});

export type NewUser = z.infer<typeof user>;
