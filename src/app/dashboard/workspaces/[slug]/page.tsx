"use client";

import { useEffect, useMemo, useState, use } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { DonutChart, DonutLegend } from "@/components/dashboard/charts/DonutChart";

type WorkspaceType = "TRIP" | "FLATMATES" | "FAMILY" | "OTHER";

const TYPE_ICON: Record<WorkspaceType, string> = {
  TRIP: "✈️",
  FLATMATES: "🏠",
  FAMILY: "❤️",
  OTHER: "⚙️",
};

const TYPE_GRADIENT: Record<WorkspaceType, string> = {
  TRIP: "from-sky-400 to-blue-500",
  FLATMATES: "from-amber-400 to-orange-500",
  FAMILY: "from-rose-400 to-pink-500",
  OTHER: "from-violet-400 to-indigo-500",
};

type Member = { id: string; name: string };
type Expense = {
  id: string;
  description: string;
  amount: number;
  category: string | null;
  tag: string | null;
  date: string;
  paidByUserId: string;
  splits: { userId: string; shareAmount: number }[];
};
type WorkspaceDetail = {
  id: string;
  name: string;
  type: WorkspaceType;
  members: Member[];
  expenses: Expense[];
  balances: { userId: string; amount: number }[];
  settlement: { from: string; to: string; amount: number }[];
};

function formatINR(v: number) {
  return `₹${Math.abs(Math.round(v)).toLocaleString("en-IN")}`;
}

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function currentMonthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: toISODate(from), to: toISODate(to) };
}

const PALETTE = [
  "#10b981",
  "#6366f1",
  "#f59e0b",
  "#ec4899",
  "#0ea5e9",
  "#8b5cf6",
  "#f97316",
  "#14b8a6",
  "#ef4444",
  "#84cc16",
];

function colorFor(label: string) {
  let hash = 0;
  for (const ch of label) hash = (hash * 31 + ch.charCodeAt(0)) % PALETTE.length;
  return PALETTE[hash];
}

function initials(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "?";
}

const EXPENSE_ICON_RULES: { keywords: string[]; icon: string }[] = [
  { keywords: ["dinner", "lunch", "breakfast", "food", "restaurant", "swiggy", "zomato", "khana"], icon: "🍽️" },
  { keywords: ["cab", "taxi", "uber", "ola", "auto", "fuel", "petrol"], icon: "🚕" },
  { keywords: ["grocery", "groceries", "store", "market", "kirana", "dudh", "milk"], icon: "🛒" },
  { keywords: ["rent", "fee", "emi", "bill", "electricity", "wifi", "recharge"], icon: "🧾" },
  { keywords: ["medicine", "doctor", "hospital", "pharmacy"], icon: "💊" },
  { keywords: ["movie", "entertainment", "fun", "game"], icon: "🎬" },
];

function iconForExpense(description: string, category: string | null) {
  const text = `${description} ${category ?? ""}`.toLowerCase();
  for (const rule of EXPENSE_ICON_RULES) {
    if (rule.keywords.some((k) => text.includes(k))) return rule.icon;
  }
  return "💳";
}

function Chevron({ className = "" }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SectionIcon({ icon }: { icon: string }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-base dark:bg-emerald-500/10">
      {icon}
    </div>
  );
}

