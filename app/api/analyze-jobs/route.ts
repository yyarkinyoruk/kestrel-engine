// app/api/analyze-jobs/route.ts
// Kestrel AI — Kariyer.net İlan AI Analizi
// 1. is_processed=false ilanları çeker
// 2. Keyword pre-filter ile intent skoru hesaplar
// 3. Skor >= 30 olanları Groq ile zenginleştirir
// 4. Sonuçları kariyer_signals tablosuna yazar

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// ─── Intent Keyword Sistemi ───────────────────────────
// Her keyword grubunun bir ağırlığı var. Toplam skor 0-100 arasında normalize edilir.

interface KeywordRule {
  keywords: string[];
  weight: number;
  category: string;
}

const POSITIVE_RULES: KeywordRule[] = [
  // Yüksek intent — yeni yatırım / yeni tesis sinyalleri
  {
    category: 'yeni_yatirim',
    weight: 25,
    keywords: [
      'yeni tesis', 'yeni fabrika', 'yeni üretim hattı', 'yeni hat',
      'yeni kurulacak', 'greenfield', 'sıfırdan kurulan', 'yeni yatırım',
      'yatırım projesi', 'yeni kurulan fabrika',
    ],
  },
  {
    category: 'devreye_alma',
    weight: 20,
    keywords: [
      'devreye alma', 'commissioning', 'kurulum ve montaj',
      'hat kurulumu', 'makine kurulumu', 'tesis kurulumu',
      'montaj ve devreye alma', 'idame ve devreye',
    ],
  },
  {
    category: 'kapasite',
    weight: 18,
    keywords: [
      'kapasite artırımı', 'kapasite artışı', 'kapasite genişletme',
      'hat genişletme', 'ikinci hat', 'üçüncü hat', 'yeni hat',
      'genişleme projesi', 'tevsi', 'modernizasyon',
    ],
  },
  // Orta intent — spesifik makine/ekipman referansları
  {
    category: 'spesifik_makine',
    weight: 20,
    keywords: [
      // Gıda işleme
      'dolum hattı', 'paketleme hattı', 'ambalaj hattı', 'üretim hattı',
      'pastörizatör', 'sterilizatör', 'homojenizatör', 'separator',
      'evaporatör', 'dekantör', 'karıştırıcı', 'mikser', 'reaktör',
      'un değirmeni', 'yem fabrikası', 'süt işleme', 'et işleme',
      // Soğutma
      'soğuk hava deposu', 'soğutma sistemi', 'chiller', 'kompresör',
      'kondenser', 'evaporatör', 'amonyak soğutma', 'freon',
      // Otomasyon
      'PLC programlama', 'SCADA', 'HMI', 'DCS', 'otomasyon sistemi',
      'robot programlama', 'endüstriyel otomasyon',
      // Genel endüstriyel
      'CNC tezgah', 'CNC makine', 'torna', 'freze', 'pres',
      'enjeksiyon makinesi', 'ekstrüder', 'kalender',
    ],
  },
  // Marka adları — spesifik marka = çok yüksek intent
  {
    category: 'marka',
    weight: 25,
    keywords: [
      // Gıda makineleri
      'Tetra Pak', 'GEA', 'Alfa Laval', 'Bühler', 'Alapala',
      'SPX Flow', 'Krones', 'Sidel', 'KHS', 'Bosch Packaging',
      'Multivac', 'Ishida', 'Marel', 'JBT', 'Haarslev',
      // Soğutma
      'Bitzer', 'Carrier', 'Daikin', 'Trane', 'Güntner',
      'Danfoss', 'Copeland', 'Emerson', 'Frascold',
      // Otomasyon
      'Siemens', 'ABB', 'Rockwell', 'Allen-Bradley', 'Mitsubishi',
      'Schneider', 'Omron', 'Beckhoff', 'Fanuc', 'KUKA',
    ],
  },
  // Düşük intent — dolaylı sinyaller
  {
    category: 'genel_uretim',
    weight: 8,
    keywords: [
      'üretim planlama', 'üretim takibi', 'kalite kontrol',
      'proses mühendisi', 'bakım planlama', 'arıza analizi',
      'yalın üretim', 'lean manufacturing', 'TPM',
      'iş güvenliği', 'kalibrasyon',
    ],
  },
];

