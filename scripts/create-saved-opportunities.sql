-- Kestrel AI: saved_opportunities (Supabase SQL editor veya migration)
CREATE TABLE IF NOT EXISTS public.saved_opportunities (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL CHECK (source IN ('eced', 'kariyer', 'tkdk')),
  signal_id TEXT NOT NULL,
  company_name TEXT NOT NULL DEFAULT '',
  project_name TEXT NOT NULL DEFAULT '',
  score INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source, signal_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_opportunities_saved_at ON public.saved_opportunities (saved_at DESC);
