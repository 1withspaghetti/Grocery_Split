import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseResponse } from "hono/client";
import { validator, type PopulatedItem } from "@grocery-split/validation";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import { client } from "@/lib/client";
import { errorMessage, membersQuery, tripsQuery } from "@/lib/queries";

interface InlineItemFormProps {
	groupId: string;
	tripId?: string;
	showPrice: boolean;
	onCancel: () => void;
	item?: PopulatedItem;
}

function InlineItemForm({ groupId, tripId, showPrice, onCancel, item }: InlineItemFormProps) {
	const queryClient = useQueryClient();
	const { data: members } = useQuery(membersQuery(groupId));
	const { data: trips } = useQuery(tripsQuery(groupId));
	const input = useRef<HTMLInputElement>(null);
	const editing = item !== undefined;
	const [name, setName] = useState(item?.name ?? "");
	const [quantity, setQuantity] = useState(item?.quantity ?? "");
	const [price, setPrice] = useState(item?.price?.toString() ?? "");
	const [selectedTripId, setSelectedTripId] = useState(item?.tripId ?? tripId ?? "");
	const [error, setError] = useState("");
	const [showUserPicker, setShowUserPicker] = useState(false);
	const [split, setSplit] = useState<Record<string, { selected: boolean; parts: number }>>(() =>
		Object.fromEntries(
			item?.wantedBy.map((share) => [share.userId, { selected: true, parts: share.parts }]) ?? []
		)
	);

	useEffect(() => input.current?.focus(), []);
	const itemShares = (members ?? [])
		.filter((member) => split[member.id]?.selected ?? false)
		.map((member) => ({ userId: member.id, parts: split[member.id]?.parts ?? 1 }));
	const sharedMembers = (members ?? []).filter((member) => split[member.id]?.selected ?? false);
	const totalParts = itemShares.reduce((total, share) => total + share.parts, 0);
	const unsharedMembers = (members ?? []).filter(
		(member) => !(split[member.id]?.selected ?? false)
	);

	function itemJson() {
		return {
			name: name.trim(),
			quantity: quantity.trim() || null,
			notes: item?.notes ?? null,
			price: price.trim() ? Number(price) : null,
			tripId: selectedTripId || null
		};
	}

	const save = useMutation({
		mutationFn: async () => {
			const json = validator.item.parse(itemJson());
			const shares = validator.itemShares.parse(itemShares);
			const saved = await parseResponse(
				item
					? client.api.groups[":groupId"].items[":itemId"].$patch({
							param: { groupId, itemId: item.id },
							json
						})
					: client.api.groups[":groupId"].items.$post({ param: { groupId }, json })
			);
			await parseResponse(
				client.api.groups[":groupId"].items[":itemId"].shares.$put({
					param: { groupId, itemId: saved.id },
					json: shares
				})
			);
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
			onCancel();
		},
		onError: (reason) => setError(errorMessage(reason))
	});

	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!validator.item.safeParse(itemJson()).success) {
			setError("Enter an item name and a valid price.");
			return;
		}
		if (!members?.length) {
			setError("Unable to load group members. Try again.");
			return;
		}
		if (!validator.itemShares.safeParse(itemShares).success) {
			setError("Pick at least one member to split with.");
			return;
		}
		setError("");
		save.mutate();
	}

	return (
		<TableRow className="border-0 hover:bg-transparent">
			<TableCell colSpan={showPrice ? 4 : 3} className="p-2 sm:p-3">
				<Card className="gap-0 overflow-hidden rounded-2xl p-0 shadow-sm ring-1 ring-foreground/10">
					<form className="flex flex-col gap-3 p-3 sm:gap-4 sm:p-5" onSubmit={submit}>
						<div className="flex flex-col gap-1.5">
							<label htmlFor="inline-item-name" className="text-sm font-semibold">
								Name
							</label>
							<Input
								id="inline-item-name"
								ref={input}
								value={name}
								onChange={(event) => setName(event.target.value)}
								placeholder="Oat milk"
								maxLength={128}
								className="h-11 rounded-xl"
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<label htmlFor="inline-item-quantity" className="text-sm font-semibold">
								Quantity
							</label>
							<Input
								id="inline-item-quantity"
								value={quantity}
								onChange={(event) => setQuantity(event.target.value)}
								placeholder="2 cartons"
								maxLength={128}
								className="h-11 rounded-xl"
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<label htmlFor="inline-item-price" className="text-sm font-semibold">
								Price
							</label>
							<Input
								id="inline-item-price"
								value={price}
								onChange={(event) => setPrice(event.target.value)}
								inputMode="decimal"
								placeholder="Pending"
								className="h-11 rounded-xl"
							/>
						</div>
						<fieldset className="-mx-3 bg-muted/40 px-3 py-3 sm:-mx-5 sm:px-5 sm:py-4">
							<legend className="sr-only">Shares</legend>
							<div className="mb-3 flex items-center justify-between gap-3">
								<div>
									<div className="text-sm font-semibold">Shares</div>
									<p className="text-xs text-muted-foreground">
										Share count sets each person's percentage.
									</p>
								</div>
								<Button
									type="button"
									variant="outline"
									size="icon"
									className="size-9 shrink-0"
									aria-label="Add user"
									title="Add user"
									onClick={() => setShowUserPicker(true)}
									disabled={!unsharedMembers.length}>
									<Plus aria-hidden="true" className="size-4" />
								</Button>
							</div>
							{showUserPicker && (
								<select
									autoFocus
									value=""
									onBlur={() => setShowUserPicker(false)}
									onChange={(event) => {
										if (!event.target.value) return;
										setSplit((current) => ({
											...current,
											[event.target.value]: { selected: true, parts: 1 }
										}));
										setShowUserPicker(false);
									}}
									className="mb-3 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
									<option value="">Choose a group member…</option>
									{unsharedMembers.map((member) => (
										<option key={member.id} value={member.id}>
											{member.name}
										</option>
									))}
								</select>
							)}
							<div className="grid gap-2">
								{sharedMembers.map((member) => {
									const share = split[member.id]!;
									const percentage = totalParts ? Math.round((share.parts / totalParts) * 100) : 0;
									return (
										<label
											key={member.id}
											className="flex min-w-0 w-full items-center gap-2 overflow-hidden rounded-xl bg-background px-3 py-2 text-sm shadow-sm">
											<span className="min-w-0 flex-1 truncate">{member.name}</span>
											<Input
												type="number"
												min={1}
												max={99}
												step={1}
												inputMode="numeric"
												value={share.parts}
												onChange={(event) =>
													setSplit((current) => ({
														...current,
														[member.id]: {
															...share,
															parts: Math.min(
																99,
																Math.max(1, Math.floor(Number(event.target.value)) || 1)
															)
														}
													}))
												}
												aria-label={`Shares for ${member.name}`}
												className="h-9 w-14 shrink-0 rounded-lg px-1 text-center"
											/>
											<span className="w-9 shrink-0 text-right text-xs font-medium text-muted-foreground">
												{percentage}%
											</span>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="size-9 shrink-0 text-muted-foreground"
												aria-label={`Remove ${member.name}`}
												title={`Remove ${member.name}`}
												onClick={() =>
													setSplit((current) => ({
														...current,
														[member.id]: { ...share, selected: false }
													}))
												}>
												<Minus aria-hidden="true" className="size-4" />
											</Button>
										</label>
									);
								})}
							</div>
							{sharedMembers.length === 0 && (
								<p className="py-2 text-center text-sm text-muted-foreground">
									No one is sharing this item yet.
								</p>
							)}
						</fieldset>
						<div className="flex flex-col gap-2">
							<label htmlFor="inline-item-trip" className="text-sm font-semibold">
								Trip
							</label>
							<select
								id="inline-item-trip"
								value={selectedTripId}
								onChange={(event) => setSelectedTripId(event.target.value)}
								className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
								<option value="">No trip (main list)</option>
								{trips?.map((trip) => (
									<option key={trip.id} value={trip.id}>
										{trip.name}
									</option>
								))}
							</select>
						</div>
						<div className="flex justify-center gap-2 pt-1">
							<Button type="button" variant="ghost" onClick={onCancel} disabled={save.isPending}>
								Cancel
							</Button>
							<Button type="submit" disabled={save.isPending}>
								{save.isPending ? (editing ? "Saving…" : "Adding…") : editing ? "Save" : "Add"}
							</Button>
						</div>
						{error && (
							<p role="alert" className="text-center text-sm text-destructive">
								{error}
							</p>
						)}
					</form>
				</Card>
			</TableCell>
		</TableRow>
	);
}

export default InlineItemForm;
