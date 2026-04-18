export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { supabase } from '@/lib/supabase';
import OpportunitiesClient from './OpportunitiesClient';

export default async function OpportunitiesPage() {
  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('*')
    .gte('match_score', 50)
    .order('match_score', { ascending: false })
    .order('created_at', { ascending: false });

  const { data: products } = await supabase
    .from('catalog_products')
    .select('*');

  const { data: sellers } = await supabase
    .from('sellers')
    .select('*');

  // Fetch related signals
  const opps = opportunities || [];
  const ecedIds = opps.filter((o) => o.signal_source === 'eced').map((o) => o.signal_id);
  const tkdkIds = opps.filter((o) => o.signal_source === 'tkdk').map((o) => o.signal_id);

  let ecedSignals: Record<number, unknown> = {};
  let tkdkSignals: Record<number, unknown> = {};

  if (ecedIds.length > 0) {
    const { data } = await supabase
      .from('ced_signals')
      .select('*, company:companies(*)')
      .in('id', ecedIds);
    if (data) {
      for (const s of data) ecedSignals[s.id] = s;
    }
  }

  if (tkdkIds.length > 0) {
    const { data } = await supabase
      .from('tkdk_signals')
      .select('*')
      .in('id', tkdkIds);
    if (data) {
      for (const s of data) tkdkSignals[s.id] = s;
    }
  }

  return (
    <OpportunitiesClient
      opportunities={opps}
      products={products || []}
      sellers={sellers || []}
      ecedSignals={ecedSignals}
      tkdkSignals={tkdkSignals}
    />
  );
}