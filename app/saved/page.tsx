export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { supabase } from '@/lib/supabase';
import type { SavedOpportunity } from '@/lib/types';
import SavedClient from './SavedClient';

export default async function SavedPage() {
  const { data, error } = await supabase
    .from('saved_opportunities')
    .select('*')
    .order('saved_at', { ascending: false, nullsFirst: false });

  if (error) {
    console.error('saved_opportunities fetch:', error);
  }

  const items = (data as SavedOpportunity[]) ?? [];

  return <SavedClient items={items} fetchError={error?.message ?? null} />;
}
