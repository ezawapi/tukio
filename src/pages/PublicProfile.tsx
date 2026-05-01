import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Globe, Facebook, Instagram, Twitter, Linkedin, Building2, Mail, Phone, User as UserIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";
import EventCard from "@/components/EventCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ProfileData {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  organization_name: string | null;
  organization_role: string | null;
  physical_address: string | null;
  website_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
  video_url: string | null;
  created_at: string;
}

const PublicProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [past, setPast] = useState<any[]>([]);
  const [followers, setFollowers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!userId) return;
    const load = async () => {
      const nowIso = new Date().toISOString();
      const [{ data: prof }, { data: upc }, { data: pst }, { count: favCount }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase
          .from("events")
          .select("id, title, date, end_date, location, city, image_url, price, currency, is_live, categories(name), attendees_count")
          .eq("organizer_id", userId)
          .eq("is_published", true)
          .gte("date", nowIso)
          .order("date", { ascending: true })
          .limit(24),
        supabase
          .from("events")
          .select("id, title, date, end_date, location, city, image_url, price, currency, categories(name), attendees_count")
          .eq("organizer_id", userId)
          .eq("is_published", true)
          .lt("date", nowIso)
          .order("date", { ascending: false })
          .limit(24),
        supabase
          .from("favorites")
          .select("id, events!inner(organizer_id)", { count: "exact", head: true })
          .eq("events.organizer_id", userId),
      ]);
      setProfile(prof as ProfileData | null);
      setUpcoming(upc || []);
      setPast(pst || []);
      setFollowers(favCount || 0);
      setLoading(false);
    };
    load();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-20">
          <div className="animate-pulse space-y-4">
            <div className="h-32 rounded-xl bg-card" />
            <div className="h-8 w-1/3 rounded bg-card" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 pt-24 text-center">
          <h1 className="font-display text-2xl text-foreground">Profil introuvable</h1>
          <Link to="/events"><Button className="mt-4">Retour</Button></Link>
        </div>
      </div>
    );
  }

  const totalEvents = upcoming.length + past.length;
  const memberSince = format(new Date(profile.created_at), "MMMM yyyy", { locale: fr });
  const renderCard = (e: any) => (
    <Link key={e.id} to={`/events/${e.id}`} className="block">
      <EventCard
        title={e.title}
        date={format(new Date(e.date), "d MMM yyyy · HH:mm", { locale: fr })}
        location={`${e.location || ""}${e.city ? ", " + e.city : ""}`}
        category={e.categories?.name || "Activité"}
        image={e.image_url}
        attendees={e.attendees_count || 0}
        price={e.price ? `${e.price} ${e.currency || ""}` : undefined}
        isLive={e.is_live}
        eventDate={e.date}
        endDate={e.end_date}
      />
    </Link>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pb-16 pt-20">
        <div className="container mx-auto px-4">
          <Link to="/events" className="mb-4 inline-flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Retour
          </Link>

          {/* Header */}
          <Card className="mb-6 overflow-hidden">
            <div className="h-24 sm:h-32 bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20" />
            <CardContent className="relative pt-0">
              <div className="-mt-12 sm:-mt-16 flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full overflow-hidden border-4 border-background bg-muted shrink-0">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.display_name || "Profil"} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary/10">
                      <UserIcon className="h-10 w-10 text-primary" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground truncate">
                    {profile.display_name || "Organisateur"}
                  </h1>
                  {profile.organization_role && (
                    <p className="text-sm text-muted-foreground">{profile.organization_role}</p>
                  )}
                  {profile.organization_name && (
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-foreground">
                      <Building2 className="h-3.5 w-3.5 text-primary" />
                      <span className="truncate">{profile.organization_name}</span>
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Membre depuis {memberSince}</span>
                    <Badge variant="outline" className="text-[10px]">{totalEvents} activités</Badge>
                    <Badge variant="outline" className="text-[10px]">{followers} favoris</Badge>
                  </div>
                </div>
              </div>

              {profile.physical_address && (
                <div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{profile.physical_address}</span>
                </div>
              )}

              {/* Socials */}
              {(profile.website_url || profile.facebook_url || profile.instagram_url || profile.twitter_url || profile.linkedin_url) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.website_url && (
                    <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs hover:bg-primary/10 hover:text-primary">
                      <Globe className="h-3.5 w-3.5" /> Site
                    </a>
                  )}
                  {profile.facebook_url && (
                    <a href={profile.facebook_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs hover:bg-primary/10 hover:text-primary">
                      <Facebook className="h-3.5 w-3.5" /> Facebook
                    </a>
                  )}
                  {profile.instagram_url && (
                    <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs hover:bg-primary/10 hover:text-primary">
                      <Instagram className="h-3.5 w-3.5" /> Instagram
                    </a>
                  )}
                  {profile.twitter_url && (
                    <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs hover:bg-primary/10 hover:text-primary">
                      <Twitter className="h-3.5 w-3.5" /> Twitter
                    </a>
                  )}
                  {profile.linkedin_url && (
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs hover:bg-primary/10 hover:text-primary">
                      <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Events tabs */}
          <Tabs defaultValue="upcoming" className="space-y-4">
            <TabsList>
              <TabsTrigger value="upcoming">Prochaines ({upcoming.length})</TabsTrigger>
              <TabsTrigger value="past">Passées ({past.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming">
              {upcoming.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Aucune activité à venir.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {upcoming.map(renderCard)}
                </div>
              )}
            </TabsContent>
            <TabsContent value="past">
              {past.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Aucune activité passée.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {past.map(renderCard)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
      <MobileTabBar />
    </div>
  );
};

export default PublicProfile;
