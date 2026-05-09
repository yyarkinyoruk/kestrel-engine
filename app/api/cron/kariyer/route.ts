// app/api/cron/kariyer/route.ts
// Kestrel AI — Kariyer.net İş İlanı Sinyalleri (Apify Pull)
// 3 Apify task'tan sırayla veri çeker, kariyer_signals tablosuna yazar
// Tetikleme: Task Scheduler veya Vercel Cron (haftada 2 kez)

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface ApifyItem {
  id?: string | number;
  company?: string;
  title?: string;
  location?: string;
  descriptionText?: string;
  descriptionMarkdown?: string;
  url?: string;
  publishDate?: string;
  sectorName?: string;
}

interface TaskResult {
  taskId: string;
  success: boolean;
  itemCount: number;
  error?: string;
}

async function fetchTaskData(taskId: string, apiToken: string): Promise<{ items: ApifyItem[]; error?: string }> {
  try {
    const url = `https://api.apify.com/v2/actor-tasks/${taskId}/runs/last/dataset/items?token=${apiToken}`;
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return { items: [], error: `HTTP ${response.status} ${response.statusText}` };
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      return { items: [], error: 'Apify response is not an array' };
    }

    return { items: data };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { items: [], error: message };
  }
}

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  // Güvenlik: mevcut scraper ile aynı pattern
  const secret = req.headers.get('x-kestrel-secret');
  if (!secret || secret !== process.env.KESTREL_CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('📋 Kariyer.net sinyal çekimi başladı');

    const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
    if (!APIFY_API_TOKEN) {
      throw new Error('APIFY_API_TOKEN env variable eksik');
    }

    // Task ID'leri topla: önce 3'lü, yoksa eski tekil fallback
    const taskIds: string[] = [];
    const id1 = process.env.APIFY_KARIYER_TASK_ID_1;
    const id2 = process.env.APIFY_KARIYER_TASK_ID_2;
    const id3 = process.env.APIFY_KARIYER_TASK_ID_3;

    if (id1) taskIds.push(id1);
    if (id2) taskIds.push(id2);
    if (id3) taskIds.push(id3);

    // Fallback: eski tekil env variable
    if (taskIds.length === 0) {
      const legacy = process.env.APIFY_KARIYER_TASK_ID;
      if (legacy) taskIds.push(legacy);
    }

    if (taskIds.length === 0) {
      throw new Error('Hiçbir APIFY_KARIYER_TASK_ID env variable tanımlı değil');
    }

    console.log(`📥 ${taskIds.length} Apify task'tan veri çekilecek`);

    // Her task'tan sırayla veri çek
    const taskResults: TaskResult[] = [];
    let allItems: ApifyItem[] = [];

    for (const taskId of taskIds) {
      console.log(`  → Task: ${taskId}`);
      const { items, error } = await fetchTaskData(taskId, APIFY_API_TOKEN);

      taskResults.push({
        taskId,
        success: !error,
        itemCount: items.length,
        error,
      });

      if (error) {
        console.error(`  ❌ ${taskId}: ${error}`);
      } else {
        console.log(`  ✅ ${taskId}: ${items.length} kayıt`);
        allItems = allItems.concat(items);
      }
    }

    console.log(`📊 Toplam: ${allItems.length} ham kayıt`);

    if (allItems.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Hiçbir task'tan veri gelmedi",
        tasks: taskResults,
        totalItems: 0,
        durationMs: Date.now() - startTime,
      });
    }

    // Kestrel şemasına dönüştür
    const formattedSignals = allItems
      .filter((item) => item.id && item.company)
      .map((item) => ({
        kariyer_id: item.id?.toString(),
        company_name: (item.company || 'Bilinmiyor').trim(),
        title: (item.title || '').trim(),
        location: (item.location || '').trim() || null,
        description_text: item.descriptionText || item.descriptionMarkdown || null,
        url: item.url || null,
        publish_date: item.publishDate || null,
        sector: item.sectorName || null,
        last_seen_at: new Date().toISOString(),
      }));

    // Duplikasyonları kaldır (aynı ilan birden fazla task'ta çıkabilir)
    const uniqueSignals = formattedSignals.filter(
      (signal, index, self) =>
        index === self.findIndex((s) => s.kariyer_id === signal.kariyer_id)
    );

    const duplicatesRemoved = formattedSignals.length - uniqueSignals.length;
    console.log(`🔄 ${uniqueSignals.length} benzersiz ilan (${duplicatesRemoved} duplicate kaldırıldı)`);

    // Supabase'e UPSERT
    const { error: upsertError } = await supabase
      .from('kariyer_signals')
      .upsert(uniqueSignals, {
        onConflict: 'kariyer_id',
        ignoreDuplicates: false,
      });

    if (upsertError) {
      throw new Error(`Supabase upsert hatası: ${upsertError.message}`);
    }

    // DB'deki toplam kayıt sayısı
    const { count: totalInDb } = await supabase
      .from('kariyer_signals')
      .select('*', { count: 'exact', head: true });

    const durationMs = Date.now() - startTime;

    console.log(`🎉 Tamamlandı: ${uniqueSignals.length} işlendi, ${(durationMs / 1000).toFixed(1)}s`);

    return NextResponse.json({
      success: true,
      tasks: taskResults,
      totalFromApify: allItems.length,
      uniqueSignals: uniqueSignals.length,
      duplicatesRemoved,
      totalInDb,
      durationMs,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('❌ Kariyer cron hatası:', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}