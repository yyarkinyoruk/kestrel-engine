// Kestrel AI — AI Analiz API Route
// POST: Bir sinyal ID'si al, Gemini ile analiz yap, sonucu dön

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { analyzeSignal, generateEmailDraft } from '@/lib/gemini';
import type { SignalWithCompany } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { signalId, mode } = body as { signalId: number; mode: 'analysis' | 'email' };

    if (!signalId || !mode) {
      return NextResponse.json(
        { error: 'signalId ve mode gerekli' },
        { status: 400 }
      );
    }

    // Sinyali ve firma bilgisini Supabase'den çek
    const { data: signal, error } = await supabase
      .from('ced_signals')
      .select('*, company:companies(*)')
      .eq('id', signalId)
      .single();

    if (error || !signal) {
      return NextResponse.json(
        { error: 'Sinyal bulunamadı' },
        { status: 404 }
      );
    }

    // Mode'a göre ilgili fonksiyonu çağır
    if (mode === 'analysis') {
      const analysis = await analyzeSignal(signal as SignalWithCompany);
      return NextResponse.json({ success: true, analysis });
    }

    if (mode === 'email') {
      const email = await generateEmailDraft(signal as SignalWithCompany);
      return NextResponse.json({ success: true, email });
    }

    return NextResponse.json({ error: 'Geçersiz mode' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('AI analiz hatası:', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}