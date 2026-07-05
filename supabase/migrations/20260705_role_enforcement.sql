-- ============================================================
-- Role enforcement: profiles.role bővítés + helper functions + RLS szigorítás
-- Jóváhagyva Csilla által (2026-07-05).
-- Kézzel futtatandó a Supabase SQL Editorban — NEM a CLI-vel push-olva.
-- ============================================================

-- 1. Meglévő userek besorolása (explicit döntés: mindkét jelenlegi
--    fiók — arnyekirnok@gmail.com és hellocsillu@gmail.com — admin marad)
UPDATE public.profiles SET role = 'admin' WHERE role = 'user';

-- 2. Role értékkészlet szűkítése/bővítése CHECK constraint-tel
--    (nem valódi Postgres ENUM típus — a CHECK constraint egyszerűbben
--     bővíthető/visszavonható, ha a szerepkörök még változnak)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'buffet_cashier', 'warden'));

-- 3. Helper függvények — SECURITY DEFINER, egy helyen a role-logika
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() AND is_active = true
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  )
$$;

GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 4. Fish modul: admin ÉS warden írhat; törölni (ahol van DELETE policy) csak admin
DROP POLICY IF EXISTS fish_insert_auth ON fish;
DROP POLICY IF EXISTS fish_update_auth ON fish;
CREATE POLICY fish_insert_admin_warden ON fish FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() IN ('admin', 'warden'));
CREATE POLICY fish_update_admin_warden ON fish FOR UPDATE TO authenticated
  USING (public.current_user_role() IN ('admin', 'warden'))
  WITH CHECK (public.current_user_role() IN ('admin', 'warden'));
-- fish_select_all marad változatlan (anon is olvashat — Hall of Fame jellegű)

DROP POLICY IF EXISTS catches_insert_auth ON catches;
DROP POLICY IF EXISTS catches_update_auth ON catches;
CREATE POLICY catches_insert_admin_warden ON catches FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() IN ('admin', 'warden'));
CREATE POLICY catches_update_admin_warden ON catches FOR UPDATE TO authenticated
  USING (public.current_user_role() IN ('admin', 'warden'))
  WITH CHECK (public.current_user_role() IN ('admin', 'warden'));
-- catches_select_anon, catches_select_auth marad változatlan

DROP POLICY IF EXISTS catch_images_insert_auth ON catch_images;
DROP POLICY IF EXISTS catch_images_delete_auth ON catch_images;
CREATE POLICY catch_images_insert_admin_warden ON catch_images FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() IN ('admin', 'warden'));
CREATE POLICY catch_images_delete_admin ON catch_images FOR DELETE TO authenticated
  USING (public.is_admin());
-- select policyk (anon approved-only, authenticated mind) változatlanok

-- 5. Minden más üzleti/pénzügyi/törzsadat tábla: admin-only.
--    buffet_cashier-nek ma szándékosan NINCS write joga sehol —
--    nincs hozzá kialakult workflow (ld. egyeztetés Csillával, 2026-07-05).
DO $$
DECLARE
  t TEXT;
  admin_only_tables TEXT[] := ARRAY[
    'vat_rates','categories','units','sales_sources','suppliers','storage_locations',
    'products','recipes','recipe_items','purchase_headers','purchase_items',
    'sales_entries','serial_documents','serial_document_usages','stock_movements',
    'inventory_counts','inventory_count_items','events','event_items',
    'purchase_line_items','purchases','cash_transactions','daily_reports',
    'daily_closings','daily_closing_expenses'
  ];
BEGIN
  FOREACH t IN ARRAY admin_only_tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can read all" ON %I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can write" ON %I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can manage %s" ON %I', t, t);
    EXECUTE format(
      'CREATE POLICY admin_read ON %I FOR SELECT TO authenticated USING (public.is_admin())', t
    );
    EXECUTE format(
      'CREATE POLICY admin_write ON %I FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())', t
    );
  END LOOP;
END $$;

-- profiles tábla policyjai (saját sor SELECT/UPDATE) változatlanok maradnak.
