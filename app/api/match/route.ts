import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

// ========== URUN BAZLI KEYWORD MATCHING ==========
function scoreProductAgainstSignal(signalText: string, productKeywords: string[]): number {
  if (productKeywords.length === 0) return 0;
  const text = signalText.toLowerCase();
  let matches = 0;
  for (const kw of productKeywords) {
    if (text.includes(kw.toLowerCase())) {
      matches++;
    }
  }
  // Eger en az 1 keyword eslestiyse, oran bazli skor ver
  // Ama ayni zamanda mutlak eslesme sayisini da odullendir
  const ratio = matches / productKeywords.length;
  const bonus = Math.min(matches * 10, 30); // her eslesme +10 puan, max 30 bonus
  return Math.min(Math.round(ratio * 70 + bonus), 100);
}

function getSignalText(source: string, signal: any): string {
  if (source === 'eced') {
    return [
      signal.project_name,
      signal.project_type,
      signal.raw_company_name,
      signal.company?.display_name,
      signal.location,
    ]
      .filter(Boolean)
      .join(' ');
  } else {
    return [signal.firma, signal.yatirim_adi, signal.sektor, signal.tedbir_kodu, signal.adres, signal.il]
      .filter(Boolean)
      .join(' ');
  }
}

// ========== BATCH MATCH ==========
async function batchMatch() {
  const { data: products } = await supabase.from('catalog_products').select('*');
  const { data: sellers } = await supabase.from('sellers').select('*');
  if (!products?.length || !sellers?.length) return { matched: 0, total: 0 };

  const { data: tkdkSignals } = await supabase.from('tkdk_signals').select('*');
  const { data: ecedSignals } = await supabase.from('ced_signals').select('*, company:companies(*)');

  const opportunities: any[] = [];

  for (const seller of sellers) {
    const sellerProducts = products.filter((p) => p.seller_id === seller.id);
    if (sellerProducts.length === 0) continue;

    // Her sinyali her urunle karsilastir
    const allSignals = [
      ...(tkdkSignals || []).map((s) => ({ source: 'tkdk', signal: s })),
      ...(ecedSignals || []).map((s) => ({ source: 'eced', signal: s })),
    ];

    for (const { source, signal } of allSignals) {
      const text = getSignalText(source, signal);

      let bestScore = 0;
      const matchedIds: number[] = [];

      for (const product of sellerProducts) {
        const score = scoreProductAgainstSignal(text, product.keywords || []);
        if (score > 0) {
          matchedIds.push(product.id);
          if (score > bestScore) bestScore = score;
        }
      }

      if (matchedIds.length > 0 && bestScore >= 25) {
        opportunities.push({
          signal_source: source,
          signal_id: signal.id,
          seller_id: seller.id,
          matched_product_ids: matchedIds,
          match_score: bestScore,
          ai_reasoning: null,
          ai_suggestion: null,
          status: 'new',
        });
      }
    }
  }

  // Upsert all
  if (opportunities.length > 0) {
    // Batch in chunks of 500
    for (let i = 0; i < opportunities.length; i += 500) {
      const chunk = opportunities.slice(i, i + 500);
      const { error } = await supabase
        .from('opportunities')
        .upsert(chunk, { onConflict: 'signal_source,signal_id,seller_id' });
      if (error) console.error('Upsert error:', error);
    }
  }

  return { matched: opportunities.length, total: (tkdkSignals?.length || 0) + (ecedSignals?.length || 0) };
}

// ========== AI ENRICH ==========
async function enrichWithAI(opportunityId: number) {
  const { data: opp } = await supabase.from('opportunities').select('*').eq('id', opportunityId).single();

  if (!opp) return null;

  let signalData: any = null;
  if (opp.signal_source === 'eced') {
    const { data } = await supabase.from('ced_signals').select('*, company:companies(*)').eq('id', opp.signal_id).single();
    if (data)
      signalData = {
        firma: data.company?.display_name || data.raw_company_name,
        il: data.location,
        proje: data.project_name,
        tesis: data.project_type,
      };
  } else {
    const { data } = await supabase.from('tkdk_signals').select('*').eq('id', opp.signal_id).single();
    if (data) signalData = { firma: data.firma, il: data.il, proje: data.yatirim_adi, tesis: data.sektor, tutar: data.toplam_tl };
  }

  const { data: matchedProducts } = await supabase.from('catalog_products').select('*').in('id', opp.matched_product_ids);
  const { data: seller } = await supabase.from('sellers').select('*').eq('id', opp.seller_id).single();

  const prompt = `Sen bir endustriyel ekipman satis uzmansin. Asagidaki yatirim sinyali ve eslesen urunleri analiz et.

YATIRIM SINYALI:
${JSON.stringify(signalData, null, 2)}

SATICI: ${seller?.name}
ESLESEN URUNLER:
${JSON.stringify(matchedProducts?.map((p) => ({ name: p.name, model: p.model_code, description: p.description })), null, 2)}

JSON formatinda yanit ver:
{
  "reasoning": "Bu yatirim neden bu urunlerle eslesiyor, 2-3 cumle aciklama",
  "suggestion": "Yatirimciya yaklasim onerisi, kisa ve profesyonel satis metni",
  "refined_score": 0-100 arasi gercekci uyum puani
}`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  });

  const aiData = await response.json();
  let parsed;
  try {
    let content = aiData.choices?.[0]?.message?.content || '{}';
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    parsed = JSON.parse(content);
  } catch {
    return null;
  }

  await supabase
    .from('opportunities')
    .update({
      ai_reasoning: parsed.reasoning,
      ai_suggestion: parsed.suggestion,
      match_score: parsed.refined_score || opp.match_score,
    })
    .eq('id', opportunityId);

  return parsed;
}

// ========== ROUTES ==========
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.mode === 'batch') {
      const result = await batchMatch();
      return NextResponse.json({ success: true, ...result });
    }

    if (body.mode === 'enrich' && body.opportunityId) {
      const result = await enrichWithAI(body.opportunityId);
      if (result) return NextResponse.json({ success: true, ...result });
      return NextResponse.json({ success: false, error: 'Could not enrich' }, { status: 400 });
    }

    return NextResponse.json({ success: false, error: 'Invalid mode' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}