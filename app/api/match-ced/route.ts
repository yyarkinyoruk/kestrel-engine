// app/api/match-ced/route.ts
// Kestrel AI — ÇED Sinyalleri ↔ Katalog Eşleştirme
// Mart 2026+ ÇED sinyallerini Alapala kataloguna karşı analiz eder
// İki aşamalı: keyword pre-filter → Groq AI derinlemesine analiz

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// ─── Keyword Pre-Filter ───────────────────────────────
// ÇED sinyal metninde bu keyword'ler varsa, katalog eşleşme potansiyeli var

interface KeywordGroup {
  category: string;
  weight: number;
  keywords: string[];
}

const POSITIVE_KEYWORDS: KeywordGroup[] = [
  {
    // Birebir eşleşme — un/değirmen/irmik/bulgur
    category: 'un_degirmen',
    weight: 35,
    keywords: [
      'un fabrikası', 'un değirmeni', 'un üretim', 'un tesisi',
      'değirmen', 'öğütme', 'irmik', 'bulgur',
      'buğday', 'mısır unu', 'çavdar', 'pirinç unu',
      'unlu mamul', 'makarna', 'bisküvi', 'nişasta',
    ],
  },
  {
    // Birebir eşleşme — yem fabrikası
    category: 'yem_fabrikasi',
    weight: 35,
    keywords: [
      'yem fabrikası', 'karma yem', 'yem tesisi', 'yem üretim',
      'hayvan yemi', 'kümes', 'kanatlı', 'pelet',
      'yem değirmeni', 'yem sanayi',
      'balık yemi', 'tavuk yemi',
    ],
  },
  {
    // Tahıl depolama / silo — elevatör satış potansiyeli
    category: 'tahil_depolama',
    weight: 20,
    keywords: [
      'tahıl', 'hububat', 'silo', 'tahıl deposu',
      'çeltik', 'pirinç fabrikası', 'arpa', 'hububat deposu',
    ],
  },
  {
    // Gıda sektörü genel — geniş filtre, AI karar verecek
    category: 'gida_genel',
    weight: 15,
    keywords: [
      'gıda', 'paketleme', 'ambalaj', 'bakliyat',
      'et işleme', 'süt işleme', 'hazır gıda',
      'konserve', 'şeker fabrikası', 'mezbaha',
    ],
  },
  {
    // Hayvancılık — yem makinesi dolaylı sinyal
    category: 'hayvancilik',
    weight: 12,
    keywords: [
      'hayvancılık', 'büyükbaş', 'küçükbaş', 'tavuk',
      'entegre', 'çiftlik', 'damızlık', 'piliç',
      'yumurta', 'süt çiftliği',
    ],
  },
  {
    // Tarım / genel sanayi — düşük ama filtreden geçsin
    category: 'tarim_sanayi',
    weight: 8,
    keywords: [
      'tarım', 'tarımsal', 'sera', 'kesimhane',
      'soğuk hava', 'soğutma', 'frigorifik',
    ],
  },
];

const NEGATIVE_KEYWORDS = [
  { keywords: ['çimento fabrikası', 'beton santrali', 'maden ocağı', 'taş ocağı', 'tekstil', 'boyama tesisi', 'iplik', 'maden'], penalty: 40 },
  { keywords: ['güneş enerjisi', 'güneş enerji', 'rüzgar enerjisi', 'rüzgar enerji', 'solar', 'ges', 'res', 'enerji santrali', 'mwm', 'mwe', 'mwh', 'türbin'], penalty: 40 },
  { keywords: ['konut', 'rezidans', 'avm', 'otel', 'hastane'], penalty: 40 },
  { keywords: ['atık bertaraf', 'geri dönüşüm', 'arıtma tesisi', 'atık depolama', 'düzenli depolama'], penalty: 30 },
];

function keywordScore(text: string): { score: number; matched: string[]; categories: string[] } {
  const lower = text.toLocaleLowerCase('tr-TR');
  let total = 0;
  const matched: string[] = [];
  const categories: string[] = [];

  for (const group of POSITIVE_KEYWORDS) {
    let groupMatched = false;
    for (const kw of group.keywords) {
      if (lower.includes(kw.toLocaleLowerCase('tr-TR'))) {
        matched.push(kw);
        if (!groupMatched) {
          total += group.weight;
          categories.push(group.category);
          groupMatched = true;
        }
      }
    }
  }

  for (const neg of NEGATIVE_KEYWORDS) {
    for (const kw of neg.keywords) {
      if (lower.includes(kw.toLocaleLowerCase('tr-TR'))) {
        total -= neg.penalty;
        matched.push(`[-] ${kw}`);
        break;
      }
    }
  }

  return { score: Math.max(0, Math.min(100, total)), matched, categories };
}

