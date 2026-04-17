import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const { signalSource, signalId } = await req.json();

    if (!signalSource || !signalId) {
      return NextResponse.json({ success: false, error: 'signalSource and signalId required' }, { status: 400 });
    }

    // 1. Fetch signal data
    let signalData: Record<string, unknown> | null = null;

    if (signalSource === 'eced') {
      const { data } = await supabase
        .from('ced_signals')
        .select('*, company:companies(*)')
        .eq('id', signalId)
        .single();
      if (data) {
        signalData = {
          firma: data.company?.display_name || data.raw_company_name,
          il: data.location,
          proje: data.project_name,
          tesis_turu: data.project_type,
          tarih: data.announcement_date,
        };
      }
    } else if (signalSource === 'tkdk') {
      const { data } = await supabase
        .from('tkdk_signals')
        .select('*')
        .eq('id', signalId)
        .single();
      if (data) {
        signalData = {
          firma: data.firma,
          il: data.il,
          proje: data.yatirim_adi,
          tesis_turu: data.sektor,
          tedbir: data.tedbir_kodu,
          tutar: data.toplam_tl,
          tarih: data.baslangic_tarihi,
        };
      }
    }

    if (!signalData) {
      return NextResponse.json({ success: false, error: 'Signal not found' }, { status: 404 });
    }

    // 2. Fetch all sellers and their products
    const { data: sellers } = await supabase.from('sellers').select('*');
    const { data: products } = await supabase.from('catalog_products').select('*');

    if (!sellers?.length || !products?.length) {
      return NextResponse.json({ success: false, error: 'No sellers or products in catalog' }, { status: 400 });
    }

    // 3. For each seller, ask AI to match
    const results = [];

    for (const seller of sellers) {
      const sellerProducts = products.filter((p) => p.seller_id === seller.id);
      if (sellerProducts.length === 0) continue;

      const productList = sellerProducts.map((p) => ({
        id: p.id,
        name: p.name,
        model: p.model_code,
        category: p.category,
        description: p.description,
        keywords: p.keywords,
        applications: p.applications,
      }));

      const prompt = `Sen bir endüstriyel ekipman satış uzmanısın. Aşağıdaki yatırım sinyalini analiz et ve satıcının ürün kataloğundan hangi ürünlerin bu yatırımcıya satılabileceğini belirle.

YATIRIM SİNYALİ:
${JSON.stringify(signalData, null, 2)}

SATICI: ${seller.name}
ÜRÜN KATALOĞU:
${JSON.stringify(productList, null, 2)}

Kurallar:
- Sadece gerçekten uygun ürünleri eşleştir, zorla eşleştirme yapma
- Eğer hiçbir ürün uygun değilse boş array döndür
- match_score: 0-100 arası (100 = mükemmel uyum)
- Her eşleşen ürün için neden uygun olduğunu açıkla

JSON formatında yanıt ver (başka metin yazma):
{
  "matched_product_ids": [1, 5, 12],
  "match_score": 75,
  "reasoning": "Bu yatırım bir un fabrikası olduğu için vals makinesi ve elek sistemleri doğrudan uygun.",
  "suggestion": "Yatırımcıya özel teklif metni - kısa ve profesyonel"
}`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
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
        continue;
      }

      if (parsed.matched_product_ids?.length > 0 && parsed.match_score > 20) {
        // Upsert opportunity
        const { data: opp, error } = await supabase
          .from('opportunities')
          .upsert(
            {
              signal_source: signalSource,
              signal_id: signalId,
              seller_id: seller.id,
              matched_product_ids: parsed.matched_product_ids,
              match_score: parsed.match_score,
              ai_reasoning: parsed.reasoning,
              ai_suggestion: parsed.suggestion,
              status: 'new',
            },
            { onConflict: 'signal_source,signal_id,seller_id' }
          )
          .select()
          .single();

        if (!error && opp) {
          results.push(opp);
        }
      }
    }

    return NextResponse.json({ success: true, opportunities: results, matchCount: results.length });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}