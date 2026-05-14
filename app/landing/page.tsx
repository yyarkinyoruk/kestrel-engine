"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart2,
  CheckCircle2,
  Copy,
  Database,
  Layers,
  Mail,
  Menu,
  MessageSquare,
  Package,
  Sparkles,
  Target,
  X,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

const LANDING_EMAIL = "yarkinyoruk1@gmail.com";
const LANDING_PHONE_DISPLAY = "0537 490 69 59";

function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ob = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setVisible(true);
          ob.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"} ${className}`}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [copied, setCopied] = useState<"phone" | "email" | null>(null);

  const copyText = useCallback(async (text: string, key: "phone" | "email") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = "smooth";
    return () => {
      html.style.scrollBehavior = prev;
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToId = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileOpen(false);
  }, []);

  const gridPatternClass =
    "bg-[linear-gradient(to_right,rgb(51_65_85/0.25)_1px,transparent_1px),linear-gradient(to_bottom,rgb(51_65_85/0.25)_1px,transparent_1px)] bg-[size:64px_64px]";

  return (
    <div
      className="relative min-h-screen scroll-smooth bg-slate-950 text-white antialiased"
      style={{
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div className={`pointer-events-none fixed inset-0 ${gridPatternClass}`} aria-hidden />
      <div className="pointer-events-none fixed -left-40 top-20 h-[420px] w-[420px] rounded-full bg-emerald-500/20 blur-3xl" aria-hidden />
      <div className="pointer-events-none fixed -right-32 top-1/3 h-[380px] w-[380px] rounded-full bg-teal-500/15 blur-3xl" aria-hidden />
      <div className="pointer-events-none fixed bottom-0 left-1/3 h-[320px] w-[480px] rounded-full bg-emerald-600/10 blur-3xl" aria-hidden />

      {/* Nav */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled ? "border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl" : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-10">
          <a href="#top" onClick={(e) => { e.preventDefault(); scrollToId("top"); }} className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/25">
              <Sparkles className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-bold tracking-[0.2em] text-white">KESTREL AI</span>
          </a>

          <nav className="hidden items-center gap-8 md:flex">
            <button type="button" onClick={() => scrollToId("features")} className="text-sm text-slate-400 transition hover:text-white">
              Özellikler
            </button>
            <button type="button" onClick={() => scrollToId("how")} className="text-sm text-slate-400 transition hover:text-white">
              Nasıl Çalışır
            </button>
            <button type="button" onClick={() => scrollToId("sources")} className="text-sm text-slate-400 transition hover:text-white">
              Veri Kaynakları
            </button>
            <button type="button" onClick={() => scrollToId("contact")} className="text-sm text-slate-400 transition hover:text-white">
              İletişim
            </button>
            <Link
              href="/login"
              className="rounded-lg border border-emerald-500 px-4 py-2 text-sm font-medium text-emerald-400 transition hover:bg-emerald-500/10"
            >
              Giriş Yap
            </Link>
            <button
              type="button"
              onClick={() => scrollToId("cta")}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
            >
              Demo Talep Et
            </button>
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              aria-label={mobileOpen ? "Menüyü kapat" : "Menüyü aç"}
              onClick={() => setMobileOpen((o) => !o)}
              className="rounded-lg border border-slate-700 p-2 text-slate-300"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <div className="border-b border-slate-800 bg-slate-950/95 px-6 py-4 backdrop-blur-xl md:hidden">
            <div className="flex flex-col gap-3">
              <button type="button" className="py-2 text-left text-sm text-slate-300" onClick={() => scrollToId("features")}>
                Özellikler
              </button>
              <button type="button" className="py-2 text-left text-sm text-slate-300" onClick={() => scrollToId("how")}>
                Nasıl Çalışır
              </button>
              <button type="button" className="py-2 text-left text-sm text-slate-300" onClick={() => scrollToId("sources")}>
                Veri Kaynakları
              </button>
              <button type="button" className="py-2 text-left text-sm text-slate-300" onClick={() => scrollToId("contact")}>
                İletişim
              </button>
              <Link
                href="/login"
                className="rounded-lg border border-emerald-500 py-2.5 text-center text-sm font-medium text-emerald-400"
                onClick={() => setMobileOpen(false)}
              >
                Giriş Yap
              </Link>
              <button
                type="button"
                onClick={() => scrollToId("cta")}
                className="rounded-lg bg-emerald-500 py-2.5 text-center text-sm font-semibold text-white"
              >
                Demo Talep Et
              </button>
            </div>
          </div>
        ) : null}
      </header>

      <main id="top" className="relative z-10 pt-24 md:pt-28">
        {/* Hero */}
        <section className="relative px-6 pb-20 pt-12 md:px-10 md:pb-28 md:pt-16">
          <Reveal className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-sm text-emerald-400">
              Veriden Gelen Rekabet Üstünlüğü
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
              Endüstriyel Yatırım Fırsatlarını{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Yapay Zekâ</span> ile Yakalayın
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-slate-400 md:text-lg">
              Kestrel AI, Türkiye&apos;deki yeni fabrika yatırımlarını, ekipman ihtiyaçlarını ve satış fırsatlarını gerçek zamanlı olarak tespit eder.
              Satış ekibiniz doğru müşteriye, doğru zamanda ulaşır.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button
                type="button"
                onClick={() => scrollToId("cta")}
                className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:to-teal-400 sm:w-auto"
              >
                Demo Talep Et
              </button>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-900/50 px-8 py-3.5 text-base font-medium text-white transition hover:border-emerald-500/50 hover:bg-slate-800/80 sm:w-auto"
              >
                Platform&apos;u Keşfet
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>

          <Reveal className="relative mx-auto mt-16 max-w-5xl">
            <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-emerald-500/10 blur-2xl" aria-hidden />
            <img
              src="/platform-screenshot.png"
              alt="Kestrel AI Platform"
              className="rounded-2xl border border-slate-700 shadow-2xl"
            />
          </Reveal>
        </section>

        {/* Problem & Solution */}
        <section id="problem" className="scroll-mt-28 border-t border-slate-800/80 px-6 py-24 md:px-10 md:py-32">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-red-400">Problem</h2>
              <p className="text-lg leading-relaxed text-slate-300 md:text-xl">
                Türkiye&apos;de her yıl 10.000+ endüstriyel yatırım başlıyor. Bu yatırımların bilgileri onlarca farklı kamu kaynağına dağılmış durumda.
                Manuel takip pratik olarak imkansız.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Kamu ilanları ve kararlar farklı portallarda yayınlanıyor.",
                  "Satış ekipleri fırsatları duyduğunda çoğu zaman çok geç kalıyor.",
                  "CRM ve Excel ile takip ölçeklenmiyor.",
                ].map((t) => (
                  <li key={t} className="flex gap-3 text-slate-400">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400/80" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-emerald-400">Çözüm</h2>
              <p className="text-lg leading-relaxed text-slate-300 md:text-xl">
                Kestrel AI, kamu kaynaklarını otomatik tarar, yapay zekâ ile analiz eder ve satış ekibinize önceliklendirilmiş fırsat listesi sunar.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Günlük otomatik tarama ve birleşik sinyal akışı.",
                  "AI skorlama ve katalog eşleştirmesi ile önceliklendirme.",
                  "Hazır satış önerileri ve iletişim taslağı üretimi.",
                ].map((t) => (
                  <li key={t} className="flex gap-3 text-slate-400">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400/90" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-28 border-t border-slate-800/80 px-6 py-24 md:px-10 md:py-32">
          <Reveal className="mx-auto max-w-7xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Üç Adımda Satış Fırsatı</h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-400">Veriden aksiyona giden uçtan uca akış.</p>
          </Reveal>
          <div className="mx-auto mt-16 grid max-w-7xl gap-6 md:grid-cols-3">
            {[
              {
                n: "01",
                icon: <Database className="h-6 w-6 text-emerald-400" />,
                title: "Sinyal Toplama",
                body: "ÇED, TKDK ve iş ilanları gibi kaynaklardan veri toplanır, normalize edilir ve tek panelde birleştirilir.",
              },
              {
                n: "02",
                icon: <Sparkles className="h-6 w-6 text-emerald-400" />,
                title: "AI Analiz",
                body: "Modeller yatırım niyetini, sektör uyumunu ve ürün kataloğunuzla eşleşmeyi değerlendirir; skor ve gerekçe üretir.",
              },
              {
                n: "03",
                icon: <Target className="h-6 w-6 text-emerald-400" />,
                title: "Fırsat Eşleştirme",
                body: "Öncelikli listeler, filtreler ve önerilen aksiyonlarla satış ekibiniz doğru hesaplara odaklanır.",
              },
            ].map((step) => (
              <Reveal key={step.n}>
                <div className="group h-full rounded-2xl border border-slate-800 bg-slate-900/50 p-8 transition-all duration-300 hover:border-emerald-500/50">
                  <div className="mb-6 inline-flex rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 px-3 py-1 text-xs font-bold text-white">
                    {step.n}
                  </div>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80">
                    {step.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-28 border-t border-slate-800/80 px-6 py-24 md:px-10 md:py-32">
          <Reveal className="mx-auto max-w-7xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Platform Özellikleri</h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-400">Satış ve pazarlama ekipleri için tasarlanmış modüller.</p>
          </Reveal>
          <div className="mx-auto mt-16 grid max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                { icon: Activity, title: "Günlük Sinyal Akışı", desc: "Her gün yeni yatırım kararları ve ilanlar panelinize düşer." },
                { icon: BarChart2, title: "AI Skorlama", desc: "0–100 arası uyum puanı ile en sıcak fırsatları görün." },
                { icon: Layers, title: "Çoklu Veri Kaynağı", desc: "ÇED, TKDK ve Kariyer.net sinyalleri tek yerde." },
                { icon: Package, title: "Ürün Kataloğu Eşleştirme", desc: "Kendi ürünlerinizle otomatik eşleştirme ve özet." },
                { icon: MessageSquare, title: "Satış Önerileri", desc: "AI destekli iletişim stratejisi ve konuşma başlıkları." },
                { icon: Mail, title: "Tanışma Maili", desc: "Tek tıkla kişiselleştirilmiş mail taslağı oluşturun." },
              ] as { icon: LucideIcon; title: string; desc: string }[]
            ).map((f) => {
              const Icon = f.icon;
              return (
                <Reveal key={f.title}>
                  <div className="group h-full rounded-2xl border border-slate-800 bg-slate-900/40 p-6 transition hover:border-emerald-500/30 hover:bg-slate-900/70">
                    <Icon className="h-8 w-8 text-emerald-400/90 transition group-hover:text-emerald-300" />
                    <h3 className="mt-4 text-base font-semibold text-white">{f.title}</h3>
                    <p className="mt-2 text-sm text-slate-400">{f.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* Metrics */}
        <section className="border-y border-slate-800/80 px-6 py-20 md:px-10 md:py-24">
          <div className="mx-auto max-w-7xl rounded-2xl border border-emerald-900/30 bg-gradient-to-r from-emerald-950/50 to-slate-950 px-6 py-12 md:px-12 md:py-16">
            <div className="grid grid-cols-2 gap-10 md:grid-cols-4 md:gap-6">
              {[
                { n: "1.200+", l: "Yatırım Sinyali" },
                { n: "3", l: "Aktif Veri Kaynağı" },
                { n: "15", l: "Katalog Ürünü" },
                { n: "7/24", l: "Otomatik Tarama" },
              ].map((m) => (
                <div key={m.l} className="text-center">
                  <div className="text-3xl font-bold text-white md:text-4xl">{m.n}</div>
                  <div className="mt-2 text-sm text-slate-400">{m.l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Data sources */}
        <section id="sources" className="scroll-mt-28 px-6 py-24 md:px-10 md:py-32">
          <Reveal className="mx-auto max-w-7xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Entegre Veri Kaynakları</h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-400">Resmî ve güvenilir kanallardan sürekli beslenen veri modeli.</p>
          </Reveal>
          <div className="mx-auto mt-16 grid max-w-7xl gap-6 md:grid-cols-3">
            <Reveal>
              <div className="flex h-full flex-col rounded-2xl border border-blue-500/20 bg-slate-900/50 p-8 transition hover:border-blue-500/40">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-blue-300">e-ÇED Başvuruları</h3>
                  <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-200">
                    500+ sinyal
                  </span>
                </div>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-400">
                  Çevre Bakanlığı ÇED kararları, günlük otomatik tarama.
                </p>
              </div>
            </Reveal>
            <Reveal>
              <div className="flex h-full flex-col rounded-2xl border border-emerald-500/20 bg-slate-900/50 p-8 transition hover:border-emerald-500/40">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-emerald-300">TKDK IPARD III</h3>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-200">
                    400+ sinyal
                  </span>
                </div>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-400">
                  Tarım ve kırsal kalkınma hibe sözleşmeleri.
                </p>
              </div>
            </Reveal>
            <Reveal>
              <div className="flex h-full flex-col rounded-2xl border border-orange-500/20 bg-slate-900/50 p-8 transition hover:border-orange-500/40">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-orange-300">Kariyer.net İş İlanları</h3>
                  <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-0.5 text-xs font-medium text-orange-200">
                    300+ sinyal
                  </span>
                </div>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-400">
                  Üretim sektörü işe alım sinyalleri.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* CTA */}
        <section id="cta" className="scroll-mt-28 px-6 py-24 md:px-10 md:py-32">
          <Reveal className="mx-auto max-w-3xl rounded-3xl border border-slate-800 bg-slate-900/40 px-8 py-16 backdrop-blur-sm md:px-12">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Satış Ekibinizi Güçlendirin</h2>
              <p className="mt-4 text-lg text-slate-400">Demo ve fiyatlandırma için bize yazın</p>
            </div>
            <div className="mx-auto mt-10 w-full max-w-xl space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-6">
                <p className="min-w-0 flex-1 break-all text-xl font-semibold text-emerald-400 sm:text-2xl md:text-3xl">
                  {LANDING_EMAIL}
                </p>
                <button
                  type="button"
                  onClick={() => void copyText(LANDING_EMAIL, "email")}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800/60 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-800"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied === "email" ? "Kopyalandı ✓" : "Kopyala"}
                </button>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="min-w-0 flex-1 text-lg font-medium text-slate-200">{LANDING_PHONE_DISPLAY}</p>
                <button
                  type="button"
                  onClick={() => void copyText(LANDING_PHONE_DISPLAY, "phone")}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800/60 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-800"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied === "phone" ? "Kopyalandı ✓" : "Kopyala"}
                </button>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Footer */}
        <footer id="contact" className="scroll-mt-28 border-t border-slate-800 bg-slate-950 px-6 py-16 md:px-10">
          <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600">
                  <Sparkles className="h-4 w-4 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-xs font-bold tracking-[0.15em] text-white">KESTREL AI</span>
              </div>
              <p className="mt-4 text-sm text-slate-400">Endüstriyel Yatırım Sinyal İstihbaratı</p>
              <p className="mt-6 text-xs text-slate-600">© 2026 Kestrel AI</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Platform</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-400">
                <li>
                  <button type="button" className="hover:text-white" onClick={() => scrollToId("features")}>
                    Özellikler
                  </button>
                </li>
                <li>
                  <button type="button" className="hover:text-white" onClick={() => scrollToId("how")}>
                    Nasıl Çalışır
                  </button>
                </li>
                <li>
                  <button type="button" className="hover:text-white" onClick={() => scrollToId("sources")}>
                    Veri Kaynakları
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">İletişim</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                <li>{LANDING_EMAIL}</li>
                <li>{LANDING_PHONE_DISPLAY}</li>
              </ul>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
