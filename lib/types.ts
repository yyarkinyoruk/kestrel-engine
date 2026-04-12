// Kestrel AI — Type tanımları
// Supabase tablolarının TypeScript temsilleri

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