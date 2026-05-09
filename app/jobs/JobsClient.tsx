'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Target,
  Package,
  Settings,
  Database,
  Sparkles,
  ChevronRight,
  X,
  Briefcase,
} from 'lucide-react';
import { KariyerSignal } from '@/lib/types';

interface JobsClientProps {
  signals: KariyerSignal[];
  currentPage: number;
  totalPages: number;
  totalSignals: number;
  currentSector: string;
  sectorCounts: Record<string, number>;
}

function cleanDescriptionText(text: string | null | undefined) {
  if (!text) return '';
  return text.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function intentScoreBadgeClass(score: number | null): string | null {
  if (score === null || score === 0) return null;
  if (score >= 60) return 'bg-emerald-100 text-emerald-700';
  if (score >= 30) return 'bg-amber-100 text-amber-700';
  return 'bg-gray-100 text-gray-600';
}

function IntentScoreBadge({ score }: { score: number | null }) {
  const cls = intentScoreBadgeClass(score);
  if (!cls) return null;
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${cls}`}>{score}</span>
  );
}

export default function JobsClient({
  signals,
  currentPage,
  totalPages,
  totalSignals,
  currentSector,
  sectorCounts,
}: JobsClientProps) {
  const [selectedSignal, setSelectedSignal] = useState<KariyerSignal | null>(null);

  function buildHref(params: { page?: number; sektor?: string }) {
    const p = params.page || 1;
    const s = params.sektor || currentSector;
    let href = '/jobs?';
    if (p > 1) href += `page=${p}&`;
    if (s !== 'all') href += `sektor=${encodeURIComponent(s)}&`;
    return href.replace(/[&?]$/, '') || '/jobs';
  }

  function getPageNumbers() {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }

  function formatDate(value: string | null) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

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
              <SidebarItem icon={<LayoutDashboard className="h-4 w-4" />} label="Gündem" href="/" />
              <SidebarItem icon={<Database className="h-4 w-4" />} label="TKDK Sinyalleri" href="/tkdk" />
              <SidebarItem icon={<Briefcase className="h-4 w-4" />} label="İş İlanları" active href="/jobs" />
              <SidebarItem icon={<Target className="h-4 w-4" />} label="Fırsatlar" href="/opportunities" />
              <SidebarItem icon={<Package className="h-4 w-4" />} label="Kataloğum" href="/catalog" />
              <SidebarItem icon={<Settings className="h-4 w-4" />} label="Ayarlar" href="#" />
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
                <h1 className="text-[15px] font-semibold tracking-tight text-slate-900">İş İlanları</h1>
                <p className="text-xs text-gray-500">Kariyer.net sinyalleri · {totalSignals} ilan</p>
              </div>
            </div>
          </header>

          <main className="px-10 py-10">
            <div className="mb-8 grid grid-cols-1 gap-4">
              <StatCard label="Toplam İlan" value={String(totalSignals)} trend="Kariyer.net" icon={<Briefcase className="h-4 w-4" />} />
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      <th className="px-6 py-3.5">Firma</th>
                      <th className="px-6 py-3.5">Pozisyon</th>
                      <th className="px-6 py-3.5">Lokasyon</th>
                      <th className="px-6 py-3.5">Sektör</th>
                      <th className="px-6 py-3.5">Yayın Tarihi</th>
                      <th className="px-6 py-3.5">Skor</th>
                      <th className="px-6 py-3.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {signals.map((signal) => (
                      <tr
                        key={signal.kariyer_id}
                        className="group cursor-pointer border-b border-gray-50 transition hover:bg-gray-50/60 last:border-0"
                        onClick={() => setSelectedSignal(signal)}
                      >
                        <td className="max-w-[220px] truncate px-6 py-5 text-sm font-semibold text-slate-900">{signal.company_name}</td>
                        <td className="max-w-[260px] truncate px-6 py-5 text-sm text-gray-600">{signal.title}</td>
                        <td className="max-w-[180px] truncate px-6 py-5 text-sm text-gray-600">{signal.location || '-'}</td>
                        <td className="px-6 py-5 text-sm text-gray-600">{signal.sector || 'Bilinmiyor'}</td>
                        <td className="px-6 py-5 text-sm text-gray-600">{formatDate(signal.publish_date)}</td>
                        <td className="px-6 py-5">
                          <IntentScoreBadge score={signal.intent_score ?? null} />
                        </td>
                        <td className="px-6 py-5">
                          <ChevronRight className="h-4 w-4 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-slate-900" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                {currentPage > 1 && (
                  <Link
                    href={buildHref({ page: currentPage - 1 })}
                    className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-gray-50"
                  >
                    ‹ Önceki
                  </Link>
                )}
                {getPageNumbers().map((p, i) =>
                  typeof p === 'string' ? (
                    <span key={`e${i}`} className="px-2 text-gray-400">
                      …
                    </span>
                  ) : (
                    <Link
                      key={p}
                      href={buildHref({ page: p })}
                      className={`flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-xs font-medium transition ${
                        p === currentPage
                          ? 'bg-slate-900 text-white'
                          : 'border border-gray-200 bg-white text-slate-700 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </Link>
                  )
                )}
                {currentPage < totalPages && (
                  <Link
                    href={buildHref({ page: currentPage + 1 })}
                    className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-gray-50"
                  >
                    Sonraki ›
                  </Link>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {selectedSignal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setSelectedSignal(null)} />
          <div
            className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl"
            style={{ animation: 'slideIn 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards' }}
          >
            <div className="flex items-start justify-between border-b border-gray-100 px-8 pb-6 pt-8">
              <div>
                <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                  {selectedSignal.sector || 'Bilinmiyor'}
                </span>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{selectedSignal.company_name}</h2>
              </div>
              <button
                onClick={() => setSelectedSignal(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6">
              <div className="mb-6">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Pozisyon</div>
                <p className="text-sm text-slate-700">{selectedSignal.title}</p>
              </div>

              <div className="mb-6 grid grid-cols-2 gap-4">
                <div>
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Lokasyon</div>
                  <p className="text-sm text-slate-700">{selectedSignal.location || '-'}</p>
                </div>
                <div>
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Yayın Tarihi</div>
                  <p className="text-sm text-slate-700">{formatDate(selectedSignal.publish_date)}</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Sektör</div>
                <p className="text-sm text-slate-700">{selectedSignal.sector || 'Bilinmiyor'}</p>
              </div>

              {selectedSignal.intent_analysis ? (
                <div className="mb-6 rounded-xl border border-gray-100 bg-gray-50/80 p-5">
                  <div className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-gray-500">AI Analizi</div>
                  {intentScoreBadgeClass(selectedSignal.intent_score ?? null) ? (
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-gray-600">Intent Score</span>
                      <IntentScoreBadge score={selectedSignal.intent_score ?? null} />
                    </div>
                  ) : null}
                  {selectedSignal.intent_analysis.reasoning ? (
                    <div className="mb-4">
                      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Değerlendirme</div>
                      <p className="whitespace-pre-wrap text-sm text-slate-700">{selectedSignal.intent_analysis.reasoning}</p>
                    </div>
                  ) : null}
                  {selectedSignal.intent_analysis.detected_equipment?.length ? (
                    <div className="mb-4">
                      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Tespit Edilen Ekipman</div>
                      <p className="text-sm text-slate-700">{selectedSignal.intent_analysis.detected_equipment.join(', ')}</p>
                    </div>
                  ) : null}
                  {selectedSignal.intent_analysis.investment_type ? (
                    <div className="mb-4">
                      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Yatırım Tipi</div>
                      <p className="text-sm text-slate-700">{selectedSignal.intent_analysis.investment_type}</p>
                    </div>
                  ) : null}
                  {selectedSignal.intent_analysis.sales_recommendation ? (
                    <div>
                      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Satış Önerisi</div>
                      <p className="whitespace-pre-wrap text-sm text-slate-700">{selectedSignal.intent_analysis.sales_recommendation}</p>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="mb-6">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Açıklama</div>
                <p className="whitespace-pre-wrap text-sm text-slate-700">
                  {cleanDescriptionText(selectedSignal.description_text) || 'Açıklama çekilemedi'}
                </p>
              </div>

              {selectedSignal.url ? (
                <Link
                  href={selectedSignal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline break-all"
                >
                  Kariyer.net ilanını aç
                </Link>
              ) : (
                <p className="text-sm text-gray-400">Kariyer.net linki bulunamadı</p>
              )}
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
  href = '#',
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
          active ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:bg-white/5 hover:text-white'
        }`}
      >
        <span className="flex items-center gap-3">
          {icon}
          <span className="font-medium">{label}</span>
        </span>
        {badge && (
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
            {badge}
          </span>
        )}
      </Link>
    </li>
  );
}

function StatCard({
  label,
  value,
  trend,
  icon,
}: {
  label: string;
  value: string;
  trend: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{label}</span>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-50 text-gray-500">{icon}</div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="tabular-nums text-2xl font-bold tracking-tight text-slate-900">{value}</span>
        <span className="text-[11px] font-medium text-emerald-600">{trend}</span>
      </div>
    </div>
  );
}
