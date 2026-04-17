'use client';

import { useState } from 'react';
import Link from 'next/link';
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

  // Page numbers with ellipsis
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Kestrel AI — TKDK Yatırım Sinyalleri
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              IPARD III Gıda İşleme Yatırımları · {totalSignals} sinyal
            </p>
          </div>
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            ← e-ÇED Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Sector filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Link
            href={buildHref({ sektor: 'all', page: 1 })}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
              currentSektor === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'
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
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  currentSektor === sektor
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'
                }`}
              >
                {sektorLabels[sektor] || sektor} ({count})
              </Link>
            ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Firma</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">İl</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Sektör</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Yatırım</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Tutar</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Hibe %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {signals.map((signal) => (
                  <tr
                    key={signal.id}
                    className="hover:bg-gray-50 cursor-pointer transition"
                    onClick={() => setSelectedSignal(signal)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">
                      {signal.firma}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{signal.il}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          sektorColors[signal.sektor] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {sektorLabels[signal.sektor] || signal.sektor}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">
                      {signal.yatirim_adi}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 whitespace-nowrap">
                      {formatTL(signal.toplam_tl)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      %{signal.kamu_katkisi_orani}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            {currentPage > 1 && (
              <Link
                href={buildHref({ page: currentPage - 1 })}
                className="px-3 py-1 rounded border border-gray-300 text-sm hover:bg-gray-100"
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
                  className={`px-3 py-1 rounded text-sm ${
                    p === currentPage
                      ? 'bg-gray-900 text-white'
                      : 'border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {p}
                </Link>
              )
            )}
            {currentPage < totalPages && (
              <Link
                href={buildHref({ page: currentPage + 1 })}
                className="px-3 py-1 rounded border border-gray-300 text-sm hover:bg-gray-100"
              >
                Sonraki ›
              </Link>
            )}
          </div>
        )}

        {/* Detail Drawer */}
        {selectedSignal && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => setSelectedSignal(null)}
            />
            <div className="relative w-full max-w-lg bg-white shadow-xl overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Sinyal Detayı</h2>
                <button
                  onClick={() => setSelectedSignal(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              <div className="px-6 py-6 space-y-5">
                <div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      sektorColors[selectedSignal.sektor] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {selectedSignal.sektor}
                  </span>
                  <span className="ml-2 text-xs text-gray-400">
                    {selectedSignal.tedbir_kodu}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Firma</p>
                  <p className="text-base font-semibold text-gray-900">
                    {selectedSignal.firma}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Yatırım Adı</p>
                  <p className="text-base text-gray-900">{selectedSignal.yatirim_adi}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">İl</p>
                    <p className="text-base text-gray-900">{selectedSignal.il}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Adres</p>
                    <p className="text-base text-gray-900">{selectedSignal.adres || '-'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Başlangıç</p>
                    <p className="text-base text-gray-900">
                      {selectedSignal.baslangic_tarihi}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Bitiş</p>
                    <p className="text-base text-gray-900">
                      {selectedSignal.bitis_tarihi}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Toplam Yatırım</p>
                  <p className="text-xl font-bold text-gray-900">
                    {selectedSignal.toplam_tl} TL
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedSignal.toplam_eur} EUR
                  </p>
                  <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between text-sm">
                    <span className="text-gray-500">Kamu (TKDK) katkısı</span>
                    <span className="font-medium text-emerald-700">
                      %{selectedSignal.kamu_katkisi_orani}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-gray-400 pt-2">
                  Kaynak: {selectedSignal.kaynak} · #{selectedSignal.source_no}
                </div>
              </div>
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-gray-400">
          TKDK IPARD III İmzalanan Sözleşmeler Listesinden alınmıştır · Yayımlanma: 04.03.2026
        </p>
      </div>
    </div>
  );
}