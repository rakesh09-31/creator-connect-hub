
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS portfolio_template text DEFAULT 'classic',
  ADD COLUMN IF NOT EXISTS portfolio_theme text DEFAULT 'light',
  ADD COLUMN IF NOT EXISTS services jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS testimonials jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS resume_url text,
  ADD COLUMN IF NOT EXISTS portfolio_tagline text;
