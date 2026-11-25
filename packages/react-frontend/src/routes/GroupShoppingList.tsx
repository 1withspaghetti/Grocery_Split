import { useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { CircleX, ListChecks, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import AddButton from "@/components/AddButton";
import EmptyState from "@/components/EmptyState";
import { useQuery } from "@tanstack/react-query";
import ShoppingList from "@/components/ShoppingList";
import InlineItemForm from "@/components/InlineItemForm";
import ItemSortSelect from "@/components/ItemSortSelect";
import TripPaidBySelect from "@/components/TripPaidBySelect";
import { itemsQuery } from "@/lib/queries";
import { validator, type ItemSort } from "@grocery-split/validation";

function GroupShoppingList() {
	const { groupId, tripId } = useParams();
	const showPrice = tripId !== undefined;
	const [editor, setEditor] = useState<string | "new" | null>(null);
	const adding = editor === "new";

	// The sort is kept in the url (?sort=name&order=asc) so it survives a refresh
	const [searchParams, setSearchParams] = useSearchParams();
	const parsedSort = validator.itemSort.safeParse(Object.fromEntries(searchParams));
	// Invalid links, and price on the main list (where prices are hidden), fall back to the default sort
	const sort =
		parsedSort.success && (showPrice || parsedSort.data.sort !== "price")
			? parsedSort.data
			: validator.itemSort.parse({});

	function setSort({ sort, order }: ItemSort) {
		setSearchParams(
			(params) => {
				params.set("sort", sort);
				params.set("order", order);
				return params;
			},
			{ replace: true }
		);
	}

	const items = useQuery(itemsQuery(groupId!, tripId, sort));

	return (
		<section
			aria-label={tripId ? "Trip items" : "Group shopping list"}
			className="flex flex-1 flex-col gap-4">
			{tripId && <TripPaidBySelect groupId={groupId!} tripId={tripId} />}
			{!(items.isSuccess && items.data.length === 0) && (
				<ItemSortSelect value={sort} onChange={setSort} showPrice={showPrice} />
			)}
			{!items.isLoading ? (
				items.isSuccess ? (
					items.data.length || adding ? (
						<ShoppingList
							groupId={groupId!}
							tripId={tripId}
							items={items.data}
							showPrice={showPrice}
							editingItemId={editor === "new" ? undefined : (editor ?? undefined)}
							onEdit={(itemId) => setEditor(itemId || null)}
							createRow={
								adding ? (
									<InlineItemForm
										groupId={groupId!}
										tripId={tripId}
										showPrice={showPrice}
										onCancel={() => setEditor(null)}
									/>
								) : undefined
							}
						/>
					) : (
						<EmptyState icon={ListChecks} title="No items yet" />
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
			<AddButton label="Add an item" onClick={() => setEditor("new")} />
		</section>
	);
}

export default GroupShoppingList;
