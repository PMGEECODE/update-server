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
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT version_platform_unique UNIQUE(version, platform)
);

-- Create latest_releases table
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
