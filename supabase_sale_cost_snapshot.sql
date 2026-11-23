-- Jalankan SEBELUM website versi ini dipasang.
-- Menyimpan harga modal di setiap penjualan agar laba bulan lama tidak ikut berubah.
-- Penjualan lama diisi dengan harga modal produk saat file ini dijalankan.

BEGIN;

DROP TRIGGER IF EXISTS set_kabung_sale_cost ON public.kabung_sales;

ALTER TABLE public.kabung_sales
  ADD COLUMN IF NOT EXISTS hpp_satuan NUMERIC(15,2);

UPDATE public.kabung_sales AS s
SET hpp_satuan = p.harga_modal
FROM public.kabung_products AS p
WHERE s.hpp_satuan IS NULL
  AND p.id::text = s.produk_id::text;

CREATE OR REPLACE FUNCTION public.set_kabung_sale_cost()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.produk_id IS NOT DISTINCT FROM OLD.produk_id
     AND OLD.hpp_satuan IS NOT NULL THEN
    NEW.hpp_satuan := OLD.hpp_satuan;
  ELSE
    SELECT harga_modal INTO NEW.hpp_satuan
    FROM public.kabung_products
    WHERE id::text = NEW.produk_id::text;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.set_kabung_sale_cost() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER set_kabung_sale_cost
BEFORE INSERT OR UPDATE ON public.kabung_sales
FOR EACH ROW EXECUTE FUNCTION public.set_kabung_sale_cost();

COMMIT;
