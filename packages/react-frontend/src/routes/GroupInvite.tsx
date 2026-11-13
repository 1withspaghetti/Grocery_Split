import { useNavigate, useParams } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { parseResponse } from "hono/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { client } from "@/lib/client";
import { parseInviteCode } from "@/lib/invite";
import { errorMessage, groupsQuery } from "@/lib/queries";

function GroupInvite() {
	const code = parseInviteCode(useParams().code ?? "");
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	// Only joins once the button is pressed, so opening a link never adds someone to a group by itself
	const mutation = useMutation({
		mutationFn: (code: string) =>
			parseResponse(client.api.invites[":code"].$post({ param: { code } })),
		onSuccess: (group) => {
			void queryClient.invalidateQueries({ queryKey: groupsQuery.queryKey });
			void navigate(`/groups/${group.id}/list`);
		}
	});

	if (!code) {
		return (
			<p className="text-sm text-muted-foreground">
				This invite link isn't valid. Check the code and try again.
			</p>
		);
	}

	return (
		<Card className="items-center gap-4 rounded-2xl p-5 text-center shadow-sm">
			<p className="text-sm text-muted-foreground">
				You've been invited to join a group with the code
			</p>
			<p className="font-mono text-lg font-semibold tracking-wider break-all">{code}</p>
			<Button
				size="lg"
				className="w-full rounded-full"
				disabled={mutation.isPending}
				onClick={() => mutation.mutate(code)}>
				{mutation.isPending ? "Joining…" : "Join group"}
			</Button>
			{mutation.error && (
				<p role="alert" className="text-sm text-destructive">
					{errorMessage(mutation.error)}
				</p>
			)}
		</Card>
	);
}

export default GroupInvite;
