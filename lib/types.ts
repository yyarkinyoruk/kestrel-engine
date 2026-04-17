// Kestrel AI — Type tanımları
// Supabase tablolarının TypeScript temsilleri
// Satıcı Firma (Kestrel müşterisi)

export interface Seller {
  id: string;
  name: string;
  website: string;
  sector: string;
  contact_email: string;
  logo_url: string;
  created_at: string;
}

// Ürün Kataloğu
export interface CatalogProduct {
  id: number;
  seller_id: string;
  name: string;
  model_code: string;
  category: string;
  description: string;
  features: string[];
  applications: string[];
  keywords: string[];
  image_url: string;
  product_url: string;
  created_at: string;
}

// AI Fırsat Eşleştirmesi
export interface Opportunity {
  id: number;
  signal_source: 'eced' | 'tkdk';
  signal_id: number;
  seller_id: string;
  matched_product_ids: number[];
  match_score: number;
  ai_reasoning: string;
  ai_suggestion: string;
  status: 'new' | 'viewed' | 'contacted' | 'won' | 'lost';
  created_at: string;
}

export type Company = {
    id: number;
    normalized_name: string;
    display_name: string;
    location: string | null;
    sector: string | null;
    mersis_no: string | null;
    created_at: string;
    updated_at: string;
  };
  
  export type CedSignal = {
    id: number;
    company_id: number;
    raw_company_name: string;
    project_name: string;
    location: string | null;
    project_type: string | null;
    announcement_date: string | null;
    source_url: string | null;
    raw_text: string | null;
    scraped_at: string;
  };
  
  // UI'de birleşik halde kullanacağımız tip:
  // Sinyal + bağlı olduğu firmanın bilgileri
  export type SignalWithCompany = CedSignal & {
    company: Company;
  };

  // TKDK IPARD Sinyalleri
export interface TkdkSignal {
  id: number;
  source_no: number;
  il: string;
  firma: string;
  yatirim_adi: string;
  tedbir_kodu: string;
  sektor: string;
  adres: string;
  baslangic_tarihi: string;
  bitis_tarihi: string;
  toplam_tl: string;
  toplam_eur: string;
  kamu_katkisi_orani: string;
  durum: string;
  kaynak: string;
  created_at: string;
}