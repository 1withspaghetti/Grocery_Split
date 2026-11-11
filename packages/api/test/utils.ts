import { env, exports } from "cloudflare:workers";

export const api = {
	get: async (path: string, init?: RequestInit): Promise<Response> => {
		return await exports.default.fetch(env.API_BASE + path, { method: "GET", ...init });
	},

	post: async (path: string, body: unknown, init?: RequestInit): Promise<Response> => {
		const headers = new Headers(init?.headers);
		headers.set("Content-Type", "application/json");
		return await exports.default.fetch(env.API_BASE + path, {
			method: "POST",
			body: JSON.stringify(body),
			...init,
			headers
		});
	},

	patch: async (path: string, body: unknown, init?: RequestInit): Promise<Response> => {
		const headers = new Headers(init?.headers);
		headers.set("Content-Type", "application/json");
		return await exports.default.fetch(env.API_BASE + path, {
			method: "PATCH",
			body: JSON.stringify(body),
			...init,
			headers
		});
	},

	delete: async (path: string, init?: RequestInit): Promise<Response> => {
		return await exports.default.fetch(env.API_BASE + path, { method: "DELETE", ...init });
	}
};
