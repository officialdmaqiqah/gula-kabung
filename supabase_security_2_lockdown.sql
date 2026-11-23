-- TAHAP 2: jalankan HANYA setelah website baru live dan login admin berhasil.
-- Website versi lama tidak akan berfungsi lagi setelah file ini dijalankan.
-- Jika ada satu langkah gagal, seluruh perubahan otomatis dibatalkan.

BEGIN;

DO $$
DECLARE
  v_table TEXT;
  v_policy RECORD;
  v_tables TEXT[] := ARRAY[
    'kabung_accounts', 'kabung_expenses', 'kabung_incomes', 'kabung_investors',
    'kabung_mutations', 'kabung_preorders', 'kabung_products', 'kabung_purchases',
    'kabung_receiving', 'kabung_sales', 'kabung_settings', 'kabung_suppliers'
  ];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.kabung_admins) THEN
    RAISE EXCEPTION 'Belum ada admin. Jalankan tahap 1 terlebih dahulu.';
  END IF;

  FOREACH v_table IN ARRAY v_tables LOOP
    FOR v_policy IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = v_table
    LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', v_policy.policyname, v_table);
    END LOOP;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_table);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon', v_table);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', v_table);
    EXECUTE format(
      'CREATE POLICY "Admin full access" ON public.%I FOR ALL TO authenticated
       USING ((SELECT public.is_kabung_admin()))
       WITH CHECK ((SELECT public.is_kabung_admin()))',
      v_table
    );
  END LOOP;
END $$;

-- Pengunjung hanya bisa membaca kolom katalog. harga_modal tidak termasuk.
GRANT SELECT (
  id, nama_produk, deskripsi, kategori, ukuran, harga_jual,
  stok, satuan, status_aktif, image_url, created_at
) ON public.kabung_products TO anon;
CREATE POLICY "Public read active products" ON public.kabung_products
  FOR SELECT TO anon
  USING (status_aktif = true);

GRANT SELECT (id, hero_image, whatsapp) ON public.kabung_settings TO anon;
CREATE POLICY "Public read site settings" ON public.kabung_settings
  FOR SELECT TO anon
  USING (id = 'main');

COMMIT;
