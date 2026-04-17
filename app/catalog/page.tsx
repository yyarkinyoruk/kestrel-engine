export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { supabase } from '@/lib/supabase';
import { CatalogProduct, Seller } from '@/lib/types';
import CatalogClient from './CatalogClient';

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const categoryFilter = params.category || 'all';

  const { data: seller } = await supabase
    .from('sellers')
    .select('*')
    .limit(1)
    .single();

  let query = supabase
    .from('catalog_products')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (categoryFilter !== 'all') {
    query = query.eq('category', categoryFilter);
  }

  const { data: products } = await query;

  const { data: allProducts } = await supabase
    .from('catalog_products')
    .select('category');

  const categoryMap: Record<string, number> = {};
  if (allProducts) {
    for (const row of allProducts) {
      categoryMap[row.category] = (categoryMap[row.category] || 0) + 1;
    }
  }

  return (
    <CatalogClient
      seller={(seller as Seller) || null}
      products={(products as CatalogProduct[]) || []}
      currentCategory={categoryFilter}
      categoryCounts={categoryMap}
    />
  );
}