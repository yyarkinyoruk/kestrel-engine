"use client";

import Link from "next/link";
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
  MapPin,
  Calendar,
  X,
  ExternalLink,
  Mail,
  Bookmark,
  Loader2,
  Copy,
} from "lucide-react";
import type { UnifiedOpportunity } from "@/lib/types";

interface OpportunitiesClientProps {
  opportunities: UnifiedOpportunity[];
  currentSort: "score" | "date";
  currentSource: "all" | "eced" | "kariyer" | "tkdk";
  highMatchCount: number;
  dataSourcesActive: number;
}

function cleanNbspText(text: string | null | undefined): string {
  if (!text) return "";
  return text.replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function buildOpportunitiesHref(next: { sort?: "score" | "date"; source?: "all" | "eced" | "kariyer" | "tkdk" }) {
  const sp = new URLSearchParams();
  const sort = next.sort ?? "score";
  const source = next.source ?? "all";
  if (sort === "date") sp.set("sort", "date");
  if (source !== "all") sp.set("source", source);
  const q = sp.toString();
  return q ? `/opportunities?${q}` : "/opportunities";
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function tableScoreBadgeClass(score: number): string {
  if (score >= 60) return "bg-emerald-100 text-emerald-700";
  if (score >= 40) return "bg-amber-100 text-amber-700";
  return "bg-gray-100 text-gray-600";
}

function drawerScoreBadgeClass(score: number): string {
  if (score >= 60) return "bg-emerald-100 text-emerald-700 ring-emerald-200/60";
  if (score >= 40) return "bg-amber-100 text-amber-700 ring-amber-200/60";
  return "bg-gray-100 text-gray-600 ring-gray-200/60";
}

function sourceBadgeClasses(source: UnifiedOpportunity["source"]): string {
  if (source === "eced") return "bg-blue-100 text-blue-700";
  if (source === "kariyer") return "bg-orange-100 text-orange-700";
  return "bg-emerald-100 text-emerald-700";
}

function sourceLabel(source: UnifiedOpportunity["source"]): string {
  if (source === "eced") return "e-ÇED";
  if (source === "kariyer") return "Kariyer.net";
  return "TKDK";
}

function recommendedActionBadge(action: string | undefined) {
  const a = (action || "").trim().toLowerCase();
  const variants: Record<string, { label: string; cls: string }> = {
    hemen_ara: { label: "Hemen Ara", cls: "bg-emerald-100 text-emerald-700" },
    takipte_kal: { label: "Takipte Kal", cls: "bg-amber-100 text-amber-700" },
    atla: { label: "Atla", cls: "bg-gray-100 text-gray-600" },
  };
  const m = variants[a];
  if (m) {
    return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${m.cls}`}>{m.label}</span>;
  }
  if ((action || "").trim()) {
    return <span className="text-sm text-slate-700">{action}</span>;
  }
  return null;
}

function AnalysisDrawerBody({ row }: { row: UnifiedOpportunity }) {
  const a = row.analysis;
  const reasoning = typeof a?.reasoning === "string" ? a.reasoning : "";
  const matchedProducts = Array.isArray(a?.matched_products)
    ? (a.matched_products as string[]).filter(Boolean).join(", ")
    : "";
  const investmentType = typeof a?.investment_type === "string" ? a.investment_type : "";
  const recommended = typeof a?.recommended_action === "string" ? a.recommended_action : undefined;
  const actionEl = recommendedActionBadge(recommended);
  const salesApproach = typeof a?.sales_approach === "string" ? a.sales_approach : "";
  const salesRecommendation = typeof a?.sales_recommendation === "string" ? a.sales_recommendation : "";
  const sales = salesApproach || salesRecommendation;

  const detectedRaw = a?.detected_equipment;
  const detectedList = Array.isArray(detectedRaw)
    ? (detectedRaw as string[]).filter((x) => typeof x === "string" && x.trim())
    : [];

  const desc = cleanNbspText(row.descriptionText ?? row.rawText);

  return (
    <>
      <div className="mb-6">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Proje / Pozisyon</div>
        <p className="text-sm font-medium leading-snug text-slate-900">{row.projectName}</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-4 text-sm text-slate-700">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          <span>{row.location?.trim() || "—"}</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-600">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          <span>{formatDate(row.date)}</span>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50/90 to-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-slate-600" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">AI Analizi</span>
        </div>
        {reasoning ? (
          <p className="mb-4 text-sm leading-relaxed text-slate-700">{reasoning}</p>
        ) : (
          <p className="mb-4 text-sm text-gray-400">AI değerlendirme metni yok.</p>
        )}
        {matchedProducts ? (
          <div className="mb-4">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Eşleşen Ürünler</div>
            <p className="text-sm text-slate-700">{matchedProducts}</p>
          </div>
        ) : null}
        {investmentType ? (
          <div className="mb-4">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Yatırım Tipi</div>
            <p className="text-sm text-slate-700">{investmentType}</p>
          </div>
        ) : null}
        {actionEl ? (
          <div className="mb-4">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Önerilen Aksiyon</div>
            <div>{actionEl}</div>
          </div>
        ) : null}
        {sales ? (
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Satış Önerisi</div>
            <p className="text-sm leading-relaxed text-slate-700">{sales}</p>
          </div>
        ) : null}
      </div>

      {row.source === "kariyer" && row.url ? (
        <div className="mb-6">
          <Link
            href={row.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-800 transition hover:bg-orange-100"
          >
            <ExternalLink className="h-4 w-4" />
            Kariyer.net ilanını aç
          </Link>
        </div>
      ) : null}

      {detectedList.length > 0 ? (
        <div className="mb-6">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Tespit edilen ekipman</div>
          <ul className="space-y-1.5">
            {detectedList.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span
                  className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${
                    row.source === "kariyer" ? "bg-orange-500" : row.source === "eced" ? "bg-blue-500" : "bg-emerald-500"
                  }`}
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {desc ? (
        <div className="mb-6">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Açıklama</div>
          <p className="break-words text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{desc}</p>
        </div>
      ) : null}
    </>
  );
}

export default function OpportunitiesClient({
  opportunities,
  currentSort,
  currentSource,
  highMatchCount,
  dataSourcesActive,
}: OpportunitiesClientProps) {
  const [selected, setSelected] = useState<UnifiedOpportunity | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailDraft, setEmailDraft] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [savedHydrating, setSavedHydrating] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const total = opportunities.length;

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    setSavedHydrating(true);
    (async () => {
      try {
        const url = `/api/saved?source=${encodeURIComponent(selected.source)}&signal_id=${encodeURIComponent(selected.id)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (cancelled) return;
        if (data.success) {
          setIsSaved(Boolean(data.saved));
        } else {
          setIsSaved(false);
          console.error("[opportunities] GET /api/saved", data);
        }
      } catch (e) {
        if (!cancelled) {
          setIsSaved(false);
          console.error("[opportunities] GET /api/saved fetch", e);
        }
      } finally {
        if (!cancelled) setSavedHydrating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  const closeDrawer = () => {
    setSelected(null);
    setEmailLoading(false);
    setEmailDraft(null);
    setIsSaved(false);
    setSavedHydrating(false);
    setSaveBusy(false);
  };

  const handleGenerateEmail = async () => {
    if (!selected || selected.source !== "eced") return;
    const payload = { signalId: selected.id, mode: "email" as const, source: "eced" };
    console.log("[opportunities] mail POST /api/analyze", payload);
    setEmailLoading(true);
    setEmailDraft(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log("[opportunities] mail response", { ok: res.ok, status: res.status, success: data.success, keys: data ? Object.keys(data) : [] });
      if (data.success && data.email?.subject != null && data.email?.body != null) {
        setEmailDraft(`Konu: ${data.email.subject}\n\n${data.email.body}`);
      } else {
        console.error("[opportunities] mail hata gövdesi", data);
        alert(typeof data.error === "string" ? data.error : "Mail taslağı alınamadı");
      }
    } catch (err) {
      console.error("[opportunities] mail fetch exception", err);
      alert("Bağlantı hatası: " + String(err));
    } finally {
      setEmailLoading(false);
    }
  };

  const handleToggleSave = async () => {
    if (!selected || saveBusy || savedHydrating) return;
    setSaveBusy(true);
    try {
      if (isSaved) {
        const res = await fetch("/api/saved", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source: selected.source, signal_id: selected.id }),
        });
        const data = await res.json();
        if (data.success) setIsSaved(false);
        else {
          console.error("[opportunities] DELETE /api/saved", data);
          alert(typeof data.error === "string" ? data.error : "Kayıt silinemedi");
        }
      } else {
        const body = {
          source: selected.source,
          signal_id: selected.id,
          company_name: selected.companyName,
          project_name: selected.projectName,
          score: selected.score,
        };
        const res = await fetch("/api/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (data.success) setIsSaved(true);
        else {
          console.error("[opportunities] POST /api/saved", data);
          alert(typeof data.error === "string" ? data.error : "Kaydedilemedi");
        }
      }
    } catch (e) {
      console.error("[opportunities] save toggle", e);
      alert(String(e));
    } finally {
      setSaveBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100/80 via-gray-50 to-gray-50 font-sans text-slate-900 antialiased">
      <div className="flex min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col bg-slate-900 text-white">
          <div className="flex items-center gap-2.5 px-6 pb-8 pt-7">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/25">
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
              <SidebarItem icon={<Target className="h-4 w-4" />} label="Fırsatlar" active href="/opportunities" />
              <SidebarItem icon={<Bookmark className="h-4 w-4" />} label="Kaydedilenler" href="/saved" />
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
          <header className="sticky top-0 z-10 border-b border-gray-200/80 bg-white/90 backdrop-blur-xl">
            <div className="flex min-h-16 flex-col gap-3 px-10 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-slate-900">Fırsatlar</h1>
                <p className="mt-0.5 text-xs text-gray-500">
                  Yüksek skorlu sinyaller — <span className="font-medium text-slate-700">{total}</span> kayıt
                </p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-gray-100 p-1">
                <Link
                  href={buildOpportunitiesHref({ sort: "score", source: currentSource })}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${currentSort === "score" ? "bg-white text-slate-900 shadow-sm" : "text-gray-500 hover:text-slate-900"}`}
                >
                  En Yüksek Skor
                </Link>
                <Link
                  href={buildOpportunitiesHref({ sort: "date", source: currentSource })}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${currentSort === "date" ? "bg-white text-slate-900 shadow-sm" : "text-gray-500 hover:text-slate-900"}`}
                >
                  En Güncel
                </Link>
              </div>
            </div>
          </header>

          <main className="px-10 py-10">
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-gray-200/80 bg-gradient-to-br from-white to-gray-50 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Toplam Fırsat</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <Target className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-slate-900">{total}</p>
              </div>
              <div className="rounded-2xl border border-emerald-100/80 bg-gradient-to-br from-white to-emerald-50/40 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800/80">Yüksek Eşleşme</span>
                  <span className="text-[10px] font-semibold uppercase text-emerald-600">≥60</span>
                </div>
                <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-emerald-700">{highMatchCount}</p>
              </div>
              <div className="rounded-2xl border border-gray-200/80 bg-gradient-to-br from-white to-gray-50 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Veri Kaynağı</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <Database className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-slate-900">{dataSourcesActive}</p>
                <p className="mt-1 text-[11px] font-medium text-gray-500">Aktif kaynak</p>
              </div>
            </div>

            <div className="mb-6 flex flex-wrap items-center gap-2">
              {(
                [
                  { key: "all", label: "Tümü" },
                  { key: "eced", label: "e-ÇED" },
                  { key: "kariyer", label: "Kariyer.net" },
                  { key: "tkdk", label: "TKDK" },
                ] as const
              ).map(({ key, label }) => (
                <Link
                  key={key}
                  href={buildOpportunitiesHref({ sort: currentSort, source: key })}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                    currentSource === key ? "bg-slate-900 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-slate-900"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>

            {total === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white/60 py-20">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50">
                  <Target className="h-8 w-8 text-gray-400" />
                </div>
                <h2 className="text-lg font-semibold text-slate-700">Bu filtrede fırsat yok</h2>
                <p className="mt-2 max-w-md text-center text-sm text-gray-500">
                  Seçili kaynak veya eşik için kayıt bulunamadı. Tümünü seçerek diğer yüksek skorlu sinyallere göz atın.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        <th className="px-6 py-3.5">Kaynak</th>
                        <th className="px-6 py-3.5">Firma</th>
                        <th className="px-6 py-3.5">Proje / Pozisyon</th>
                        <th className="px-6 py-3.5">Lokasyon</th>
                        <th className="px-6 py-3.5">Tarih</th>
                        <th className="px-6 py-3.5">AI Skor</th>
                        <th className="w-10 px-2 py-3.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {opportunities.map((row) => (
                        <tr
                          key={row.id}
                          onClick={() => {
                            setSavedHydrating(true);
                            setIsSaved(false);
                            setSelected(row);
                            setEmailDraft(null);
                            setEmailLoading(false);
                          }}
                          className="group cursor-pointer border-b border-gray-50 transition hover:bg-slate-50/80 last:border-0"
                        >
                          <td className="px-6 py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${sourceBadgeClasses(row.source)}`}>
                              {sourceLabel(row.source)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-semibold text-slate-900">{row.companyName}</span>
                          </td>
                          <td className="max-w-xs px-6 py-4">
                            <span className="line-clamp-2 text-sm text-slate-700">{row.projectName}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600">{row.location?.trim() || "—"}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs text-gray-500">{formatDate(row.date)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${tableScoreBadgeClass(row.score)}`}>
                              {row.score}
                            </span>
                          </td>
                          <td className="px-2 py-4">
                            <ChevronRight className="h-4 w-4 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-slate-800" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50">
          <div onClick={closeDrawer} className="absolute inset-0 bg-slate-900/25 backdrop-blur-sm" />
          <div
            className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-gray-100 bg-white shadow-2xl"
            style={{ animation: "slideIn 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards" }}
          >
            <div className="shrink-0 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50 px-8 pb-6 pt-8">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${sourceBadgeClasses(selected.source)}`}>
                      {sourceLabel(selected.source)}
                    </span>
                    <span
                      className={`inline-flex min-w-[3rem] items-center justify-center rounded-full px-3 py-1 text-lg font-bold tabular-nums ring-2 ring-offset-2 ring-offset-white ${drawerScoreBadgeClass(selected.score)}`}
                    >
                      {selected.score}
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight text-slate-900">{selected.companyName}</h2>
                  {selected.sector ? <p className="mt-1 text-xs text-gray-500">{selected.sector}</p> : null}
                </div>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-slate-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
                <AnalysisDrawerBody row={selected} />
                {emailDraft ? (
                  <div className="mb-4 rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/40 to-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">Mail taslağı</span>
                      <button
                        type="button"
                        onClick={() => void navigator.clipboard.writeText(emailDraft)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-50"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Kopyala
                      </button>
                    </div>
                    <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-slate-800">{emailDraft}</pre>
                  </div>
                ) : null}
              </div>

              <div className="sticky bottom-0 z-10 shrink-0 border-t border-gray-200 bg-white px-8 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={selected.source !== "eced" || emailLoading}
                    title={selected.source !== "eced" ? "Yakında" : undefined}
                    onClick={handleGenerateEmail}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/25 transition hover:from-emerald-500 hover:to-teal-500 disabled:cursor-not-allowed disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-500 disabled:shadow-none"
                  >
                    {emailLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Mail üretiliyor...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        Tanışma Maili Taslağı Üret
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={saveBusy || savedHydrating}
                    onClick={handleToggleSave}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition ${
                      isSaved
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                        : "border-gray-200 bg-white text-slate-700 hover:bg-gray-50"
                    } disabled:opacity-60`}
                  >
                    {saveBusy || savedHydrating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                        {savedHydrating ? "Yükleniyor..." : "İşleniyor..."}
                      </>
                    ) : isSaved ? (
                      <>Kaydedildi ✓</>
                    ) : (
                      <>
                        <Bookmark className="h-4 w-4" />
                        Kaydet
                      </>
                    )}
                  </button>
                </div>
              </div>
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
  badge,
  href = "#",
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: string;
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
        {badge ? <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">{badge}</span> : null}
      </Link>
    </li>
  );
}