// Negatif keyword'ler — skoru düşürür
const NEGATIVE_KEYWORDS: { keywords: string[]; penalty: number }[] = [
  {
    // Otel/turizm — Kestrel ICP'si değil
    penalty: 30,
    keywords: [
      'otel', 'hotel', 'resort', 'tatil köyü', 'apart',
      'restoran', 'cafe', 'kafe', 'mutfak şefi',
    ],
  },
  {
    // Sadece bakım/onarım — yeni makine değil
    penalty: 15,
    keywords: [
      'mevcut makinelerin bakımı', 'arıza giderme',
      'rutin bakım', 'periyodik bakım',
    ],
  },
];

interface KeywordMatchResult {
  score: number;
  matchedKeywords: string[];
  categories: string[];
}

function analyzeKeywords(text: string): KeywordMatchResult {
  if (!text || text.trim().length === 0) {
    return { score: 0, matchedKeywords: [], categories: [] };
  }

  const lowerText = text.toLowerCase().replace(/&nbsp;/g, ' ');
  let totalScore = 0;
  const matchedKeywords: string[] = [];
  const categories: string[] = [];

  // Pozitif keyword tarama
  for (const rule of POSITIVE_RULES) {
    let ruleMatched = false;
    for (const kw of rule.keywords) {
      if (lowerText.includes(kw.toLowerCase())) {
        matchedKeywords.push(kw);
        if (!ruleMatched) {
          totalScore += rule.weight;
          categories.push(rule.category);
          ruleMatched = true;
        }
      }
    }
  }

  // Negatif keyword tarama
  for (const neg of NEGATIVE_KEYWORDS) {
    for (const kw of neg.keywords) {
      if (lowerText.includes(kw.toLowerCase())) {
        totalScore -= neg.penalty;
        matchedKeywords.push(`[-] ${kw}`);
        break; // Her negatif gruptan max 1 penalty
      }
    }
  }

  return {
    score: Math.max(0, Math.min(100, totalScore)),
    matchedKeywords,
    categories,
  };
}

