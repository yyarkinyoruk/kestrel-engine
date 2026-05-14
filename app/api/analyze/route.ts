// Kestrel AI — AI Analiz API Route
// POST: Bir sinyal ID'si al, Gemini ile analiz yap, sonucu dön

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { analyzeSignal, generateEmailDraft } from '@/lib/gemini';
import type { SignalWithCompany } from '@/lib/types';

function parseCedNumericId(signalId: unknown, mode: unknown): number | null {
  if (!mode) return null;
  const raw = signalId;
  const numericId =
    typeof raw === 'string' && String(raw).includes(':')
      ? parseInt(String(raw).split(':')[1] ?? '', 10)
      : Number(raw);
  if (!Number.isFinite(numericId) || numericId <= 0) return null;
  return numericId;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { signalId, mode, source: _source } = body as {
      signalId: number | string;
      mode: 'analysis' | 'email';
      source?: string;
    };

    const numericId = parseCedNumericId(signalId, mode);

    if (numericId == null || !mode) {
      console.error('[api/analyze] geçersiz istek', { signalId, mode, numericId });
      return NextResponse.json({ success: false, error: 'signalId ve mode gerekli (geçerli sayısal id)' }, { status: 400 });
    }

    console.log('[api/analyze] ced_signals sorgusu', { numericId, mode, rawSignalId: signalId });

    const { data: signal, error } = await supabase
      .from('ced_signals')
      .select('*, company:companies(*)')
      .eq('id', numericId)
      .single();

    if (error) {
      console.error('[api/analyze] Supabase hata', { numericId, message: error.message, code: error.code, details: error });
      return NextResponse.json({ success: false, error: error.message || 'Sinyal sorgusu başarısız' }, { status: 404 });
    }

    if (!signal) {
      console.error('[api/analyze] kayıt yok', { numericId });
      return NextResponse.json({ success: false, error: 'Sinyal bulunamadı' }, { status: 404 });
    }

    if (mode === 'analysis') {
      const analysis = await analyzeSignal(signal as SignalWithCompany);
      console.log('[api/analyze] analiz tamam', { numericId });
      return NextResponse.json({ success: true, analysis });
    }

    if (mode === 'email') {
      const email = await generateEmailDraft(signal as SignalWithCompany);
      console.log('[api/analyze] mail taslağı tamam', { numericId, subjectLen: email.subject?.length });
      return NextResponse.json({ success: true, email });
    }

    return NextResponse.json({ success: false, error: 'Geçersiz mode' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/analyze] exception', message, err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
