import { generatePath, Link, NavLink, Outlet, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ListChecks, Settings, ShoppingCart, UserPlus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from "@/components/ui/dialog";
import { usePageHandle } from "@/components/AppLayout";
import { groupQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

const tabs = [
	{ label: "Trips", path: "/groups/:groupId/trips", icon: ShoppingCart },
	{ label: "List", path: "/groups/:groupId/list", icon: ListChecks },
	{ label: "Balances", path: "/groups/:groupId/balances", icon: Wallet }
];

function GroupTabs() {
	const params = useParams();
	const page = usePageHandle();
	const groupId = params.groupId ?? "";
	const { data: group, isPending } = useQuery(groupQuery(groupId));

	if (isPending) {
		return (
			<main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-4 p-4 sm:p-6 lg:p-8">
				<p className="text-sm text-muted-foreground">Loading group…</p>
			</main>
		);
	}

	if (!group) {
		return (
			<main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-4 p-4 sm:p-6 lg:p-8">
				<h1 className="font-heading text-xl font-bold">Group not found</h1>
				<Link to="/groups/" className="w-fit underline underline-offset-4">
					Back to My Groups
				</Link>
			</main>
		);
	}

	return (
		<main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-5 bg-background p-4 sm:gap-6 sm:p-6 lg:p-8">
			<header className="flex flex-col gap-4">
				<div className="flex items-center gap-2 sm:gap-3">
					<Button
						variant="ghost"
						size="icon"
						className="-ml-2 size-10"
						aria-label="Go back"
						nativeButton={false}
						render={<Link to={generatePath(page?.handle.back ?? "/groups/", params)} />}>
						<ChevronLeft aria-hidden="true" className="size-5" />
					</Button>
					<div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary font-heading text-lg font-semibold">
						{group.name[0]}
					</div>
					<h1 className="min-w-0 flex-1 font-heading text-xl font-bold break-words sm:text-2xl">
						{group.name}
					</h1>
					<Dialog>
						<DialogTrigger render={<Button variant="outline" className="h-11 rounded-xl" />}>
							<UserPlus aria-hidden="true" className="size-4" />
							Invite
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Invite to {group.name}</DialogTitle>
								<DialogDescription>
									Sharing group invitations isn't available yet.
								</DialogDescription>
							</DialogHeader>
						</DialogContent>
					</Dialog>
					<Button
						variant="ghost"
						size="icon"
						className="size-10"
						aria-label="Group settings"
						nativeButton={false}
						render={<Link to={generatePath("/groups/:groupId/settings", { groupId: group.id })} />}>
						<Settings aria-hidden="true" className="size-5" />
					</Button>
				</div>
			</header>

			<div className="flex flex-1 flex-col gap-5 sm:gap-6">
				<Outlet />
			</div>

			{/* Bottom tabs, pinned to the bottom of the screen while scrolling */}
			<nav
				aria-label="Group sections"
				className="sticky bottom-0 -mx-4 -mb-4 border-t bg-background px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:-mx-6 sm:-mb-6 sm:px-6 lg:-mx-8 lg:-mb-8 lg:px-8">
				<div className="grid grid-cols-3 gap-1 rounded-2xl bg-secondary/60 p-1">
					{tabs.map(({ label, path, icon: Icon }) => (
						<NavLink
							key={label}
							to={generatePath(path, params)}
							className={({ isActive }) =>
								cn(
									"flex min-h-11 items-center justify-center gap-2 rounded-xl px-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-12",
									isActive
										? "bg-card text-foreground shadow-sm"
										: "text-muted-foreground hover:bg-card/50 hover:text-foreground"
								)
							}>
							<Icon aria-hidden="true" className="hidden size-4 sm:block" />
							{label}
						</NavLink>
					))}
				</div>
			</nav>
		</main>
	);
}

export default GroupTabs;
