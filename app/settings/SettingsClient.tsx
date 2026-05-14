"use client";

import Link from "next/link";
import { useState } from "react";
import {
  LayoutDashboard,
  Target,
  Package,
  Settings,
  Database,
  Briefcase,
  Sparkles,
  ChevronRight,
  Bookmark,
  LogOut,
  Phone,
  Mail,
  Copy,
} from "lucide-react";

const PHONE_DISPLAY = "0537 490 69 59";
const PHONE_E164 = "+905374906959";
const EMAIL = "yarkinyoruk1@gmail.com";

export default function SettingsClient() {
  const [copied, setCopied] = useState<"phone" | "email" | null>(null);

  const copyText = async (text: string, key: "phone" | "email") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  };

  const lastUpdated = new Date().toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
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
              <SidebarItem icon={<Target className="h-4 w-4" />} label="Fırsatlar" href="/opportunities" />
              <SidebarItem icon={<Bookmark className="h-4 w-4" />} label="Kaydedilenler" href="/saved" />
              <SidebarItem icon={<LayoutDashboard className="h-4 w-4" />} label="Gündem" href="/" />
              <SidebarItem icon={<Database className="h-4 w-4" />} label="TKDK Sinyalleri" href="/tkdk" />
              <SidebarItem icon={<Briefcase className="h-4 w-4" />} label="İş İlanları" href="/jobs" />
              <SidebarItem icon={<Package className="h-4 w-4" />} label="Kataloğum" href="/catalog" />
              <SidebarItem icon={<Settings className="h-4 w-4" />} label="Ayarlar" active href="/settings" />
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
            <div className="flex h-16 items-center px-10">
              <h1 className="text-[15px] font-semibold tracking-tight text-slate-900">Ayarlar</h1>
            </div>
          </header>

          <main className="px-10 py-10">
            <div className="mx-auto flex max-w-2xl flex-col gap-6">
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-700 text-base font-semibold text-white ring-2 ring-slate-700">
                    YY
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight text-slate-900">Yarkın Yörük</h2>
                    <p className="mt-1 text-sm text-gray-500">Kestrel AI Beta · Kurucu</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void fetch("/api/auth/logout", { method: "POST" }).then(() => {
                      window.location.href = "/login";
                    });
                  }}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Çıkış Yap
                </button>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">İletişim</h2>
                <ul className="mt-5 space-y-4">
                  <li className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                        <Phone className="h-5 w-5" />
                      </div>
                      <a href={`tel:${PHONE_E164}`} className="truncate text-sm font-medium text-slate-900 underline-offset-2 hover:underline">
                        {PHONE_DISPLAY}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => void copyText(PHONE_DISPLAY, "phone")}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-gray-50"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {copied === "phone" ? "Kopyalandı ✓" : "Kopyala"}
                    </button>
                  </li>
                  <li className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                        <Mail className="h-5 w-5" />
                      </div>
                      <a href={`mailto:${EMAIL}`} className="truncate text-sm font-medium text-blue-600 underline-offset-2 hover:underline">
                        {EMAIL}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => void copyText(EMAIL, "email")}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-gray-50"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {copied === "email" ? "Kopyalandı ✓" : "Kopyala"}
                    </button>
                  </li>
                </ul>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Platform</h2>
                <dl className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between gap-4 border-b border-gray-100 pb-3">
                    <dt className="text-gray-500">Versiyon</dt>
                    <dd className="text-right font-medium text-slate-900">Beta 0.1</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-gray-100 pb-3">
                    <dt className="text-gray-500">Platform</dt>
                    <dd className="text-right font-medium text-slate-900">kestrel-engine.vercel.app</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-gray-100 pb-3">
                    <dt className="text-gray-500">Veri Kaynakları</dt>
                    <dd className="max-w-[55%] text-right font-medium text-slate-900">e-ÇED, TKDK IPARD III, Kariyer.net</dd>
                  </div>
                  <div className="flex justify-between gap-4 pt-1">
                    <dt className="text-gray-500">Son Güncelleme</dt>
                    <dd className="text-right font-medium text-slate-900">{lastUpdated}</dd>
                  </div>
                </dl>
              </section>
            </div>
          </main>
        </div>
      </div>
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
