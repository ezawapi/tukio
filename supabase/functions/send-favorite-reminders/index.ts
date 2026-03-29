import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get today's date range (UTC)
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

    // Find events happening today
    const { data: todayEvents, error: evErr } = await supabase
      .from("events")
      .select("id, title")
      .eq("is_published", true)
      .gte("date", todayStart)
      .lt("date", todayEnd);

    if (evErr) throw evErr;
    if (!todayEvents || todayEvents.length === 0) {
      return new Response(JSON.stringify({ message: "No events today" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let notifCount = 0;

    for (const event of todayEvents) {
      // Find users who favorited this event
      const { data: favs } = await supabase
        .from("favorites")
        .select("user_id")
        .eq("event_id", event.id);

      if (!favs || favs.length === 0) continue;

      for (const fav of favs) {
        // Check if we already sent this reminder today
        const { count } = await supabase
          .from("user_notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", fav.user_id)
          .eq("related_event_id", event.id)
          .eq("type", "event_reminder")
          .gte("created_at", todayStart);

        if (count && count > 0) continue;

        await supabase.from("user_notifications").insert({
          user_id: fav.user_id,
          title: "🎉 C'est aujourd'hui !",
          body: `L'événement « ${event.title} » que vous avez mis en favori commence aujourd'hui ! Ne le manquez pas.`,
          type: "event_reminder",
          related_event_id: event.id,
        });
        notifCount++;
      }
    }

    return new Response(
      JSON.stringify({ message: `Sent ${notifCount} reminders` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
