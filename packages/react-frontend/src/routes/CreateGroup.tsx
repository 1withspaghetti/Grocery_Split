import { validator } from "@grocery-split/validation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { parseResponse } from "hono/client";
import { useNavigate } from "react-router";
import CreateNameForm from "@/components/CreateNameForm";
import { client } from "@/lib/client";
import { errorMessage, groupsQuery } from "@/lib/queries";

function CreateGroup() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const mutation = useMutation({
		mutationFn: (name: string) => parseResponse(client.api.groups.$post({ json: { name } })),
		onSuccess: (group) => {
			void queryClient.invalidateQueries({ queryKey: groupsQuery.queryKey });
			void navigate(`/groups/${group.id}/trips`);
		}
	});

	return (
		<CreateNameForm
			label="Group name"
			placeholder="Apartment 4B"
			description="You can invite roommates right after it's created."
			schema={validator.group}
			onCreate={mutation.mutate}
			isPending={mutation.isPending}
			createError={mutation.error ? errorMessage(mutation.error) : undefined}
		/>
	);
}

export default CreateGroup;
