# Kestrel AI — Project Context

Bu belge, yeni AI sohbetlerine (Claude, Gemini, Cursor) proje bağlamını aktarmak için kullanılır. Yeni bir chat açtığında bu dosyanın tamamını yapıştır ve "Bu projeyi anla, onay ver, sonra sorularıma cevap ver" de.

---

## Kim

**Yarkın Yörük** — Türkiye'de makine mühendisliği öğrencisi, solo kurucu. Sıfıra yakın yazılım geçmişi. AI-orkestralı geliştirme yaklaşımı (Cursor + Claude + Gemini). Paralel projesi: Outnest (Gen Z sosyal, Flutter/Firebase, canlı). Kestrel AI ikinci projesi.

## Ne

**Kestrel AI** = Türk sanayisi için yatırım radarı. Gıda işleme ve endüstriyel soğutma/HVAC ekipmanı satan B2B firmalarına, 6-12 ay öncesinden yeni tesis yatırımı yapacak fabrikaları tespit eden SaaS.

**Değer önermesi**: Bir makine satıcısının satış ekibi her sabah Kestrel'i açtığında, AI tarafından puanlanmış "yüksek niyetli" yatırım sinyallerini görür — ÇED başvuruları, teşvik belgeleri, TKDK destekleri gibi açık kaynaklardan.

**Benzerleri**: 6sense ($100K/yıl, Türkçe yok), Apollo, Clay. Türkiye'de doğrudan rakip yok. ihalerapor.com 2024'te kapandı.

**Domain**: kestrelai.co (Namecheap → Vercel).

## Mimari

**İki ayrı proje** var:

1. **Vitrin** (`machineai` klasörü, `kestrelai.co` canlı) — statik "Wizard of Oz" prototipi, pilot toplantılarında demo için. DOKUNMAYIZ.

2. **Motor** (`kestrelai` klasörü) — gerçek ürün, üzerinde çalıştığımız. Vercel'e ayrı proje olarak deploy edilecek. Stabilleşince vitrinle swap.

## Stack (Değişmez)

- Next.js 15 (App Router, TypeScript, Turbopack)
- Tailwind CSS (shadcn/MUI/Radix YOK)
- lucide-react ikonlar (tek dış UI kütüphanesi)
- Supabase (PostgreSQL + Auth)
- Playwright / xlsx (scraping)
- Vercel Cron (zamanlanmış işler)
- OpenRouter + Gemini 1.5 Flash (AI analizi)
- Dil: **TypeScript only, Python YOK**

## Veri Kaynakları

**MVP (canlı):** e-ÇED Olumlu Kararlar (Excel download, günlük 921+ kayıt)

**Faz 2 (sırada):** Resmi Gazete teşvik belgeleri, TKDK IPARD, Ticaret Sicili Gazetesi (MERSIS backfill için)

**Faz 3+:** MERSIS direct, EPİAŞ, LinkedIn, KAP, KIK, inşaat ruhsatları

## Şu Anki Durum

- Supabase'de 731 firma + 921 ÇED sinyali (gerçek veri)
- Dashboard localhost'ta Supabase ile bağlı, real-data tablo + drawer
- GitHub repo: `kestrel-engine`
- Motor henüz canlıya deploy edilmedi

## 10 Haftalık Yol Haritası

- H0-2: Vitrin + Wizard of Oz (TAMAMLANDI)
- H3-4: e-ÇED scraper + dashboard bağlantı (TAMAMLANDI)
- H5-6: Vercel Cron + Resmi Gazete (ŞU AN)
- H7: Auth + katalog CRUD
- H8: Gemini AI analizi + mail taslağı
- H9: Polish + ilk 2-3 pilot kullanıcı
- H10: Pilot feedback + ücretli karar

## Fiyatlandırma (Plan)

25K / 65K / 150K+ TL/yıl. "6sense $100K, Kestrel 1/50 maliyet" çerçevesi.

## Tasarım Kuralları

- Apple/Stripe/Linear seviyesi premium
- Arka plan: bg-gray-50
- Vurgu: bg-slate-900
- Başarı/AI: emerald-50/700
- Bol whitespace, rounded-xl/2xl, shadow-sm
- Font: Inter

## AI Asistanına Beklentilerim

- Kararları SORGULAMA (niş, stack, scope değişmez)
- Sıfır kod geçmişiliyim — yorum satırları Türkçe, kod küçük parçalara bölünsün
- Copy-paste edilebilir çıktılar, aşırı açıklama yok
- Türkçe-İngilizce karışık normal, teknik terimler EN kalsın
- Hatalıysam söyle, kayırma

## Nerede Çalışıyorum

- Windows PC: `C:\Users\yarki\OneDrive\Masaüstü\kestrelai` (motor)
- Cursor IDE (ücretsiz tier)
- PowerShell terminal (Cursor içinden)

---

**Son güncelleme:** (güncellediğin tarih)