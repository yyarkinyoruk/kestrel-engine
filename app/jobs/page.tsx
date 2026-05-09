export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { supabase } from '@/lib/supabase';
import { KariyerSignal } from '@/lib/types';
import JobsClient from './JobsClient';

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sektor?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const perPage = 50;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const sektorFilter = params.sektor || 'all';

  let countQuery = supabase
    .from('kariyer_signals')
    .select('*', { count: 'exact', head: true });

  if (sektorFilter !== 'all') {
    countQuery = countQuery.eq('sector', sektorFilter);
  }

  const { count } = await countQuery;
  const totalSignals = count || 0;
  const totalPages = Math.ceil(totalSignals / perPage);

  let dataQuery = supabase
    .from('kariyer_signals')
    .select('*')
    .order('publish_date', { ascending: false, nullsFirst: false })
    .range(from, to);

  if (sektorFilter !== 'all') {
    dataQuery = dataQuery.eq('sector', sektorFilter);
  }

  const { data: signals } = await dataQuery;

  const { data: sectorCounts } = await supabase
    .from('kariyer_signals')
    .select('sector');

  const sectorMap: Record<string, number> = {};
  if (sectorCounts) {
    for (const row of sectorCounts) {
      const sector = row.sector || 'Bilinmiyor';
      sectorMap[sector] = (sectorMap[sector] || 0) + 1;
    }
  }

  return (
    <JobsClient
      signals={(signals as KariyerSignal[]) || []}
      currentPage={page}
      totalPages={totalPages}
      totalSignals={totalSignals}
      currentSector={sektorFilter}
      sectorCounts={sectorMap}
    />
  );
}
