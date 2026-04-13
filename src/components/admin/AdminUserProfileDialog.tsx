import { useEffect, useState } from "react";
import { User, Calendar, MessageSquare, Heart, FileText, Video, Mail, Phone, MapPin, Building2, Globe, Facebook, Instagram, Linkedin, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  profileId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AdminUserProfileDialog = ({ profileId, open, onOpenChange }: Props) => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [msgTitle, setMsgTitle] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!profileId || !open) return;
    setLoading(true);
    setShowMessageForm(false);
    setMsgTitle("");
    setMsgBody("");
    Promise.all([
      supabase.from("profiles").select("*").eq("id", profileId).single(),
      supabase.from("events").select("id, title, date, status, is_published, contact_email").eq("organizer_id", profileId).order("created_at", { ascending: false }).limit(20),
      supabase.from("comments").select("id, content, created_at, event_id").eq("user_id", profileId).order("created_at", { ascending: false }).limit(20),
      supabase.from("favorites").select("id, event_id, created_at").eq("user_id", profileId).limit(20),
      supabase.from("user_roles").select("role").eq("user_id", profileId),
    ]).then(([pRes, eRes, cRes, fRes, rRes]) => {
      setProfile(pRes.data);
      setEvents(eRes.data || []);
      setComments(cRes.data || []);
      setFavorites(fRes.data || []);
      setRoles((rRes.data || []).map((r: any) => r.role));
      const contactEmail = (eRes.data || []).find((e: any) => e.contact_email)?.contact_email;
      setUserEmail(contactEmail || null);
      setLoading(false);
    });
  }, [profileId, open]);

  const sendMessage = async () => {
    if (!profileId || !msgTitle.trim()) return;
    setSending(true);
    const { error } = await supabase.from("user_notifications").insert({
      user_id: profileId,
      title: msgTitle.trim(),
      body: msgBody.trim() || null,
      type: "admin_message",
    });
    setSending(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Message envoyé", description: "La notification a été envoyée à l'utilisateur." });
      setShowMessageForm(false);
      setMsgTitle("");
      setMsgBody("");
    }
  };

  if (!open) return null;

  const InfoRow = ({ icon: Icon, label, value, isLink }: { icon: any; label: string; value?: string | null; isLink?: boolean }) => {
    if (!value) return null;
    return (
      <div className="flex items-start gap-2 text-sm">
        <Icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-muted-foreground">{label}</p>
          {isLink ? (
            <a href={value} target="_blank" rel="noopener noreferrer" className="font-medium text-primary text-xs break-all hover:underline">{value}</a>
          ) : (
            <p className="font-medium text-foreground break-all text-xs">{value}</p>
          )}
        </div>
      </div>
    );
  };

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

            {/* Send message button */}
            <Button size="sm" variant="outline" className="w-full gap-2" onClick={() => setShowMessageForm(!showMessageForm)}>
              <Send className="h-4 w-4" /> Envoyer un message à cet utilisateur
            </Button>

            {showMessageForm && (
              <div className="rounded-lg border border-border p-3 space-y-3 bg-muted/30">
                <Input placeholder="Titre du message *" value={msgTitle} onChange={(e) => setMsgTitle(e.target.value)} className="text-sm" />
                <Textarea placeholder="Corps du message (optionnel)" value={msgBody} onChange={(e) => setMsgBody(e.target.value)} rows={3} className="text-sm" />
                <Button size="sm" onClick={sendMessage} disabled={sending || !msgTitle.trim()} className="w-full gap-2">
                  <Send className="h-3.5 w-3.5" /> {sending ? "Envoi..." : "Envoyer la notification"}
                </Button>
              </div>
            )}

            {/* Contact Info */}
            <div className="rounded-lg border border-border p-3 space-y-2">
              <p className="font-display text-xs font-semibold text-foreground mb-2">Coordonnées</p>
              {userEmail && <InfoRow icon={Mail} label="Email" value={userEmail} />}
              <InfoRow icon={Phone} label="Téléphone principal" value={profile.phone_primary} />
              <InfoRow icon={Phone} label="Téléphone secondaire" value={profile.phone_secondary} />
              <InfoRow icon={MapPin} label="Adresse physique" value={profile.physical_address} />
              <InfoRow icon={Building2} label="Organisation" value={profile.organization_name} />
              {profile.organization_role && <InfoRow icon={User} label="Fonction" value={profile.organization_role} />}
              <InfoRow icon={Video} label="Vidéo" value={profile.video_url} isLink />
              {!userEmail && !profile.phone_primary && !profile.physical_address && !profile.organization_name && !profile.video_url && (
                <p className="text-xs text-muted-foreground italic">Aucune coordonnée renseignée</p>
              )}
            </div>

            {/* Social */}
            <div className="rounded-lg border border-border p-3 space-y-2">
              <p className="font-display text-xs font-semibold text-foreground mb-2">Réseaux sociaux</p>
              <InfoRow icon={Facebook} label="Facebook" value={profile.facebook_url} isLink />
              <InfoRow icon={Instagram} label="Instagram" value={profile.instagram_url} isLink />
              <InfoRow icon={Globe} label="Twitter / X" value={profile.twitter_url} isLink />
              <InfoRow icon={Globe} label="TikTok" value={profile.tiktok_url} isLink />
              <InfoRow icon={Linkedin} label="LinkedIn" value={profile.linkedin_url} isLink />
              <InfoRow icon={Globe} label="Site web" value={profile.website_url} isLink />
              {!profile.facebook_url && !profile.instagram_url && !profile.twitter_url && !profile.tiktok_url && !profile.linkedin_url && !profile.website_url && (
                <p className="text-xs text-muted-foreground italic">Aucun réseau social renseigné</p>
              )}
            </div>

            {/* Dates */}
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

            {/* Stats */}
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
