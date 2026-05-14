// app/api/match-tkdk/route.ts
// mode=keyword: sadece keyword skoru yaz (Groq yok, hızlı)
// mode=ai&limit=10: keyword eşleşenleri AI'dan geçir (10'ar batch)

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface KeywordGroup { category: string; weight: number; keywords: string[]; }

const POSITIVE_KEYWORDS: KeywordGroup[] = [
  { category: 'un_degirmen', weight: 35, keywords: ['un fabrikası', 'un değirmeni', 'un üretim', 'değirmen', 'öğütme', 'irmik', 'bulgur', 'buğday', 'mısır unu', 'unlu mamul', 'makarna', 'bisküvi', 'nişasta'] },
  { category: 'yem_fabrikasi', weight: 35, keywords: ['yem fabrikası', 'karma yem', 'yem tesisi', 'yem üretim', 'hayvan yemi', 'kümes', 'kanatlı', 'pelet', 'yem değirmeni', 'yem sanayi', 'balık yemi', 'tavuk yemi'] },
  { category: 'tahil_depolama', weight: 20, keywords: ['tahıl', 'hububat', 'silo', 'tahıl deposu', 'çeltik', 'arpa', 'hububat deposu'] },
  { category: 'gida_genel', weight: 15, keywords: ['gıda', 'paketleme', 'ambalaj', 'bakliyat', 'et işleme', 'süt işleme', 'hazır gıda', 'konserve'] },
  { category: 'hayvancilik', weight: 12, keywords: ['hayvancılık', 'büyükbaş', 'küçükbaş', 'tavuk', 'entegre', 'çiftlik', 'damızlık', 'piliç', 'yumurta'] },
  { category: 'sogutma', weight: 10, keywords: ['soğuk hava', 'soğutma', 'frigorifik', 'zeytinyağı', 'zeytin'] },
];

const NEGATIVE_KEYWORDS = [
  { keywords: ['güneş enerji', 'rüzgar', 'solar', 'enerji santrali'], penalty: 40 },
  { keywords: ['çimento', 'beton', 'maden', 'tekstil'], penalty: 40 },
  { keywords: ['otel', 'hotel', 'turizm'], penalty: 40 },
];

function keywordScore(text: string): { score: number; matched: string[]; categories: string[] } {
  const lower = text.toLocaleLowerCase('tr-TR');
  let total = 0;
  const matched: string[] = [];
  const categories: string[] = [];
  for (const group of POSITIVE_KEYWORDS) {
    let hit = false;
    for (const kw of group.keywords) {
      if (lower.includes(kw.toLocaleLowerCase('tr-TR'))) {
        matched.push(kw);
        if (!hit) { total += group.weight; categories.push(group.category); hit = true; }
      }
    }
  }
  for (const neg of NEGATIVE_KEYWORDS) {
    for (const kw of neg.keywords) {
      if (lower.includes(kw.toLocaleLowerCase('tr-TR'))) {
        total -= neg.penalty; matched.push(`[-] ${kw}`); break;
      }
    }
  }
  return { score: Math.max(0, Math.min(100, total)), matched, categories };
}