// ─── Groq AI Analiz ───────────────────────────────────
async function analyzeWithGroq(
  signal: Record<string, any>,
  products: Record<string, any>[],
  sellerName: string
): Promise<{ score: number; analysis: Record<string, any> } | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const productList = products.map(p =>
    `• ${p.name} (${p.model_code}) — ${p.category}: ${p.description}`
  ).join('\n');

  const prompt = `Sen Türkiye endüstriyel ekipman pazarında 20 yıl deneyimli bir satış müdürüsün. ${sellerName} firmasının ürünlerini satıyorsun.

Aşağıda bir Çevresel Etki Değerlendirme (ÇED) başvurusu var. Bu yatırım projesinin ${sellerName}'nın ürün katalogundaki ekipmanları gerçekten satın alma olasılığını değerlendir.

═══ ÇED YATIRIM BİLGİSİ ═══
Firma: ${signal.raw_company_name || 'Bilinmiyor'}
Proje Adı: ${signal.project_name || 'Bilinmiyor'}
Tesis Türü: ${signal.project_type || 'Bilinmiyor'}
Lokasyon: ${signal.location || 'Bilinmiyor'}
Ham Metin: ${(signal.raw_text || '').slice(0, 800)}

═══ ${sellerName.toUpperCase()} ÜRÜN KATALOĞU ═══
${productList}

═══ PUANLAMA REHBERİ ═══
Bu puanlama çok önemli — gerçekçi ol, yüksek puan vermekten kaçın:

90-100: Bu firma BİREBİR müşteri. Un fabrikası/değirmen kuruyorsa vals, elek, sasör LAZIM. Yem fabrikası kuruyorsa pelet presi, mikser LAZIM. Proje açıkça bu ekipmanları gerektiriyor.

70-89: Çok güçlü eşleşme. Proje türü doğrudan ilgili (tahıl işleme, un/yem üretimi) ama spesifik detay eksik. Yüksek olasılıkla bu ekipmanlara ihtiyaç duyacak.

50-69: Orta eşleşme. Gıda sektörü ama un/yem dışı (süt, et, hazır gıda vs). Bazı yardımcı ekipmanlar (taşıma, filtreleme, paketleme) uyabilir ama core ürünler değil.

30-49: Zayıf eşleşme. Dolaylı bağlantı var (tarım, hayvancılık) ama bu firma büyük olasılıkla farklı tip ekipman alacak.

0-29: Eşleşme yok. Farklı sektör (enerji, madencilik, inşaat, kimya vs). Zaman kaybı.

ÖNEMLI KURALLAR:
- Gıda sektörü diye otomatik yüksek puan VERME. Süt fabrikası ≠ un fabrikası. Et işleme ≠ yem fabrikası.
- "Gıda tesisi" genel ifadesi 50-60 bandında kalmalı, 80+ olmamalı.
- Sadece un, irmik, bulgur, değirmen, yem, karma yem, pelet, tahıl işleme projeleri 70+ hak eder.
- Eğer proje türü hiç belli değilse (sadece "gıda" yazıyorsa), 50'yi geçme.
- Elevatör ve filtre gibi genel ekipmanlar için puan şişirme — bunlar un/yem fabrikası olmadan satılmaz.

Aşağıdaki JSON formatında yanıt ver, başka bir şey yazma:
{
  "match_score": <0-100 arası puan>,
  "reasoning": "<2-3 cümle: neden bu puanı verdiğin, hangi ürünler uyuyor/uymuyor>",
  "matched_products": ["<eşleşen ürün adları listesi>"],
  "investment_type": "<un_fabrikasi | yem_fabrikasi | tahil_depolama | gida_isleme | diger>",
  "recommended_action": "<hemen_ara | takipte_kal | atla>",
  "sales_approach": "<satış ekibine 1-2 cümle spesifik öneri>"
}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.15,
        max_tokens: 600,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.error(`Groq API hatası: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    return {
      score: parsed.match_score || 0,
      analysis: parsed,
    };
  } catch (err) {
    console.error('Groq analiz hatası:', err);
    return null;
  }
}

