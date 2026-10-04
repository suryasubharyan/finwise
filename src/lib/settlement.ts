type Balance = { userId: string; amount: number }; // positive = is owed money, negative = owes money

export type SettlementTransaction = { from: string; to: string; amount: number };

/**
 * Greedy minimum-transaction debt simplification — the same approach
 * Splitwise uses. Matches the largest creditor against the largest debtor
 * repeatedly, so a group of N people settles in at most N-1 payments
 * instead of everyone paying everyone individually. Never changes anyone's
 * net balance — only the payment paths.
 */
export function simplifyDebts(balances: Balance[]): SettlementTransaction[] {
  const creditors = balances
    .filter((b) => b.amount > 0.5)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.amount - a.amount);

  const debtors = balances
    .filter((b) => b.amount < -0.5)
    .map((b) => ({ userId: b.userId, amount: -b.amount }))
    .sort((a, b) => b.amount - a.amount);

  const transactions: SettlementTransaction[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.amount, creditor.amount);

    if (amount > 0.5) {
      transactions.push({ from: debtor.userId, to: creditor.userId, amount: Math.round(amount) });
    }

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount < 0.5) i++;
    if (creditor.amount < 0.5) j++;
  }

  return transactions;
}