function FilterPill({
  value,
  onChange,
  options,
  active,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  active?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`cursor-pointer appearance-none rounded-full border py-1.5 pr-7 pl-3.5 text-xs font-semibold outline-none transition-colors ${
          active
            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-500/10 dark:text-emerald-400"
            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600"
        }`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        className={`pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 ${
          active ? "text-emerald-500" : "text-slate-400"
        }`}
      >
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function WorkspaceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { t } = useLanguage();
  const s = t.dashboard.workspacesSection;

  const [data, setData] = useState<WorkspaceDetail | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [invitingLoading, setInvitingLoading] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const [editingName, setEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidByUserId, setPaidByUserId] = useState("");
  const [date, setDate] = useState(() => toISODate(new Date()));
  const [tag, setTag] = useState("");
  const [category, setCategory] = useState("");
  const [splitEnabled, setSplitEnabled] = useState(true);
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rangeMode, setRangeMode] = useState<"month" | "custom">("month");
  const [customFrom, setCustomFrom] = useState(() => currentMonthRange().from);
  const [customTo, setCustomTo] = useState(() => currentMonthRange().to);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const [expenseRangeMode, setExpenseRangeMode] = useState<"all" | "month" | "custom">("all");
  const [expenseFrom, setExpenseFrom] = useState(() => currentMonthRange().from);
  const [expenseTo, setExpenseTo] = useState(() => currentMonthRange().to);
  const [expenseTagFilter, setExpenseTagFilter] = useState("all");
  const [expenseMemberFilter, setExpenseMemberFilter] = useState("all");
  const [expenseLimit, setExpenseLimit] = useState("10");

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/workspaces/${slug}`);
    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Could not load this workspace");
      setLoading(false);
      return;
    }

    setData(json);
    if (json.members?.length) {
      setParticipantIds(json.members.map((m: Member) => m.id));
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    fetch("/api/me")
      .then((r) => r.json())
      .then((u) => {
        setMyId(u.id);
        setPaidByUserId(u.id);
      });
  }, [slug]);

  async function handleInvite() {
    setInviteModalOpen(true);
    setCodeCopied(false);
    setInviteCode(null);
    setInvitingLoading(true);
    const res = await fetch(`/api/workspaces/${slug}/invite`, { method: "POST" });
    const json = await res.json();
    setInvitingLoading(false);
    setInviteCode(json.code);
  }

  async function handleCopyInviteCode() {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      // clipboard access unavailable; user can still select the code manually
    }
  }

  function startEditingName() {
    setEditedName(data?.name ?? "");
    setNameError(null);
    setEditingName(true);
  }

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setNameError(null);
    setSavingName(true);

    const res = await fetch(`/api/workspaces/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editedName }),
    });

    const json = await res.json();
    setSavingName(false);

    if (!res.ok) {
      setNameError(json.error);
      return;
    }

    setEditingName(false);
    await load();
  }

  function toggleParticipant(userId: string) {
    setParticipantIds((prev) =>
      prev.includes(userId) ? prev.filter((p) => p !== userId) : [...prev, userId]
    );
  }

  function openAddModal() {
    setError(null);
    setAddModalOpen(true);
  }

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch(`/api/workspaces/${slug}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description,
        amount: Number(amount),
        date,
        paidByUserId,
        tag: tag.trim() || undefined,
        category: category.trim() || undefined,
        splitType: splitEnabled ? "EQUAL" : "NONE",
        participantIds: splitEnabled ? participantIds : undefined,
      }),
    });

    const json = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(json.error);
      return;
    }

    setDescription("");
    setAmount("");
    setDate(toISODate(new Date()));
    setTag("");
    setCategory("");
    setAddModalOpen(false);
    await load();
  }

  function memberName(userId: string) {
    if (userId === myId) return "You";
    return data?.members.find((m) => m.id === userId)?.name ?? "Someone";
  }

  const effectiveRange = rangeMode === "month" ? currentMonthRange() : { from: customFrom, to: customTo };

  const existingTags = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>();
    for (const e of data.expenses) if (e.tag) set.add(e.tag);
    return Array.from(set);
  }, [data]);

  const existingCategories = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>();
    for (const e of data.expenses) if (e.category) set.add(e.category);
    return Array.from(set);
  }, [data]);

  const filteredExpenses = useMemo(() => {
    if (!data) return [];
    let list = data.expenses;

    if (expenseRangeMode !== "all") {
      const range = expenseRangeMode === "month" ? currentMonthRange() : { from: expenseFrom, to: expenseTo };
      const fromTime = new Date(range.from).getTime();
      const toTime = new Date(range.to + "T23:59:59").getTime();
      list = list.filter((e) => {
        const time = new Date(e.date).getTime();
        return time >= fromTime && time <= toTime;
      });
    }

    if (expenseTagFilter !== "all") {
      list = list.filter((e) => (e.tag || s.untagged) === expenseTagFilter);
    }

    if (expenseMemberFilter !== "all") {
      list = list.filter((e) => e.paidByUserId === expenseMemberFilter);
    }

    return list;
  }, [data, expenseRangeMode, expenseFrom, expenseTo, expenseTagFilter, expenseMemberFilter, s.untagged]);

  const visibleExpenses =
    expenseLimit === "all" ? filteredExpenses : filteredExpenses.slice(0, Number(expenseLimit));

  const analytics = useMemo(() => {
    if (!data) return null;
    const fromTime = new Date(effectiveRange.from).getTime();
    const toTime = new Date(effectiveRange.to + "T23:59:59").getTime();
    const inRange = data.expenses.filter((e) => {
      const time = new Date(e.date).getTime();
      return time >= fromTime && time <= toTime;
    });

    const total = inRange.reduce((sum, e) => sum + e.amount, 0);

    const tagMap = new Map<string, number>();
    for (const e of inRange) {
      const key = e.tag || s.untagged;
      tagMap.set(key, (tagMap.get(key) ?? 0) + e.amount);
    }
    const byTag = Array.from(tagMap.entries())
      .map(([label, value]) => ({ label, value, color: colorFor(label) }))
      .sort((a, b) => b.value - a.value);

    const memberMap = new Map<string, number>();
    for (const e of inRange) {
      memberMap.set(e.paidByUserId, (memberMap.get(e.paidByUserId) ?? 0) + e.amount);
    }
    const byMember = Array.from(memberMap.entries())
      .map(([userId, value]) => ({ userId, value }))
      .sort((a, b) => b.value - a.value);

    let byCategory: { label: string; value: number; color: string }[] = [];
    if (selectedTag) {
      const inTag = inRange.filter((e) => (e.tag || s.untagged) === selectedTag);
      const catMap = new Map<string, number>();
      for (const e of inTag) {
        const key = e.category || s.uncategorized;
        catMap.set(key, (catMap.get(key) ?? 0) + e.amount);
      }
      byCategory = Array.from(catMap.entries())
        .map(([label, value]) => ({ label, value, color: colorFor(label) }))
        .sort((a, b) => b.value - a.value);
    }

    return { total, byTag, byMember, byCategory, count: inRange.length };
  }, [data, effectiveRange.from, effectiveRange.to, selectedTag, s.untagged, s.uncategorized]);

  if (loading) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">...</p>;
  }

  if (!data || !analytics) {
    return (
      <Card className="mx-auto mt-10 max-w-md text-center text-sm text-slate-500 dark:text-slate-400">
        {error ?? "This workspace is not available."}
      </Card>
    );
  }

  return (
    <div className="animate-fade-in-up mx-auto max-w-5xl space-y-6">
      <Link
        href="/dashboard/workspaces"
        className="group inline-flex items-center gap-2 rounded-full py-1.5 pr-3.5 pl-1.5 text-sm font-semibold text-slate-500 transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors duration-200 group-hover:bg-emerald-100 group-hover:text-emerald-600 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-emerald-500/20 dark:group-hover:text-emerald-400">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        {s.title}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3.5">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl text-white shadow-lg shadow-slate-900/10 ${TYPE_GRADIENT[data.type]}`}
          >
            {TYPE_ICON[data.type]}
          </div>

          <div className="min-w-0 flex-1">
            {editingName ? (
              <form onSubmit={handleSaveName} className="flex max-w-xs items-center gap-2">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  autoFocus
                  required
                />
                <Button type="submit" loading={savingName} className="shrink-0 px-3 py-2 text-xs">
                  ✓
                </Button>
                <button
                  type="button"
                  onClick={() => setEditingName(false)}
                  className="shrink-0 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  ✕
                </button>
              </form>
            ) : (
              <div className="group flex items-center gap-1.5">
                <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {data.name}
                </h1>
                <button
                  onClick={startEditingName}
                  aria-label={s.renameButton}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-300 opacity-0 transition-all hover:bg-slate-100 hover:text-slate-500 group-hover:opacity-100 dark:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-400"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            )}
            {nameError && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{nameError}</p>}

            <div className="mt-2 flex items-center">
              <div className="flex -space-x-1.5">
                {data.members.slice(0, 5).map((m) => (
                  <div
                    key={m.id}
                    title={m.id === myId ? "You" : m.name}
                    className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-50 bg-white text-[10px] font-bold text-slate-600 shadow-sm dark:border-slate-950 dark:bg-slate-700 dark:text-slate-200"
                  >
                    {initials(m.id === myId ? "You" : m.name)}
                  </div>
                ))}
              </div>
              <span className="pl-2.5 text-xs text-slate-500 dark:text-slate-400">
                {data.members.length} {s.members}
              </span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="secondary" onClick={handleInvite} loading={invitingLoading} className="text-sm">
            {s.inviteButton}
          </Button>
          <Button onClick={openAddModal} className="text-sm">
            <span>+</span> {s.addExpense}
          </Button>
        </div>
      </div>


      {/* Analytics + Balances */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <SectionIcon icon="📊" />
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{s.analyticsTitle}</h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{s.analyticsExplainer}</p>
              </div>
            </div>

            <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setRangeMode("month")}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  rangeMode === "month"
                    ? "bg-emerald-50 text-emerald-700 shadow-sm dark:bg-emerald-500/15 dark:text-emerald-400"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {s.thisMonth}
              </button>
              <button
                type="button"
                onClick={() => setRangeMode("custom")}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  rangeMode === "custom"
                    ? "bg-emerald-50 text-emerald-700 shadow-sm dark:bg-emerald-500/15 dark:text-emerald-400"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {s.customRange}
              </button>
            </div>
          </div>

          {rangeMode === "custom" && (
            <div className="animate-fade-in mb-5 grid grid-cols-2 gap-3">
              <Input
                label={s.fromLabel}
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
              <Input
                label={s.toLabel}
                type="date"
                value={customTo}
                min={customFrom}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </div>
          )}

          {analytics.count === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-2xl dark:bg-slate-800">
                📊
              </div>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{s.noDataInRange}</p>
            </div>
          ) : (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {selectedTag ? (
                    <button
                      type="button"
                      onClick={() => setSelectedTag(null)}
                      className="text-emerald-600 hover:underline dark:text-emerald-400"
                    >
                      ← {s.allTags}
                    </button>
                  ) : (
                    s.byTag
                  )}
                </p>
              </div>

              {selectedTag ? (
                <div className="flex flex-col items-center gap-6 sm:flex-row">
                  <DonutChart
                    data={analytics.byCategory}
                    size={190}
                    centerValue={formatINR(
                      analytics.byCategory.reduce((sum, c) => sum + c.value, 0)
                    )}
                    centerLabel={selectedTag}
                  />
                  <DonutLegend
                    data={analytics.byCategory}
                    total={analytics.byCategory.reduce((sum, c) => sum + c.value, 0)}
                    formatValue={formatINR}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6 sm:flex-row">
                  <DonutChart
                    data={analytics.byTag}
                    size={190}
                    selectedLabel={selectedTag}
                    onSelect={(label) => setSelectedTag(label)}
                    centerValue={formatINR(analytics.total)}
                    centerLabel={s.totalSpent}
                  />
                  <DonutLegend
                    data={analytics.byTag}
                    total={analytics.total}
                    onSelect={(label) => setSelectedTag(label)}
                    formatValue={formatINR}
                  />
                </div>
              )}
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <div className="mb-3 flex items-center gap-2.5">
              <SectionIcon icon="💼" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{s.balancesTitle}</h2>
            </div>
            <div className="space-y-2">
              {data.balances.map((b) => (
                <div
                  key={b.userId}
                  className="group flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3.5 py-2.5 transition-colors duration-200 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/60"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-bold text-slate-600 shadow-sm dark:bg-slate-700 dark:text-slate-200">
                      {initials(memberName(b.userId))}
                    </div>
                    <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-300">
                      {memberName(b.userId)}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span
                      className={`text-sm font-bold ${
                        b.amount > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : b.amount < 0
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-slate-400"
                      }`}
                    >
                      {b.amount > 0 ? "+" : b.amount < 0 ? "-" : ""}
                      {formatINR(b.amount)}
                    </span>
                    <Chevron className="text-slate-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-slate-400 dark:text-slate-600" />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
              <h3 className="mb-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                {s.settleUpTitle}
              </h3>
              {data.settlement.length === 0 ? (
                <div className="flex items-center justify-between rounded-xl bg-emerald-50/60 px-3.5 py-3 dark:bg-emerald-500/5">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{s.noSettlementNeeded}</p>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-base dark:bg-emerald-500/15">
                    🎉
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {data.settlement.map((tx, i) => (
                    <div
                      key={i}
                      className="group flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs transition-colors duration-200 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/60"
                    >
                      <span className="text-slate-700 dark:text-slate-300">
                        <strong>{memberName(tx.from)}</strong> {s.owes} <strong>{memberName(tx.to)}</strong>
                      </span>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-white">{formatINR(tx.amount)}</span>
                        <Chevron className="text-slate-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-slate-400 dark:text-slate-600" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {analytics.byMember.length > 0 && (
            <Card>
              <div className="mb-3 flex items-center gap-2.5">
                <SectionIcon icon="📈" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{s.byMember}</h2>
              </div>
              <div className="space-y-3.5">
                {analytics.byMember.map((m) => {
                  const pct = analytics.total > 0 ? Math.round((m.value / analytics.total) * 100) : 0;
                  return (
                    <div key={m.userId}>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[9px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {initials(memberName(m.userId))}
                          </span>
                          {memberName(m.userId)}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {formatINR(m.value)}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700 ease-out"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>

      {error && !addModalOpen && (
        <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
          {error}
        </p>
      )}

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <SectionIcon icon="🧾" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{s.expensesTitle}</h2>
          </div>

          {data.expenses.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <FilterPill
                value={expenseRangeMode}
                onChange={(v) => setExpenseRangeMode(v as "all" | "month" | "custom")}
                active
                options={[
                  { value: "all", label: s.allTime },
                  { value: "month", label: s.thisMonth },
                  { value: "custom", label: s.customRange },
                ]}
              />

              {expenseRangeMode === "custom" && (
                <>
                  <div className="w-36">
                    <Input
                      type="date"
                      value={expenseFrom}
                      onChange={(e) => setExpenseFrom(e.target.value)}
                      className="py-2 text-xs"
                    />
                  </div>
                  <div className="w-36">
                    <Input
                      type="date"
                      value={expenseTo}
                      min={expenseFrom}
                      onChange={(e) => setExpenseTo(e.target.value)}
                      className="py-2 text-xs"
                    />
                  </div>
                </>
              )}

              {existingTags.length > 0 && (
                <FilterPill
                  value={expenseTagFilter}
                  onChange={setExpenseTagFilter}
                  options={[
                    { value: "all", label: s.allTags },
                    ...existingTags.map((tg) => ({ value: tg, label: tg })),
                  ]}
                />
              )}

              {data.members.length > 1 && (
                <FilterPill
                  value={expenseMemberFilter}
                  onChange={setExpenseMemberFilter}
                  options={[
                    { value: "all", label: s.allMembers },
                    ...data.members.map((m) => ({ value: m.id, label: m.id === myId ? "You" : m.name })),
                  ]}
                />
              )}

              <FilterPill
                value={expenseLimit}
                onChange={setExpenseLimit}
                options={[
                  { value: "5", label: `${s.show} 5` },
                  { value: "10", label: `${s.show} 10` },
                  { value: "20", label: `${s.show} 20` },
                  { value: "all", label: s.showAll },
                ]}
              />
            </div>
          )}
        </div>

        {data.expenses.length === 0 ? (
          <Card
            onClick={openAddModal}
            className="cursor-pointer border-dashed text-center hover:-translate-y-0.5"
          >
            <div className="flex flex-col items-center justify-center py-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-2xl dark:bg-slate-800">
                🧾
              </div>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{s.noExpenses}</p>
            </div>
          </Card>
        ) : filteredExpenses.length === 0 ? (
          <Card className="text-center text-sm text-slate-500 dark:text-slate-400">
            {s.noExpensesMatchFilters}
          </Card>
        ) : (
          <Card className="divide-y divide-slate-100 p-0 dark:divide-slate-800">
            {visibleExpenses.map((exp) => (
              <div
                key={exp.id}
                className="group flex items-center justify-between gap-3 px-4 py-3.5 transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 sm:px-6"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base transition-transform duration-200 group-hover:scale-105 ${
                      exp.tag ? "" : "bg-slate-100 dark:bg-slate-800"
                    }`}
                    style={exp.tag ? { backgroundColor: `${colorFor(exp.tag)}1a` } : undefined}
                  >
                    {iconForExpense(exp.description, exp.category)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                      {exp.description}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {s.paidBy} {memberName(exp.paidByUserId)} ·{" "}
                      {new Date(exp.date).toLocaleDateString("en-IN")}
                      {exp.tag && (
                        <>
                          {" "}
                          ·{" "}
                          <span
                            className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                            style={{
                              backgroundColor: `${colorFor(exp.tag)}1a`,
                              color: colorFor(exp.tag),
                            }}
                          >
                            {exp.tag}
                          </span>
                        </>
                      )}
                      {exp.splits.length === 0 && (
                        <span className="ml-1 text-[10px] text-slate-400 dark:text-slate-500">
                          · 🔒 {s.notSplitBadge}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {formatINR(exp.amount)}
                  </p>
                  <Chevron className="text-slate-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-slate-400 dark:text-slate-600" />
                </div>
              </div>
            ))}
          </Card>
        )}

        {filteredExpenses.length > 0 && visibleExpenses.length < filteredExpenses.length && (
          <p className="mt-2.5 text-center text-xs text-slate-400 dark:text-slate-500">
            {s.showingPrefix} {visibleExpenses.length} {s.showingOf} {filteredExpenses.length}
          </p>
        )}
      </div>

      <Modal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title={
          <div className="flex flex-col items-center gap-3 pt-1 text-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 to-indigo-500 text-2xl text-white shadow-lg shadow-violet-500/25">
              🔗
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {s.inviteModalTitle}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{s.inviteModalDesc}</p>
            </div>
          </div>
        }
      >
        {invitingLoading || !inviteCode ? (
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            <svg className="h-6 w-6 animate-spin text-slate-300 dark:text-slate-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <p className="text-xs text-slate-400 dark:text-slate-500">{s.generatingCode}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/50 px-5 py-5 dark:border-violet-900/40 dark:bg-violet-500/5">
              <p className="font-mono text-2xl font-bold tracking-[0.3em] text-violet-700 dark:text-violet-300">
                {inviteCode}
              </p>
            </div>
            <Button type="button" variant="accent" onClick={handleCopyInviteCode} className="w-full">
              {codeCopied ? <>✓ {s.copiedLabel}</> : <>📋 {s.copyButton}</>}
            </Button>
          </div>
        )}
      </Modal>

      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title={
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-xl text-white shadow-lg shadow-emerald-500/25">
              🧾
            </div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              {s.addExpense}
            </h2>
          </div>
        }
      >
        {error && (
          <p className="animate-fade-in mb-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
            {error}
          </p>
        )}
        <form onSubmit={handleAddExpense} className="space-y-4">
          <Input
            label={s.descriptionLabel}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={s.descriptionPlaceholder}
            autoFocus
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={s.amountLabel}
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <Input label={s.dateLabel} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input
                label={s.tagLabel}
                list="workspace-tags"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder={s.tagPlaceholder}
              />
              <datalist id="workspace-tags">
                {existingTags.map((tg) => (
                  <option key={tg} value={tg} />
                ))}
              </datalist>
            </div>
            <div>
              <Input
                label={s.categoryLabel}
                list="workspace-categories"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder={s.categoryPlaceholder}
              />
              <datalist id="workspace-categories">
                {existingCategories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
          </div>
          <Select label={s.paidByLabel} value={paidByUserId} onChange={(e) => setPaidByUserId(e.target.value)}>
            {data.members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.id === myId ? "You" : m.name}
              </option>
            ))}
          </Select>

          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-3 dark:bg-slate-800">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{s.splitThis}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {splitEnabled ? s.splitOnHint : s.splitOffHint}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={splitEnabled}
              onClick={() => setSplitEnabled((v) => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800 ${
                splitEnabled ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  splitEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {splitEnabled && (
            <div className="animate-fade-in">
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {s.splitLabel}
              </label>
              <div className="flex flex-wrap gap-2">
                {data.members.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => toggleParticipant(m.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      participantIds.includes(m.id)
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : "border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400"
                    }`}
                  >
                    {m.id === myId ? "You" : m.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button type="submit" loading={submitting} className="w-full">
            {submitting ? s.adding : s.addButton}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