// ─── Ana Endpoint ─────────────────────────────────────
export async function GET(req: NextRequest) {
  const startTime = Date.now();

  // Auth
  const secret = req.headers.get('x-kestrel-secret');
  if (!secret || secret !== process.env.KESTREL_CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('🔍 ÇED ↔ Katalog eşleştirme başladı');

    // Katalog ve satıcı bilgilerini çek
    const { data: products } = await supabase.from('catalog_products').select('*');
    const { data: sellers } = await supabase.from('sellers').select('*');

    if (!products?.length || !sellers?.length) {
      return NextResponse.json({ error: 'Katalog veya satıcı bulunamadı' }, { status: 400 });
    }

    const seller = sellers[0]; // Pilot: Alapala Makina

    // Henüz eşleştirilmemiş sinyaller
    const { data: signals, error: fetchError } = await supabase
      .from('ced_signals')
      .select('*, company:companies(*)')
      .eq('is_catalog_matched', false)
      .order('announcement_date', { ascending: false });

    if (fetchError) throw new Error(`Supabase fetch hatası: ${fetchError.message}`);
    if (!signals || signals.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Eşleştirilecek sinyal bulunamadı',
        durationMs: Date.now() - startTime,
      });
    }

    console.log(`📋 ${signals.length} ÇED sinyali analiz edilecek`);

    let keywordMatches = 0;
    let aiAnalyzed = 0;
    let highScore = 0;
    const results: Array<{ id: number; company: string; project: string; kwScore: number; aiScore?: number; finalScore: number }> = [];

    for (const signal of signals) {
      // Sinyal metnini oluştur
      const text = [
        signal.project_name,
        signal.project_type,
        signal.raw_company_name,
        signal.company?.display_name,
        signal.location,
        signal.raw_text,
      ].filter(Boolean).join(' ');

      // Adım 1: Keyword pre-filter
      const kwResult = keywordScore(text);

      if (kwResult.score >= 15) {
        keywordMatches++;

        // Adım 2: Groq AI analiz
        const aiResult = await analyzeWithGroq(signal, products, seller.name);

        // Rate limit koruması: 2.5 saniye bekle
        await new Promise((resolve) => setTimeout(resolve, 2500));

        const finalScore = aiResult
          ? Math.round(kwResult.score * 0.2 + aiResult.score * 0.8)
          : kwResult.score;

        if (finalScore >= 75) highScore++;

        // Supabase güncelle
        const { error: updateError } = await supabase
          .from('ced_signals')
          .update({
            is_catalog_matched: true,
            catalog_match_score: finalScore,
            catalog_analysis: aiResult?.analysis || {
              reasoning: 'Sadece keyword analizi',
              matched_keywords: kwResult.matched,
              categories: kwResult.categories,
            },
          })
          .eq('id', signal.id);

        if (!updateError) {
          if (aiResult) aiAnalyzed++;
          results.push({
            id: signal.id,
            company: signal.raw_company_name || signal.company?.display_name || '?',
            project: signal.project_name || '?',
            kwScore: kwResult.score,
            aiScore: aiResult?.score,
            finalScore,
          });
        }
      } else {
        // Eşleşme yok — işaretle ve geç
        await supabase
          .from('ced_signals')
          .update({
            is_catalog_matched: true,
            catalog_match_score: kwResult.score,
            catalog_analysis: {
              reasoning: 'Keyword eşiği geçemedi — sektör uyumsuz',
              matched_keywords: kwResult.matched,
            },
          })
          .eq('id', signal.id);
      }
    }

    // Opportunities tablosuna yüksek skorluları ekle
    const highScoreResults = results.filter(r => r.finalScore >= 75);
    if (highScoreResults.length > 0) {
      const opportunities = highScoreResults.map(r => ({
        signal_source: 'eced',
        signal_id: r.id,
        seller_id: seller.id,
        matched_product_ids: products.map(p => p.id), // AI analiz hangi ürünlerin uyduğunu belirliyor
        match_score: r.finalScore,
        ai_reasoning: null, // catalog_analysis'te zaten var
        ai_suggestion: null,
        status: 'new',
      }));

      await supabase
        .from('opportunities')
        .upsert(opportunities, { onConflict: 'signal_source,signal_id,seller_id' });
    }

    const durationMs = Date.now() - startTime;
    console.log(`🎉 Tamamlandı: ${signals.length} sinyal, ${keywordMatches} keyword eşleşme, ${aiAnalyzed} AI analiz, ${highScore} yüksek skor, ${(durationMs / 1000).toFixed(1)}s`);

    return NextResponse.json({
      success: true,
      totalSignals: signals.length,
      keywordMatches,
      aiAnalyzed,
      highScoreCount: highScore,
      topResults: results.sort((a, b) => b.finalScore - a.finalScore).slice(0, 15),
      durationMs,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('❌ ÇED eşleştirme hatası:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}