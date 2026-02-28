-- Enable auth schema if not exists
CREATE SCHEMA IF NOT EXISTS auth;

-- Create releases table
CREATE TABLE IF NOT EXISTS public.releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  platform TEXT NOT NULL,
  filename TEXT NOT NULL,
  blob_url TEXT NOT NULL,
  checksum TEXT,
  file_size BIGINT,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT version_platform_unique UNIQUE(version, platform)
);

-- Create latest_releases table (denormalized for performance)
CREATE TABLE IF NOT EXISTS public.latest_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL UNIQUE,
  version TEXT NOT NULL,
  release_id UUID REFERENCES public.releases(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_releases_version ON public.releases(version);
CREATE INDEX IF NOT EXISTS idx_releases_platform ON public.releases(platform);
CREATE INDEX IF NOT EXISTS idx_releases_published ON public.releases(published);
CREATE INDEX IF NOT EXISTS idx_releases_created_by ON public.releases(created_by);
CREATE INDEX IF NOT EXISTS idx_latest_releases_platform ON public.latest_releases(platform);

-- Enable RLS
ALTER TABLE public.releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.latest_releases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for releases
CREATE POLICY "Allow public read published releases" ON public.releases
  FOR SELECT USING (published = true);

CREATE POLICY "Allow authenticated users read all releases" ON public.releases
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users insert releases" ON public.releases
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow users update own releases" ON public.releases
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Allow users delete own releases" ON public.releases
  FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for latest_releases
CREATE POLICY "Allow public read latest_releases" ON public.latest_releases
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users manage latest_releases" ON public.latest_releases
  USING (auth.role() = 'authenticated');
