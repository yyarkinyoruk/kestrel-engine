'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Package,
  ChevronRight,
  ExternalLink,
  Tag,
  Cpu,
  Factory,
  X,
  LayoutDashboard,
  Target,
  Settings,
  Database,
  Sparkles,
} from 'lucide-react';
import { CatalogProduct, Seller } from '@/lib/types';

interface CatalogClientProps {
  seller: Seller | null;
  products: CatalogProduct[];
  currentCategory: string;
  categoryCounts: Record<string, number>;
}

const categoryIcons: Record<string, string> = {
  'Yeni Nesil Öğütme': '⚙️',
  'Temizleme Grubu': '🧹',
  'Değirmen Grubu': '🏭',
  'Tartım ve Paketleme': '📦',
  'Taşıma Grubu': '🔄',
  'Yem Değirmeni Makineleri': '🌾',
};

export default function CatalogClient({
  seller,
  products,
  currentCategory,
  categoryCounts,
}: CatalogClientProps) {
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);

  const allCount = Object.values(categoryCounts).reduce((a, b) => a + b, 0);

  function buildHref(category: string) {
    if (category === 'all') return '/catalog';
    return `/catalog?category=${encodeURIComponent(category)}`;
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
              <SidebarItem icon={<Database className="h-4 w-4" />} label="TKDK Sinyalleri" badge="264" href="/tkdk" />
              <SidebarItem icon={<Target className="h-4 w-4" />} label="Fırsatlar" href="#" />
              <SidebarItem icon={<Package className="h-4 w-4" />} label="Kataloğum" active href="/catalog" />
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
                <h1 className="text-[15px] font-semibold tracking-tight text-slate-900">Ürün Kataloğum</h1>
                {seller && (
                  <p className="text-xs text-gray-500">{seller.name} · {allCount} ürün</p>
                )}
              </div>
              {seller?.website && (
                <Link
                  href={seller.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-gray-50"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Web Sitesi
                </Link>
              )}
            </div>
          </header>

          <main className="px-10 py-10">
            {/* Category filters */}
            <div className="flex flex-wrap gap-2 mb-8">
              <Link
                href={buildHref('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  currentCategory === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                Tümü ({allCount})
              </Link>
              {Object.entries(categoryCounts)
                .sort((a, b) => a[0].localeCompare(b[0], 'tr'))
                .map(([cat, count]) => (
                  <Link
                    key={cat}
                    href={buildHref(cat)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      currentCategory === cat
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {categoryIcons[cat] || '📦'} {cat} ({count})
                  </Link>
                ))}
            </div>

            {/* Product grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className="group cursor-pointer rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-gray-300"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-lg">
                      {categoryIcons[product.category] || '📦'}
                    </div>
                    {product.model_code && (
                      <span className="rounded-md bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-600 tracking-wide">
                        {product.model_code}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1 group-hover:text-emerald-700 transition">
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                      {product.category}
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-600" />
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>

      {/* Product detail drawer */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50">
          <div onClick={() => setSelectedProduct(null)} className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" />
          <div
            className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl"
            style={{ animation: 'slideIn 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards' }}
          >
            <div className="flex items-start justify-between border-b border-gray-100 px-8 pb-6 pt-8">
              <div>
                {selectedProduct.model_code && (
                  <div className="mb-2 inline-block rounded-md bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-600 tracking-wide">
                    {selectedProduct.model_code}
                  </div>
                )}
                <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                  {selectedProduct.name}
                </h2>
                <p className="mt-1 text-xs text-gray-500">{selectedProduct.category}</p>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6">
              {/* Description */}
              <div className="mb-6">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Açıklama</div>
                <p className="text-sm leading-relaxed text-slate-700">{selectedProduct.description}</p>
              </div>

              {/* Features */}
              {selectedProduct.features.length > 0 && (
                <div className="mb-6">
                  <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    <Cpu className="h-3 w-3" />
                    Özellikler
                  </div>
                  <ul className="space-y-1.5">
                    {selectedProduct.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Applications */}
              {selectedProduct.applications.length > 0 && (
                <div className="mb-6">
                  <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    <Factory className="h-3 w-3" />
                    Uygulama Alanları
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.applications.map((a, i) => (
                      <span
                        key={i}
                        className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-slate-700"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Keywords */}
              {selectedProduct.keywords.length > 0 && (
                <div className="mb-6">
                  <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    <Tag className="h-3 w-3" />
                    AI Eşleştirme Anahtar Kelimeleri
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProduct.keywords.map((k, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Product link */}
              {selectedProduct.product_url && (
                <Link
                  href={selectedProduct.product_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-blue-600 transition hover:bg-gray-100"
                >
                  <ExternalLink className="h-4 w-4" />
                  Üretici sayfasında görüntüle
                </Link>
              )}
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