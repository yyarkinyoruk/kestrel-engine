// Kestrel AI — Ana Dashboard (Server Component)
// Supabase'den gerçek sinyalleri çeker ve DashboardClient'a props olarak geçirir

import { supabase } from '@/lib/supabase';
import type { SignalWithCompany } from '@/lib/types';
import DashboardClient from './DashboardClient';

export default async function Page() {
  // Son 50 sinyali getir, her birine bağlı firma bilgisini ekle
  const { data, error } = await supabase
    .from('ced_signals')
    .select(`
      *,
      company:companies(*)
    `)
    .order('announcement_date', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Supabase error:', error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-semibold">Veri yüklenemedi</p>
          <p className="text-sm text-gray-500 mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  const signals = (data as SignalWithCompany[]) || [];

  return <DashboardClient signals={signals} />;
}