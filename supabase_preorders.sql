-- Table for Waiting List
CREATE TABLE IF NOT EXISTS kabung_preorders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  nama_konsumen TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  produk_id UUID REFERENCES kabung_products(id) ON DELETE SET NULL,
  nama_produk TEXT NOT NULL,
  jumlah INTEGER NOT NULL DEFAULT 1,
  catatan TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Waiting', -- Waiting, Dihubungi, Selesai, Batal
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS)
ALTER TABLE kabung_preorders ENABLE ROW LEVEL SECURITY;

-- Policies for public reading, inserting, updating, and deleting
CREATE POLICY "Public Access Preorders" ON kabung_preorders FOR ALL USING (true) WITH CHECK (true);
