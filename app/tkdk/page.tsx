export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { supabase } from '@/lib/supabase';
import { TkdkSignal } from '@/lib/types';
import TkdkClient from './TkdkClient';

export default async function TkdkPage({
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
    .from('tkdk_signals')
    .select('*', { count: 'exact', head: true });

  if (sektorFilter !== 'all') {
    countQuery = countQuery.eq('sektor', sektorFilter);
  }

  const { count } = await countQuery;
  const totalSignals = count || 0;
  const totalPages = Math.ceil(totalSignals / perPage);

  let dataQuery = supabase
    .from('tkdk_signals')
    .select('*')
    .order('source_no', { ascending: true })
    .range(from, to);

  if (sektorFilter !== 'all') {
    dataQuery = dataQuery.eq('sektor', sektorFilter);
  }

  const { data: signals } = await dataQuery;

  const { data: sectorCounts } = await supabase
    .from('tkdk_signals')
    .select('sektor');

  const sektorMap: Record<string, number> = {};
  if (sectorCounts) {
    for (const row of sectorCounts) {
      sektorMap[row.sektor] = (sektorMap[row.sektor] || 0) + 1;
    }
  }

  return (
    <TkdkClient
      signals={(signals as TkdkSignal[]) || []}
      currentPage={page}
      totalPages={totalPages}
      totalSignals={totalSignals}
      currentSektor={sektorFilter}
      sektorCounts={sektorMap}
    />
  );
}