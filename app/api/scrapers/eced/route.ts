// Kestrel AI — e-ÇED Olumlu Kararlar Scraper
// Bu API route, Çevre Bakanlığı'nın yayınladığı ÇED olumlu kararlar Excel'ini
// indirir, parse eder ve Supabase'e yazar.

import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import fetch from 'node-fetch';
import https from 'https';

// Excel dosyasının kamu URL'i (Çevre Bakanlığı)
const EXCEL_URL = 'https://eced.csb.gov.tr/images/ced_olumlu_projeler.xlsx';

// Bizim scraper'ımızı tanıtan User-Agent (şeffaflık için)
const USER_AGENT = 'Kestrel AI Research Bot (beta) - contact: yarkin@kestrelai.co';

// Excel satırlarının tip tanımı (kolonlar TR olarak gelir)
type ExcelRow = {
  'KARAR TARİHİ'?: string | number | Date;
  'SEKTÖR'?: string;
  'PROJENİN ADI'?: string;
  'PROJE SAHİBİ'?: string;
  'İLİ'?: string;
  'İLÇESİ'?: string;
  'PROJE YERİ'?: string;
  'RAPORU HAZIRLAYAN KURUM/KURULUŞ'?: string;
  'KARAR SONUCU'?: string;
};

// Türkçe karakterleri sadeleştirir ve tüzel sufiksleri temizler
function normalizeCompanyName(name: string): string {
  if (!name) return '';

  let normalized = name
    .toLowerCase()
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');

  // Yaygın tüzel kişilik sufikslerini kaldır
  const suffixes = [
    'a.s.', 'a s', 'as', 'anonim sirketi',
    'ltd.', 'ltd sti.', 'ltd sti', 'limited sirketi',
    'sti.', 'sti', 'sirketi',
    'san.', 'san ', 'sanayi',
    'tic.', 'tic ', 'ticaret',
    've', '&',
  ];

  suffixes.forEach((s) => {
    const regex = new RegExp(`\\b${s.replace('.', '\\.')}\\b`, 'g');
    normalized = normalized.replace(regex, ' ');
  });

  // Fazla boşlukları temizle
  return normalized.replace(/\s+/g, ' ').trim();
}

// Excel'deki tarihi Postgres DATE formatına çevirir (YYYY-MM-DD)
function parseDate(value: unknown): string | null {
  if (!value) return null;

  try {
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    if (typeof value === 'number') {
      // Excel serial date → JS Date
      const date = XLSX.SSF.parse_date_code(value);
      if (!date) return null;
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }
    if (typeof value === 'string') {
      const d = new Date(value);
      if (isNaN(d.getTime())) return null;
      return d.toISOString().split('T')[0];
    }
  } catch {
    return null;
  }
  return null;
}

// Ana işlem: GET request geldiğinde çalışır
export async function GET(req: NextRequest) {
  const startTime = Date.now();

  // Güvenlik: sadece doğru secret tokenla çalıştırılabilir
  const secret = req.headers.get('x-kestrel-secret');
  if (!secret || secret !== process.env.KESTREL_CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('🦅 Kestrel ÇED scraper başladı');

    console.log('🦅 Kestrel ÇED scraper başladı');

    // 1. Excel dosyasını indir
    // Türk devlet sitelerinin eski HTTPS protokolleriyle uyumlu özel HTTP agent
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false, // SSL doğrulamayı gevşet (kamu verisi, güvenli)
      keepAlive: true,
    });

    console.log(`📥 Excel indiriliyor: ${EXCEL_URL}`);
    const response = await fetch(EXCEL_URL, {
      headers: { 'User-Agent': USER_AGENT },
      agent: httpsAgent,
    });

    if (!response.ok) {
      throw new Error(`Excel indirilemedi: HTTP ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    console.log(`✅ Excel indirildi: ${(buffer.byteLength / 1024).toFixed(1)} KB`);
    // 2. Parse et
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet);
    console.log(`📊 ${rows.length} satır parse edildi`);

    // 3. Her satırı işle
    let newCompanies = 0;
    let newSignals = 0;
    let skippedDuplicates = 0;
    const errors: string[] = [];

    for (const row of rows) {
      try {
        const rawCompanyName = (row['PROJE SAHİBİ'] || '').toString().trim();
        if (!rawCompanyName) continue;

        const normalized = normalizeCompanyName(rawCompanyName);
        if (!normalized) continue;

        // Firma var mı kontrol et, yoksa oluştur
        const { data: existingCompany } = await supabase
          .from('companies')
          .select('id')
          .eq('normalized_name', normalized)
          .maybeSingle();

        let companyId: number;
        if (existingCompany) {
          companyId = existingCompany.id;
        } else {
          const { data: newCompany, error: insertError } = await supabase
            .from('companies')
            .insert({
              normalized_name: normalized,
              display_name: rawCompanyName,
              location: `${(row['İLİ'] || '').toString().trim()}`,
              sector: (row['SEKTÖR'] || '').toString().trim(),
            })
            .select('id')
            .single();

          if (insertError || !newCompany) {
            errors.push(`Company insert error for ${rawCompanyName}: ${insertError?.message}`);
            continue;
          }
          companyId = newCompany.id;
          newCompanies++;
        }

        // Signal için duplicate kontrolü
        const projectName = (row['PROJENİN ADI'] || '').toString().trim();
        const announcementDate = parseDate(row['KARAR TARİHİ']);

        const { data: existingSignal } = await supabase
          .from('ced_signals')
          .select('id')
          .eq('company_id', companyId)
          .eq('project_name', projectName)
          .eq('announcement_date', announcementDate)
          .maybeSingle();

        if (existingSignal) {
          skippedDuplicates++;
          continue;
        }

        // Yeni sinyal ekle
        const { error: signalError } = await supabase.from('ced_signals').insert({
          company_id: companyId,
          raw_company_name: rawCompanyName,
          project_name: projectName,
          location: `${row['İLİ'] || ''} / ${row['İLÇESİ'] || ''}`.trim(),
          project_type: (row['SEKTÖR'] || '').toString().trim(),
          announcement_date: announcementDate,
          source_url: EXCEL_URL,
          raw_text: JSON.stringify(row),
        });

        if (signalError) {
          errors.push(`Signal insert error: ${signalError.message}`);
          continue;
        }

        newSignals++;
      } catch (err) {
        errors.push(`Row processing error: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    const durationMs = Date.now() - startTime;
    console.log(`🎉 Tamamlandı: ${newCompanies} yeni firma, ${newSignals} yeni sinyal, ${skippedDuplicates} duplicate`);

    return NextResponse.json({
      success: true,
      totalRows: rows.length,
      newCompanies,
      newSignals,
      skippedDuplicates,
      durationMs,
      errors: errors.slice(0, 10), // İlk 10 hatayı döndür
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('❌ Scraper hatası:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}