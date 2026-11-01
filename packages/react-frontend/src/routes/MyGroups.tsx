import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { AvatarGroup, UserAvatar } from "@/components/ui/avatar";
import { Link } from "react-router";
import { ChevronRight, Users } from "lucide-react";
import AddButton from "@/components/AddButton";
import { authClient } from "@/lib/client";
import { errorMessage, groupsQuery, membersQuery } from "@/lib/queries";
import type { User } from "@grocery-split/validation";

function GroupCard({ group }: { group: { id: string; name: string } }) {
	const { data: members } = useQuery(membersQuery(group.id));

	return (
		<Link
			to={`/groups/${group.id}/list`}
			className="min-w-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
			<Card className="h-full flex-row items-stretch gap-0 rounded-2xl p-0 shadow-sm transition-colors hover:bg-muted/30">
				<div className="flex min-w-0 flex-1 items-center gap-2 p-3 sm:gap-3 sm:p-4">
					<div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-muted font-heading font-semibold text-muted-foreground sm:size-10">
						{group.name[0]}
					</div>
					<div className="min-w-0 flex-1">
						<h2 className="truncate text-sm font-semibold sm:text-base" title={group.name}>
							{group.name}
						</h2>
						<AvatarGroup className="mt-2">
							{members?.map((member) => (
								<UserAvatar key={member.id} user={member} size="sm" />
							))}
						</AvatarGroup>
					</div>
					<ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
				</div>
			</Card>
		</Link>
	);
}

function MyGroups() {
	const { data: session } = authClient.useSession();
	const { data: groups, error, isPending } = useQuery(groupsQuery);

	return (
		<main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-5 bg-background p-4 sm:gap-6 sm:p-6 lg:p-8">
			<header className="flex items-center justify-between gap-4">
				<h1 className="font-heading text-xl font-bold sm:text-2xl">My Groups</h1>
				{session && <UserAvatar user={session.user as User} />}
			</header>

			<section aria-label="Your groups" className="grid grid-cols-1 gap-3 sm:gap-4">
				{isPending && <p className="text-sm text-muted-foreground">Loading groups…</p>}
				{error && (
					<p role="alert" className="text-sm text-destructive">
						{errorMessage(error)}
					</p>
				)}
				{groups?.map((group) => (
					<GroupCard key={group.id} group={group} />
				))}
				{groups?.length === 0 && (
					<Card className="items-center gap-3 rounded-2xl px-6 py-12 text-center shadow-sm">
						<Users aria-hidden="true" className="size-8 text-primary" />
						<h2 className="font-heading text-lg font-semibold">No groups yet</h2>
						<p className="text-sm text-muted-foreground">
							Create a group to start splitting your groceries.
						</p>
					</Card>
				)}
			</section>

			<AddButton to="/groups/new-group" label="Create a group" />
		</main>
	);
}

export default MyGroups;