async function analyzeWithGroq(signal: Record<string, any>, products: Record<string, any>[], sellerName: string): Promise<{ score: number; analysis: Record<string, any> } | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  const productList = products.map(p => `${p.name} (${p.model_code}) — ${p.category}`).join(', ');
  const prompt = `Sen endüstriyel ekipman satış uzmanısın. ${sellerName} ürünlerini satıyorsun.

TKDK YATIRIM: Firma: ${signal.firma || '?'} | Yatırım: ${signal.yatirim_adi || '?'} | Sektör: ${signal.sektor || '?'} | Tedbir: ${signal.tedbir_kodu || '?'} | İl: ${signal.il || '?'} | Tutar: ${signal.toplam_tl || '?'} TL

ÜRÜNLER: ${productList}

PUANLAMA: 90-100=un/yem fabrikası (birebir müşteri), 70-89=tahıl işleme, 50-69=genel gıda (yardımcı ekipman), 30-49=et/süt (dolaylı), 0-29=soğuk hava/zeytinyağı (uyumsuz). 103/5 projeleri genelde 0-20.

JSON yanıt: {"match_score":<0-100>,"reasoning":"<2 cümle>","matched_products":["..."],"investment_type":"<un_fabrikasi|yem_fabrikasi|tahil_depolama|gida_isleme|soguk_hava|diger>","recommended_action":"<hemen_ara|takipte_kal|atla>","sales_approach":"<1 cümle>"}`;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], temperature: 0.15, max_tokens: 400, response_format: { type: 'json_object' } }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { console.error(`Groq API hatası: ${res.status}`); return null; }
    const data = await res.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
    return { score: parsed.match_score || 0, analysis: parsed };
  } catch (err) { console.error('Groq hatası:', err); return null; }
}

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const secret = req.headers.get('x-kestrel-secret');
  if (!secret || secret !== process.env.KESTREL_CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const reqUrl = new URL(req.url);
  const mode = reqUrl.searchParams.get('mode') || 'keyword';
  const limit = parseInt(reqUrl.searchParams.get('limit') || '10');

  try {
    console.log(`🔍 TKDK eşleştirme (mode=${mode}, limit=${limit})`);
    const { data: products } = await supabase.from('catalog_products').select('*');
    const { data: sellers } = await supabase.from('sellers').select('*');
    if (!products?.length || !sellers?.length) return NextResponse.json({ error: 'Katalog bulunamadı' }, { status: 400 });
    const seller = sellers[0];

    const { data: signals, error: fetchError } = await supabase
      .from('tkdk_signals').select('*').eq('is_catalog_matched', false).order('id', { ascending: true });

    if (fetchError) throw new Error(fetchError.message);
    if (!signals?.length) return NextResponse.json({ success: true, message: 'İşlenecek sinyal yok', durationMs: Date.now() - startTime });

    console.log(`📋 ${signals.length} sinyal`);
    let keywordMatches = 0, aiAnalyzed = 0, highScore = 0;
    const results: any[] = [];

    for (const signal of signals) {
      const text = [signal.firma, signal.yatirim_adi, signal.sektor, signal.tedbir_kodu, signal.il].filter(Boolean).join(' ');
      const kw = keywordScore(text);

      if (kw.score > 0) {
        keywordMatches++;

        if (mode === 'ai' && aiAnalyzed < limit) {
          const ai = await analyzeWithGroq(signal, products, seller.name);
          await new Promise(r => setTimeout(r, 4000));
          const finalScore = ai ? Math.round(kw.score * 0.2 + ai.score * 0.8) : kw.score;
          if (finalScore >= 50) highScore++;
          await supabase.from('tkdk_signals').update({
            is_catalog_matched: true, catalog_match_score: finalScore,
            catalog_analysis: ai?.analysis || { reasoning: 'Sadece keyword analizi', matched_keywords: kw.matched, categories: kw.categories },
          }).eq('id', signal.id);
          if (ai) aiAnalyzed++;
          results.push({ id: signal.id, firma: signal.firma, yatirim: signal.yatirim_adi, kwScore: kw.score, aiScore: ai?.score, finalScore });
        } else if (mode === 'keyword') {
          await supabase.from('tkdk_signals').update({
            is_catalog_matched: true, catalog_match_score: kw.score,
            catalog_analysis: { reasoning: 'Sadece keyword analizi', matched_keywords: kw.matched, categories: kw.categories },
          }).eq('id', signal.id);
          results.push({ id: signal.id, firma: signal.firma, yatirim: signal.yatirim_adi, kwScore: kw.score, finalScore: kw.score });
        }
      } else {
        await supabase.from('tkdk_signals').update({
          is_catalog_matched: true, catalog_match_score: 0,
          catalog_analysis: { reasoning: 'Sektör uyumsuz' },
        }).eq('id', signal.id);
      }
    }

    const durationMs = Date.now() - startTime;
    console.log(`🎉 ${signals.length} sinyal, ${keywordMatches} keyword, ${aiAnalyzed} AI, ${(durationMs/1000).toFixed(1)}s`);
    return NextResponse.json({ success: true, mode, totalSignals: signals.length, keywordMatches, aiAnalyzed, highScoreCount: highScore,
      topResults: results.sort((a: any, b: any) => b.finalScore - a.finalScore).slice(0, 20), durationMs });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('❌ TKDK hatası:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}