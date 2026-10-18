DROP POLICY "Categories are viewable by everyone" ON public.categories;
CREATE POLICY "Authenticated users read categories"
ON public.categories FOR SELECT TO authenticated USING (true);

DROP POLICY "Site content viewable by everyone" ON public.site_content;
CREATE POLICY "Authenticated users read site content"
ON public.site_content FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE VIEW public.public_categories
WITH (security_invoker = false) AS
SELECT id, name, icon, color, created_at FROM public.categories;

GRANT SELECT ON public.public_categories TO anon, authenticated;

CREATE OR REPLACE VIEW public.public_site_content
WITH (security_invoker = false) AS
SELECT key, value FROM public.site_content;

GRANT SELECT ON public.public_site_content TO anon, authenticated;