"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useLanguage } from "@/components/providers/LanguageProvider";

type Workspace = {
  id: string;
  slug: string;
  name: string;
  members: { id: string; name: string }[];
};

type WorkspaceType = "TRIP" | "FLATMATES" | "FAMILY" | "OTHER";

const TYPE_ICON: Record<WorkspaceType, string> = {
  TRIP: "✈️",
  FLATMATES: "🏠",
  FAMILY: "❤️",
  OTHER: "⚙️",
};

const TYPE_CARD_BG: Record<WorkspaceType, string> = {
  TRIP: "from-sky-50 to-white dark:from-sky-500/10 dark:to-slate-900",
  FLATMATES: "from-amber-50 to-white dark:from-amber-500/10 dark:to-slate-900",
  FAMILY: "from-rose-50 to-white dark:from-rose-500/10 dark:to-slate-900",
  OTHER: "from-violet-50 to-white dark:from-violet-500/10 dark:to-slate-900",
};

const TILE_GRADIENTS = [
  "from-indigo-400 to-violet-500",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-rose-400 to-pink-500",
  "from-sky-400 to-blue-500",
];

const TILE_ACCENTS = [
  {
    border: "border-violet-200/70 dark:border-violet-500/30",
    bg: "bg-gradient-to-br from-violet-100 via-violet-50 to-white dark:from-violet-500/15 dark:via-slate-900 dark:to-slate-900",
    chevron: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
  },
  {
    border: "border-emerald-200/70 dark:border-emerald-500/30",
    bg: "bg-gradient-to-br from-emerald-100 via-emerald-50 to-white dark:from-emerald-500/15 dark:via-slate-900 dark:to-slate-900",
    chevron: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  {
    border: "border-amber-200/70 dark:border-amber-500/30",
    bg: "bg-gradient-to-br from-amber-100 via-amber-50 to-white dark:from-amber-500/15 dark:via-slate-900 dark:to-slate-900",
    chevron: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
  },
  {
    border: "border-rose-200/70 dark:border-rose-500/30",
    bg: "bg-gradient-to-br from-rose-100 via-rose-50 to-white dark:from-rose-500/15 dark:via-slate-900 dark:to-slate-900",
    chevron: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
  },
  {
    border: "border-sky-200/70 dark:border-sky-500/30",
    bg: "bg-gradient-to-br from-sky-100 via-sky-50 to-white dark:from-sky-500/15 dark:via-slate-900 dark:to-slate-900",
    chevron: "bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300",
  },
];

function gradientIndex(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % TILE_GRADIENTS.length;
  return hash;
}

function ChevronCircle({ className = "" }: { className?: string }) {
  return (
    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:translate-x-0.5 ${className}`}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function WorkspacesPage() {
  const { t } = useLanguage();
  const s = t.dashboard.workspacesSection;

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const [name, setName] = useState("");
  const [type, setType] = useState<WorkspaceType>("TRIP");
  const [creating, setCreating] = useState(false);
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/workspaces");
    const data = await res.json();
    setWorkspaces(
      data.map(
        (w: { id: string; slug: string; name: string; members: { user: { id: string; name: string } }[] }) => ({
          id: w.id,
          slug: w.slug,
          name: w.name,
          members: w.members.map((m) => m.user),
        })
      )
    );
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openModal() {
    setJoinOpen(false);
    setError(null);
    setModalOpen(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const finalName = type === "OTHER" ? name.trim() : s.type[type].label;
    if (!finalName) return;

    setCreating(true);

    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: finalName, type }),
    });

    const data = await res.json();
    setCreating(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    setName("");
    setType("TRIP");
    setModalOpen(false);
    await load();
  }

  async function handleJoin() {
    if (!code.trim()) return;
    setError(null);
    setJoining(true);

    const res = await fetch("/api/workspaces/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    const data = await res.json();
    setJoining(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    setCode("");
    setModalOpen(false);
    await load();
  }

  return (
    <div className="animate-fade-in-up relative isolate -mx-4 -mt-6 min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-sky-50 px-3 pt-6 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 sm:-mx-6 sm:-mt-8 sm:px-3 sm:pt-8 lg:-mx-10 lg:-mt-10 lg:px-4 lg:pt-10">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-500/10" />
        <div className="absolute top-1/4 -right-20 h-80 w-80 rounded-full bg-teal-200/30 blur-3xl dark:bg-teal-500/10" />
        <div className="absolute bottom-0 right-1/4 h-[28rem] w-[28rem] rounded-full bg-emerald-100/50 blur-3xl dark:bg-emerald-400/10" />
        <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-sky-100/40 blur-3xl dark:bg-sky-500/10" />
      </div>

      <div className="relative mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-2xl text-white shadow-lg shadow-emerald-500/25">
            👥
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{s.title}</h1>
            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{s.explainer}</p>
          </div>
        </div>

        <div>
          {loading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">...</p>
          ) : workspaces.length === 0 ? (
            <button
              type="button"
              onClick={() => openModal()}
              className="group flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-300/70 bg-white/40 py-10 text-center backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-white/70 hover:shadow-lg hover:shadow-emerald-500/10 dark:border-emerald-700/50 dark:bg-slate-900/30 dark:hover:bg-slate-900/50"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-2xl text-white shadow-lg shadow-emerald-500/30 transition-transform duration-200 group-hover:scale-110">
                👥
              </div>
              <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">{s.noWorkspaces}</p>
            </button>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {workspaces.map((w) => {
                const idx = gradientIndex(w.name);
                const accent = TILE_ACCENTS[idx];
                return (
                  <Link key={w.id} href={`/dashboard/workspaces/${w.slug}`}>
                    <div
                      className={`group flex items-center gap-3 rounded-2xl border p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${accent.border} ${accent.bg}`}
                    >
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-lg font-bold text-white ${TILE_GRADIENTS[idx]}`}
                      >
                        {w.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {w.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {w.members.length} {s.members}
                        </p>
                      </div>
                      <ChevronCircle className={accent.chevron} />
                    </div>
                  </Link>
                );
              })}

              <button
                type="button"
                onClick={() => openModal()}
                className="group flex min-h-[84px] items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-emerald-300/70 bg-white/40 text-sm font-semibold text-emerald-600 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-white/70 hover:shadow-md hover:shadow-emerald-500/10 dark:border-emerald-700/50 dark:bg-slate-900/30 dark:text-emerald-400 dark:hover:bg-slate-900/50"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-sm text-white shadow-md shadow-emerald-500/30 transition-transform duration-200 group-hover:scale-110">
                  +
                </span>
                {s.createNew}
              </button>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        contentClassName="bg-gradient-to-br from-emerald-50 via-white to-sky-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900"
        title={
          <div className="flex flex-col items-center gap-3 pt-1 text-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-2xl text-white shadow-lg shadow-emerald-500/25">
              👥
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {s.createNew}
            </h2>
          </div>
        }
      >
        {error && (
          <p className="animate-fade-in mb-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
            {error}
          </p>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {s.typeLabel}
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(Object.keys(TYPE_ICON) as WorkspaceType[]).map((key) => (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setType(key)}
                    className={`relative flex flex-col items-center justify-center gap-0.5 rounded-2xl border px-2 py-3 text-center transition-all duration-200 ${
                      type === key
                        ? `border-emerald-400 bg-gradient-to-br shadow-sm ${TYPE_CARD_BG[key]} dark:border-emerald-500`
                        : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
                    }`}
                  >
                    <span
                      className={`absolute top-2 right-2 h-3 w-3 rounded-full border-2 ${
                        type === key
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-slate-300 dark:border-slate-600"
                      }`}
                    />
                    <span className="text-lg leading-none">{TYPE_ICON[key]}</span>
                    <p className="mt-1 text-xs leading-tight font-semibold text-slate-900 dark:text-white">
                      {s.type[key].label}
                    </p>
                    <p className="text-[10px] leading-tight text-slate-500 dark:text-slate-400">
                      {s.type[key].desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {type === "OTHER" && (
              <Input
                label={s.nameLabel}
                icon={<span>👥</span>}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={s.namePlaceholder}
                autoFocus
                required
              />
            )}

            <Button type="submit" loading={creating} className="w-full">
              {creating ? (
                s.creating
              ) : (
                <>
                  {s.createButton} <span>→</span>
                </>
              )}
            </Button>

          <button
            type="button"
            onClick={() => {
              setError(null);
              setJoinOpen((o) => !o);
            }}
            className="flex w-full items-center justify-center gap-1.5 text-center text-xs font-semibold text-violet-600 transition-colors hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
          >
            <span>🔗</span> {s.haveCode}
          </button>

          {joinOpen && (
            <div className="animate-fade-in-up space-y-3 rounded-xl border border-violet-100 bg-violet-50/50 p-3.5 dark:border-violet-900/40 dark:bg-violet-500/5">
              <Input
                label={s.codeLabel}
                icon={<span>🔗</span>}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleJoin();
                  }
                }}
                placeholder={s.codePlaceholder}
                autoFocus
                required
              />
              <Button
                type="button"
                variant="accent"
                loading={joining}
                className="w-full"
                onClick={handleJoin}
              >
                {joining ? (
                  s.joining
                ) : (
                  <>
                    {s.joinButton} <span>→</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </form>
        </Modal>
    </div>
  );
}
