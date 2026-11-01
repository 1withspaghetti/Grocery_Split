import { useId, useState, type FormEvent } from "react";
import { validator, type Group, type User } from "@grocery-split/validation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseResponse } from "hono/client";
import { useParams } from "react-router";
import { UserAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient, client } from "@/lib/client";
import { errorMessage, groupQuery, groupsQuery, membersQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";
import type { Group, User } from "@grocery-split/validation";

interface GroupSettingsFormProps {
	group: Group;
	members: User[];
}

function GroupSettingsForm({ group, members }: GroupSettingsFormProps) {
	const { data: session } = authClient.useSession();
	const queryClient = useQueryClient();
	const nameId = useId();
	const [name, setName] = useState(group.name);
	const [nameError, setNameError] = useState("");
	const [nameStatus, setNameStatus] = useState("");
	const [newOwner, setNewOwner] = useState(group.ownerId);
	const [ownerStatus, setOwnerStatus] = useState("");
	const param = { groupId: group.id };
	const isOwner = session?.user.id === group.ownerId;

	const rename = useMutation({
		mutationFn: (name: string) =>
			parseResponse(client.api.groups[":groupId"].$patch({ param, json: { name } })),
		onSuccess: () => {
			setNameStatus("Group name saved.");
			// The name also shows in the groups list, so refresh from the top
			void queryClient.invalidateQueries({ queryKey: groupsQuery.queryKey });
		},
		onError: (error) => setNameError(errorMessage(error))
	});

	const transfer = useMutation({
		mutationFn: (ownerId: string) =>
			parseResponse(client.api.groups[":groupId"].owner.$patch({ param, json: { ownerId } })),
		onSuccess: () => {
			setOwnerStatus("Ownership transferred.");
			void queryClient.invalidateQueries({ queryKey: groupQuery(group.id).queryKey });
		},
		onError: (error) => setOwnerStatus(errorMessage(error))
	});

	function handleRename(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const result = validator.group.safeParse({ name: name.trim() });
		if (!result.success) {
			setNameError("Enter a name to continue.");
			return;
		}
		rename.mutate(result.data.name);
	}

	function handleTransfer(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const result = validator.groupOwner.safeParse({ ownerId: newOwner });
		if (!result.success) {
			setOwnerStatus("Pick a member to transfer ownership to.");
			return;
		}
		transfer.mutate(result.data.ownerId);
	}

	return (
		<div className="flex flex-col gap-5">
			<Card className="gap-0 rounded-2xl p-4 shadow-sm sm:p-5">
				<form noValidate onSubmit={handleRename} className="flex flex-col gap-3">
					<label htmlFor={nameId} className="font-heading text-base font-semibold">
						Group name
					</label>
					<Input
						id={nameId}
						name="name"
						value={name}
						onChange={(event) => {
							setName(event.target.value);
							setNameError("");
							setNameStatus("");
						}}
						required
						maxLength={128}
						autoComplete="off"
						aria-invalid={Boolean(nameError)}
						aria-describedby={nameError ? `${nameId}-error` : undefined}
						className="h-12 rounded-xl px-4 text-base md:text-base"
					/>
					{nameError && (
						<p id={`${nameId}-error`} role="alert" className="text-sm text-destructive">
							{nameError}
						</p>
					)}
					{nameStatus && (
						<p role="status" className="text-sm text-muted-foreground">
							{nameStatus}
						</p>
					)}
					<Button
						type="submit"
						disabled={name.trim() === group.name || rename.isPending}
						className="h-11 w-full rounded-xl font-semibold">
						Save name
					</Button>
				</form>
			</Card>

			<Card className="gap-0 rounded-2xl p-4 shadow-sm sm:p-5">
				<form onSubmit={handleTransfer} className="flex flex-col gap-3">
					<fieldset disabled={!isOwner} className="flex flex-col gap-3">
						<legend className="mb-1 font-heading text-base font-semibold">Group owner</legend>
						<p className="text-sm text-muted-foreground">
							{isOwner
								? "Pick a member to hand ownership of this group to."
								: "Only the current owner can hand this group to someone else."}
						</p>
						<div className="flex flex-col gap-2">
							{members.map((member) => (
								<label
									key={member.id}
									className={cn(
										"flex min-h-12 items-center gap-3 rounded-xl border px-3 py-2 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring",
										isOwner && "cursor-pointer",
										newOwner === member.id
											? "border-primary bg-primary/5"
											: isOwner && "hover:bg-muted/30"
									)}>
									<input
										type="radio"
										name="owner"
										value={member.id}
										checked={newOwner === member.id}
										onChange={() => {
											setNewOwner(member.id);
											setOwnerStatus("");
										}}
										className="sr-only"
									/>
									<UserAvatar user={member} size="sm" />
									<span className="flex-1 text-sm font-medium">{member.name}</span>
									{member.id === group.ownerId && (
										<span className="text-xs text-muted-foreground">Current owner</span>
									)}
								</label>
							))}
						</div>
					</fieldset>
					{ownerStatus && (
						<p role="status" className="text-sm text-muted-foreground">
							{ownerStatus}
						</p>
					)}
					<Button
						type="submit"
						variant="outline"
						disabled={!isOwner || newOwner === group.ownerId || transfer.isPending}
						className="h-11 w-full rounded-xl font-semibold">
						Transfer ownership
					</Button>
				</form>
			</Card>
		</div>
	);
}

function GroupSettings() {
	const { groupId = "" } = useParams();
	const group = useQuery(groupQuery(groupId));
	const members = useQuery(membersQuery(groupId));

	if (group.isError || members.isError) {
		return <p className="text-sm text-muted-foreground">This group couldn't be found.</p>;
	}
	if (group.isPending || members.isPending) {
		return <p className="text-sm text-muted-foreground">Loading group…</p>;
	}

	return <GroupSettingsForm key={group.data.id} group={group.data} members={members.data} />;
}

export default GroupSettings;
