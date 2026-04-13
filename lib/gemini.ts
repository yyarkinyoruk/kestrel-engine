// Kestrel AI — Gemini AI Yardımcı Fonksiyonları
// Sinyal için kişiselleştirilmiş analiz ve mail taslağı üretir

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { SignalWithCompany } from '@/lib/types';

// Gemini client'ını başlat (lazy, sadece gerektiğinde)
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable eksik');
  }
  return new GoogleGenerativeAI(apiKey);
}

// AI analizinin çıktı formatı
export type AiAnalysis = {
  summary: string; // Projenin kısa özeti (2-3 cümle)
  equipmentNeeds: string[]; // Muhtemel ekipman ihtiyaçları (3-5 madde)
  urgency: 'high' | 'medium' | 'low'; // Aciliyet derecesi
  keyInsight: string; // Satıcıya en değerli içgörü (1 cümle)
};

// Bir sinyal için AI analizi üret
export async function analyzeSignal(signal: SignalWithCompany): Promise<AiAnalysis> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.2, // Düşük = tutarlı, yüksek = yaratıcı. Analiz için düşük iyi.
      responseMimeType: 'application/json',
    },
  });

  const prompt = `Sen Türk sanayisinde makine ve ekipman satışı konusunda uzman bir analiz motorusun. Aşağıdaki e-ÇED yatırım sinyalini incele ve makine/ekipman satıcısı için değerli bir analiz yap.

SİNYAL BİLGİLERİ:
- Firma: ${signal.company?.display_name || signal.raw_company_name}
- Proje: ${signal.project_name}
- Lokasyon: ${signal.location}
- Sektör: ${signal.project_type}
- Karar Tarihi: ${signal.announcement_date}

GÖREV:
Şu formatta JSON döndür (başka metin YOK, sadece JSON):
{
  "summary": "2-3 cümlelik net özet. Projenin ne olduğu, kapasitesi (varsa), ölçeği.",
  "equipmentNeeds": ["İhtiyaç 1", "İhtiyaç 2", "İhtiyaç 3"],
  "urgency": "high|medium|low",
  "keyInsight": "Satıcı için en değerli tek bir içgörü cümlesi"
}

KURALLAR:
- equipmentNeeds: 3-5 madde, spesifik makine/ekipman adları (generic "ekipman" değil, "paslanmaz soğutma tankı", "CNC freze", "endüstriyel chiller" gibi)
- urgency: ÇED olumlu kararı son 30 gün içindeyse "high", 90 gün içindeyse "medium", daha eskiyse "low"
- keyInsight: "Bu firma şu an X ihtiyacı olan Y konumundaki nadir fırsatlardan" tarzında
- Tüm metinler Türkçe
- Kesin olmayan sayı/değer uydurma, varsa kullan, yoksa bahsetme
- Sektör "Enerji" ise GES/RES için kablolama, transformatör, panel sistemleri gibi
- Sektör "Gıda" ise soğutma, paketleme, dolum hatları gibi
- Sektör "Kimya" ise reaktör, pompa, filtreleme gibi`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const parsed = JSON.parse(text) as AiAnalysis;
    return parsed;
  } catch (err) {
    console.error('Gemini cevabı JSON parse edilemedi:', text);
    throw new Error('AI analizi parse edilemedi');
  }
}

// Kişiselleştirilmiş mail taslağı üret
export async function generateEmailDraft(
  signal: SignalWithCompany,
  userProductContext?: string
): Promise<{ subject: string; body: string }> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.4, // Mail için biraz daha yaratıcı
      responseMimeType: 'application/json',
    },
  });

  const prompt = `Sen Türk sanayisinde makine/ekipman satışı yapan bir satış uzmanısın. Aşağıdaki yatırım sinyali için profesyonel, kısa ve etkili bir tanışma maili yaz.

HEDEF FİRMA:
- Firma: ${signal.company?.display_name || signal.raw_company_name}
- Proje: ${signal.project_name}
- Lokasyon: ${signal.location}
- Sektör: ${signal.project_type}

${userProductContext ? `BİZİM ÜRÜNLERİMİZ:\n${userProductContext}` : 'Henüz ürün kataloğu girilmemiş, genel bir giriş maili yaz.'}

GÖREV:
Şu formatta JSON döndür:
{
  "subject": "Kısa, net email konusu (50 karakter altı)",
  "body": "Mail içeriği (Türkçe, profesyonel, 4-6 paragraf)"
}

KURALLAR:
- Konu: "[Proje adı kısa]" + yatırımınız hakkında tarzında
- Body: "Sayın [Firma] yetkilisi," ile başla, "Saygılarımla," ile bitir
- Tebrik et, niyetini açıkla (yardımcı olmak), 20 dk görüşme iste
- Asla abartma, asla yalan söyleme, asla spesifik fiyat/teknik söz verme
- Tek bir net call-to-action (20 dk görüşme)
- İmza bölümüne "[Adınız]" placeholder bırak`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const parsed = JSON.parse(text) as { subject: string; body: string };
    return parsed;
  } catch (err) {
    console.error('Gemini mail cevabı parse edilemedi:', text);
    throw new Error('Mail taslağı parse edilemedi');
  }
}