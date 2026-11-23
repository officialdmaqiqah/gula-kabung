-- BAGIAN SEDEKAH PEMBELIAN: jalankan SEBELUM website versi ini dipasang.
-- Total pembelian dan saldo rekening tidak berubah.
-- Pembelian 24 September ditandai memuat sedekah Rp 100.000.

BEGIN;

ALTER TABLE public.kabung_purchases
  ADD COLUMN IF NOT EXISTS bagian_sedekah NUMERIC(15,2) NOT NULL DEFAULT 0;

ALTER TABLE public.kabung_purchases
  DROP CONSTRAINT IF EXISTS kabung_purchases_bagian_sedekah_check;

ALTER TABLE public.kabung_purchases
  ADD CONSTRAINT kabung_purchases_bagian_sedekah_check
  CHECK (bagian_sedekah >= 0 AND bagian_sedekah <= harga_beli_total);

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT count(*) INTO v_count
  FROM public.kabung_purchases
  WHERE tanggal::text LIKE '2026-09-24%'
    AND nama_produk = 'Gula Kabung'
    AND jumlah_beli = 30
    AND harga_beli_total = 610325;

  IF v_count <> 1 THEN
    RAISE EXCEPTION 'Pembelian 24 September tidak ditemukan tepat satu baris (%). Tidak ada yang diubah.', v_count;
  END IF;
END $$;

UPDATE public.kabung_purchases
SET bagian_sedekah = 100000
WHERE tanggal::text LIKE '2026-09-24%'
  AND nama_produk = 'Gula Kabung'
  AND jumlah_beli = 30
  AND harga_beli_total = 610325;

COMMIT;

SELECT tanggal::text AS tanggal,
       to_char(harga_beli_total::numeric, 'FM999,999,990') AS total_uang_keluar,
       to_char(bagian_sedekah, 'FM999,999,990') AS bagian_sedekah,
       to_char(harga_beli_total::numeric - bagian_sedekah, 'FM999,999,990') AS nilai_barang
FROM public.kabung_purchases
WHERE bagian_sedekah > 0;
