import { queryOptions } from "@tanstack/react-query";
import { DetailedError, parseResponse } from "hono/client";
import { client } from "@/lib/client";

const groups = client.api.groups;
const group = groups[":groupId"];

// Keys are nested under the group, so invalidating ["groups", groupId] refreshes everything in it
export const groupsQuery = queryOptions({
	queryKey: ["groups"],
	queryFn: () => parseResponse(groups.$get())
});

export const groupQuery = (groupId: string) =>
	queryOptions({
		queryKey: ["groups", groupId],
		queryFn: () => parseResponse(group.$get({ param: { groupId } }))
	});

export const membersQuery = (groupId: string) =>
	queryOptions({
		queryKey: ["groups", groupId, "members"],
		queryFn: () => parseResponse(group.members.$get({ param: { groupId } }))
	});

export const tripsQuery = (groupId: string) =>
	queryOptions({
		queryKey: ["groups", groupId, "trips"],
		queryFn: () => parseResponse(group.trips.$get({ param: { groupId } }))
	});

export const tripQuery = (groupId: string, tripId?: string) =>
	queryOptions({
		queryKey: ["groups", groupId, "trips", tripId],
		enabled: tripId !== undefined,
		queryFn: () =>
			parseResponse(group.trips[":tripId"].$get({ param: { groupId, tripId: tripId! } }))
	});

export const itemsQuery = (groupId: string, tripId?: string) =>
	queryOptions({
		queryKey: ["groups", groupId, "trips", tripId, "items"],
		queryFn: () => parseResponse(group.items.$get({ param: { groupId }, query: { tripId } }))
	});

export const itemQuery = (groupId: string, itemId: string) =>
	queryOptions({
		queryKey: ["groups", groupId, "items", itemId],
		queryFn: () => parseResponse(group.items[":itemId"].$get({ param: { groupId, itemId } }))
	});

export const itemSharesQuery = (groupId: string, itemId: string) =>
	queryOptions({
		queryKey: ["groups", groupId, "items", itemId, "shares"],
		queryFn: () => parseResponse(group.items[":itemId"].shares.$get({ param: { groupId, itemId } }))
	});

// The API sends { message } with its errors, use that when it's there
export function errorMessage(error: Error) {
	if (error instanceof DetailedError) {
		const data = error.detail?.data as { message?: string } | undefined;
		if (data?.message) return data.message;
	}
	return "Something went wrong. Try again.";
}
