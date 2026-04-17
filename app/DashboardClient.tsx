"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Target,
  Package,
  Settings,
  Bell,
  Download,
  X,
  Sparkles,
  Mail,
  Bookmark,
  ChevronRight,
  ChevronLeft,
  Search,
  Calendar,
  MapPin,
  Factory,
  Database,
  Building2,
  Gauge,
} from "lucide-react";
import type { SignalWithCompany } from "@/lib/types";
import type { AiAnalysis } from "@/lib/gemini";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Bugün";
  if (diffDays === 1) return "Dün";
  if (diffDays <= 7) return "Bu Hafta";
  if (diffDays <= 30) return "Bu Ay";

  const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

export default function DashboardClient({
  signals,
  currentPage,
  totalPages,
  totalSignals,
}: {
  signals: SignalWithCompany[];
  currentPage: number;
  totalPages: number;
  totalSignals: number;
}) {
  const [selected, setSelected] = useState<SignalWithCompany | null>(null);
  const [activeFilter, setActiveFilter] = useState("Bu Ay");
  const [emailData, setEmailData] = useState<{ subject: string; body: string } | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const openDrawer = (sig: SignalWithCompany) => {
    setSelected(sig);
    setEmailData(null);
    setAnalysis(null);
  };

  const closeDrawer = () => {
    setSelected(null);
    setEmailData(null);
    setAnalysis(null);
  };

  const handleGenerateAnalysis = async () => {
    if (!selected) return;
    setAnalysisLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signalId: selected.id, mode: "analysis" }),
      });
      const data = await res.json();
      if (data.success) {
        setAnalysis(data.analysis);
      } else {
        alert("AI analizi alınamadı: " + (data.error || "Bilinmeyen hata"));
      }
    } catch (err) {
      alert("Bağlantı hatası: " + String(err));
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleGenerateEmail = async () => {
    if (!selected) return;
    setEmailLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signalId: selected.id, mode: "email" }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailData(data.email);
      } else {
        alert("Mail taslağı alınamadı: " + (data.error || "Bilinmeyen hata"));
      }
    } catch (err) {
      alert("Bağlantı hatası: " + String(err));
    } finally {
      setEmailLoading(false);
    }
  };

  const visiblePages = Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => {
    if (totalPages <= 7) return true;
    if (p === 1 || p === totalPages) return true;
    if (p >= currentPage - 1 && p <= currentPage + 1) return true;
    return false;
  });

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
              <NavItem icon={<LayoutDashboard className="h-4 w-4" />} label="Gündem" active />
              <NavItem icon={<Target className="h-4 w-4" />} label="Fırsatlar" badge={String(totalSignals)} />
              <NavItem icon={<Package className="h-4 w-4" />} label="Kataloğum" />
              <NavItem icon={<Settings className="h-4 w-4" />} label="Ayarlar" />
            </ul>
          </nav>

          <div className="mx-3 mb-4 rounded-xl border border-slate-800 bg-slate-800/40 p-3 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-700 text-xs font-semibold ring-2 ring-slate-700">YY</div>
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
                <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-gray-500">
                  <Calendar className="h-3 w-3" />
                  {new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long" })}
                </div>
                <h1 className="mt-0.5 text-[15px] font-semibold tracking-tight text-slate-900">Sektörel Yatırım Özetiniz</h1>
                <Link href="/tkdk" className="mt-1 inline-block text-sm text-emerald-600 underline hover:text-emerald-800">
                  TKDK Sinyalleri →
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-slate-900">
                  <Search className="h-4 w-4" />
                </button>
                <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-slate-900">
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                </button>
                <div className="mx-2 h-6 w-px bg-gray-200" />
                <button className="flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-slate-800">
                  <Download className="h-3.5 w-3.5" />
                  Dışa Aktar
                </button>
              </div>
            </div>
          </header>

          <main className="px-10 py-10">
            <div className="mb-8 grid grid-cols-4 gap-4">
              <StatCard label="Toplam Sinyal" value={String(totalSignals)} trend="e-ÇED" icon={<Sparkles className="h-4 w-4" />} />
              <StatCard label="Benzersiz Firma" value={String(new Set(signals.map((s) => s.company_id)).size)} trend="bu sayfa" icon={<Building2 className="h-4 w-4" />} />
              <StatCard label="Aktif Şehir" value={String(new Set(signals.map((s) => s.company?.location?.trim()).filter(Boolean)).size)} trend="il" icon={<MapPin className="h-4 w-4" />} />
              <StatCard label="Sektör" value={String(new Set(signals.map((s) => s.project_type).filter(Boolean)).size)} trend="çeşit" icon={<Gauge className="h-4 w-4" />} />
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <div className="flex items-center gap-1.5 rounded-full bg-gray-100 p-1">
                  {["Bugün", "Bu Hafta", "Bu Ay"].map((f) => (
                    <button key={f} onClick={() => setActiveFilter(f)} className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${activeFilter === f ? "bg-white text-slate-900 shadow-sm" : "text-gray-500 hover:text-slate-900"}`}>
                      {f}
                    </button>
                  ))}
                </div>
                <div className="text-xs text-gray-500">
                  <span className="font-medium text-slate-900">{totalSignals}</span> yatırım sinyali
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      <th className="px-6 py-3.5">Tarih</th>
                      <th className="px-6 py-3.5">Lokasyon</th>
                      <th className="px-6 py-3.5">Firma</th>
                      <th className="px-6 py-3.5">Tesis Türü</th>
                      <th className="px-6 py-3.5">Kaynak</th>
                      <th className="px-6 py-3.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {signals.map((sig) => (
                      <tr key={sig.id} onClick={() => openDrawer(sig)} className="group cursor-pointer border-b border-gray-50 transition hover:bg-gray-50/60 last:border-0">
                        <td className="px-6 py-5">
                          <span className="text-xs font-medium text-gray-500">{formatDate(sig.announcement_date)}</span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-1.5 text-sm text-slate-700">
                            <MapPin className="h-3.5 w-3.5 text-gray-400" />
                            {sig.location?.trim() || "—"}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 text-[11px] font-semibold text-slate-700">
                              {sig.company?.display_name?.substring(0, 2).toUpperCase() || "??"}
                            </div>
                            <div className="max-w-xs">
                              <div className="text-sm font-semibold text-slate-900 truncate">{sig.company?.display_name || sig.raw_company_name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-1.5 text-sm text-slate-700 max-w-xs">
                            <Factory className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            <span className="truncate">{sig.project_type || "—"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold bg-blue-50 text-blue-700 border-blue-100">
                            <Database className="h-2.5 w-2.5" />
                            e-ÇED
                          </span>
                        </td>
                        <td className="px-6 py-5 pr-6">
                          <ChevronRight className="h-4 w-4 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-slate-900" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Sayfa <span className="font-medium text-slate-900">{currentPage}</span> / <span className="font-medium text-slate-900">{totalPages}</span>
                <span className="mx-2">·</span>
                Gösterilen: {signals.length} kayıt (toplam {totalSignals})
              </div>
              <div className="flex items-center gap-2">
                {currentPage > 1 ? (
                  <Link href={`/?page=${currentPage - 1}`} className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-gray-50">
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Önceki
                  </Link>
                ) : (
                  <span className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-300 cursor-not-allowed">
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Önceki
                  </span>
                )}

                <div className="flex items-center gap-1">
                  {visiblePages.map((p, idx) => {
                    const prev = visiblePages[idx - 1];
                    const showEllipsis = prev && p - prev > 1;
                    return (
                      <span key={p} className="flex items-center gap-1">
                        {showEllipsis && <span className="px-1 text-gray-400">…</span>}
                        <Link href={`/?page=${p}`} className={`flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-xs font-medium transition ${p === currentPage ? "bg-slate-900 text-white" : "border border-gray-200 bg-white text-slate-700 hover:bg-gray-50"}`}>
                          {p}
                        </Link>
                      </span>
                    );
                  })}
                </div>

                {currentPage < totalPages ? (
                  <Link href={`/?page=${currentPage + 1}`} className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-gray-50">
                    Sonraki
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <span className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-300 cursor-not-allowed">
                    Sonraki
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-gray-400">Çevre Bakanlığı e-ÇED kayıtlarından otomatik çekilmiştir · Her sabah 06:00&apos;da güncellenir</p>
          </main>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50">
          <div onClick={closeDrawer} className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" />
          <div className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl" style={{ animation: "slideIn 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards" }}>
            <div className="flex items-start justify-between border-b border-gray-100 px-8 pb-6 pt-8">
              <div>
                <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
                  <Sparkles className="h-3 w-3" />
                  AI Fırsat Analizi
                </div>
                <h2 className="text-xl font-semibold tracking-tight text-slate-900">{selected.company?.display_name || selected.raw_company_name}</h2>
                <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-500">
                  <MapPin className="h-3 w-3" />
                  {selected.location?.trim() || "Konum bilgisi yok"}
                </div>
              </div>
              <button onClick={closeDrawer} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-slate-900">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6">
              <div className="mb-6 rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-emerald-50/30 p-5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Proje</div>
                <div className="mt-1 text-sm font-medium text-emerald-900 leading-snug">{selected.project_name}</div>
              </div>

              <div className="mb-6">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Sektör</div>
                <p className="text-sm text-slate-700">{selected.project_type || "—"}</p>
              </div>

              <div className="mb-6">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Karar Tarihi</div>
                <p className="text-sm text-slate-700">{selected.announcement_date ? new Date(selected.announcement_date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }) : "—"}</p>
              </div>

              <div className="mb-6">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Kaynak</div>
                {selected.source_url ? (
                  <Link href={selected.source_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">
                    Çevre Bakanlığı e-ÇED Olumlu Kararları
                  </Link>
                ) : (
                  <span className="text-sm text-gray-400">Kaynak bilgisi yok</span>
                )}
              </div>

              {analysis ? (
                <div className="mb-6 rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">AI Analizi</span>
                    <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${analysis.urgency === "high" ? "bg-red-50 text-red-700" : analysis.urgency === "medium" ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-700"}`}>
                      {analysis.urgency === "high" ? "Acil" : analysis.urgency === "medium" ? "Orta" : "Düşük"} Öncelik
                    </span>
                  </div>
                  <p className="mb-4 text-sm leading-relaxed text-slate-700">{analysis.summary}</p>
                  <div className="mb-4">
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Muhtemel Ekipman İhtiyaçları</div>
                    <ul className="space-y-1.5">
                      {analysis.equipmentNeeds.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="border-t border-emerald-100 pt-3">
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Ana İçgörü</div>
                    <p className="text-sm font-medium text-emerald-900">{analysis.keyInsight}</p>
                  </div>
                </div>
              ) : (
                <button onClick={handleGenerateAnalysis} disabled={analysisLoading} className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50">
                  <Sparkles className="h-4 w-4" />
                  {analysisLoading ? "AI Analiz Ediyor..." : "AI Analizi Üret"}
                </button>
              )}

              {emailData && (
                <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2.5">
                    <Mail className="h-3.5 w-3.5 text-gray-500" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">AI Mail Taslağı</span>
                  </div>
                  <div className="px-4 py-4 text-sm leading-relaxed text-slate-700">
                    <div className="mb-3 text-xs text-gray-500">
                      <span className="font-medium text-slate-700">Konu:</span> {emailData.subject}
                    </div>
                    <div className="whitespace-pre-wrap">{emailData.body}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 bg-white px-8 py-5">
              <button onClick={handleGenerateEmail} disabled={emailLoading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-60">
                <Mail className="h-4 w-4" />
                {emailLoading ? "Mail Üretiliyor..." : emailData ? "Yeniden Üret" : "Tanışma Maili Taslağı Üret"}
              </button>
              <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-slate-700 transition hover:bg-gray-50">
                <Bookmark className="h-4 w-4" />
                CRM&apos;e Kaydet
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

function NavItem({ icon, label, active, badge }: { icon: React.ReactNode; label: string; active?: boolean; badge?: string }) {
  return (
    <li>
      <Link href="#" className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${active ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
        <span className="flex items-center gap-3">
          {icon}
          <span className="font-medium">{label}</span>
        </span>
        {badge && <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">{badge}</span>}
      </Link>
    </li>
  );
}

function StatCard({ label, value, trend, icon }: { label: string; value: string; trend: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{label}</span>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-50 text-gray-500">{icon}</div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">{value}</span>
        <span className="text-[11px] font-medium text-emerald-600">{trend}</span>
      </div>
    </div>
  );
}