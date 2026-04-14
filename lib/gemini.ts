// Kestrel AI — Groq AI Yardımcı Fonksiyonları
// Sinyal için kişiselleştirilmiş analiz ve mail taslağı üretir
// Groq LPU altyapısı: ultra hızlı inference (200-500 tok/sn)

import type { SignalWithCompany } from '@/lib/types';

// Groq API endpoint
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Kullanılan model
// llama-3.3-70b-versatile: Güçlü model, Türkçe'de iyi, JSON mode destekliyor
const MODEL = 'llama-3.3-70b-versatile';

// Groq'a istek atan ortak fonksiyon
async function callGroq(prompt: string, temperature: number = 0.3): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY environment variable eksik');
  }

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      response_format: { type: 'json_object' },
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq hatası ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Groq boş cevap döndü');
  }
  return content;
}

// AI analizinin çıktı formatı
export type AiAnalysis = {
  summary: string;
  equipmentNeeds: string[];
  urgency: 'high' | 'medium' | 'low';
  keyInsight: string;
};

// Bir sinyal için AI analizi üret
export async function analyzeSignal(signal: SignalWithCompany): Promise<AiAnalysis> {
  const prompt = `Sen Türk sanayisinde makine ve ekipman satışı konusunda uzman bir analiz motorusun. Aşağıdaki e-ÇED yatırım sinyalini incele ve makine/ekipman satıcısı için değerli bir analiz yap.

SİNYAL BİLGİLERİ:
- Firma: ${signal.company?.display_name || signal.raw_company_name}
- Proje: ${signal.project_name}
- Lokasyon: ${signal.location}
- Sektör: ${signal.project_type}
- Karar Tarihi: ${signal.announcement_date}

GÖREV:
Şu formatta GEÇERLI JSON döndür (başka metin YOK, sadece JSON objesi):
{
  "summary": "2-3 cümlelik net özet. Projenin ne olduğu, kapasitesi varsa, ölçeği.",
  "equipmentNeeds": ["İhtiyaç 1", "İhtiyaç 2", "İhtiyaç 3"],
  "urgency": "high",
  "keyInsight": "Satıcı için en değerli tek bir içgörü cümlesi"
}

KURALLAR:
- equipmentNeeds: 3-5 madde, spesifik makine/ekipman adları (generic "ekipman" değil, "paslanmaz soğutma tankı", "CNC freze", "endüstriyel chiller" gibi)
- urgency: "high" | "medium" | "low" — ÇED kararı son 30 gün içindeyse "high", 90 gün içindeyse "medium", daha eskiyse "low"
- keyInsight: Satıcıya açık değer katan tek cümle
- Tüm metinler Türkçe
- Kesin olmayan sayı/değer uydurma
- Sektör "Enerji" ise GES/RES için kablolama, transformatör, panel gibi
- Sektör "Gıda" ise soğutma, paketleme, dolum hatları gibi
- Sektör "Kimya" ise reaktör, pompa, filtreleme gibi`;

  const text = await callGroq(prompt, 0.2);

  try {
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned) as AiAnalysis;
    return parsed;
  } catch (err) {
    console.error('Groq cevabı JSON parse edilemedi:', text);
    throw new Error('AI analizi parse edilemedi');
  }
}

// Kişiselleştirilmiş mail taslağı üret
export async function generateEmailDraft(
  signal: SignalWithCompany,
  userProductContext?: string
): Promise<{ subject: string; body: string }> {
  const prompt = `Sen Türk sanayisinde makine/ekipman satışı yapan bir satış uzmanısın. Aşağıdaki yatırım sinyali için profesyonel, kısa ve etkili bir tanışma maili yaz.

HEDEF FİRMA:
- Firma: ${signal.company?.display_name || signal.raw_company_name}
- Proje: ${signal.project_name}
- Lokasyon: ${signal.location}
- Sektör: ${signal.project_type}

${userProductContext ? `BİZİM ÜRÜNLERİMİZ:\n${userProductContext}` : 'Henüz ürün kataloğu girilmemiş, genel bir giriş maili yaz.'}

GÖREV:
Şu formatta GEÇERLI JSON döndür (sadece JSON, başka metin yok):
{
  "subject": "Kısa email konusu (50 karakter altı)",
  "body": "Mail içeriği, çok satırlı metin, \\n kullanabilirsin"
}

KURALLAR:
- Konu: "[Proje adı kısa] Yatırımınız Hakkında" tarzında
- Body: "Sayın [Firma] yetkilisi," ile başla, "Saygılarımla," ile bitir, 4-6 paragraf
- Türkçe, profesyonel, tek net call-to-action (20 dk görüşme)
- Asla abartma, fiyat/teknik söz verme
- İmza bölümüne "[Adınız]" placeholder bırak`;

  const text = await callGroq(prompt, 0.4);

  try {
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned) as { subject: string; body: string };
    return parsed;
  } catch (err) {
    console.error('Groq mail cevabı parse edilemedi:', text);
    throw new Error('Mail taslağı parse edilemedi');
  }
}