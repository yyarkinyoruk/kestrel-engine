'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Target,
  Sparkles,
  Package,
  Settings,
  Database,
  LayoutDashboard,
  ChevronRight,
  MapPin,
  Factory,
  Zap,
  X,
  Mail,
  Eye,
  CheckCircle,
} from 'lucide-react';

interface OpportunitiesClientProps {
  opportunities: any[];
  products: any[];
  sellers: any[];
  ecedSignals: Record<number, any>;
  tkdkSignals: Record<number, any>;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  new: { label: 'Yeni', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  viewed: { label: 'Görüldü', color: 'bg-gray-50 text-gray-700 border-gray-200' },
  contacted: { label: 'İletişime Geçildi', color: 'bg-amber-50 text-amber-700 border-amber-100' },
  won: { label: 'Kazanıldı', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  lost: { label: 'Kaybedildi', color: 'bg-red-50 text-red-700 border-red-100' },
};

export default function OpportunitiesClient({
  opportunities,
  products,
  sellers,
  ecedSignals,
  tkdkSignals,
}: OpportunitiesClientProps) {
  const [selectedOpp, setSelectedOpp] = useState<any | null>(null);

  function getSignalInfo(opp: any) {
    if (opp.signal_source === 'eced') {
      const s = ecedSignals[opp.signal_id] as any;
      if (!s) return { firma: '—', il: '—', proje: '—', kaynak: 'e-ÇED' };
      return {
        firma: s.company?.display_name || s.raw_company_name || '—',
        il: s.location || '—',
        proje: s.project_name || s.project_type || '—',
        kaynak: 'e-ÇED',
      };
    } else {
      const s = tkdkSignals[opp.signal_id] as any;
      if (!s) return { firma: '—', il: '—', proje: '—', kaynak: 'TKDK' };
      return {
        firma: s.firma || '—',
        il: s.il || '—',
        proje: s.yatirim_adi || s.sektor || '—',
        kaynak: 'TKDK',
      };
    }
  }

  function getMatchedProducts(opp: any) {
    return products.filter((p: any) => opp.matched_product_ids?.includes(p.id));
  }

  function scoreColor(score: number) {
    if (score >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 50) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-gray-700 bg-gray-50 border-gray-200';
  }

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
              <SidebarItem icon={<Database className="h-4 w-4" />} label="TKDK Sinyalleri" href="/tkdk" />
              <SidebarItem icon={<Target className="h-4 w-4" />} label="Fırsatlar" active badge={String(opportunities.length)} href="/opportunities" />
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
                <h1 className="text-[15px] font-semibold tracking-tight text-slate-900">Fırsatlar</h1>
                <p className="text-xs text-gray-500">AI tarafından eşleştirilen yatırım fırsatları · {opportunities.length} fırsat</p>
              </div>
            </div>
          </header>

          <main className="px-10 py-10">
            {opportunities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 mb-4">
                  <Target className="h-8 w-8 text-gray-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-700 mb-2">Henüz fırsat yok</h2>
                <p className="text-sm text-gray-500 text-center max-w-md">
                  Gündem veya TKDK sayfasından bir sinyale tıklayıp &quot;AI Eşleştir&quot; butonuna basarak
                  kataloğunuzdaki ürünlerle otomatik eşleştirme yapabilirsiniz.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {opportunities.map((opp) => {
                  const info = getSignalInfo(opp);
                  const matched = getMatchedProducts(opp);
                  const st = statusLabels[opp.status] || statusLabels.new;

                  return (
                    <div
                      key={opp.id}
                      onClick={() => setSelectedOpp(opp)}
                      className="group cursor-pointer rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-gray-300"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-lg border ${scoreColor(opp.match_score)}`}>
                            {opp.match_score}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{info.firma}</div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <MapPin className="h-3 w-3" />
                              {info.il}
                              <span className="text-gray-300">·</span>
                              <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${info.kaynak === 'TKDK' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                {info.kaynak}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${st.color}`}>
                            {st.label}
                          </span>
                          <ChevronRight className="h-4 w-4 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-slate-900" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-3 line-clamp-1">
                        <Factory className="inline h-3 w-3 mr-1" />
                        {info.proje}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {matched.map((p: any) => (
                          <span key={p.id} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                            {p.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Detail drawer */}
      {selectedOpp && (
        <div className="fixed inset-0 z-50">
          <div onClick={() => setSelectedOpp(null)} className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" />
          <div className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl" style={{ animation: 'slideIn 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards' }}>
            <div className="flex items-start justify-between border-b border-gray-100 px-8 pb-6 pt-8">
              <div>
                <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
                  <Zap className="h-3 w-3" />
                  AI Fırsat Eşleştirmesi
                </div>
                <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                  {getSignalInfo(selectedOpp).firma}
                </h2>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                  <MapPin className="h-3 w-3" />
                  {getSignalInfo(selectedOpp).il}
                </div>
              </div>
              <button onClick={() => setSelectedOpp(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-slate-900">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6">
              {/* Score */}
              <div className="mb-6 flex items-center gap-4">
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border-2 text-2xl font-bold ${scoreColor(selectedOpp.match_score)}`}>
                  {selectedOpp.match_score}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Uyum Puanı</div>
                  <div className="text-xs text-gray-500">
                    {selectedOpp.match_score >= 80 ? 'Yüksek uyum — öncelikli takip' : selectedOpp.match_score >= 50 ? 'Orta uyum — değerlendirmeye değer' : 'Düşük uyum'}
                  </div>
                </div>
              </div>

              {/* AI Reasoning */}
              <div className="mb-6 rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white p-5">
                <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                  <Sparkles className="h-3 w-3" />
                  AI Analizi
                </div>
                <p className="text-sm leading-relaxed text-slate-700">{selectedOpp.ai_reasoning}</p>
              </div>

              {/* Matched Products */}
              <div className="mb-6">
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Eşleşen Ürünler</div>
                <div className="space-y-2">
                  {getMatchedProducts(selectedOpp).map((p: any) => (
                    <div key={p.id} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
                      <Package className="h-5 w-5 text-gray-400 shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-slate-900">{p.name}</div>
                        <div className="text-xs text-gray-500">{p.model_code} · {p.category}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Suggestion */}
              {selectedOpp.ai_suggestion && (
                <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-5">
                  <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    <Mail className="h-3 w-3" />
                    Satış Önerisi
                  </div>
                  <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{selectedOpp.ai_suggestion}</p>
                </div>
              )}

              {/* Signal info */}
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Sinyal Bilgisi</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">Proje:</span></div>
                  <div className="text-slate-700">{getSignalInfo(selectedOpp).proje}</div>
                  <div><span className="text-gray-500">Kaynak:</span></div>
                  <div className="text-slate-700">{getSignalInfo(selectedOpp).kaynak}</div>
                </div>
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