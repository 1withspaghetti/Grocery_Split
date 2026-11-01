import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { ShoppingCart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { errorMessage, itemsQuery, tripsQuery } from "@/lib/queries";
import { cn, formatPrice } from "@/lib/utils";
import AddButton from "@/components/AddButton";
import type { Trip } from "@grocery-split/validation";

interface TripCardProps {
	groupId: string;
	trip: Trip;
}

function TripCard({ groupId, trip }: TripCardProps) {
	const { data: items } = useQuery(itemsQuery(groupId, trip.id));
	const pendingCount = items?.filter((item) => item.price === null).length ?? 0;
	const total = items?.reduce((sum, item) => sum + (item.price ?? 0), 0) ?? 0;

	return (
		<Link
			to={`/groups/${groupId}/trips/${trip.id}`}
			className="min-w-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
			<Card className="gap-4 rounded-2xl p-4 shadow-sm transition-colors hover:bg-muted/30 sm:p-5">
				<div className="flex items-center justify-between gap-3">
					<div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
						<ShoppingCart aria-hidden="true" className="size-5" />
					</div>
					{items && (
						<span
							className={cn(
								"flex h-9 w-28 shrink-0 items-center justify-center rounded-md text-xs font-semibold",
								pendingCount ? "bg-orange-100 text-orange-800" : "bg-emerald-100 text-emerald-800"
							)}>
							{pendingCount ? `${pendingCount} pending` : "All priced"}
						</span>
					)}
				</div>
				<div>
					<h2 className="font-heading text-lg font-semibold break-words">{trip.name}</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						<time dateTime={new Date(trip.createdAt).toString()}>
							{new Date(trip.createdAt).toLocaleDateString("en-US", {
								weekday: "short",
								month: "short",
								day: "numeric"
							})}
						</time>
						{items && ` · ${items.length} ${items.length === 1 ? "item" : "items"}`}
					</p>
				</div>
				{items && (
					<div className="flex items-center justify-between gap-3 border-t pt-3">
						<p className="font-heading text-xl font-bold tabular-nums">{formatPrice(total)}</p>
					</div>
				)}
			</Card>
		</Link>
	);
}

function GroupTrips() {
	const { groupId = "" } = useParams();
	const { data: trips, error, isPending } = useQuery(tripsQuery(groupId));

	return (
		<>
			<section aria-label="Group trips" className="grid grid-cols-1 gap-3 sm:gap-4">
				{isPending && <p className="text-sm text-muted-foreground">Loading trips…</p>}
				{error && (
					<p role="alert" className="text-sm text-destructive">
						{errorMessage(error)}
					</p>
				)}
				{trips?.map((trip) => (
					<TripCard key={trip.id} groupId={groupId} trip={trip} />
				))}
				{trips?.length === 0 && (
					<Card className="items-center gap-3 rounded-2xl px-6 py-12 text-center shadow-sm">
						<ShoppingCart aria-hidden="true" className="size-8 text-primary" />
						<h2 className="font-heading text-lg font-semibold">No trips yet</h2>
						<p className="text-sm text-muted-foreground">
							Start a new trip to organize your next grocery run.
						</p>
					</Card>
				)}
			</section>
			<AddButton to={`/groups/${groupId}/new-trip`} label="Create a trip" />
		</>
	);
}

export default GroupTrips;
