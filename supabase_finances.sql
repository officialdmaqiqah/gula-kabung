-- Table for Manual Expenses
CREATE TABLE IF NOT EXISTS kabung_expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tanggal DATE NOT NULL,
  kategori TEXT NOT NULL,
  nama_pengeluaran TEXT NOT NULL,
  jumlah DECIMAL(15,2) NOT NULL,
  rekening_id UUID REFERENCES kabung_accounts(id),
  catatan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table for Manual Incomes
CREATE TABLE IF NOT EXISTS kabung_incomes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tanggal DATE NOT NULL,
  kategori TEXT NOT NULL,
  nama_pemasukan TEXT NOT NULL,
  jumlah DECIMAL(15,2) NOT NULL,
  rekening_id UUID REFERENCES kabung_accounts(id),
  catatan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE kabung_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE kabung_incomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Access Expenses" ON kabung_expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Incomes" ON kabung_incomes FOR ALL USING (true) WITH CHECK (true);
