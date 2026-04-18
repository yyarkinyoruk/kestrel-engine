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
} from 'lucide-react';
import { TkdkSignal } from '@/lib/types';

interface TkdkClientProps {
  signals: TkdkSignal[];
  currentPage: number;
  totalPages: number;
  totalSignals: number;
  currentSektor: string;
  sektorCounts: Record<string, number>;
}

export default function TkdkClient({
  signals,
  currentPage,
  totalPages,
  totalSignals,
  currentSektor,
  sektorCounts,
}: TkdkClientProps) {
  const [selectedSignal, setSelectedSignal] = useState<TkdkSignal | null>(null);

  const sektorLabels: Record<string, string> = {
    'Soğuk Hava / Paketleme / Zeytinyağı': 'Soğuk Hava',
    'Süt İşleme': 'Süt',
    'Et İşleme': 'Et',
    'Su Ürünleri': 'Su Ürünleri',
    'Hazır Gıda': 'Hazır Gıda',
    'Yumurta İşleme': 'Yumurta',
  };

  const sektorColors: Record<string, string> = {
    'Soğuk Hava / Paketleme / Zeytinyağı': 'bg-blue-100 text-blue-800',
    'Süt İşleme': 'bg-emerald-100 text-emerald-800',
    'Et İşleme': 'bg-red-100 text-red-800',
    'Su Ürünleri': 'bg-cyan-100 text-cyan-800',
    'Hazır Gıda': 'bg-amber-100 text-amber-800',
    'Yumurta İşleme': 'bg-yellow-100 text-yellow-800',
  };

  function buildHref(params: { page?: number; sektor?: string }) {
    const p = params.page || 1;
    const s = params.sektor || currentSektor;
    let href = '/tkdk?';
    if (p > 1) href += `page=${p}&`;
    if (s !== 'all') href += `sektor=${encodeURIComponent(s)}&`;
    return href.replace(/[&?]$/, '') || '/tkdk';
  }

  function formatTL(val: string) {
    if (!val) return '-';
    const parts = val.split(',');
    if (parts.length >= 2) {
      return parts.slice(0, -1).join(',') + ' TL';
    }
    return val + ' TL';
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

  const allCount = Object.values(sektorCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-900 antialiased">
      <div className="flex min-h-screen">
        {/* Sidebar */}
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
              <SidebarItem icon={<Database className="h-4 w-4" />} label="TKDK Sinyalleri" active href="/tkdk" />
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

        {/* Main */}
        <div className="flex-1 pl-64">
          <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-xl">
            <div className="flex h-16 items-center justify-between px-10">
              <div>
                <h1 className="text-[15px] font-semibold tracking-tight text-slate-900">TKDK Yatırım Sinyalleri</h1>
                <p className="text-xs text-gray-500">IPARD III Gıda İşleme Yatırımları · {totalSignals} sinyal</p>
              </div>
            </div>
          </header>

          <main className="px-10 py-10">
            {/* Sector filter tabs */}
            <div className="flex flex-wrap gap-2 mb-8">
              <Link
                href={buildHref({ sektor: 'all', page: 1 })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  currentSektor === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                Tümü ({allCount})
              </Link>
              {Object.entries(sektorCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([sektor, count]) => (
                  <Link
                    key={sektor}
                    href={buildHref({ sektor, page: 1 })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      currentSektor === sektor
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {sektorLabels[sektor] || sektor} ({count})
                  </Link>
                ))}
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      <th className="px-6 py-3.5">Firma</th>
                      <th className="px-6 py-3.5">İl</th>
                      <th className="px-6 py-3.5">Sektör</th>
                      <th className="px-6 py-3.5">Yatırım</th>
                      <th className="px-6 py-3.5 text-right">Tutar</th>
                      <th className="px-6 py-3.5">Hibe %</th>
                      <th className="px-6 py-3.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {signals.map((signal) => (
                      <tr
                        key={signal.id}
                        className="group cursor-pointer border-b border-gray-50 transition hover:bg-gray-50/60 last:border-0"
                        onClick={() => setSelectedSignal(signal)}
                      >
                        <td className="px-6 py-5">
                          <div className="text-sm font-semibold text-slate-900 max-w-[200px] truncate">
                            {signal.firma}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-sm text-gray-600">{signal.il}</td>
                        <td className="px-6 py-5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                              sektorColors[signal.sektor] || 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {sektorLabels[signal.sektor] || signal.sektor}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-sm text-gray-600 max-w-[200px] truncate">
                          {signal.yatirim_adi}
                        </td>
                        <td className="px-6 py-5 text-right text-sm text-gray-600 whitespace-nowrap">
                          {formatTL(signal.toplam_tl)}
                        </td>
                        <td className="px-6 py-5 text-sm text-gray-600">
                          %{signal.kamu_katkisi_orani}
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

            {/* Pagination */}
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
                    <span key={`e${i}`} className="px-2 text-gray-400">…</span>
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

            <p className="mt-6 text-center text-xs text-gray-400">
              TKDK IPARD III İmzalanan Sözleşmeler Listesinden alınmıştır · Yayımlanma: 04.03.2026
            </p>
          </main>
        </div>
      </div>

      {/* Detail Drawer */}
      {selectedSignal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setSelectedSignal(null)} />
          <div className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl" style={{ animation: 'slideIn 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards' }}>
            <div className="flex items-start justify-between border-b border-gray-100 px-8 pb-6 pt-8">
              <div>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${sektorColors[selectedSignal.sektor] || 'bg-gray-100 text-gray-800'}`}>
                  {selectedSignal.sektor}
                </span>
                <span className="ml-2 text-xs text-gray-400">{selectedSignal.tedbir_kodu}</span>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{selectedSignal.firma}</h2>
              </div>
              <button onClick={() => setSelectedSignal(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-slate-900">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6">
              <div className="mb-6">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Yatırım Adı</div>
                <p className="text-sm text-slate-700">{selectedSignal.yatirim_adi}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500">İl</div>
                  <p className="text-sm text-slate-700">{selectedSignal.il}</p>
                </div>
                <div>
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Adres</div>
                  <p className="text-sm text-slate-700">{selectedSignal.adres || '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Başlangıç</div>
                  <p className="text-sm text-slate-700">{selectedSignal.baslangic_tarihi}</p>
                </div>
                <div>
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Bitiş</div>
                  <p className="text-sm text-slate-700">{selectedSignal.bitis_tarihi}</p>
                </div>
              </div>

              <div className="mb-6 rounded-xl border border-gray-100 bg-gray-50 p-5">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Toplam Yatırım</div>
                <p className="text-xl font-bold text-gray-900">{selectedSignal.toplam_tl} TL</p>
                <p className="text-sm text-gray-500 mt-1">{selectedSignal.toplam_eur} EUR</p>
                <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between text-sm">
                  <span className="text-gray-500">Kamu (TKDK) katkısı</span>
                  <span className="font-medium text-emerald-700">%{selectedSignal.kamu_katkisi_orani}</span>
                </div>
              </div>

              <div className="text-xs text-gray-400">
                Kaynak: {selectedSignal.kaynak} · #{selectedSignal.source_no}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

function SidebarItem({ icon, label, active, badge, href = '#' }: { icon: React.ReactNode; label: string; active?: boolean; badge?: string; href?: string }) {
  return (
    <li>
      <Link href={href} className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${active ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
        <span className="flex items-center gap-3">
          {icon}
          <span className="font-medium">{label}</span>
        </span>
        {badge && <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">{badge}</span>}
      </Link>
    </li>
  );
}