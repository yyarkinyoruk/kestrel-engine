"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Target,
  Sparkles,
  Package,
  Settings,
  Database,
  LayoutDashboard,
  Briefcase,
  ChevronRight,
  X,
  Bookmark,
  Trash2,
} from "lucide-react";
import type { SavedOpportunity } from "@/lib/types";

interface SavedClientProps {
  items: SavedOpportunity[];
  fetchError: string | null;
}

function sourceBadgeClasses(source: SavedOpportunity["source"]): string {
  if (source === "eced") return "bg-blue-100 text-blue-700";
  if (source === "kariyer") return "bg-orange-100 text-orange-700";
  return "bg-emerald-100 text-emerald-700";
}

function sourceLabel(source: SavedOpportunity["source"]): string {
  if (source === "eced") return "e-ÇED";
  if (source === "kariyer") return "Kariyer.net";
  return "TKDK";
}

function formatSavedAt(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function scoreClass(score: number): string {
  if (score >= 60) return "bg-emerald-100 text-emerald-700";
  if (score >= 40) return "bg-amber-100 text-amber-700";
  return "bg-gray-100 text-gray-600";
}

export default function SavedClient({ items: initialItems, fetchError }: SavedClientProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [selected, setSelected] = useState<SavedOpportunity | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const openDrawer = (row: SavedOpportunity) => setSelected(row);
  const closeDrawer = () => setSelected(null);

  const handleDelete = async () => {
    if (!selected) return;
    setDeleteBusy(true);
    try {
      const res = await fetch("/api/saved", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: selected.source, signal_id: selected.signal_id }),
      });
      const data = await res.json();
      if (data.success) {
        setItems((prev) => prev.filter((x) => !(x.source === selected.source && x.signal_id === selected.signal_id)));
        closeDrawer();
        router.refresh();
      } else {
        alert(typeof data.error === "string" ? data.error : "Silinemedi");
      }
    } catch (e) {
      alert(String(e));
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-900 antialiased">
      <div className="flex min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col bg-slate-900 text-white">
          <div className="flex items-center gap-2.5 px-6 pb-8 pt-7">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/20">
              <Sparkles className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-semibold tracking-tight">Kestrel AI</span>
              <span className="mt-0.5 text-[10px] font-medium tracking-wide text-slate-400">INVESTMENT SIGNALS</span>
            </div>
          </div>
          <nav className="flex-1 px-3">
            <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Menü</div>
            <ul className="space-y-1">
              <SidebarItem icon={<Target className="h-4 w-4" />} label="Fırsatlar" href="/opportunities" />
              <SidebarItem icon={<Bookmark className="h-4 w-4" />} label="Kaydedilenler" active href="/saved" />
              <SidebarItem icon={<LayoutDashboard className="h-4 w-4" />} label="Gündem" href="/" />
              <SidebarItem icon={<Database className="h-4 w-4" />} label="TKDK Sinyalleri" href="/tkdk" />
              <SidebarItem icon={<Briefcase className="h-4 w-4" />} label="İş İlanları" href="/jobs" />
              <SidebarItem icon={<Package className="h-4 w-4" />} label="Kataloğum" href="/catalog" />
              <SidebarItem icon={<Settings className="h-4 w-4" />} label="Ayarlar" href="/settings" />
            </ul>
          </nav>
          <div className="mx-3 mb-4 rounded-xl border border-slate-800 bg-slate-800/40 p-3 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-700 text-xs font-semibold ring-2 ring-slate-700">
                YY
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">Yarkın Yörük</div>
                <div className="truncate text-xs text-slate-400">Kestrel AI Beta</div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-500" />
            </div>
          </div>
        </aside>

        <div className="flex-1 pl-64">
          <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-xl">
            <div className="flex h-16 items-center justify-between px-10">
              <div>
                <h1 className="text-[15px] font-semibold tracking-tight text-slate-900">Kaydedilenler</h1>
                <p className="text-xs text-gray-500">{items.length} kayıt</p>
              </div>
            </div>
          </header>

          <main className="px-10 py-10">
            {fetchError ? (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                Kayıtlar yüklenemedi: {fetchError}
                <span className="mt-1 block text-xs text-red-600">
                  Supabase&apos;de <code className="rounded bg-red-100 px-1">saved_opportunities</code> tablosunu oluşturduğunuzdan emin olun.
                </span>
              </div>
            ) : null}

            {items.length === 0 && !fetchError ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
                <Bookmark className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                <p className="text-sm font-medium text-slate-700">Henüz kayıtlı fırsat yok</p>
                <p className="mt-1 text-xs text-gray-500">Fırsatlar sayfasından bir satır açıp &quot;Kaydet&quot; ile ekleyebilirsiniz.</p>
                <Link href="/opportunities" className="mt-4 inline-block text-sm font-semibold text-emerald-700 hover:underline">
                  Fırsatlara git
                </Link>
              </div>
            ) : null}

            {items.length > 0 ? (
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        <th className="px-6 py-3.5">Kaynak</th>
                        <th className="px-6 py-3.5">Firma</th>
                        <th className="px-6 py-3.5">Proje</th>
                        <th className="px-6 py-3.5">Skor</th>
                        <th className="px-6 py-3.5">Kaydedilme</th>
                        <th className="w-10 px-2 py-3.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((row) => (
                        <tr
                          key={`${row.source}-${row.signal_id}`}
                          onClick={() => openDrawer(row)}
                          className="group cursor-pointer border-b border-gray-50 transition hover:bg-gray-50/80 last:border-0"
                        >
                          <td className="px-6 py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${sourceBadgeClasses(row.source)}`}>
                              {sourceLabel(row.source)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-slate-900">{row.company_name}</td>
                          <td className="max-w-md px-6 py-4 text-sm text-slate-700">{row.project_name}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${scoreClass(row.score)}`}>{row.score}</span>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-500">{formatSavedAt(row.saved_at)}</td>
                          <td className="px-2 py-4">
                            <ChevronRight className="h-4 w-4 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-slate-800" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </main>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50">
          <div onClick={closeDrawer} className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" />
          <div
            className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl"
            style={{ animation: "slideIn 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards" }}
          >
            <div className="flex items-start justify-between border-b border-gray-100 px-8 pb-6 pt-8">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${sourceBadgeClasses(selected.source)}`}>
                    {sourceLabel(selected.source)}
                  </span>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${scoreClass(selected.score)}`}>{selected.score}</span>
                </div>
                <h2 className="text-xl font-semibold tracking-tight text-slate-900">{selected.company_name}</h2>
              </div>
              <button type="button" onClick={closeDrawer} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-slate-900">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-8 py-6">
              <div className="mb-6">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Proje</div>
                <p className="text-sm text-slate-800">{selected.project_name}</p>
              </div>
              <div className="mb-6">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Kaydedilme</div>
                <p className="text-sm text-slate-700">{formatSavedAt(selected.saved_at)}</p>
              </div>
              <div className="mb-6">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Notlar</div>
                <p className="min-h-[4rem] rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-slate-600">{selected.notes?.trim() || "— (ileride düzenlenebilir)"}</p>
              </div>
              <button
                type="button"
                disabled={deleteBusy}
                onClick={handleDelete}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-semibold text-red-800 transition hover:bg-red-100 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {deleteBusy ? "Siliniyor..." : "Kaydı Sil"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

function SidebarItem({
  icon,
  label,
  active,
  href = "#",
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  href?: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
          active ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:bg-white/5 hover:text-white"
        }`}
      >
        <span className="flex items-center gap-3">
          {icon}
          <span className="font-medium">{label}</span>
        </span>
      </Link>
    </li>
  );
}
