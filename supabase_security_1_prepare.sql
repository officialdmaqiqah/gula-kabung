-- TAHAP 1: aman dijalankan selagi website lama masih aktif (hanya menambah).
-- Sebelum menjalankan: buat user admin di Supabase > Authentication > Users,
-- lalu ganti GANTI_DENGAN_EMAIL_ADMIN di bawah dengan email user tersebut.

BEGIN;

CREATE TABLE IF NOT EXISTS public.kabung_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.kabung_admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.kabung_admins FROM PUBLIC, anon, authenticated;

INSERT INTO public.kabung_admins (user_id)
SELECT id FROM auth.users WHERE lower(email) = lower('GANTI_DENGAN_EMAIL_ADMIN')
ON CONFLICT DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.kabung_admins) THEN
    RAISE EXCEPTION 'Belum ada admin. Buat user di Authentication dan isi emailnya di file ini.';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.is_kabung_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.kabung_admins WHERE user_id = (SELECT auth.uid())
  );
$$;
REVOKE ALL ON FUNCTION public.is_kabung_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_kabung_admin() TO authenticated;

-- Checkout: harga dan stok ditentukan server, seluruh pesanan berhasil atau batal bersama.
CREATE OR REPLACE FUNCTION public.create_kabung_order(
  p_nama TEXT,
  p_catatan TEXT,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_nama TEXT := btrim(coalesce(p_nama, ''));
  v_catatan TEXT := coalesce(nullif(btrim(coalesce(p_catatan, '')), ''), '-');
  v_tanggal DATE := (now() AT TIME ZONE 'Asia/Jakarta')::date;
  v_item RECORD;
  v_product RECORD;
  v_subtotal NUMERIC;
  v_total NUMERIC := 0;
  v_lines JSONB := '[]'::jsonb;
BEGIN
  IF length(v_nama) NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'Nama pembeli tidak valid.';
  END IF;
  IF length(v_catatan) > 500 THEN
    RAISE EXCEPTION 'Catatan terlalu panjang.';
  END IF;
  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_items) NOT BETWEEN 1 AND 20 THEN
    RAISE EXCEPTION 'Isi keranjang tidak valid.';
  END IF;

  -- Urut berdasarkan id agar pesanan bersamaan tidak saling mengunci.
  FOR v_item IN
    SELECT x.id,
           sum(x.quantity)::bigint AS quantity,
           bool_and(coalesce(x.quantity, 0) >= 1) AS valid
    FROM jsonb_to_recordset(p_items) AS x(id UUID, quantity INTEGER)
    GROUP BY x.id
    ORDER BY x.id
  LOOP
    IF v_item.id IS NULL OR NOT v_item.valid OR v_item.quantity > 1000 THEN
      RAISE EXCEPTION 'Jumlah pesanan tidak valid.';
    END IF;

    SELECT nama_produk, harga_jual, stok
    INTO v_product
    FROM public.kabung_products
    WHERE id = v_item.id AND status_aktif = true
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Ada produk yang sudah tidak tersedia.';
    END IF;
    IF coalesce(v_product.stok, 0) < v_item.quantity THEN
      RAISE EXCEPTION 'Stok % tersisa %.', v_product.nama_produk, coalesce(v_product.stok, 0);
    END IF;

    v_subtotal := v_product.harga_jual * v_item.quantity;
    v_total := v_total + v_subtotal;

    INSERT INTO public.kabung_sales (
      tanggal, nama_pembeli, nama_produk, produk_id, jumlah,
      harga_satuan, total_penjualan, status_pembayaran, rekening_id, catatan
    ) VALUES (
      v_tanggal, v_nama, v_product.nama_produk, v_item.id, v_item.quantity,
      v_product.harga_jual, v_subtotal, 'Belum bayar', NULL, v_catatan
    );

    UPDATE public.kabung_products
    SET stok = stok - v_item.quantity
    WHERE id = v_item.id;

    v_lines := v_lines || jsonb_build_object(
      'name', v_product.nama_produk,
      'quantity', v_item.quantity,
      'subtotal', v_subtotal
    );
  END LOOP;

  RETURN jsonb_build_object('items', v_lines, 'total', v_total);
END;
$$;
REVOKE ALL ON FUNCTION public.create_kabung_order(TEXT, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_kabung_order(TEXT, TEXT, JSONB) TO anon, authenticated;

-- Waiting list publik: hanya bisa menambah data baru berstatus Waiting.
CREATE OR REPLACE FUNCTION public.create_kabung_preorder(
  p_nama TEXT,
  p_whatsapp TEXT,
  p_produk_id UUID,
  p_jumlah INTEGER,
  p_catatan TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_nama TEXT := btrim(coalesce(p_nama, ''));
  v_whatsapp TEXT := btrim(coalesce(p_whatsapp, ''));
  v_catatan TEXT := btrim(coalesce(p_catatan, ''));
  v_nama_produk TEXT;
BEGIN
  IF length(v_nama) NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'Nama tidak valid.';
  END IF;
  IF v_whatsapp !~ '^[0-9+() -]{8,20}$' THEN
    RAISE EXCEPTION 'Nomor WhatsApp tidak valid.';
  END IF;
  IF p_jumlah IS NULL OR p_jumlah NOT BETWEEN 1 AND 1000 THEN
    RAISE EXCEPTION 'Jumlah tidak valid.';
  END IF;
  IF length(v_catatan) > 500 THEN
    RAISE EXCEPTION 'Catatan terlalu panjang.';
  END IF;

  SELECT nama_produk INTO v_nama_produk
  FROM public.kabung_products
  WHERE id = p_produk_id AND status_aktif = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produk tidak tersedia.';
  END IF;

  INSERT INTO public.kabung_preorders (
    tanggal, nama_konsumen, whatsapp, produk_id, nama_produk, jumlah, catatan, status
  ) VALUES (
    (now() AT TIME ZONE 'Asia/Jakarta')::date,
    v_nama, v_whatsapp, p_produk_id, v_nama_produk, p_jumlah, v_catatan, 'Waiting'
  );
END;
$$;
REVOKE ALL ON FUNCTION public.create_kabung_preorder(TEXT, TEXT, UUID, INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_kabung_preorder(TEXT, TEXT, UUID, INTEGER, TEXT) TO anon, authenticated;

COMMIT;
