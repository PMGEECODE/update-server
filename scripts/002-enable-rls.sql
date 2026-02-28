-- Enable RLS
ALTER TABLE public.releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.latest_releases ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read published releases" ON public.releases;
DROP POLICY IF EXISTS "Allow authenticated users read all releases" ON public.releases;
DROP POLICY IF EXISTS "Allow authenticated users insert releases" ON public.releases;
DROP POLICY IF EXISTS "Allow users update own releases" ON public.releases;
DROP POLICY IF EXISTS "Allow users delete own releases" ON public.releases;
DROP POLICY IF EXISTS "Allow public read latest_releases" ON public.latest_releases;
DROP POLICY IF EXISTS "Allow authenticated users manage latest_releases" ON public.latest_releases;

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
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users insert latest_releases" ON public.latest_releases
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
