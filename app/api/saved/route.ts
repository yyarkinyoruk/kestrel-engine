// Kaydedilen fırsatlar — saved_opportunities tablosu
// Tablo: source (text), signal_id (text), company_name, project_name, score (int), notes (text, nullable), saved_at (timestamptz)
// UNIQUE (source, signal_id)

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const source = searchParams.get('source');
    const signal_id = searchParams.get('signal_id');

    if ((source && !signal_id) || (!source && signal_id)) {
      return NextResponse.json({ success: false, error: 'source ve signal_id birlikte gerekli' }, { status: 400 });
    }

    if (source && signal_id) {
      const { data, error } = await supabase
        .from('saved_opportunities')
        .select('id')
        .eq('source', source)
        .eq('signal_id', signal_id)
        .maybeSingle();

      if (error) {
        console.error('[api/saved GET single]', { source, signal_id, message: error.message, details: error });
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, saved: Boolean(data) });
    }

    const { data, error } = await supabase
      .from('saved_opportunities')
      .select('*')
      .order('saved_at', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('[api/saved GET list]', { message: error.message, details: error });
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, items: data ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/saved GET]', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { source, signal_id, company_name, project_name, score } = body as {
      source?: string;
      signal_id?: string;
      company_name?: string;
      project_name?: string;
      score?: number;
    };

    if (!source || !signal_id) {
      return NextResponse.json({ success: false, error: 'source ve signal_id gerekli' }, { status: 400 });
    }

    const row = {
      source,
      signal_id,
      company_name: company_name ?? '',
      project_name: project_name ?? '',
      score: typeof score === 'number' ? score : 0,
      saved_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('saved_opportunities')
      .upsert(row, { onConflict: 'source,signal_id' })
      .select()
      .single();

    if (error) {
      console.error('[api/saved POST]', { row, message: error.message, details: error });
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, item: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/saved POST]', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { source, signal_id } = body as { source?: string; signal_id?: string };

    if (!source || !signal_id) {
      return NextResponse.json({ success: false, error: 'source ve signal_id gerekli' }, { status: 400 });
    }

    const { error } = await supabase.from('saved_opportunities').delete().eq('source', source).eq('signal_id', signal_id);

    if (error) {
      console.error('[api/saved DELETE]', { source, signal_id, message: error.message, details: error });
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/saved DELETE]', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
