export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { supabase } from '@/lib/supabase';
import type { UnifiedOpportunity } from '@/lib/types';
import OpportunitiesClient from './OpportunitiesClient';

type PageProps = {
  searchParams: Promise<{ sort?: string; source?: string }>;
};

function parseSort(v: string | undefined): 'score' | 'date' {
  return v === 'date' ? 'date' : 'score';
}

function parseSource(v: string | undefined): 'all' | 'eced' | 'kariyer' | 'tkdk' {
  if (v === 'eced' || v === 'kariyer' || v === 'tkdk') return v;
  return 'all';
}

export default async function OpportunitiesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentSort = parseSort(params.sort);
  const currentSource = parseSource(params.source);

  const [cedRes, kariyerRes, tkdkRes] = await Promise.all([
    supabase
      .from('ced_signals')
      .select(
        'id, raw_company_name, project_name, project_type, location, announcement_date, catalog_match_score, catalog_analysis, raw_text, source_url, company:companies(*)'
      )
      .gte('catalog_match_score', 25)
      .order('announcement_date', { ascending: false, nullsFirst: false }),
    supabase
      .from('kariyer_signals')
      .select(
        'kariyer_id, company_name, title, location, sector, publish_date, intent_score, intent_analysis, url, description_text'
      )
      .gte('intent_score', 25)
      .order('publish_date', { ascending: false, nullsFirst: false }),
    supabase
      .from('tkdk_signals')
      .select(
        'id, firma, yatirim_adi, sektor, tedbir_kodu, il, toplam_tl, baslangic_tarihi, catalog_match_score, catalog_analysis, created_at'
      )
      .gte('catalog_match_score', 25)
      .order('created_at', { ascending: false, nullsFirst: false }),
  ]);

  if (cedRes.error) console.error('opportunities ced_signals:', cedRes.error);
  if (kariyerRes.error) console.error('opportunities kariyer_signals:', kariyerRes.error);
  if (tkdkRes.error) console.error('opportunities tkdk_signals:', tkdkRes.error);

  const cedRows = cedRes.data ?? [];
  const kariyerRows = kariyerRes.data ?? [];
  const tkdkRows = tkdkRes.data ?? [];

  const fromCed = (row: (typeof cedRows)[number]): UnifiedOpportunity => {
    const company = row.company as { display_name?: string } | null;
    return {
      id: `eced:${row.id}`,
      source: 'eced',
      companyName: company?.display_name || row.raw_company_name || '—',
      projectName: row.project_name || '—',
      location: row.location,
      sector: row.project_type,
      score: Number(row.catalog_match_score ?? 0),
      date: row.announcement_date,
      analysis: (row.catalog_analysis as Record<string, unknown> | null) ?? null,
      url: row.source_url ?? null,
      descriptionText: null,
      rawText: row.raw_text ?? null,
    };
  };

  const fromKariyer = (row: (typeof kariyerRows)[number]): UnifiedOpportunity => ({
    id: `kariyer:${row.kariyer_id}`,
    source: 'kariyer',
    companyName: row.company_name || '—',
    projectName: row.title || '—',
    location: row.location,
    sector: row.sector,
    score: Number(row.intent_score ?? 0),
    date: row.publish_date,
    analysis: (row.intent_analysis as Record<string, unknown> | null) ?? null,
    url: row.url ?? null,
    descriptionText: row.description_text ?? null,
    rawText: null,
  });

  const fromTkdk = (row: (typeof tkdkRows)[number]): UnifiedOpportunity => ({
    id: `tkdk:${row.id}`,
    source: 'tkdk',
    companyName: row.firma || '—',
    projectName: row.yatirim_adi || '—',
    location: row.il ?? null,
    sector: row.sektor,
    score: Number(row.catalog_match_score ?? 0),
    date: row.baslangic_tarihi || '2026-01-01',
    analysis: (row.catalog_analysis as Record<string, unknown> | null) ?? null,
    url: null,
    descriptionText: null,
    rawText: null,
  });

  const merged: UnifiedOpportunity[] = [
    ...cedRows.map(fromCed),
    ...kariyerRows.map(fromKariyer),
    ...tkdkRows.map(fromTkdk),
  ];

  const dataSourcesActive = [cedRows.length > 0, kariyerRows.length > 0, tkdkRows.length > 0].filter(Boolean).length;

  const filtered =
    currentSource === 'all' ? merged : merged.filter((o) => o.source === currentSource);

  const sorted = [...filtered].sort((a, b) => {
    if (currentSort === 'score') {
      if (b.score !== a.score) return b.score - a.score;
    } else {
      const ta = a.date ? new Date(a.date).getTime() : 0;
      const tb = b.date ? new Date(b.date).getTime() : 0;
      if (tb !== ta) return tb - ta;
      if (b.score !== a.score) return b.score - a.score;
    }
    return a.id.localeCompare(b.id);
  });

  const highMatchCount = sorted.filter((o) => o.score >= 60).length;

  return (
    <OpportunitiesClient
      opportunities={sorted}
      currentSort={currentSort}
      currentSource={currentSource}
      highMatchCount={highMatchCount}
      dataSourcesActive={dataSourcesActive}
    />
  );
}
