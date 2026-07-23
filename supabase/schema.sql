-- ============================================
-- Genus Flood Relief Drive - Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- DONATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS donations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  donor_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  transaction_id TEXT NOT NULL,
  screenshot_url TEXT,
  message TEXT,
  city TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  is_rejected BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GALLERY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS gallery (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  image_url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (key, value) VALUES
  ('target_amount', '500000'),
  ('admin_password', 'genus2026'),
  ('site_title', 'Genus Flood Relief Drive'),
  ('families_per_lakh', '8'),
  ('upi_id', 'ssgobind12@okaxis'),
  ('contact_name', 'Shubham Pratap Singh'),
  ('contact_phone', '+91 9216013070'),
  ('contact_email', 'shubham.singh@genus.in')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- VIEWS
-- ============================================

-- Donation statistics view (only verified donations)
CREATE OR REPLACE VIEW donation_stats AS
SELECT
  COUNT(*) FILTER (WHERE is_verified = TRUE) AS total_donors,
  COALESCE(SUM(amount) FILTER (WHERE is_verified = TRUE), 0) AS total_amount,
  COALESCE(SUM(amount) FILTER (WHERE is_verified = TRUE AND created_at >= CURRENT_DATE), 0) AS today_amount,
  COUNT(*) FILTER (WHERE is_verified = TRUE AND created_at >= CURRENT_DATE) AS today_donors,
  COALESCE(SUM(amount) FILTER (WHERE is_verified = TRUE AND created_at >= date_trunc('week', CURRENT_DATE)), 0) AS week_amount,
  COALESCE(SUM(amount) FILTER (WHERE is_verified = TRUE AND created_at >= date_trunc('month', CURRENT_DATE)), 0) AS month_amount,
  COALESCE(AVG(amount) FILTER (WHERE is_verified = TRUE), 0) AS avg_donation,
  COUNT(*) FILTER (WHERE is_verified = FALSE AND is_rejected = FALSE) AS pending_count
FROM donations;

-- Recent verified donations (public view)
CREATE OR REPLACE VIEW recent_donations AS
SELECT
  id,
  CASE WHEN is_anonymous THEN 'Anonymous' ELSE donor_name END AS donor_name,
  amount,
  city,
  is_anonymous,
  created_at
FROM donations
WHERE is_verified = TRUE
ORDER BY created_at DESC
LIMIT 50;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Public can INSERT donations (submit form)
CREATE POLICY "Anyone can submit a donation" ON donations
  FOR INSERT WITH CHECK (TRUE);

-- Public can read only verified donations (limited fields)
CREATE POLICY "Anyone can view verified donations" ON donations
  FOR SELECT USING (is_verified = TRUE);

-- Public can view gallery
CREATE POLICY "Anyone can view gallery" ON gallery
  FOR SELECT USING (is_active = TRUE);

-- Public can read settings
CREATE POLICY "Anyone can read settings" ON settings
  FOR SELECT USING (TRUE);

-- ============================================
-- STORAGE BUCKET (run in Supabase dashboard)
-- ============================================
-- Create a public bucket named 'donation-screenshots'
-- Create a public bucket named 'gallery-images'

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_donations_verified ON donations(is_verified);
CREATE INDEX IF NOT EXISTS idx_donations_created ON donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_amount ON donations(amount);
CREATE INDEX IF NOT EXISTS idx_gallery_active ON gallery(is_active, sort_order);
