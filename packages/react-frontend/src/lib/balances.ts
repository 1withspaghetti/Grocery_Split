import type { PopulatedItem, Transaction, Trip } from "@grocery-split/validation";

export interface Debt {
	fromId: string;
	toId: string;
	amount: number;
}

export interface Balances {
	// "fromId owes toId amount", only between people who still owe each other
	debts: Debt[];
	// Positive if the member gets money back, negative if they owe money
	totals: Map<string, number>;
}

// Works out who owes who in a group:
// - Every priced item on a paid trip is split between the people sharing it by their share count,
//   and everyone except whoever paid for the trip owes them their part
// - A transaction means fromId paid toId back, so it lowers what fromId owes toId
// Amounts are added up in cents so the totals don't pick up floating point errors
export function calculateBalances(
	trips: Trip[],
	tripItems: Map<string, PopulatedItem[]>,
	transactions: Transaction[]
): Balances {
	// owed.get(a)?.get(b) is how many cents a owes b
	const owed = new Map<string, Map<string, number>>();
	const addOwed = (fromId: string, toId: string, cents: number) => {
		if (fromId === toId) return;
		const row = owed.get(fromId) ?? new Map<string, number>();
		row.set(toId, (row.get(toId) ?? 0) + cents);
		owed.set(fromId, row);
	};

	for (const trip of trips) {
		if (!trip.paidById) continue; // Nobody has paid for it yet

		for (const item of tripItems.get(trip.id) ?? []) {
			if (item.price === null) continue; // Not priced yet

			const totalParts = item.wantedBy.reduce((sum, share) => sum + share.parts, 0);
			if (totalParts === 0) continue;

			for (const share of item.wantedBy) {
				addOwed(share.userId, trip.paidById, (item.price * 100 * share.parts) / totalParts);
			}
		}
	}

	for (const transaction of transactions) {
		addOwed(transaction.fromId, transaction.toId, -transaction.amount * 100);
	}

	// Net each pair out, so two people never owe each other at the same time
	const debts: Debt[] = [];
	const totals = new Map<string, number>();
	const memberIds = new Set([
		...owed.keys(),
		...[...owed.values()].flatMap((row) => [...row.keys()])
	]);
	const ids = [...memberIds].sort();

	for (const [index, a] of ids.entries()) {
		for (const b of ids.slice(index + 1)) {
			const cents = Math.round((owed.get(a)?.get(b) ?? 0) - (owed.get(b)?.get(a) ?? 0));
			if (cents === 0) continue;

			const [fromId, toId] = cents > 0 ? [a, b] : [b, a];
			const amount = Math.abs(cents) / 100;
			debts.push({ fromId, toId, amount });
			totals.set(fromId, (totals.get(fromId) ?? 0) - amount);
			totals.set(toId, (totals.get(toId) ?? 0) + amount);
		}
	}

	return { debts: debts.sort((a, b) => b.amount - a.amount), totals };
}
