import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseResponse } from "hono/client";
import { Wallet } from "lucide-react";
import { client } from "@/lib/client";
import { errorMessage, membersQuery, tripQuery, tripsQuery } from "@/lib/queries";

// Lets anyone in the group pick who paid for a trip (or that nobody has yet)
function TripPaidBySelect({ groupId, tripId }: { groupId: string; tripId: string }) {
	const queryClient = useQueryClient();
	const { data: trip } = useQuery(tripQuery(groupId, tripId));
	const { data: members } = useQuery(membersQuery(groupId));
	const save = useMutation({
		mutationFn: (paidById: string | null) =>
			parseResponse(
				client.api.groups[":groupId"].trips[":tripId"].$patch({
					param: { groupId, tripId },
					json: { name: trip!.name, paidById }
				})
			),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: tripsQuery(groupId).queryKey });
		}
	});

	if (!trip || !members) return null;

	return (
		<div className="flex flex-col gap-1">
			<label className="flex items-center gap-2 text-sm text-muted-foreground">
				<Wallet aria-hidden="true" className="size-4" />
				Paid by
				<select
					value={trip.paidById ?? ""}
					disabled={save.isPending}
					onChange={(e) => save.mutate(e.target.value || null)}
					className="h-9 rounded-3xl border border-transparent bg-input/50 px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30">
					<option value="">Not paid yet</option>
					{members.map((member) => (
						<option key={member.id} value={member.id}>
							{member.name}
						</option>
					))}
				</select>
			</label>
			{save.error && (
				<p role="alert" className="text-sm text-destructive">
					{errorMessage(save.error)}
				</p>
			)}
		</div>
	);
}

export default TripPaidBySelect;
