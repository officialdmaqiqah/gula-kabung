-- Table for Investors
CREATE TABLE IF NOT EXISTS kabung_investors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nama TEXT NOT NULL,
  modal DECIMAL(15,2) NOT NULL,
  persentase DECIMAL(5,2) NOT NULL,
  income_id UUID, -- Links to kabung_incomes if created automatically
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table for Website Settings
CREATE TABLE IF NOT EXISTS kabung_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  hero_image TEXT,
  whatsapp TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE kabung_investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE kabung_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Access Investors" ON kabung_investors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Settings" ON kabung_settings FOR ALL USING (true) WITH CHECK (true);

-- Insert default settings if not exists
INSERT INTO kabung_settings (id, whatsapp) VALUES ('main', '6281234567890') ON CONFLICT DO NOTHING;
