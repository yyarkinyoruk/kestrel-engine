// Kestrel AI — Ana Dashboard (Server Component)
// Supabase'den gerçek sinyalleri çeker, sayfalandırır ve DashboardClient'a props olarak geçirir

import { supabase } from '@/lib/supabase';
import type { SignalWithCompany } from '@/lib/types';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PAGE_SIZE = 50;

type PageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  // URL'den ?page=2 gibi parametreyi oku
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || '1', 10));
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // Toplam sinyal sayısını al (pagination için)
  const { count: totalCount, error: countError } = await supabase
    .from('ced_signals')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Supabase count error:', countError);
  }

  const totalSignals = totalCount || 0;
  const totalPages = Math.max(1, Math.ceil(totalSignals / PAGE_SIZE));

  // Bu sayfa için sinyalleri getir, en yeni karar tarihinden eskiye doğru sırala
  const { data, error } = await supabase
    .from('ced_signals')
    .select(`
      *,
      company:companies(*)
    `)
    .order('announcement_date', { ascending: false, nullsFirst: false })
    .range(from, to);

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

  return (
    <DashboardClient
      signals={signals}
      currentPage={currentPage}
      totalPages={totalPages}
      totalSignals={totalSignals}
    />
  );
}