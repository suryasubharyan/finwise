"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useLanguage } from "@/components/providers/LanguageProvider";

type Account = {
  id: string;
  institution: string;
  accountType: string;
  currentBalance: string;
  currency: string;
};

type Transaction = {
  id: string;
  merchant: string;
  amount: string;
  type: string;
  date: string;
  categoryId: string | null;
  account: { institution: string };
};

type Category = { id: string; name: string };

const ACCOUNT_ICON: Record<string, string> = {
  BANK: "🏦",
  CASH: "💵",
  CARD: "💳",
  WALLET: "📱",
  OTHER: "📁",
};

function formatINR(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export default function AccountsPage() {
  const { t } = useLanguage();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  const [institution, setInstitution] = useState("");
  const [accountType, setAccountType] = useState("BANK");
  const [currentBalance, setCurrentBalance] = useState("");
  const [accountError, setAccountError] = useState<string | null>(null);
  const [submittingAccount, setSubmittingAccount] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);

  const [txnAccountId, setTxnAccountId] = useState("");
  const [txnAmount, setTxnAmount] = useState("");
  const [txnType, setTxnType] = useState("DEBIT");
  const [txnMerchant, setTxnMerchant] = useState("");
  const [txnDate, setTxnDate] = useState("");
  const [txnError, setTxnError] = useState<string | null>(null);
  const [submittingTxn, setSubmittingTxn] = useState(false);

  const [csvAccountId, setCsvAccountId] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvStatus, setCsvStatus] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);

  async function loadAccounts() {
    setLoadingAccounts(true);
    const res = await fetch("/api/accounts");
    setAccounts(await res.json());
    setLoadingAccounts(false);
  }

  async function loadTransactions() {
    setLoadingTransactions(true);
    const res = await fetch("/api/transactions");
    setTransactions(await res.json());
    setLoadingTransactions(false);
  }

  async function handleCategoryChange(txnId: string, categoryId: string) {
    await fetch(`/api/transactions/${txnId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId: categoryId || null }),
    });
    await loadTransactions();
  }

  useEffect(() => {
    loadAccounts();
    loadTransactions();
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories);
  }, []);

  async function handleAddAccount(e: React.FormEvent) {
    e.preventDefault();
    setAccountError(null);
    setSubmittingAccount(true);

    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        institution,
        accountType,
        currentBalance: Number(currentBalance),
      }),
    });

    const data = await res.json();
    setSubmittingAccount(false);

    if (!res.ok) {
      setAccountError(data.error);
      return;
    }

    setInstitution("");
    setCurrentBalance("");
    await loadAccounts();
  }

  async function handleAddTransaction(e: React.FormEvent) {
    e.preventDefault();
    setTxnError(null);

    if (!txnAccountId) {
      setTxnError(t.dashboard.selectAccount);
      return;
    }

    setSubmittingTxn(true);

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId: txnAccountId,
        amount: Number(txnAmount),
        type: txnType,
        merchant: txnMerchant,
        date: txnDate,
      }),
    });

    const data = await res.json();
    setSubmittingTxn(false);

    if (!res.ok) {
      setTxnError(data.error);
      return;
    }

    setTxnAmount("");
    setTxnMerchant("");
    setTxnDate("");
    await loadTransactions();
  }

  async function handleCsvImport(e: React.FormEvent) {
    e.preventDefault();
    setCsvStatus(null);

    if (!csvAccountId || !csvFile) {
      setCsvStatus(t.dashboard.selectAccount);
      return;
    }

    setImporting(true);
    const csvText = await csvFile.text();

    const res = await fetch("/api/transactions/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId: csvAccountId, csvText }),
    });

    const data = await res.json();
    setImporting(false);

    if (!res.ok) {
      setCsvStatus(data.error);
      return;
    }

    setCsvStatus(`Imported ${data.imported} transactions (${data.skipped} skipped)`);
    setCsvFile(null);
    await loadTransactions();
  }

  return (
    <div className="animate-fade-in-up mx-auto max-w-6xl space-y-10">
      <PageHeader icon="💳" title={t.sidebar.accounts} />

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          {t.dashboard.accountsTitle}
        </h2>

        {loadingAccounts ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">...</p>
        ) : accounts.length === 0 ? (
          <Card className="text-center text-sm text-slate-500 dark:text-slate-400">
            {t.dashboard.noAccounts}
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {accounts.map((acc) => (
              <Card key={acc.id} className="flex items-center gap-3.5 hover:-translate-y-0.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xl dark:bg-emerald-500/10">
                  {ACCOUNT_ICON[acc.accountType] ?? "📁"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {acc.institution}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t.dashboard.accountType[
                      acc.accountType as keyof typeof t.dashboard.accountType
                    ] ?? acc.accountType}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold text-slate-900 dark:text-white">
                  {formatINR(Number(acc.currentBalance))}
                </p>
              </Card>
            ))}
          </div>
        )}

        {accountError && (
          <p className="mt-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-600 animate-fade-in dark:bg-rose-500/10 dark:text-rose-400">
            {accountError}
          </p>
        )}

        <Card className="mt-4">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
            {t.dashboard.addAccountTitle}
          </h3>
          <form
            onSubmit={handleAddAccount}
            className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end"
          >
            <Input
              label={t.dashboard.institutionLabel}
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder={t.dashboard.institutionPlaceholder}
              required
            />
            <Select
              label={t.dashboard.accountTypeLabel}
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
            >
              <option value="BANK">{t.dashboard.accountType.BANK}</option>
              <option value="CASH">{t.dashboard.accountType.CASH}</option>
              <option value="CARD">{t.dashboard.accountType.CARD}</option>
              <option value="WALLET">{t.dashboard.accountType.WALLET}</option>
              <option value="OTHER">{t.dashboard.accountType.OTHER}</option>
            </Select>
            <Input
              label={t.dashboard.balanceLabel}
              type="number"
              value={currentBalance}
              onChange={(e) => setCurrentBalance(e.target.value)}
              required
            />
            <Button
              type="submit"
              loading={submittingAccount}
              className="sm:col-span-3 sm:w-fit"
            >
              {submittingAccount ? t.dashboard.addingAccount : t.dashboard.addAccountButton}
            </Button>
          </form>
        </Card>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          {t.dashboard.transactionsTitle}
        </h2>

        {loadingTransactions ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">...</p>
        ) : transactions.length === 0 ? (
          <Card className="text-center text-sm text-slate-500 dark:text-slate-400">
            {t.dashboard.noTransactions}
          </Card>
        ) : (
          <Card className="divide-y divide-slate-100 p-0 dark:divide-slate-800 sm:p-0">
            {transactions.map((txn) => (
              <div
                key={txn.id}
                className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 sm:px-6"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                    {txn.merchant}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {txn.account.institution} ·{" "}
                    {new Date(txn.date).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <select
                  value={txn.categoryId ?? ""}
                  onChange={(e) => handleCategoryChange(txn.id, e.target.value)}
                  className="shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  <option value="">Uncategorized</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p
                  className={`w-24 shrink-0 text-right text-sm font-semibold ${
                    txn.type === "CREDIT"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {txn.type === "CREDIT" ? "+" : "-"}
                  {formatINR(Number(txn.amount))}
                </p>
              </div>
            ))}
          </Card>
        )}

        {txnError && (
          <p className="mt-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-600 animate-fade-in dark:bg-rose-500/10 dark:text-rose-400">
            {txnError}
          </p>
        )}

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
              {t.dashboard.addTxnTitle}
            </h3>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <Select
                label={t.dashboard.accountLabel}
                value={txnAccountId}
                onChange={(e) => setTxnAccountId(e.target.value)}
              >
                <option value="">{t.dashboard.selectAccount}</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.institution}
                  </option>
                ))}
              </Select>
              <Input
                label={t.dashboard.merchantLabel}
                type="text"
                value={txnMerchant}
                onChange={(e) => setTxnMerchant(e.target.value)}
                placeholder={t.dashboard.merchantPlaceholder}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={t.dashboard.amountLabel}
                  type="number"
                  value={txnAmount}
                  onChange={(e) => setTxnAmount(e.target.value)}
                  required
                />
                <Select
                  label={t.dashboard.typeLabel}
                  value={txnType}
                  onChange={(e) => setTxnType(e.target.value)}
                >
                  <option value="DEBIT">{t.dashboard.debit}</option>
                  <option value="CREDIT">{t.dashboard.credit}</option>
                </Select>
              </div>
              <Input
                label={t.dashboard.dateLabel}
                type="date"
                value={txnDate}
                onChange={(e) => setTxnDate(e.target.value)}
                required
              />
              <Button type="submit" loading={submittingTxn} className="w-full">
                {submittingTxn ? t.dashboard.addingTxn : t.dashboard.addTxnButton}
              </Button>
            </form>
          </Card>

          <Card>
            <h3 className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">
              {t.dashboard.csvImportTitle}
            </h3>
            <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
              {t.dashboard.csvImportDesc}
            </p>

            {csvStatus && (
              <p className="mb-4 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700 animate-fade-in dark:bg-emerald-500/10 dark:text-emerald-400">
                {csvStatus}
              </p>
            )}

            <form onSubmit={handleCsvImport} className="space-y-4">
              <Select
                label={t.dashboard.accountLabel}
                value={csvAccountId}
                onChange={(e) => setCsvAccountId(e.target.value)}
              >
                <option value="">{t.dashboard.selectAccount}</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.institution}
                  </option>
                ))}
              </Select>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t.dashboard.csvFileLabel}
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
                  className="block w-full cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3.5 py-6 text-sm text-slate-500 transition-colors hover:border-emerald-400 hover:bg-emerald-50/50 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-emerald-500 dark:hover:bg-emerald-500/10"
                />
              </div>

              <Button type="submit" variant="secondary" loading={importing} className="w-full">
                {importing ? t.dashboard.importingButton : t.dashboard.importButton}
              </Button>
            </form>
          </Card>
        </div>
      </section>
    </div>
  );
}
