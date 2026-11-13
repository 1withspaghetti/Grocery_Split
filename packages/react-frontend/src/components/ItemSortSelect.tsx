import type { ItemSort } from "@grocery-split/validation";
import { ArrowUpDown } from "lucide-react";

const sortOptions: { label: string; value: ItemSort; needsPrice?: boolean }[] = [
	{ label: "Oldest first", value: { sort: "createdAt", order: "asc" } },
	{ label: "Newest first", value: { sort: "createdAt", order: "desc" } },
	{ label: "Name (A-Z)", value: { sort: "name", order: "asc" } },
	{ label: "Name (Z-A)", value: { sort: "name", order: "desc" } },
	{ label: "Price (low to high)", value: { sort: "price", order: "asc" }, needsPrice: true },
	{ label: "Price (high to low)", value: { sort: "price", order: "desc" }, needsPrice: true }
];

const optionKey = ({ sort, order }: ItemSort) => `${sort}-${order}`;

function ItemSortSelect({
	value,
	onChange,
	showPrice = true
}: {
	value: ItemSort;
	onChange: (value: ItemSort) => void;
	showPrice?: boolean;
}) {
	// Price sorting is hidden where prices are not shown (the main list)
	const options = sortOptions.filter((option) => showPrice || !option.needsPrice);

	return (
		<label className="flex items-center gap-2 self-end text-sm text-muted-foreground">
			<ArrowUpDown aria-hidden="true" className="size-4" />
			Sort by
			<select
				value={optionKey(value)}
				onChange={(e) => {
					const option = options.find((option) => optionKey(option.value) === e.target.value);
					if (option) onChange(option.value);
				}}
				className="h-9 rounded-3xl border border-transparent bg-input/50 px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30">
				{options.map((option) => (
					<option key={optionKey(option.value)} value={optionKey(option.value)}>
						{option.label}
					</option>
				))}
			</select>
		</label>
	);
}

export default ItemSortSelect;
