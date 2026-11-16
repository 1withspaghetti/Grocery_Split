import type { PopulatedItem } from "@grocery-split/validation";
import { Fragment, type ReactNode } from "react";
import { AvatarGroup, AvatarGroupCount, UserAvatar } from "./ui/avatar";
import { formatPrice } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import InlineItemForm from "./InlineItemForm";

function ShoppingList({
	groupId,
	tripId,
	items,
	showPrice = true,
	createRow,
	editingItemId,
	onEdit
}: {
	groupId: string;
	tripId?: string;
	items: PopulatedItem[];
	showPrice?: boolean;
	createRow?: ReactNode;
	editingItemId?: string;
	onEdit: (itemId: string) => void;
}) {
	return (
		<Table className="table-fixed text-xs sm:text-sm">
			<TableHeader>
				<TableRow className="text-sm">
					<TableHead className="w-full">Name</TableHead>
					<TableHead className="w-20">Quantity</TableHead>
					{showPrice && <TableHead className="w-20 text-right">Price</TableHead>}
					<TableHead className="w-20">Members</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{createRow}
				{items.map((item) => (
					<Fragment key={item.id}>
						<TableRow
							onClick={() => onEdit(item.id)}
							onKeyDown={(event) => {
								if (event.key === "Enter" || event.key === " ") {
									event.preventDefault();
									onEdit(item.id);
								}
							}}
							role="button"
							tabIndex={0}
							aria-expanded={editingItemId === item.id}
							aria-label={`Edit ${item.name}`}
							className="cursor-pointer focus-within:bg-muted/50">
							<TableCell className="w-full truncate text-base font-semibold">{item.name}</TableCell>
							<TableCell className="w-20 truncate">{item.quantity}</TableCell>
							{showPrice && (
								<TableCell className="w-20 truncate text-right">
									{item.price ? formatPrice(item.price) : "-"}
								</TableCell>
							)}
							<TableCell className="w-20 overflow-hidden">
								<AvatarGroup aria-label="Sharing this item" className="max-w-20">
									{item.wantedBy.slice(0, 2).map((wantedItem) => (
										<UserAvatar key={wantedItem.userId} user={wantedItem.user} size="sm" />
									))}
									{item.wantedBy.length > 2 && (
										<AvatarGroupCount>+{item.wantedBy.length - 2}</AvatarGroupCount>
									)}
								</AvatarGroup>
							</TableCell>
						</TableRow>
						{editingItemId === item.id && (
							<InlineItemForm
								key={`${item.id}-editor`}
								groupId={groupId}
								tripId={tripId}
								showPrice={showPrice}
								item={item}
								onCancel={() => onEdit("")}
							/>
						)}
					</Fragment>
				))}
			</TableBody>
		</Table>
	);
}

export default ShoppingList;
