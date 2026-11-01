import { validator } from "@grocery-split/validation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { parseResponse } from "hono/client";
import { useNavigate, useParams } from "react-router";
import CreateNameForm from "@/components/CreateNameForm";
import { client } from "@/lib/client";
import { errorMessage, tripsQuery } from "@/lib/queries";

function CreateTrip() {
	const { groupId = "" } = useParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const mutation = useMutation({
		mutationFn: (name: string) =>
			parseResponse(
				client.api.groups[":groupId"].trips.$post({ param: { groupId }, json: { name } })
			),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: tripsQuery(groupId).queryKey });
			void navigate(`/groups/${groupId}/trips`);
		}
	});
	const date = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });

	return (
		<CreateNameForm
			label="Trip name"
			placeholder="Trader Joe's"
			description={`Tip: name it after the store — the date is added for you (${date}).`}
			schema={validator.trip}
			onCreate={mutation.mutate}
			isPending={mutation.isPending}
			createError={mutation.error ? errorMessage(mutation.error) : undefined}
		/>
	);
}

export default CreateTrip;
