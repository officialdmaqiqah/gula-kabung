-- Table for Money Mutations (Transfers between accounts)
CREATE TABLE IF NOT EXISTS kabung_mutations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tanggal DATE NOT NULL,
  dari_rekening_id UUID REFERENCES kabung_accounts(id) NOT NULL,
  ke_rekening_id UUID REFERENCES kabung_accounts(id) NOT NULL,
  jumlah DECIMAL(15,2) NOT NULL,
  catatan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE kabung_mutations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access Mutations" ON kabung_mutations FOR ALL USING (true) WITH CHECK (true);
