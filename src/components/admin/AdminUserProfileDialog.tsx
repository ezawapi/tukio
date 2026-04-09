import { useEffect, useState } from "react";
import { User, Calendar, MessageSquare, Heart, FileText, Video, ShieldCheck, ShieldOff, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  profileId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AdminUserProfileDialog = ({ profileId, open, onOpenChange }: Props) => {
  const [profile, setProfile] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profileId || !open) return;
    setLoading(true);
    Promise.all([
      supabase.from("profiles").select("*").eq("id", profileId).single(),
      supabase.from("events").select("id, title, date, status, is_published").eq("organizer_id", profileId).order("created_at", { ascending: false }).limit(20),
      supabase.from("comments").select("id, content, created_at, event_id").eq("user_id", profileId).order("created_at", { ascending: false }).limit(20),
      supabase.from("favorites").select("id, event_id, created_at").eq("user_id", profileId).limit(20),
      supabase.from("user_roles").select("role").eq("user_id", profileId),
    ]).then(([pRes, eRes, cRes, fRes, rRes]) => {
      setProfile(pRes.data);
      setEvents(eRes.data || []);
      setComments(cRes.data || []);
      setFavorites(fRes.data || []);
      setRoles((rRes.data || []).map((r: any) => r.role));
      setLoading(false);
    });
  }, [profileId, open]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display"><User className="h-5 w-5 text-primary" /> Profil utilisateur</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Chargement...</div>
        ) : profile ? (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-8 w-8 text-primary" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-lg font-semibold text-foreground">{profile.display_name || "Sans nom"}</h3>
                <p className="font-body text-xs text-muted-foreground truncate">{profile.id}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {profile.is_blocked && <Badge variant="destructive" className="text-[10px]">Bloqué</Badge>}
                  {roles.map(r => <Badge key={r} className="text-[10px]">{r}</Badge>)}
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-muted-foreground text-xs">Inscrit le</p>
                <p className="font-medium">{new Date(profile.created_at).toLocaleDateString("fr-FR")}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-muted-foreground text-xs">Dernière MàJ</p>
                <p className="font-medium">{new Date(profile.updated_at).toLocaleDateString("fr-FR")}</p>
              </div>
            </div>

            {profile.video_url && (
              <div className="rounded-lg bg-muted/50 p-3 flex items-center gap-2">
                <Video className="h-4 w-4 text-primary" />
                <a href={profile.video_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline truncate">{profile.video_url}</a>
              </div>
            )}

            {/* Contributions */}
            <Tabs defaultValue="events" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="events" className="flex-1 gap-1 text-xs"><FileText className="h-3 w-3" /> Événements ({events.length})</TabsTrigger>
                <TabsTrigger value="comments" className="flex-1 gap-1 text-xs"><MessageSquare className="h-3 w-3" /> Commentaires ({comments.length})</TabsTrigger>
                <TabsTrigger value="favorites" className="flex-1 gap-1 text-xs"><Heart className="h-3 w-3" /> Favoris ({favorites.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="events" className="max-h-48 overflow-y-auto space-y-1.5">
                {events.length === 0 && <p className="text-center text-xs text-muted-foreground py-4">Aucun événement</p>}
                {events.map(e => (
                  <div key={e.id} className="flex items-center justify-between rounded bg-muted/30 px-3 py-2">
                    <span className="text-xs font-medium truncate flex-1">{e.title}</span>
                    <div className="flex items-center gap-1">
                      <Badge variant={e.is_published ? "default" : "secondary"} className="text-[9px]">{e.is_published ? "Publié" : "Brouillon"}</Badge>
                      <Badge variant={e.status === "approved" ? "default" : "secondary"} className="text-[9px]">{e.status}</Badge>
                    </div>
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="comments" className="max-h-48 overflow-y-auto space-y-1.5">
                {comments.length === 0 && <p className="text-center text-xs text-muted-foreground py-4">Aucun commentaire</p>}
                {comments.map(c => (
                  <div key={c.id} className="rounded bg-muted/30 px-3 py-2">
                    <p className="text-xs text-foreground line-clamp-2">{c.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(c.created_at).toLocaleDateString("fr-FR")}</p>
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="favorites" className="max-h-48 overflow-y-auto space-y-1.5">
                {favorites.length === 0 && <p className="text-center text-xs text-muted-foreground py-4">Aucun favori</p>}
                {favorites.map(f => (
                  <div key={f.id} className="flex items-center justify-between rounded bg-muted/30 px-3 py-2">
                    <span className="text-xs text-muted-foreground">{f.event_id}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(f.created_at).toLocaleDateString("fr-FR")}</span>
                  </div>
                ))}
              </TabsContent>
            </Tabs>

            {/* Stats summary */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-primary/10 p-2">
                <p className="font-display text-lg font-bold text-primary">{events.length}</p>
                <p className="text-[10px] text-muted-foreground">Événements</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-2">
                <p className="font-display text-lg font-bold text-primary">{comments.length}</p>
                <p className="text-[10px] text-muted-foreground">Commentaires</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-2">
                <p className="font-display text-lg font-bold text-primary">{favorites.length}</p>
                <p className="text-[10px] text-muted-foreground">Favoris</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">Profil introuvable.</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminUserProfileDialog;
