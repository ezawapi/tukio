import { createClient } from "npm:@supabase/supabase-js@2";
import { createResponsesCall } from "../_shared/responses.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-lovable-aig-run-id",
  "Access-Control-Expose-Headers": "X-Lovable-AIG-Run-ID",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "Service IA non configuré." }, 500);

    const body = await req.json().catch(() => ({}));
    const tastes = String(body.tastes ?? "").slice(0, 1000).trim();
    const constraints = String(body.constraints ?? "").slice(0, 1000).trim();
    if (!tastes) return json({ error: "Décrivez vos goûts." }, 400);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: events, error } = await supabase
      .from("events")
      .select("id,title,date,city,location,price,currency,category_id,categories(name),description")
      .eq("status", "approved")
      .eq("is_published", true)
      .gte("date", new Date(Date.now() - 86400000).toISOString())
      .order("date", { ascending: true })
      .limit(60);
    if (error) return json({ error: "Impossible de charger les événements." }, 500);
    if (!events?.length) return json({ recommendations: [] });

    const catalog = events.map((e: any) => ({
      id: e.id,
      t: e.title,
      d: e.date?.slice(0, 16),
      c: e.city,
      l: e.location,
      p: `${e.price ?? ""} ${e.currency ?? ""}`.trim(),
      cat: e.categories?.name,
      desc: (e.description ?? "").slice(0, 160),
    }));

    const prompt = `Tu es l'assistant de recommandations de Tukio. Choisis au maximum 5 événements du catalogue qui correspondent le mieux aux goûts et contraintes de l'utilisateur. Respecte strictement les contraintes (budget, ville, dates). Réponds UNIQUEMENT avec du JSON valide de la forme {"recommendations":[{"id":"<id du catalogue>","score":<0-100>,"reason":"<1 phrase en français, max 25 mots>"}]}. N'invente aucun id.

Goûts: ${tastes}
Contraintes: ${constraints || "aucune"}
Date du jour: ${new Date().toISOString().slice(0, 10)}
Catalogue: ${JSON.stringify(catalog)}`;

    const { result } = createResponsesCall(
      req,
      { baseURL: "https://ai.gateway.lovable.dev/v1", apiKey, model: "openai/gpt-6-astra" },
      [{ role: "user", content: prompt }],
    );
    let text = "";
    try {
      text = await result.text;
    } catch (e: any) {
      const status = e?.statusCode ?? e?.status ?? 500;
      if (status === 429) return json({ error: "Trop de demandes, réessayez dans un instant." }, 429);
      if (status === 402) return json({ error: "Crédits IA épuisés. Rechargez-les dans Paramètres → Plans & crédits." }, 402);
      if (status === 403) return json({ error: "Accès au service IA refusé." }, 403);
      console.error("AI error", e);
      return json({ error: "Le service IA est indisponible." }, 502);
    }

    const match = text.match(/\{[\s\S]*\}/);
    let parsed: any = {};
    try { parsed = match ? JSON.parse(match[0]) : {}; } catch { parsed = {}; }
    const byId = new Map(events.map((e: any) => [e.id, e]));
    const recommendations = (Array.isArray(parsed.recommendations) ? parsed.recommendations : [])
      .filter((r: any) => byId.has(r?.id))
      .slice(0, 5)
      .map((r: any) => {
        const e: any = byId.get(r.id);
        return {
          id: e.id, title: e.title, date: e.date, city: e.city, price: e.price, currency: e.currency,
          score: Math.max(0, Math.min(100, Number(r.score) || 0)),
          reason: String(r.reason ?? "").slice(0, 240),
        };
      });
    return json({ recommendations });
  } catch (e) {
    console.error(e);
    return json({ error: "Erreur inattendue." }, 500);
  }
});
