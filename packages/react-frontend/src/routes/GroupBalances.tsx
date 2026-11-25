import { useQueries, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { ArrowRight, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/avatar";
import EmptyState from "@/components/EmptyState";
import { calculateBalances } from "@/lib/balances";
import {
	errorMessage,
	itemsQuery,
	membersQuery,
	transactionsQuery,
	tripsQuery
} from "@/lib/queries";
import { cn, formatPrice } from "@/lib/utils";

function GroupBalances() {
	const { groupId = "" } = useParams();
	const trips = useQuery(tripsQuery(groupId));
	const members = useQuery(membersQuery(groupId));
	const transactions = useQuery(transactionsQuery(groupId));
	// Only trips someone paid for count towards balances (same queries as the trip cards, so they're usually cached)
	const paidTrips = trips.data?.filter((trip) => trip.paidById) ?? [];
	const tripItems = useQueries({
		queries: paidTrips.map((trip) => itemsQuery(groupId, trip.id))
	});

	const queries = [trips, members, transactions, ...tripItems];
	const error = queries.find((query) => query.error)?.error;

	if (error) {
		return (
			<p role="alert" className="text-sm text-destructive">
				{errorMessage(error)}
			</p>
		);
	}

	if (queries.some((query) => query.isPending)) {
		return <p className="text-sm text-muted-foreground">Loading balances…</p>;
	}

	const { debts, totals } = calculateBalances(
		paidTrips,
		new Map(paidTrips.map((trip, index) => [trip.id, tripItems[index].data ?? []])),
		transactions.data ?? []
	);
	const memberById = new Map(members.data?.map((member) => [member.id, member]));

	return (
		<section aria-label="Group balances" className="flex flex-col gap-4">
			<h2 className="font-heading text-lg font-semibold">Who owes who</h2>
			{debts.length === 0 ? (
				<EmptyState
					icon={Wallet}
					title="Everyone is settled up"
					description="Balances come from priced items on trips that someone paid for."
				/>
			) : (
				<ul aria-label="Who owes who" className="flex flex-col gap-3">
					{debts.map((debt) => {
						const from = memberById.get(debt.fromId);
						const to = memberById.get(debt.toId);
						return (
							<li key={`${debt.fromId}-${debt.toId}`}>
								<Card className="flex-row items-center gap-3 rounded-2xl p-3 shadow-sm sm:p-4">
									{from && <UserAvatar user={from} size="sm" />}
									<p className="min-w-0 flex-1 text-sm">
										<span className="font-semibold">{from?.name ?? "Former member"}</span> owes{" "}
										<span className="font-semibold">{to?.name ?? "Former member"}</span>
									</p>
									<ArrowRight
										aria-hidden="true"
										className="size-4 shrink-0 text-muted-foreground"
									/>
									<p className="font-heading text-base font-bold tabular-nums">
										{formatPrice(debt.amount)}
									</p>
								</Card>
							</li>
						);
					})}
				</ul>
			)}

			<h2 className="font-heading text-lg font-semibold">Totals</h2>
			<ul aria-label="Totals" className="flex flex-col gap-3">
				{members.data?.map((member) => {
					const total = totals.get(member.id) ?? 0;
					return (
						<li key={member.id}>
							<Card className="flex-row items-center gap-3 rounded-2xl p-3 shadow-sm sm:p-4">
								<UserAvatar user={member} size="sm" />
								<p className="min-w-0 flex-1 truncate text-sm font-semibold">{member.name}</p>
								<p
									className={cn(
										"text-sm font-semibold tabular-nums",
										total > 0 && "text-emerald-700",
										total < 0 && "text-destructive",
										total === 0 && "text-muted-foreground"
									)}>
									{total > 0
										? `gets back ${formatPrice(total)}`
										: total < 0
											? `owes ${formatPrice(-total)}`
											: "settled up"}
								</p>
							</Card>
						</li>
					);
				})}
			</ul>
		</section>
	);
}

export default GroupBalances;
