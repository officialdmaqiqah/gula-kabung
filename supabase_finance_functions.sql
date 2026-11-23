-- Jalankan SEBELUM website versi perbaikan keuangan dipasang.
-- File ini hanya menambah fungsi dan tidak mengubah data yang sudah ada.

BEGIN;

CREATE OR REPLACE FUNCTION public.save_kabung_sale(p_id TEXT, p_sale JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_new public.kabung_sales%ROWTYPE;
  v_old public.kabung_sales%ROWTYPE;
  v_old_qty INTEGER := 0;
  v_new_qty INTEGER;
BEGIN
  IF NOT public.is_kabung_admin() THEN
    RAISE EXCEPTION 'Akses ditolak.';
  END IF;

  v_new := jsonb_populate_record(NULL::public.kabung_sales, p_sale);
  IF v_new.produk_id IS NULL OR coalesce(v_new.jumlah, 0) < 1 OR coalesce(v_new.harga_satuan, -1) < 0 THEN
    RAISE EXCEPTION 'Data transaksi tidak valid.';
  END IF;
  v_new_qty := CASE WHEN v_new.status_pembayaran = 'Batal' THEN 0 ELSE v_new.jumlah END;

  IF p_id IS NOT NULL THEN
    SELECT * INTO v_old FROM public.kabung_sales WHERE id::text = p_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Transaksi tidak ditemukan.';
    END IF;
    v_old_qty := CASE WHEN v_old.status_pembayaran = 'Batal' THEN 0 ELSE v_old.jumlah END;
  END IF;

  PERFORM 1 FROM public.kabung_products
  WHERE id::text IN (v_new.produk_id::text, v_old.produk_id::text)
  ORDER BY id
  FOR UPDATE;

  IF p_id IS NULL THEN
    INSERT INTO public.kabung_sales (
      tanggal, nama_pembeli, produk_id, nama_produk, jumlah, harga_satuan, total_penjualan,
      metode_pembayaran, rekening_id, status_pembayaran, channel_penjualan, catatan
    ) VALUES (
      v_new.tanggal, v_new.nama_pembeli, v_new.produk_id, v_new.nama_produk, v_new.jumlah,
      v_new.harga_satuan, v_new.jumlah * v_new.harga_satuan, v_new.metode_pembayaran,
      v_new.rekening_id, v_new.status_pembayaran, v_new.channel_penjualan, v_new.catatan
    );
  ELSE
    UPDATE public.kabung_sales SET
      tanggal = v_new.tanggal,
      nama_pembeli = v_new.nama_pembeli,
      produk_id = v_new.produk_id,
      nama_produk = v_new.nama_produk,
      jumlah = v_new.jumlah,
      harga_satuan = v_new.harga_satuan,
      total_penjualan = v_new.jumlah * v_new.harga_satuan,
      metode_pembayaran = v_new.metode_pembayaran,
      rekening_id = v_new.rekening_id,
      status_pembayaran = v_new.status_pembayaran,
      channel_penjualan = v_new.channel_penjualan,
      catatan = v_new.catatan
    WHERE id::text = p_id;

    UPDATE public.kabung_products SET stok = coalesce(stok, 0) + v_old_qty
    WHERE id::text = v_old.produk_id::text;
  END IF;

  UPDATE public.kabung_products SET stok = coalesce(stok, 0) - v_new_qty
  WHERE id::text = v_new.produk_id::text;
END;
$$;
REVOKE ALL ON FUNCTION public.save_kabung_sale(TEXT, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_kabung_sale(TEXT, JSONB) TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_kabung_sale(p_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_old public.kabung_sales%ROWTYPE;
BEGIN
  IF NOT public.is_kabung_admin() THEN
    RAISE EXCEPTION 'Akses ditolak.';
  END IF;

  SELECT * INTO v_old FROM public.kabung_sales WHERE id::text = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaksi tidak ditemukan.';
  END IF;

  IF v_old.status_pembayaran IS DISTINCT FROM 'Batal' THEN
    UPDATE public.kabung_products SET stok = coalesce(stok, 0) + v_old.jumlah
    WHERE id::text = v_old.produk_id::text;
  END IF;

  DELETE FROM public.kabung_sales WHERE id::text = p_id;
END;
$$;
REVOKE ALL ON FUNCTION public.delete_kabung_sale(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_kabung_sale(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.close_kabung_month(
  p_month TEXT,
  p_source UUID,
  p_investasi NUMERIC,
  p_sedekah NUMERIC,
  p_kabah NUMERIC,
  p_dividends JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_start DATE;
  v_end DATE;
  v_name TEXT;
  v_investasi_id UUID;
  v_sedekah_id UUID;
  v_kabah_id UUID;
  v_account_id UUID;
  v_dividend RECORD;
BEGIN
  IF NOT public.is_kabung_admin() THEN
    RAISE EXCEPTION 'Akses ditolak.';
  END IF;
  IF p_month !~ '^[0-9]{4}-(0[1-9]|1[0-2])$' THEN
    RAISE EXCEPTION 'Periode tidak valid.';
  END IF;
  IF least(p_investasi, p_sedekah, p_kabah) < 0
     OR jsonb_typeof(p_dividends) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_dividends) = 0 THEN
    RAISE EXCEPTION 'Rincian alokasi tidak valid.';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('kabung_tutup_buku'));

  v_start := (p_month || '-01')::date;
  v_end := (v_start + INTERVAL '1 month' - INTERVAL '1 day')::date;

  IF EXISTS (
    SELECT 1 FROM public.kabung_expenses
    WHERE tanggal BETWEEN v_start AND v_end
      AND kategori IN ('Alokasi Investasi', 'Alokasi Sedekah', 'Ka''bah', 'Bagi Hasil Investor')
  ) THEN
    RAISE EXCEPTION 'Bulan ini sudah pernah ditutup buku.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.kabung_accounts
    WHERE id = p_source AND nama_rekening NOT LIKE 'Kantong%'
  ) THEN
    RAISE EXCEPTION 'Rekening sumber tidak valid.';
  END IF;

  FOREACH v_name IN ARRAY ARRAY['Kantong Investasi', 'Kantong Sedekah', 'Kantong Ka''bah'] LOOP
    SELECT id INTO v_account_id FROM public.kabung_accounts WHERE nama_rekening = v_name LIMIT 1;
    IF v_account_id IS NULL THEN
      INSERT INTO public.kabung_accounts (nama_rekening, saldo_awal)
      VALUES (v_name, 0)
      RETURNING id INTO v_account_id;
    END IF;
    IF v_name = 'Kantong Investasi' THEN v_investasi_id := v_account_id;
    ELSIF v_name = 'Kantong Sedekah' THEN v_sedekah_id := v_account_id;
    ELSE v_kabah_id := v_account_id;
    END IF;
    v_account_id := NULL;
  END LOOP;

  INSERT INTO public.kabung_expenses (tanggal, kategori, nama_pengeluaran, jumlah, rekening_id, catatan) VALUES
    (v_end, 'Alokasi Investasi', 'Dana Investasi (' || p_month || ')', p_investasi, p_source, 'Otomatis Tutup Buku (40%)'),
    (v_end, 'Alokasi Sedekah', 'Dana Sedekah (' || p_month || ')', p_sedekah, p_source, 'Otomatis Tutup Buku (10%)'),
    (v_end, 'Ka''bah', 'Dana Ka''bah (' || p_month || ')', p_kabah, p_source, 'Otomatis Tutup Buku (10%)');

  FOR v_dividend IN
    SELECT * FROM jsonb_to_recordset(p_dividends) AS x(nama TEXT, jumlah NUMERIC)
  LOOP
    IF v_dividend.nama IS NULL OR coalesce(v_dividend.jumlah, -1) < 0 THEN
      RAISE EXCEPTION 'Rincian bagi hasil tidak valid.';
    END IF;
    INSERT INTO public.kabung_expenses (tanggal, kategori, nama_pengeluaran, jumlah, rekening_id, catatan)
    VALUES (
      v_end, 'Bagi Hasil Investor', 'Bagi Hasil ' || p_month || ': ' || v_dividend.nama,
      v_dividend.jumlah, p_source, 'Tutup Buku ' || p_month || '. Porsi 40% dari total laba.'
    );
  END LOOP;

  INSERT INTO public.kabung_incomes (tanggal, kategori, nama_pemasukan, jumlah, rekening_id, catatan) VALUES
    (v_end, 'Alokasi Investasi', 'Setoran Alokasi Investasi (' || p_month || ')', p_investasi, v_investasi_id, 'Otomatis Tutup Buku (40%)'),
    (v_end, 'Alokasi Sedekah', 'Setoran Alokasi Sedekah (' || p_month || ')', p_sedekah, v_sedekah_id, 'Otomatis Tutup Buku (10%)'),
    (v_end, 'Ka''bah', 'Setoran Alokasi Ka''bah (' || p_month || ')', p_kabah, v_kabah_id, 'Otomatis Tutup Buku (10%)');
END;
$$;
REVOKE ALL ON FUNCTION public.close_kabung_month(TEXT, UUID, NUMERIC, NUMERIC, NUMERIC, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.close_kabung_month(TEXT, UUID, NUMERIC, NUMERIC, NUMERIC, JSONB) TO authenticated;

COMMIT;
