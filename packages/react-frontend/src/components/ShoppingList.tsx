import type { PopulatedItem } from "@grocery-split/validation";
import { Link } from "react-router";
import { AvatarGroup, UserAvatar } from "./ui/avatar";
import { formatPrice } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Edit2 } from "lucide-react";
import { Button } from "./ui/button";

function ShoppingList({
	base,
	items,
	showPrice = true
}: {
	base: string;
	items: PopulatedItem[];
	showPrice?: boolean;
}) {
	return (
		<Table>
			<TableHeader>
				<TableRow className="text-sm">
					<TableHead className="w-full">Name</TableHead>
					<TableHead>Quantity</TableHead>
					{showPrice && <TableHead className="text-right">Price</TableHead>}
					<TableHead>Members</TableHead>
					<TableHead>Edit</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{items.map((item) => (
					<TableRow>
						<TableCell className="w-full truncate text-base font-semibold">{item.name}</TableCell>
						<TableCell className="truncate">{item.quantity}</TableCell>
						{showPrice && (
							<TableCell className="truncate">
								{item.price ? formatPrice(item.price) : "-"}
							</TableCell>
						)}
						<TableCell>
							<AvatarGroup aria-label="Sharing this item" className="flex-1">
								{item.wantedBy.map((wantedItem) => (
									<UserAvatar key={wantedItem.userId} user={wantedItem.user} size="sm" />
								))}
							</AvatarGroup>
						</TableCell>
						<TableCell>
							<Button
								variant="ghost"
								size="icon"
								aria-label={`Edit ${item.name}`}
								nativeButton={false}
								render={<Link to={`${base}/items/${item.id}/edit`} />}>
								<Edit2 className="size-5" />
							</Button>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

export default ShoppingList;
