import { useParams } from "react-router";
import { CircleX, ListChecks, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import AddButton from "@/components/AddButton";
import { useQuery } from "@tanstack/react-query";
import ShoppingList from "@/components/ShoppingList";
import { itemsQuery, tripQuery } from "@/lib/queries";

function GroupShoppingList() {
	const { groupId, tripId } = useParams();
	const base = tripId ? `/groups/${groupId}/trips/${tripId}` : `/groups/${groupId}`;

	const trip = useQuery(tripQuery(groupId!, tripId));
	const items = useQuery(itemsQuery(groupId!, tripId));

	return (
		<section
			aria-label={tripId ? "Trip items" : "Group shopping list"}
			className="flex flex-1 flex-col gap-4">
			<h2 className="font-heading text-lg font-semibold">
				{tripId && trip.isSuccess ? trip.data!.name : "Shopping list"}
			</h2>
			{!items.isLoading ? (
				items.isSuccess ? (
					items.data.length ? (
						<ShoppingList base={base} items={items.data} showPrice={tripId !== undefined} />
					) : (
						<Card className="items-center gap-3 rounded-2xl px-6 py-12 text-center shadow-sm">
							<ListChecks aria-hidden="true" className="size-8 text-primary" />
							<h3 className="text-lg font-semibold">No items yet</h3>
						</Card>
					)
				) : (
					<Card className="items-center gap-3 rounded-2xl px-6 py-12 text-center shadow-sm">
						<CircleX aria-hidden="true" className="size-8 text-primary" />
						<h3 className="text-lg font-semibold">
							Error fetching data: {items.error?.message || "Unknown Error"}
						</h3>
					</Card>
				)
			) : (
				<Card className="items-center gap-3 rounded-2xl px-6 py-12 text-center shadow-sm">
					<Loader2 aria-hidden="true" className="size-8 text-primary" />
					<h3 className="text-lg font-semibold">Loading...</h3>
				</Card>
			)}
			<AddButton to={`${base}/new-item`} label="Add an item" />
		</section>
	);
}

export default GroupShoppingList;