// ─── Groq AI Analizi ──────────────────────────────────
async function analyzeWithGroq(
  signal: Record<string, unknown>
): Promise<{ aiScore: number; analysis: Record<string, unknown> } | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const prompt = `Sen bir endüstriyel yatırım analisti olarak çalışıyorsun. Kestrel AI platformu için iş ilanlarını analiz ediyorsun.

Amaç: Bu iş ilanının YENI MAKİNE/EKİPMAN ALIMI sinyali verip vermediğini değerlendir. Müşterimiz gıda işleme ve endüstriyel soğutma ekipmanı satıcısı.

İlan Bilgileri:
- Firma: ${signal.company_name}
- Pozisyon: ${signal.title}
- Lokasyon: ${signal.location || 'Belirtilmemiş'}
- Sektör: ${signal.sector || 'Belirtilmemiş'}
- Açıklama: ${(signal.description_text as string || '').slice(0, 1500)}

Aşağıdaki JSON formatında yanıt ver, başka bir şey yazma:
{
  "equipment_intent_score": <0-100 arası skor, yeni ekipman alım olasılığı>,
  "reasoning": "<1-2 cümle neden bu skoru verdiğin>",
  "detected_equipment": ["<ilandan çıkarılan spesifik makine/ekipman adları>"],
  "investment_type": "<yeni_tesis | kapasite_artisi | modernizasyon | bakim_kadrosu | belirsiz>",
  "sales_recommendation": "<satış ekibine 1 cümle öneri>"
}

Skorlama rehberi:
- 80-100: Spesifik makine adı + yeni tesis/hat kurulumu açıkça belirtilmiş
- 60-79: Yeni ekipman ihtiyacı güçlü ima ediliyor (kapasite artışı, yeni hat)
- 40-59: Dolaylı sinyal var ama kesin değil
- 20-39: Zayıf sinyal, muhtemelen mevcut kadro takviyesi
- 0-19: Sinyal yok veya sadece bakım/onarım kadrosu`;

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
        temperature: 0.2,
        max_tokens: 500,
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
      aiScore: parsed.equipment_intent_score || 0,
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
    console.log('🔍 Kariyer.net AI analizi başladı');

    // is_processed=false olanları çek
    const { data: signals, error: fetchError } = await supabase
      .from('kariyer_signals')
      .select('*')
      .eq('is_processed', false)
      .order('publish_date', { ascending: false })
      .limit(100); // Batch limit

    if (fetchError) throw new Error(`Supabase fetch hatası: ${fetchError.message}`);
    if (!signals || signals.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'İşlenecek ilan bulunamadı',
        durationMs: Date.now() - startTime,
      });
    }

    console.log(`📋 ${signals.length} ilan analiz edilecek`);

    let keywordMatches = 0;
    let aiEnriched = 0;
    let lowIntent = 0;
    const results: Array<{ kariyer_id: string; score: number; aiScore?: number }> = [];

    for (const signal of signals) {
      // Adım 1: Keyword pre-filter
      const kwResult = analyzeKeywords(
        `${signal.title} ${signal.description_text || ''} ${signal.sector || ''}`
      );

      if (kwResult.score >= 30) {
        keywordMatches++;

        // Adım 2: Groq AI enrichment
        const aiResult = await analyzeWithGroq(signal);

        const finalScore = aiResult
          ? Math.round(kwResult.score * 0.3 + aiResult.aiScore * 0.7)
          : kwResult.score;

        // Supabase güncelle
        const { error: updateError } = await supabase
          .from('kariyer_signals')
          .update({
            is_processed: true,
            intent_score: finalScore,
            intent_analysis: aiResult?.analysis || {
              reasoning: 'Sadece keyword analizi yapıldı',
              matched_keywords: kwResult.matchedKeywords,
              categories: kwResult.categories,
            },
            matched_keywords: kwResult.matchedKeywords.filter(k => !k.startsWith('[-]')),
          })
          .eq('kariyer_id', signal.kariyer_id);

        if (updateError) {
          console.error(`Update hatası (${signal.kariyer_id}):`, updateError.message);
        } else {
          if (aiResult) aiEnriched++;
          results.push({
            kariyer_id: signal.kariyer_id,
            score: finalScore,
            aiScore: aiResult?.aiScore,
          });
        }
      } else {
        // Düşük intent — sadece işaretle
        lowIntent++;
        await supabase
          .from('kariyer_signals')
          .update({
            is_processed: true,
            intent_score: kwResult.score,
            intent_analysis: {
              reasoning: 'Keyword pre-filter eşiği geçemedi',
              matched_keywords: kwResult.matchedKeywords,
              categories: kwResult.categories,
            },
            matched_keywords: kwResult.matchedKeywords.filter(k => !k.startsWith('[-]')),
          })
          .eq('kariyer_id', signal.kariyer_id);
      }
    }

    const durationMs = Date.now() - startTime;
    console.log(`🎉 Analiz tamamlandı: ${signals.length} ilan, ${keywordMatches} eşleşme, ${aiEnriched} AI zenginleştirme, ${(durationMs / 1000).toFixed(1)}s`);

    return NextResponse.json({
      success: true,
      totalAnalyzed: signals.length,
      keywordMatches,
      aiEnriched,
      lowIntent,
      topResults: results.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 10),
      durationMs,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('❌ Analiz hatası:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}