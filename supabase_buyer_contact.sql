-- Jalankan SEBELUM website versi ini dipasang.
-- Menambah kolom kontak pembeli. Checkout website lama tetap berfungsi.

BEGIN;

ALTER TABLE public.kabung_sales
  ADD COLUMN IF NOT EXISTS whatsapp_pembeli TEXT,
  ADD COLUMN IF NOT EXISTS alamat_pembeli TEXT;

DROP FUNCTION IF EXISTS public.create_kabung_order(TEXT, TEXT, JSONB);

CREATE OR REPLACE FUNCTION public.create_kabung_order(
  p_nama TEXT,
  p_catatan TEXT,
  p_items JSONB,
  p_whatsapp TEXT DEFAULT NULL,
  p_alamat TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_nama TEXT := btrim(coalesce(p_nama, ''));
  v_catatan TEXT := coalesce(nullif(btrim(coalesce(p_catatan, '')), ''), '-');
  v_whatsapp TEXT := nullif(btrim(coalesce(p_whatsapp, '')), '');
  v_alamat TEXT := nullif(btrim(coalesce(p_alamat, '')), '');
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
  IF v_whatsapp IS NOT NULL AND v_whatsapp !~ '^[0-9+() -]{8,20}$' THEN
    RAISE EXCEPTION 'Nomor WhatsApp tidak valid.';
  END IF;
  IF length(v_alamat) > 500 THEN
    RAISE EXCEPTION 'Alamat terlalu panjang.';
  END IF;
  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_items) NOT BETWEEN 1 AND 20 THEN
    RAISE EXCEPTION 'Isi keranjang tidak valid.';
  END IF;

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
      tanggal, nama_pembeli, whatsapp_pembeli, alamat_pembeli, nama_produk, produk_id,
      jumlah, harga_satuan, total_penjualan, status_pembayaran, rekening_id, catatan
    ) VALUES (
      v_tanggal, v_nama, v_whatsapp, v_alamat, v_product.nama_produk, v_item.id,
      v_item.quantity, v_product.harga_jual, v_subtotal, 'Belum bayar', NULL, v_catatan
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
REVOKE ALL ON FUNCTION public.create_kabung_order(TEXT, TEXT, JSONB, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_kabung_order(TEXT, TEXT, JSONB, TEXT, TEXT) TO anon, authenticated;

COMMIT;
